"use server";

import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import { CartState, PaymentType } from "@/types/pos";
import { revalidatePath } from "next/cache";
import { generateOrderId } from "@/lib/utils";

export async function createPosOrder(
  cart: CartState,
  paymentMethod: PaymentType,
  customerId?: string
) {
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
        throw new Error(
          `Stock insuficiente para ${cartItem.name}. Disponible: ${totalAvailable}, Solicitado: ${cartItem.quantity}`
        );
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
    const order = await prisma.order.create({
      data: {
        orderNo: orderNumber,
        clientId: finalCustomerId,
        userId: session.user.id,
        totalAmount: Math.round(cart.totalAmount),
        discount: cart.discountAmount || 0,
        status: "ENTREGADO",
        notes: "Venta POS",
        dueDate: new Date(),
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
        reference: `POS-${Date.now()}`,
      },
    });

    revalidatePath("/sistema/pos");
    revalidatePath("/sistema/ventas/pedidos");
    revalidatePath("/sistema/negocio/articulos");
    return { success: true, orderId: order.id };
  } catch (error) {
    console.error("Error creating POS order:", error);
    throw new Error("Error al procesar la venta");
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
