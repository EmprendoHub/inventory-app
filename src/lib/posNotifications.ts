import db from "./db";
import {
  checkStockAvailabilityAcrossBranches,
  createBranchNotification,
  shouldTriggerUrgentNotification,
} from "./branchNotifications";
import { BranchDeliveryMethod, NotificationPriority } from "@prisma/client";

export interface PosCheckoutItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface PosCheckoutData {
  sessionId: string;
  cashRegisterId: string;
  customerId?: string;
  items: PosCheckoutItem[];
  paymentType: string;
  totalAmount: number;
  userId: string;
}

export interface StockAlert {
  itemId: string;
  itemName: string;
  requestedQty: number;
  availableQty: number;
  shortfall: number;
  branchesWithStock: Array<{
    warehouseId: string;
    warehouseName: string;
    availableQty: number;
  }>;
  notificationCreated: boolean;
  notificationId?: string;
}

/**
 * Check stock availability during POS checkout and create notifications if needed
 * This should be called before completing the sale
 */
export async function checkStockAndCreateNotifications(
  checkoutData: PosCheckoutData
): Promise<{
  canProceed: boolean;
  stockAlerts: StockAlert[];
  messages: string[];
}> {
  const stockAlerts: StockAlert[] = [];
  const messages: string[] = [];
  let canProceed = true;

  try {
    // Get the warehouse associated with this cash register
    const cashRegister = await db.cashRegister.findUnique({
      where: { id: checkoutData.cashRegisterId },
      include: {
        user: true,
        // We need to determine the warehouse from the cash register
        // For now, we'll assume each register is associated with a location
        // This might need adjustment based on your specific setup
      },
    });

    if (!cashRegister) {
      throw new Error("Cash register not found");
    }

    // Try to find the warehouse for this register
    // This might need to be adjusted based on how you link registers to warehouses
    const currentWarehouse = await findWarehouseForCashRegister(
      checkoutData.cashRegisterId
    );

    if (!currentWarehouse) {
      messages.push("Warning: Could not determine current warehouse location");
      return { canProceed: true, stockAlerts, messages };
    }

    // Check each item in the checkout
    for (const checkoutItem of checkoutData.items) {
      const stockCheck = await checkItemStock(
        checkoutItem.itemId,
        checkoutItem.quantity,
        currentWarehouse.id
      );

      if (stockCheck.shortfall > 0) {
        // Find branches with available stock
        const branchesWithStock = await checkStockAvailabilityAcrossBranches(
          checkoutItem.itemId,
          stockCheck.shortfall,
          currentWarehouse.id
        );

        const stockAlert: StockAlert = {
          itemId: checkoutItem.itemId,
          itemName: checkoutItem.name,
          requestedQty: checkoutItem.quantity,
          availableQty: stockCheck.availableQty,
          shortfall: stockCheck.shortfall,
          branchesWithStock: branchesWithStock.map((branch) => ({
            warehouseId: branch.warehouseId,
            warehouseName: branch.warehouseName,
            availableQty: branch.availableQty,
          })),
          notificationCreated: false,
        };

        if (branchesWithStock.length > 0) {
          // Check if this should be an urgent notification
          const isUrgent = await shouldTriggerUrgentNotification(
            checkoutItem.itemId,
            currentWarehouse.id,
            checkoutItem.quantity
          );

          // Create notification request
          try {
            const customerInfo = checkoutData.customerId
              ? await getCustomerInfo(checkoutData.customerId)
              : null;

            const notificationId = await createBranchNotification({
              itemId: checkoutItem.itemId,
              posOrderId: undefined, // Will be set after order creation
              fromWarehouseId: currentWarehouse.id,
              requestedQty: stockCheck.shortfall,
              customerInfo: customerInfo
                ? {
                    id: customerInfo.id,
                    name: customerInfo.name,
                    phone: customerInfo.phone,
                    address: customerInfo.address,
                  }
                : undefined,
              deliveryMethod: BranchDeliveryMethod.PICKUP, // Default, can be changed
              priority: isUrgent
                ? NotificationPriority.HIGH
                : NotificationPriority.NORMAL,
              urgency: isUrgent,
              notes: `POS checkout request - Customer needs ${checkoutItem.quantity} units, only ${stockCheck.availableQty} available locally.`,
              createdBy: checkoutData.userId,
            });

            stockAlert.notificationCreated = true;
            stockAlert.notificationId = notificationId;

            messages.push(
              `✅ Requested ${stockCheck.shortfall} units of ${checkoutItem.name} from ${branchesWithStock[0].warehouseName}`
            );
          } catch (notificationError) {
            console.error(
              "Failed to create branch notification:",
              notificationError
            );
            messages.push(
              `⚠️ Could not create notification for ${checkoutItem.name}. Please contact other branches manually.`
            );
          }
        } else {
          // No branches have stock
          messages.push(
            `❌ ${checkoutItem.name}: No other branches have sufficient stock (need ${stockCheck.shortfall} more)`
          );
          canProceed = false; // Might want to make this configurable
        }

        stockAlerts.push(stockAlert);
      }
    }

    // Generate summary message
    if (stockAlerts.length > 0) {
      messages.unshift(
        `📋 Stock alerts for ${stockAlerts.length} item${
          stockAlerts.length > 1 ? "s" : ""
        }`
      );
    }
  } catch (error) {
    console.error("Error checking stock during POS checkout:", error);
    messages.push(
      "⚠️ Error checking stock availability. Please proceed with caution."
    );
  }

  return {
    canProceed,
    stockAlerts,
    messages,
  };
}

/**
 * Update notification with POS order ID after order creation
 */
export async function linkNotificationToPosOrder(
  notificationId: string,
  posOrderId: string
): Promise<void> {
  try {
    await db.branchNotification.update({
      where: { id: notificationId },
      data: { posOrderId },
    });
  } catch (error) {
    console.error("Error linking notification to POS order:", error);
    // Don't throw - this is not critical
  }
}

/**
 * Check stock for a specific item in a warehouse
 */
async function checkItemStock(
  itemId: string,
  requestedQty: number,
  warehouseId: string
): Promise<{
  availableQty: number;
  shortfall: number;
}> {
  try {
    const stock = await db.stock.findUnique({
      where: {
        itemId_warehouseId: {
          itemId,
          warehouseId,
        },
      },
    });

    const availableQty = stock?.availableQty || 0;
    const shortfall = Math.max(0, requestedQty - availableQty);

    return {
      availableQty,
      shortfall,
    };
  } catch (error) {
    console.error("Error checking item stock:", error);
    return {
      availableQty: 0,
      shortfall: requestedQty,
    };
  }
}

/**
 * Find the warehouse associated with a cash register
 * This is a simplified implementation - you might need to adjust based on your setup
 */
async function findWarehouseForCashRegister(
  cashRegisterId: string
): Promise<{ id: string; title: string } | null> {
  try {
    // Option 1: If cash register has a direct warehouse relationship
    // (You might need to add this to your schema if not present)

    // Option 2: Find by location or naming convention
    const cashRegister = await db.cashRegister.findUnique({
      where: { id: cashRegisterId },
    });

    if (!cashRegister) return null;

    // For now, let's assume the location field or name indicates the warehouse
    // You might need to adjust this logic based on your setup
    let warehouse = null;

    if (cashRegister.location) {
      warehouse = await db.warehouse.findFirst({
        where: {
          OR: [
            { title: { contains: cashRegister.location, mode: "insensitive" } },
            { code: { contains: cashRegister.location, mode: "insensitive" } },
          ],
          status: "ACTIVE",
        },
      });
    }

    // Fallback to the main warehouse
    if (!warehouse) {
      warehouse = await db.warehouse.findFirst({
        where: {
          type: "PRINCIPAL",
          status: "ACTIVE",
        },
      });
    }

    return warehouse ? { id: warehouse.id, title: warehouse.title } : null;
  } catch (error) {
    console.error("Error finding warehouse for cash register:", error);
    return null;
  }
}

/**
 * Get customer information for notification context
 */
async function getCustomerInfo(customerId: string) {
  try {
    return await db.client.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        email: true,
      },
    });
  } catch (error) {
    console.error("Error getting customer info:", error);
    return null;
  }
}

/**
 * Process completed POS order and update stock
 * This should be called after a successful checkout
 */
export async function processPosOrderStockUpdates(
  posOrderId: string,
  items: PosCheckoutItem[],
  warehouseId: string,
  userId: string
): Promise<void> {
  try {
    // Update stock for each item
    for (const item of items) {
      await updateStockAfterSale(
        item.itemId,
        item.quantity,
        warehouseId,
        posOrderId,
        userId
      );
    }

    // Update any related notifications
    await updateRelatedNotifications(posOrderId);
  } catch (error) {
    console.error("Error processing POS order stock updates:", error);
    throw error;
  }
}

/**
 * Update stock after a sale
 */
async function updateStockAfterSale(
  itemId: string,
  quantity: number,
  warehouseId: string,
  posOrderId: string,
  userId: string
): Promise<void> {
  try {
    // Create stock movement record
    await db.stockMovement.create({
      data: {
        itemId,
        type: "SALE",
        quantity: -quantity, // Negative for outgoing stock
        fromWarehouseId: warehouseId,
        reference: `POS Sale ${posOrderId}`,
        reason: "Point of sale transaction",
        status: "COMPLETED",
        createdBy: userId,
        approvedBy: userId,
      },
    });

    // Update stock quantities
    const stock = await db.stock.findUnique({
      where: {
        itemId_warehouseId: {
          itemId,
          warehouseId,
        },
      },
    });

    if (stock) {
      const newQuantity = Math.max(0, stock.quantity - quantity);
      const newAvailableQty = Math.max(0, stock.availableQty - quantity);

      await db.stock.update({
        where: {
          itemId_warehouseId: {
            itemId,
            warehouseId,
          },
        },
        data: {
          quantity: newQuantity,
          availableQty: newAvailableQty,
        },
      });
    }
  } catch (error) {
    console.error("Error updating stock after sale:", error);
    throw error;
  }
}

/**
 * Update notifications related to a POS order
 */
async function updateRelatedNotifications(posOrderId: string): Promise<void> {
  try {
    const notifications = await db.branchNotification.findMany({
      where: { posOrderId },
    });

    for (const notification of notifications) {
      // Update with additional context about the completed sale
      await db.branchNotification.update({
        where: { id: notification.id },
        data: {
          notes: `${
            notification.notes || ""
          }\n\nSale completed - POS Order: ${posOrderId}`,
        },
      });
    }
  } catch (error) {
    console.error("Error updating related notifications:", error);
    // Don't throw - this is not critical
  }
}
