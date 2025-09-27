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

// Result interface for POS operations
interface PosOrderResult {
  success: boolean;
  orderId?: string;
  error?: string;
  isStockError?: boolean;
  changeGiven?: CashBreakdown;
  changeAmount?: number;
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

    // Use the same stock update logic as sistema/ventas/pedidos/nuevo
    const orderItems = [];
    for (const cartItem of cart.items) {
      // Check stock availability
      const stocks = await prisma.stock.findMany({
        where: { itemId: cartItem.itemId },
      });

      const totalAvailable = stocks.reduce(
        (sum, stock) => sum + stock.quantity,
        0
      );

      if (totalAvailable < cartItem.quantity) {
        return {
          success: false,
          error: `Stock insuficiente para ${cartItem.name}. Disponible: ${totalAvailable}, Solicitado: ${cartItem.quantity}`,
          isStockError: true,
        };
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
    return {
      success: true,
      orderId: order.id,
      changeGiven,
      changeAmount,
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
  const session = await getServerSession(options);

  if (!session?.user?.id) {
    throw new Error("Usuario no autenticado");
  }

  try {
    // Since favorites are global in this system, we'll update the favorites table directly
    // First, clear existing favorites and then recreate them
    await prisma.favorite.deleteMany({});

    // Create new favorites
    for (const favorite of favorites) {
      await prisma.favorite.create({
        data: {
          itemId: favorite.itemId,
          name: favorite.name,
          price: favorite.price,
          image: favorite.image,
          position: favorite.position,
          isActive: favorite.isActive,
        },
      });
    }

    revalidatePath("/sistema/pos");
    return { success: true };
  } catch (error) {
    console.error("Error updating favorites:", error);
    throw new Error("Error al actualizar favoritos");
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
