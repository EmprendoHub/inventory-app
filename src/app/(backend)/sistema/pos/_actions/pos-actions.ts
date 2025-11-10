"use server";

import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import { CartState, PaymentType } from "@/types/pos";
import { revalidatePath } from "next/cache";
import { generateOrderId, getMexicoGlobalUtcDate } from "@/lib/utils";

// Interface for stock availability in other warehouses
interface WarehouseStockInfo {
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  availableStock: number;
}

// Check stock availability in other warehouses
async function checkStockInOtherWarehouses(
  itemId: string,
  currentWarehouseId: string | null,
  requiredQuantity: number
): Promise<WarehouseStockInfo[]> {
  const warehouseStocks = await prisma.stock.findMany({
    where: {
      itemId,
      quantity: { gt: 0 },
      ...(currentWarehouseId && {
        warehouseId: { not: currentWarehouseId },
      }),
    },
    include: {
      warehouse: {
        select: {
          id: true,
          title: true,
          code: true,
          status: true,
        },
      },
    },
  });

  return warehouseStocks
    .filter((stock) => stock.warehouse.status === "ACTIVE")
    .map((stock) => ({
      warehouseId: stock.warehouse.id,
      warehouseName: stock.warehouse.title,
      warehouseCode: stock.warehouse.code,
      availableStock: stock.quantity,
    }))
    .filter((info) => info.availableStock >= requiredQuantity);
}

// Result interface for POS operations
interface PosOrderResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
  isStockError?: boolean;
  changeAmount?: number;
  stockSuggestions?: {
    itemName: string;
    itemId: string;
    requiredQuantity: number;
    availableLocally: number;
    availableWarehouses: WarehouseStockInfo[];
  }[];
}

export async function createPosOrder(
  cart: CartState,
  paymentMethod: PaymentType,
  customerId?: string,
  cashReceived?: number, // Amount of cash received from customer
  referenceNumber?: string // Payment reference number for cards/transfers
): Promise<PosOrderResult> {
  const session = await getServerSession(options);

  if (!session?.user?.id) {
    throw new Error("Usuario no autenticado");
  }

  try {
    // Wrap entire operation in a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get or create "PUBLICO GENERAL" client if no customerId provided
      let finalCustomerId = customerId;

      if (!finalCustomerId) {
        const publicClient = await tx.client.upsert({
          where: { email: "publico@general.com" },
          update: {},
          create: {
            name: "PUBLICO GENERAL",
            email: "publico@general.com",
            phone: "0000000000",
            address: "Dirección general",
            image: "",
            status: "ACTIVE",
          },
        });
        finalCustomerId = publicClient.id;
      }

      // Get user's current warehouse
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        include: { warehouse: true },
      });

      const currentWarehouseId = user?.warehouseId;

      // Use the same stock update logic as sistema/ventas/pedidos/nuevo
      const orderItems = [];
      const stockSuggestions = [];

      for (const cartItem of cart.items) {
        // Check stock availability in current warehouse - FRESH data from transaction
        const stocks = await tx.stock.findMany({
          where: {
            itemId: cartItem.itemId,
            ...(currentWarehouseId && { warehouseId: currentWarehouseId }),
          },
          include: {
            warehouse: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });

        console.log(
          `🔍 Stock check for ${cartItem.name} (${cartItem.itemId}):`,
          {
            currentWarehouseId,
            stocksFound: stocks.length,
            stockDetails: stocks.map((s) => ({
              warehouse: s.warehouseId,
              quantity: s.quantity,
            })),
            requiredQuantity: cartItem.quantity,
          }
        );

        const totalAvailable = stocks.reduce(
          (sum, stock) => sum + stock.quantity,
          0
        );

        // If user has no warehouse assigned, we need to handle this differently
        let localStock = 0;
        if (currentWarehouseId) {
          // User has warehouse - count only local stock
          localStock = stocks
            .filter((s) => s.warehouseId === currentWarehouseId)
            .reduce((sum, stock) => sum + stock.quantity, 0);
        } else {
          // User has no warehouse - treat all stock as local
          localStock = totalAvailable;
        }

        console.log(`📊 Stock calculation for ${cartItem.name}:`, {
          localStock,
          requiredQuantity: cartItem.quantity,
          hasEnoughStock: localStock >= cartItem.quantity,
        });

        if (localStock < cartItem.quantity) {
          // Check if stock is available in other warehouses
          const availableWarehouses = await checkStockInOtherWarehouses(
            cartItem.itemId,
            currentWarehouseId || null,
            cartItem.quantity - localStock // Only need the deficit from LOCAL stock
          );

          if (availableWarehouses.length > 0) {
            // Stock available in other warehouses - allow sale but mark for notification
            console.log(`⚠️ Adding stock suggestion for ${cartItem.name}:`, {
              requiredFromOtherWarehouses: cartItem.quantity - localStock,
              availableWarehouses: availableWarehouses.length,
            });
            stockSuggestions.push({
              itemName: cartItem.name,
              itemId: cartItem.itemId,
              requiredQuantity: cartItem.quantity - localStock,
              availableLocally: localStock,
              availableWarehouses,
            });
          } else {
            // No stock available anywhere - fail the transaction
            throw new Error(
              `Stock insuficiente para ${cartItem.name}. Disponible localmente: ${localStock}, Solicitado: ${cartItem.quantity}. No hay stock en otras sucursales.`
            );
          }
        }

        orderItems.push({
          itemId: cartItem.itemId,
          name: cartItem.name,
          description: cartItem.name,
          quantity: cartItem.quantity,
          price: Math.round(cartItem.price),
          image: cartItem.image || "",
        });
      }

      // Generate order number
      const orderNumber = await generateOrderId(tx);

      // Create the order using Order model with status "ENTREGADO"
      const createdAt = getMexicoGlobalUtcDate();
      const order = await tx.order.create({
        data: {
          orderNo: orderNumber,
          clientId: finalCustomerId,
          userId: session.user.id,
          totalAmount: Math.round(cart.totalAmount),
          discount: cart.discountAmount || 0,
          status: "ENTREGADO",
          notes: "Venta POS",
          dueDate: createdAt,
          createdAt,
          updatedAt: createdAt,
          orderItems: {
            create: orderItems,
          },
        },
        include: {
          orderItems: true,
        },
      });

      // Update stock using the same logic as createNewOrder
      for (const cartItem of cart.items) {
        let remainingToDeduct = cartItem.quantity;

        const stocks = await tx.stock.findMany({
          where: { itemId: cartItem.itemId },
          orderBy: { createdAt: "asc" },
        });

        for (const stock of stocks) {
          if (remainingToDeduct <= 0) break;

          const deductAmount = Math.min(stock.quantity, remainingToDeduct);

          await tx.stock.update({
            where: { id: stock.id },
            data: {
              quantity: stock.quantity - deductAmount,
              availableQty: stock.availableQty - deductAmount,
            },
          });

          remainingToDeduct -= deductAmount;
        }
      }

      // Create payment record
      const paymentMethodMap = {
        [PaymentType.CASH]: "EFECTIVO",
        [PaymentType.CARD]: "TARJETA",
        [PaymentType.TRANSFER]: "TRANSFERENCIA",
        [PaymentType.ACCOUNT]: "CUENTA",
      };

      await tx.payment.create({
        data: {
          orderId: order.id,
          orderNo: order.orderNo,
          method: paymentMethodMap[paymentMethod],
          amount: Math.round(cart.totalAmount),
          status: "PAGADO",
          reference: referenceNumber || `POS-${Date.now()}`,
          createdAt,
          updatedAt: createdAt,
        },
      });

      // Variables to store change information
      let changeAmount: number | undefined;

      // Handle cash register updates for cash payments
      if (paymentMethod === PaymentType.CASH) {
        // Get the user's cash register
        const cashRegister = await tx.cashRegister.findFirst({
          where: { userId: session.user.id },
        });

        if (cashRegister) {
          // Calculate simple change for receipt display
          if (cashReceived && cashReceived > cart.totalAmount) {
            changeAmount = cashReceived - cart.totalAmount;
          }

          // Update cash register balance only (no denominations tracking)
          await tx.cashRegister.update({
            where: { id: cashRegister.id },
            data: {
              balance: cashRegister.balance + cart.totalAmount,
              updatedAt: createdAt,
            },
          });

          // Create cash transaction record
          await tx.cashTransaction.create({
            data: {
              type: "DEPOSITO",
              amount: cart.totalAmount,
              description: `Venta POS - ${order.orderNo}`,
              cashRegisterId: cashRegister.id,
              userId: session.user.id,
              createdAt,
              updatedAt: createdAt,
            },
          });
        }
      }

      return {
        order,
        changeAmount,
        stockSuggestions,
      };
    }); // End of transaction

    revalidatePath("/sistema/pos");
    revalidatePath("/sistema/ventas/pedidos");
    revalidatePath("/sistema/negocio/articulos");

    console.log(
      `✅ Order ${result.order.orderNo} completed successfully. Stock suggestions:`,
      result.stockSuggestions.length
    );

    return {
      success: true,
      orderId: result.order.id,
      orderNumber: result.order.orderNo,
      changeAmount: result.changeAmount,
      stockSuggestions:
        result.stockSuggestions.length > 0
          ? result.stockSuggestions
          : undefined,
    };
  } catch (error) {
    console.error("Error creating POS order:", error);

    // Return error information in a serializable format instead of throwing
    const errorMessage =
      error instanceof Error ? error.message : "Error al procesar la venta";

    return {
      success: false,
      error: errorMessage,
      isStockError: errorMessage.includes("Stock insuficiente"),
    };
  }
}

export async function updateFavorites(favorites: any[]) {
  try {
    // Clear existing favorites
    await prisma.favorite.deleteMany({});

    // Add new favorites
    for (let i = 0; i < favorites.length; i++) {
      const favorite = favorites[i];
      await prisma.favorite.create({
        data: {
          itemId: favorite.itemId,
          name: favorite.name,
          price: favorite.price,
          image: favorite.image,
          position: i + 1,
        },
      });
    }

    revalidatePath("/sistema/pos/register");
    return { success: true };
  } catch (error) {
    console.error("Error updating favorites:", error);
    return { success: false, error: "Failed to update favorites" };
  }
}

// Create branch notification from POS for stock request
export async function createBranchNotificationFromPos(
  itemId: string,
  itemName: string,
  requiredQuantity: number,
  targetWarehouseId: string,
  customerId?: string,
  deliveryMethod:
    | "PICKUP"
    | "DELIVERY"
    | "CUSTOMER_PICKUP"
    | "DIRECT_DELIVERY" = "CUSTOMER_PICKUP",
  notes?: string
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  const session = await getServerSession(options);

  if (!session?.user?.id) {
    return { success: false, error: "Usuario no autenticado" };
  }

  try {
    // Get user's current warehouse
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { warehouse: true },
    });

    if (!user?.warehouseId) {
      return { success: false, error: "Usuario sin almacén asignado" };
    }

    // Generate notification number
    const notificationCount = await prisma.branchNotification.count();
    const notificationNo = `BN${(notificationCount + 1)
      .toString()
      .padStart(6, "0")}`;

    // Get customer info if provided
    let customerInfo = null;
    if (customerId) {
      const customer = await prisma.client.findUnique({
        where: { id: customerId },
      });
      if (customer) {
        customerInfo = {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
        };
      }
    }

    const createdAt = getMexicoGlobalUtcDate();

    // Create branch notification
    const notification = await prisma.branchNotification.create({
      data: {
        notificationNo,
        type: "STOCK_REQUEST",
        priority: "ALTA",
        title: `Solicitud de stock - ${itemName}`,
        message: `Se requiere ${requiredQuantity} unidades de ${itemName} para completar una venta en ${user.warehouse?.title}.`,
        fromWarehouseId: user.warehouseId,
        toWarehouseId: targetWarehouseId,
        itemId,
        requestedQty: requiredQuantity,
        status: "PENDING",
        deliveryMethod,
        createdBy: session.user.id,
        customerInfo,
        notes,
        createdAt,
        updatedAt: createdAt,
      },
    });

    revalidatePath("/sistema/notifications");

    return {
      success: true,
      notificationId: notification.id,
    };
  } catch (error) {
    console.error(
      "Full error details:",
      JSON.stringify(error, Object.getOwnPropertyNames(error))
    );
    return {
      success: false,
      error: "Error al crear notificación entre sucursales",
    };
  }
}

export async function getFavorites() {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { isActive: true },
      orderBy: { position: "asc" },
    });

    return favorites;
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
}

export async function getDiscounts() {
  try {
    const discounts = await prisma.discount.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return discounts;
  } catch (error) {
    console.error("Error fetching discounts:", error);
    return [];
  }
}

export async function getItems() {
  try {
    const items = await prisma.item.findMany({
      orderBy: { name: "asc" },
    });

    return items;
  } catch (error) {
    console.error("Error fetching items:", error);
    return [];
  }
}

// Function to handle stock confirmation and transfer between warehouses
export async function confirmAndTransferStock(
  notificationId: string,
  itemId: string,
  quantity: number,
  fromWarehouseId: string,
  toWarehouseId: string,
  notes?: string
): Promise<{ success: boolean; error?: string; transferId?: string }> {
  const session = await getServerSession(options);

  if (!session?.user?.id) {
    return { success: false, error: "Usuario no autenticado" };
  }

  try {
    // Check if notification exists and is still pending
    const notification = await prisma.branchNotification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return { success: false, error: "Notificación no encontrada" };
    }

    if (notification.status !== "PENDING") {
      return { success: false, error: "La notificación ya fue procesada" };
    }

    // Check available stock in source warehouse
    const sourceStocks = await prisma.stock.findMany({
      where: {
        itemId,
        warehouseId: fromWarehouseId,
        quantity: { gt: 0 },
      },
      orderBy: { createdAt: "asc" },
    });

    const totalAvailable = sourceStocks.reduce(
      (sum, stock) => sum + stock.quantity,
      0
    );

    if (totalAvailable < quantity) {
      return {
        success: false,
        error: `Stock insuficiente en almacén origen. Disponible: ${totalAvailable}, Solicitado: ${quantity}`,
      };
    }

    // Create transfer record
    const transferCount = await prisma.branchStockTransfer.count();
    const transferNo = `BT${(transferCount + 1).toString().padStart(6, "0")}`;

    const createdAt = getMexicoGlobalUtcDate();

    const transfer = await prisma.branchStockTransfer.create({
      data: {
        transferNo,
        notificationId,
        fromWarehouseId,
        toWarehouseId,
        itemId,
        requestedQty: quantity,
        transferredQty: quantity,
        method: notification.deliveryMethod,
        status: "RECEIVED", // Use correct enum value
        createdBy: session.user.id, // Add required field
        createdAt,
        updatedAt: createdAt,
      },
    });

    // Update source warehouse stock (deduct)
    let remainingToDeduct = quantity;
    for (const stock of sourceStocks) {
      if (remainingToDeduct <= 0) break;

      const deductAmount = Math.min(stock.quantity, remainingToDeduct);

      await prisma.stock.update({
        where: { id: stock.id },
        data: {
          quantity: stock.quantity - deductAmount,
          availableQty: stock.availableQty - deductAmount,
        },
      });

      remainingToDeduct -= deductAmount;
    }

    // Add stock to destination warehouse
    await prisma.stock.create({
      data: {
        itemId,
        warehouseId: toWarehouseId,
        quantity,
        availableQty: quantity,
        createdAt,
        updatedAt: createdAt,
      },
    });

    // Update notification status
    await prisma.branchNotification.update({
      where: { id: notificationId },
      data: {
        status: "COMPLETED",
        fulfilledQty: quantity,
        completedAt: createdAt,
        responseNotes: notes || "Stock transferido exitosamente",
        respondedBy: session.user.id,
        respondedAt: createdAt,
        updatedAt: createdAt,
      },
    });

    revalidatePath("/sistema/notifications");
    revalidatePath("/sistema/negocio/articulos");

    return {
      success: true,
      transferId: transfer.id,
    };
  } catch (error) {
    console.error("❌ DEBUG: Error in stock transfer:", error);
    return {
      success: false,
      error: "Error al transferir stock entre almacenes",
    };
  }
}
