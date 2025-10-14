"use server";

import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import { CartState, PaymentType, CashBreakdown } from "@/types/pos";
import {
  calculateOptimalChange,
  subtractChangeFromRegister,
} from "@/lib/changeCalculation";
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
  error?: string;
  isStockError?: boolean;
  changeGiven?: CashBreakdown;
  changeAmount?: number;
  stockSuggestions?: {
    itemName: string;
    itemId: string;
    requiredQuantity: number;
    availableLocally: number;
    availableWarehouses: WarehouseStockInfo[];
  }[];
}

// Utility function to add two CashBreakdown objects
function addCashBreakdowns(
  existing: CashBreakdown | null,
  incoming: CashBreakdown
): CashBreakdown {
  if (!existing) return incoming;

  // Helper function to safely get denomination values
  const safeDenomination = (
    existingDenom: any,
    incomingDenom: any,
    value: number
  ) => ({
    value,
    count: (existingDenom?.count || 0) + (incomingDenom?.count || 0),
    total: (existingDenom?.total || 0) + (incomingDenom?.total || 0),
  });

  return {
    bills: {
      thousands: safeDenomination(
        existing.bills?.thousands,
        incoming.bills?.thousands,
        1000
      ),
      fiveHundreds: safeDenomination(
        existing.bills?.fiveHundreds,
        incoming.bills?.fiveHundreds,
        500
      ),
      twoHundreds: safeDenomination(
        existing.bills?.twoHundreds,
        incoming.bills?.twoHundreds,
        200
      ),
      hundreds: safeDenomination(
        existing.bills?.hundreds,
        incoming.bills?.hundreds,
        100
      ),
      fifties: safeDenomination(
        existing.bills?.fifties,
        incoming.bills?.fifties,
        50
      ),
      twenties: safeDenomination(
        existing.bills?.twenties,
        incoming.bills?.twenties,
        20
      ),
      tens: safeDenomination(existing.bills?.tens, incoming.bills?.tens, 10),
      fives: safeDenomination(existing.bills?.fives, incoming.bills?.fives, 5),
      ones: safeDenomination(existing.bills?.ones, incoming.bills?.ones, 1),
    },
    coins: {
      peso20: safeDenomination(
        existing.coins?.peso20,
        incoming.coins?.peso20,
        20
      ),
      peso10: safeDenomination(
        existing.coins?.peso10,
        incoming.coins?.peso10,
        10
      ),
      peso5: safeDenomination(existing.coins?.peso5, incoming.coins?.peso5, 5),
      peso2: safeDenomination(existing.coins?.peso2, incoming.coins?.peso2, 2),
      peso1: safeDenomination(existing.coins?.peso1, incoming.coins?.peso1, 1),
      centavos50: safeDenomination(
        existing.coins?.centavos50,
        incoming.coins?.centavos50,
        0.5
      ),
      centavos20: safeDenomination(
        existing.coins?.centavos20,
        incoming.coins?.centavos20,
        0.2
      ),
      centavos10: safeDenomination(
        existing.coins?.centavos10,
        incoming.coins?.centavos10,
        0.1
      ),
    },
    totalCash: (existing?.totalCash || 0) + (incoming?.totalCash || 0),
  };
}

export async function createPosOrder(
  cart: CartState,
  paymentMethod: PaymentType,
  customerId?: string,
  billBreakdown?: CashBreakdown, // CashBreakdown object
  cashReceived?: number, // Amount of cash received from customer
  referenceNumber?: string // Payment reference number for cards/transfers
): Promise<PosOrderResult> {
  const session = await getServerSession(options);

  if (!session?.user?.id) {
    throw new Error("Usuario no autenticado");
  }

  try {
    // Get or create "PUBLICO GENERAL" client if no customerId provided
    let finalCustomerId = customerId;

    if (!finalCustomerId) {
      const publicClient = await prisma.client.upsert({
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
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { warehouse: true },
    });

    const currentWarehouseId = user?.warehouseId;

    // Use the same stock update logic as sistema/ventas/pedidos/nuevo
    const orderItems = [];
    const stockSuggestions = [];

    for (const cartItem of cart.items) {
      console.log("🔍 DEBUG: Checking stock for item:", {
        itemName: cartItem.name,
        itemId: cartItem.itemId,
        requestedQty: cartItem.quantity,
        userWarehouseId: currentWarehouseId,
      });

      // Check stock availability in current warehouse or all warehouses if no specific warehouse
      const stocks = await prisma.stock.findMany({
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
        "📊 DEBUG: Found stocks:",
        stocks.map((s) => ({
          warehouseId: s.warehouseId,
          warehouseName: s.warehouse.title,
          quantity: s.quantity,
        }))
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
        // User has no warehouse - treat all stock as local (this might be the issue)
        localStock = totalAvailable;
      }

      console.log("📈 DEBUG: Stock calculation:", {
        localStock,
        totalAvailable,
        requestedQty: cartItem.quantity,
        needsCrossWarehouse: localStock < cartItem.quantity,
      });

      if (localStock < cartItem.quantity) {
        // Check if stock is available in other warehouses
        const availableWarehouses = await checkStockInOtherWarehouses(
          cartItem.itemId,
          currentWarehouseId || null,
          cartItem.quantity - localStock // Only need the deficit from LOCAL stock
        );

        console.log("🏭 DEBUG: Cross-warehouse check result:", {
          deficit: cartItem.quantity - localStock,
          availableWarehouses: availableWarehouses.length,
          warehouses: availableWarehouses.map((w) => ({
            name: w.warehouseName,
            stock: w.availableStock,
          })),
        });

        if (availableWarehouses.length > 0) {
          // Stock available in other warehouses - allow sale but mark for notification
          stockSuggestions.push({
            itemName: cartItem.name,
            itemId: cartItem.itemId,
            requiredQuantity: cartItem.quantity - localStock, // Only the deficit from LOCAL stock
            availableLocally: localStock, // Use LOCAL stock, not total
            availableWarehouses,
          });

          console.log("📦 DEBUG: Item needs cross-warehouse fulfillment:", {
            item: cartItem.name,
            localStock: localStock,
            requiredQty: cartItem.quantity,
            deficit: cartItem.quantity - localStock,
            availableWarehouses: availableWarehouses.length,
          });
        } else {
          // No stock available anywhere - fail the transaction
          return {
            success: false,
            error: `Stock insuficiente para ${cartItem.name}. Disponible localmente: ${localStock}, Solicitado: ${cartItem.quantity}. No hay stock en otras sucursales.`,
            isStockError: true,
            stockSuggestions: undefined,
          };
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
    const orderNumber = await generateOrderId(prisma);

    // Create the order using Order model with status "ENTREGADO"
    const createdAt = getMexicoGlobalUtcDate();
    const order = await prisma.order.create({
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

      const stocks = await prisma.stock.findMany({
        where: { itemId: cartItem.itemId },
        orderBy: { createdAt: "asc" },
      });

      for (const stock of stocks) {
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
    }

    // Create payment record
    const paymentMethodMap = {
      [PaymentType.CASH]: "EFECTIVO",
      [PaymentType.CARD]: "TARJETA",
      [PaymentType.TRANSFER]: "TRANSFERENCIA",
      [PaymentType.MIXED]: "MIXTO",
      [PaymentType.ACCOUNT]: "CUENTA",
    };

    await prisma.payment.create({
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
    let changeGiven: CashBreakdown | undefined;
    let changeAmount: number | undefined;

    // Handle cash register updates for cash payments
    if (paymentMethod === PaymentType.CASH) {
      // Get the user's cash register
      const cashRegister = await prisma.cashRegister.findFirst({
        where: { userId: session.user.id },
      });

      if (cashRegister) {
        // Parse existing breakdown
        let existingBreakdown: CashBreakdown | null = null;
        if (cashRegister.billBreakdown) {
          existingBreakdown = cashRegister.billBreakdown as CashBreakdown;
        }

        // Add incoming cash breakdown to register
        const updatedBreakdown = billBreakdown
          ? addCashBreakdowns(existingBreakdown, billBreakdown)
          : existingBreakdown;

        // Calculate change if cash received is specified
        let finalBreakdown = updatedBreakdown;

        if (cashReceived && cashReceived > cart.totalAmount) {
          changeAmount = cashReceived - cart.totalAmount;

          // Calculate optimal change distribution
          const changeResult = calculateOptimalChange(
            changeAmount,
            updatedBreakdown
          );

          if (!changeResult.success) {
            return {
              success: false,
              error:
                changeResult.error ||
                `No se puede dar cambio de $${changeAmount.toFixed(2)}`,
              isStockError: false,
            };
          }

          // Store change information for return
          changeGiven = changeResult.changeGiven || undefined;

          // Subtract change denominations from register
          if (changeResult.changeGiven) {
            finalBreakdown = subtractChangeFromRegister(
              updatedBreakdown,
              changeResult.changeGiven
            );
          }
        }

        // Update cash register balance and denominations
        await prisma.cashRegister.update({
          where: { id: cashRegister.id },
          data: {
            balance: cashRegister.balance + cart.totalAmount,
            billBreakdown: finalBreakdown,
            updatedAt: createdAt,
          },
        });

        // Create cash transaction record
        await prisma.cashTransaction.create({
          data: {
            type: "DEPOSITO",
            amount: cart.totalAmount,
            description: `Venta POS - ${order.orderNo}`,
            cashRegisterId: cashRegister.id,
            billBreakdown,
            userId: session.user.id,
            createdAt,
            updatedAt: createdAt,
          },
        });
      }
    }

    revalidatePath("/sistema/pos");
    revalidatePath("/sistema/ventas/pedidos");
    revalidatePath("/sistema/negocio/articulos");

    console.log(
      "✅ DEBUG: POS Order completed successfully with stock suggestions:",
      {
        orderId: order.id,
        stockSuggestions:
          stockSuggestions.length > 0 ? stockSuggestions : "none",
        stockSuggestionsCount: stockSuggestions.length,
        stockSuggestionsDetails: stockSuggestions,
      }
    );

    return {
      success: true,
      orderId: order.id,
      changeGiven,
      changeAmount,
      stockSuggestions:
        stockSuggestions.length > 0 ? stockSuggestions : undefined,
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

export async function createHeldOrder(cart: CartState, customerId?: string) {
  const session = await getServerSession(options);

  if (!session?.user?.id) {
    throw new Error("Usuario no autenticado");
  }

  try {
    // Get the user's cash register
    const cashRegister = await prisma.cashRegister.findFirst({
      where: { userId: session.user.id },
    });

    if (!cashRegister) {
      throw new Error("No se encontró caja registradora para el usuario");
    }

    // Create held order with items as JSON string (as per schema)
    const heldOrder = await prisma.heldOrder.create({
      data: {
        holdNumber: `HELD-${Date.now()}`,
        cashRegisterId: cashRegister.id,
        customerId: customerId || undefined,
        heldBy: session.user.id,
        status: "HELD",
        items: JSON.stringify(
          cart.items.map((item) => ({
            itemId: item.itemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            discount: item.discount,
            totalPrice: item.price * item.quantity - (item.discount || 0),
          }))
        ),
        subtotal: cart.subtotal,
        discountAmount: cart.discountAmount || 0,
        notes: "Orden suspendida",
      },
    });

    revalidatePath("/sistema/pos");
    revalidatePath("/sistema/ventas/pedidos");

    return { success: true, heldOrderId: heldOrder.id };
  } catch (error) {
    console.error("Error creating held order:", error);
    throw new Error("Error al suspender la orden");
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
  console.log("🔍 DEBUG: createBranchNotificationFromPos called with:", {
    itemId,
    itemName,
    requiredQuantity,
    targetWarehouseId,
    customerId,
    deliveryMethod,
    notes,
  });

  const session = await getServerSession(options);

  if (!session?.user?.id) {
    console.log("❌ DEBUG: No authenticated user session");
    return { success: false, error: "Usuario no autenticado" };
  }

  console.log("✅ DEBUG: User authenticated:", session.user.id);

  try {
    // Get user's current warehouse
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { warehouse: true },
    });

    console.log("🏢 DEBUG: User data:", {
      userId: user?.id,
      warehouseId: user?.warehouseId,
      warehouseName: user?.warehouse?.title,
    });

    if (!user?.warehouseId) {
      console.log("❌ DEBUG: User has no assigned warehouse");
      return { success: false, error: "Usuario sin almacén asignado" };
    }

    // Generate notification number
    const notificationCount = await prisma.branchNotification.count();
    const notificationNo = `BN${(notificationCount + 1)
      .toString()
      .padStart(6, "0")}`;

    console.log(
      "🔢 DEBUG: Generated notification number:",
      notificationNo,
      "based on count:",
      notificationCount
    );

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
      console.log("👤 DEBUG: Customer info:", customerInfo);
    }

    const createdAt = getMexicoGlobalUtcDate();

    console.log("📝 DEBUG: About to create notification with data:", {
      notificationNo,
      type: "STOCK_REQUEST",
      priority: "HIGH",
      title: `Solicitud de stock - ${itemName}`,
      fromWarehouseId: user.warehouseId,
      toWarehouseId: targetWarehouseId,
      itemId,
      requestedQty: requiredQuantity,
      deliveryMethod,
      createdBy: session.user.id,
    });

    // Create branch notification
    const notification = await prisma.branchNotification.create({
      data: {
        notificationNo,
        type: "STOCK_REQUEST",
        priority: "HIGH",
        title: `Solicitud de stock - ${itemName}`,
        message: `Se requiere ${requiredQuantity} unidades de ${itemName} para completar una venta en POS.`,
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

    console.log("✅ DEBUG: Notification created successfully:", {
      id: notification.id,
      notificationNo: notification.notificationNo,
      type: notification.type,
    });

    revalidatePath("/sistema/notifications");

    return {
      success: true,
      notificationId: notification.id,
    };
  } catch (error) {
    console.error("❌ DEBUG: Error creating branch notification:", error);
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
    console.log("🔄 DEBUG: Starting stock transfer:", {
      notificationId,
      itemId,
      quantity,
      fromWarehouseId,
      toWarehouseId,
    });

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

    console.log("✅ DEBUG: Stock transfer completed:", {
      transferId: transfer.id,
      transferNo: transfer.transferNo,
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
