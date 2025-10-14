import db from "./db";
import {
  BranchDeliveryMethod,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
  ResponseType,
  TransferStatus,
  WarehouseType,
  MovementType,
  MovementStatus,
} from "@prisma/client";

export interface StockCheckResult {
  hasStock: boolean;
  availableQty: number;
  warehouseId?: string;
  warehouseName?: string;
  warehouseCode?: string;
}

export interface BranchStockInfo {
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  warehouseType: WarehouseType;
  availableQty: number;
  reservedQty: number;
  totalQty: number;
}

export interface CreateNotificationData {
  itemId: string;
  orderId?: string;
  posOrderId?: string;
  fromWarehouseId: string;
  requestedQty: number;
  customerInfo?: any;
  deliveryMethod?: BranchDeliveryMethod;
  priority?: NotificationPriority;
  urgency?: boolean;
  notes?: string;
  createdBy: string;
}

/**
 * Check stock availability across all branches for a specific item
 * Excludes the requesting branch from the search
 */
export async function checkStockAvailabilityAcrossBranches(
  itemId: string,
  requestedQty: number,
  excludeWarehouseId?: string
): Promise<BranchStockInfo[]> {
  try {
    const whereClause: any = {
      itemId,
      warehouse: {
        status: "ACTIVE",
      },
    };

    // Exclude the requesting warehouse if specified
    if (excludeWarehouseId) {
      whereClause.warehouseId = {
        not: excludeWarehouseId,
      };
    }

    const stockData = await db.stock.findMany({
      where: whereClause,
      include: {
        warehouse: true,
      },
    });

    return stockData
      .map(
        (stock): BranchStockInfo => ({
          warehouseId: stock.warehouseId,
          warehouseName: stock.warehouse.title,
          warehouseCode: stock.warehouse.code,
          warehouseType: stock.warehouse.type,
          availableQty: stock.availableQty,
          reservedQty: stock.reservedQty,
          totalQty: stock.quantity,
        })
      )
      .filter((stock: BranchStockInfo) => stock.availableQty >= requestedQty) // Only return branches with sufficient stock
      .sort((a: BranchStockInfo, b: BranchStockInfo) => {
        // Prioritize PRINCIPAL warehouses, then by available quantity
        if (a.warehouseType === "PRINCIPAL" && b.warehouseType !== "PRINCIPAL")
          return -1;
        if (b.warehouseType === "PRINCIPAL" && a.warehouseType !== "PRINCIPAL")
          return 1;
        return b.availableQty - a.availableQty;
      });
  } catch (error) {
    console.error("Error checking stock availability across branches:", error);
    throw error;
  }
}

/**
 * Create a new branch notification request
 */
export async function createBranchNotification(
  data: CreateNotificationData
): Promise<string> {
  try {
    // Generate notification number
    const notificationNo = await generateNotificationNumber();

    // Find the best branch with available stock
    const availableBranches = await checkStockAvailabilityAcrossBranches(
      data.itemId,
      data.requestedQty,
      data.fromWarehouseId
    );

    if (availableBranches.length === 0) {
      throw new Error("No branches have sufficient stock for this item");
    }

    // Select the best branch (first in sorted list)
    const targetBranch = availableBranches[0];

    // Create the notification
    const notification = await db.branchNotification.create({
      data: {
        notificationNo,
        type: NotificationType.STOCK_REQUEST,
        priority: data.priority || NotificationPriority.NORMAL,
        title: `Stock Request: ${data.requestedQty} units needed`,
        message: `Branch requests ${data.requestedQty} units of item. Available at target branch: ${targetBranch.availableQty} units.`,
        fromWarehouseId: data.fromWarehouseId,
        toWarehouseId: targetBranch.warehouseId,
        itemId: data.itemId,
        orderId: data.orderId,
        posOrderId: data.posOrderId,
        requestedQty: data.requestedQty,
        availableQty: targetBranch.availableQty,
        status: NotificationStatus.PENDING,
        urgency: data.urgency || false,
        customerInfo: data.customerInfo,
        deliveryMethod: data.deliveryMethod || BranchDeliveryMethod.PICKUP,
        notes: data.notes,
        createdBy: data.createdBy,
      },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
      },
    });

    // If it's urgent, try to find multiple options
    if (data.urgency && availableBranches.length > 1) {
      // Create additional notifications to other branches as backup
      for (let i = 1; i < Math.min(availableBranches.length, 3); i++) {
        const backupBranch = availableBranches[i];
        await db.branchNotification.create({
          data: {
            notificationNo: await generateNotificationNumber(),
            type: NotificationType.STOCK_REQUEST,
            priority: NotificationPriority.HIGH,
            title: `Backup Stock Request: ${data.requestedQty} units needed`,
            message: `Backup request for ${data.requestedQty} units. Available: ${backupBranch.availableQty} units.`,
            fromWarehouseId: data.fromWarehouseId,
            toWarehouseId: backupBranch.warehouseId,
            itemId: data.itemId,
            orderId: data.orderId,
            posOrderId: data.posOrderId,
            requestedQty: data.requestedQty,
            availableQty: backupBranch.availableQty,
            status: NotificationStatus.PENDING,
            urgency: true,
            customerInfo: data.customerInfo,
            deliveryMethod: data.deliveryMethod || BranchDeliveryMethod.PICKUP,
            notes: `${data.notes || ""} [BACKUP REQUEST]`,
            createdBy: data.createdBy,
          },
        });
      }
    }

    return notification.id;
  } catch (error) {
    console.error("Error creating branch notification:", error);
    throw error;
  }
}

/**
 * Respond to a branch notification
 */
export async function respondToBranchNotification(
  notificationId: string,
  responseType: ResponseType,
  respondedBy: string,
  message?: string,
  confirmedQty?: number,
  estimatedTime?: Date
) {
  try {
    // Create the response
    const response = await db.branchNotificationResponse.create({
      data: {
        notificationId,
        responseType,
        message,
        confirmedQty,
        estimatedTime,
        respondedBy,
      },
    });

    // Update notification status based on response
    let newStatus: NotificationStatus;
    switch (responseType) {
      case ResponseType.ACCEPT:
      case ResponseType.PARTIAL_ACCEPT:
        newStatus = NotificationStatus.ACCEPTED;
        break;
      case ResponseType.REJECT:
        newStatus = NotificationStatus.REJECTED;
        break;
      default:
        newStatus = NotificationStatus.ACKNOWLEDGED;
    }

    await db.branchNotification.update({
      where: { id: notificationId },
      data: {
        status: newStatus,
        respondedBy,
        respondedAt: new Date(),
        responseNotes: message,
      },
    });

    // If accepted, create a stock transfer record
    if (
      responseType === ResponseType.ACCEPT ||
      responseType === ResponseType.PARTIAL_ACCEPT
    ) {
      const notification = await db.branchNotification.findUnique({
        where: { id: notificationId },
      });

      if (notification) {
        await createBranchStockTransfer({
          notificationId,
          fromWarehouseId: notification.toWarehouseId,
          toWarehouseId: notification.fromWarehouseId,
          itemId: notification.itemId,
          requestedQty: confirmedQty || notification.requestedQty,
          method: notification.deliveryMethod,
          createdBy: respondedBy,
        });
      }
    }

    return response;
  } catch (error) {
    console.error("Error responding to branch notification:", error);
    throw error;
  }
}

/**
 * Create a stock transfer record
 */
export async function createBranchStockTransfer(data: {
  notificationId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  itemId: string;
  requestedQty: number;
  method: BranchDeliveryMethod;
  deliveryAddress?: string;
  customerInfo?: any;
  notes?: string;
  createdBy: string;
}) {
  try {
    const transferNo = await generateTransferNumber();

    return await db.branchStockTransfer.create({
      data: {
        transferNo,
        notificationId: data.notificationId,
        fromWarehouseId: data.fromWarehouseId,
        toWarehouseId: data.toWarehouseId,
        itemId: data.itemId,
        requestedQty: data.requestedQty,
        transferredQty: data.requestedQty,
        method: data.method,
        status: TransferStatus.PENDING,
        deliveryAddress: data.deliveryAddress,
        customerInfo: data.customerInfo,
        notes: data.notes,
        createdBy: data.createdBy,
      },
    });
  } catch (error) {
    console.error("Error creating stock transfer:", error);
    throw error;
  }
}

/**
 * Update transfer status and handle stock movements
 */
export async function updateTransferStatus(
  transferId: string,
  status: TransferStatus,
  userId: string,
  notes?: string
) {
  try {
    const transfer = await db.branchStockTransfer.findUnique({
      where: { id: transferId },
      include: {
        notification: true,
        fromWarehouse: true,
        toWarehouse: true,
      },
    });

    if (!transfer) {
      throw new Error("Transfer not found");
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === TransferStatus.IN_TRANSIT) {
      updateData.handedBy = userId;
      updateData.transferredAt = new Date();
    } else if (status === TransferStatus.RECEIVED) {
      updateData.receivedBy = userId;
      updateData.receivedAt = new Date();

      // Update notification as completed
      await db.branchNotification.update({
        where: { id: transfer.notificationId },
        data: {
          status: NotificationStatus.COMPLETED,
          completedAt: new Date(),
          fulfilledQty: transfer.transferredQty,
        },
      });

      // Create stock movements
      await createStockMovements(transfer, userId);
    }

    if (notes) {
      updateData.notes = notes;
    }

    return await db.branchStockTransfer.update({
      where: { id: transferId },
      data: updateData,
    });
  } catch (error) {
    console.error("Error updating transfer status:", error);
    throw error;
  }
}

/**
 * Create stock movements for completed transfers
 */
async function createStockMovements(transfer: any, userId: string) {
  try {
    // Outgoing movement from source warehouse
    await db.stockMovement.create({
      data: {
        itemId: transfer.itemId,
        type: MovementType.TRANSFER,
        quantity: -transfer.transferredQty, // Negative for outgoing
        fromWarehouseId: transfer.fromWarehouseId,
        toWarehouseId: transfer.toWarehouseId,
        reference: `Branch Transfer ${transfer.transferNo}`,
        reason: "Inter-branch stock transfer",
        status: MovementStatus.COMPLETED,
        createdBy: userId,
        approvedBy: userId,
      },
    });

    // Incoming movement to destination warehouse
    await db.stockMovement.create({
      data: {
        itemId: transfer.itemId,
        type: MovementType.TRANSFER,
        quantity: transfer.transferredQty, // Positive for incoming
        fromWarehouseId: transfer.fromWarehouseId,
        toWarehouseId: transfer.toWarehouseId,
        reference: `Branch Transfer ${transfer.transferNo}`,
        reason: "Inter-branch stock transfer",
        status: MovementStatus.COMPLETED,
        createdBy: userId,
        approvedBy: userId,
      },
    });

    // Update stock quantities
    await updateStockQuantities(
      transfer.itemId,
      transfer.fromWarehouseId,
      -transfer.transferredQty
    );
    await updateStockQuantities(
      transfer.itemId,
      transfer.toWarehouseId,
      transfer.transferredQty
    );
  } catch (error) {
    console.error("Error creating stock movements:", error);
    throw error;
  }
}

/**
 * Update stock quantities
 */
async function updateStockQuantities(
  itemId: string,
  warehouseId: string,
  quantityChange: number
) {
  try {
    const stock = await db.stock.findUnique({
      where: {
        itemId_warehouseId: {
          itemId,
          warehouseId,
        },
      },
    });

    if (stock) {
      const newQuantity = Math.max(0, stock.quantity + quantityChange);
      const newAvailableQty = Math.max(0, stock.availableQty + quantityChange);

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
    } else if (quantityChange > 0) {
      // Create new stock record if it doesn't exist and we're adding stock
      await db.stock.create({
        data: {
          itemId,
          warehouseId,
          quantity: quantityChange,
          availableQty: quantityChange,
        },
      });
    }
  } catch (error) {
    console.error("Error updating stock quantities:", error);
    throw error;
  }
}

/**
 * Get notifications for a specific warehouse
 */
export async function getNotificationsForWarehouse(
  warehouseId: string,
  type: "incoming" | "outgoing" | "all" = "all",
  status?: NotificationStatus[]
) {
  try {
    const where: any = {};

    if (type === "incoming") {
      where.toWarehouseId = warehouseId;
    } else if (type === "outgoing") {
      where.fromWarehouseId = warehouseId;
    } else {
      where.OR = [
        { toWarehouseId: warehouseId },
        { fromWarehouseId: warehouseId },
      ];
    }

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    return await db.branchNotification.findMany({
      where,
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        responses: {
          orderBy: { createdAt: "desc" },
        },
        transfers: true,
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });
  } catch (error) {
    console.error("Error getting notifications for warehouse:", error);
    throw error;
  }
}

/**
 * Generate unique notification number
 */
async function generateNotificationNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, "0");

  // Find the last notification number for today
  const lastNotification = await db.branchNotification.findFirst({
    where: {
      notificationNo: {
        startsWith: `BN${year}${month}`,
      },
    },
    orderBy: {
      notificationNo: "desc",
    },
  });

  let nextNumber = 1;
  if (lastNotification) {
    const lastNumber = parseInt(lastNotification.notificationNo.slice(-4));
    nextNumber = lastNumber + 1;
  }

  return `BN${year}${month}${nextNumber.toString().padStart(4, "0")}`;
}

/**
 * Generate unique transfer number
 */
async function generateTransferNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, "0");

  const lastTransfer = await db.branchStockTransfer.findFirst({
    where: {
      transferNo: {
        startsWith: `BT${year}${month}`,
      },
    },
    orderBy: {
      transferNo: "desc",
    },
  });

  let nextNumber = 1;
  if (lastTransfer) {
    const lastNumber = parseInt(lastTransfer.transferNo.slice(-4));
    nextNumber = lastNumber + 1;
  }

  return `BT${year}${month}${nextNumber.toString().padStart(4, "0")}`;
}

/**
 * Check if item should trigger urgent notification based on stock levels
 */
export async function shouldTriggerUrgentNotification(
  itemId: string,
  warehouseId: string,
  requestedQty: number
): Promise<boolean> {
  try {
    const item = await db.item.findUnique({
      where: { id: itemId },
      include: {
        stocks: {
          where: { warehouseId },
        },
      },
    });

    if (!item || !item.stocks.length) return true; // No stock info = urgent

    const currentStock = item.stocks[0];
    const afterSaleStock = currentStock.availableQty - requestedQty;

    // Trigger urgent if:
    // 1. Not enough stock for the sale
    // 2. After sale, stock will be below minimum
    // 3. After sale, stock will be below reorder point
    return (
      afterSaleStock < 0 ||
      afterSaleStock < item.minStock ||
      (item.reorderPoint ? afterSaleStock < item.reorderPoint : false)
    );
  } catch (error) {
    console.error("Error checking urgent notification criteria:", error);
    return false;
  }
}
