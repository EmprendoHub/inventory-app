"use server";

import prisma from "@/lib/db";
import { idSchema, PaymentSchema, TwoIdSchema } from "@/lib/schemas";
import { generateOrderId } from "@/lib/utils";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createNewOrder(
  state: {
    errors: { [key: string]: string[] };
    success: boolean;
    message: string;
  },
  formData: FormData
) {
  const clientData = formData.get("client") as string;
  const itemsInput = formData.get("items") as string;
  const notes = formData.get("notes") as string;

  // Validate inputs
  const errors: { [key: string]: string[] } = {};

  const client = JSON.parse(clientData);

  let items: {
    id: string;
    quantity: number;
    price: number;
    name: string;
    description: string;
    notes: string;
    mainImage: string;
  }[] = [];
  try {
    items = JSON.parse(itemsInput || "[]");

    if (!Array.isArray(items) || items.length === 0) {
      errors.items = ["Items must be a non-empty JSON array"];
    }

    items.forEach((item, index) => {
      if (!item.id || !item.quantity || !item.price) {
        errors.items = [`Item at index ${index} is missing required fields`];
      }
    });
  } catch (error) {
    console.log(error);

    errors.items = ["Invalid JSON format for items"];
  }

  console.log(errors);

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      success: false,
      message: "Please fix the errors before submitting.",
    };
  }

  try {
    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    const dueDate = new Date();
    const orderNo = await generateOrderId(prisma);

    await prisma.order.create({
      data: {
        orderNo,
        clientId: client.id,
        status: "PENDIENTE" as OrderStatus,
        totalAmount,
        notes,
        dueDate,
        orderItems: {
          create: items.map((item) => ({
            itemId: item.id,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            image: item.mainImage,
          })),
        },
      },
    });

    revalidatePath("/sistema/ventas/pedidos");

    return {
      errors: {},
      success: true,
      message: "Order created successfully!",
    };
  } catch (error) {
    console.error("Error creating order:", error);
    return {
      errors: {},
      success: false,
      message: "Failed to create order",
    };
  }
}

export async function deleteOrderAction(formData: FormData) {
  const rawData = {
    id: formData.get("id"),
  };

  // Validate the data using Zod
  const validatedData = idSchema.safeParse(rawData);
  if (!validatedData.success) {
    const errors = validatedData.error.flatten().fieldErrors;
    return {
      errors,
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  if (!validatedData.data)
    return { success: false, message: "Error al crear producto" };

  try {
    await prisma.orderItem.deleteMany({
      where: {
        orderId: validatedData.data.id,
      },
    });

    await prisma.payment.deleteMany({
      where: {
        orderId: validatedData.data.id,
      },
    });

    const order = await prisma.order.delete({
      where: {
        id: validatedData.data.id,
      },
    });

    console.log("order deleted", order);
    revalidatePath("/sistema/ventas/pedidos");
    revalidatePath("/sistema/ventas/pagos");
    return {
      errors: {},
      success: true,
      message: "Order deleted successfully!",
    };
  } catch (error) {
    console.error("Error creating order:", error);
    return {
      errors: {},
      success: false,
      message: "Failed to delete order",
    };
  }
}

export async function payOrderAction(formData: FormData) {
  // Extract and validate form data
  const rawData = {
    id: formData.get("id"),
    amount: formData.get("amount"),
    reference: formData.get("reference"),
    method: formData.get("method"),
  };

  // Validate the data using Zod
  const validatedData = PaymentSchema.safeParse(rawData);
  if (!validatedData.success) {
    return {
      errors: validatedData.error.flatten().fieldErrors,
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  const { id, amount, reference, method } = validatedData.data;
  const paymentAmount = Number(amount);

  try {
    // Find order and calculate current payments total
    const order = await prisma.order.findUnique({
      where: { id: id as string },
      include: {
        payments: {
          select: { amount: true },
        },
      },
    });

    if (!order) {
      return {
        errors: {},
        success: false,
        message: "Order not found",
      };
    }

    const currentTotal = order.payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    // Check if order is already paid off
    if (currentTotal >= order.totalAmount) {
      return {
        errors: {},
        success: false,
        message: "El pedido ya está pagado en su totalidad",
      };
    }

    // Check if new payment would exceed order total
    if (currentTotal + paymentAmount > order.totalAmount) {
      return {
        errors: {},
        success: false,
        message: `El monto del pago de $${paymentAmount} excedería el total del pedido, intenta aplicar un pago por no mas de: $${
          order.totalAmount - currentTotal
        } `,
      };
    }

    // Create new payment
    const payment = await prisma.payment.create({
      data: {
        amount: Math.round(paymentAmount),
        method: method || "cash",
        orderNo: order.orderNo,
        orderId: order.id,
        reference,
        status: "Paid",
        invoiceId: "",
      },
    });

    revalidatePath("/sistema/ventas/pedidos");
    revalidatePath("/sistema/ventas/pagos");

    return {
      payment,
      errors: {},
      success: true,
      message: `Pago de $${paymentAmount} aceptado.`,
    };
  } catch (error) {
    console.error("Error processing payment:", error);
    return {
      errors: {},
      success: false,
      message: "Failed to process payment",
    };
  }
}

export async function deletePaymentAction(formData: FormData) {
  const rawData = {
    id: formData.get("id"),
  };

  // Validate the data using Zod
  const validatedData = idSchema.safeParse(rawData);
  if (!validatedData.success) {
    const errors = validatedData.error.flatten().fieldErrors;
    return {
      errors,
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  if (!validatedData.data)
    return { success: false, message: "Error al borrar pago" };

  try {
    await prisma.payment.delete({
      where: {
        id: validatedData.data.id,
      },
    });

    revalidatePath("/sistema/ventas/pedidos");
    revalidatePath("/sistema/ventas/pagos");
    revalidatePath(`/sistema/ventas/pedidos/${validatedData.data.id}`);
    return {
      errors: {},
      success: true,
      message: "Pago eliminado con éxito!",
    };
  } catch (error) {
    console.error("Error al eliminar pago:", error);
    return {
      errors: {},
      success: false,
      message: "Failed to delete payment",
    };
  }
}

export async function deleteOrderItemsAction(formData: FormData) {
  const rawData = {
    id: formData.get("id"),
    orderId: formData.get("orderId"),
  };

  // Validate the data using Zod
  const validatedData = TwoIdSchema.safeParse(rawData);
  if (!validatedData.success) {
    const errors = validatedData.error.flatten().fieldErrors;
    return {
      errors,
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  if (!validatedData.data)
    return { success: false, message: "Error al borrar pago" };

  try {
    const orderId = validatedData.data.orderId;
    const itemId = validatedData.data.id;

    // Check the number of orderItems for this order
    const orderItemCount = await prisma.orderItem.count({
      where: { orderId },
    });

    if (orderItemCount === 1) {
      // If it's the last order item, delete the order itself
      await prisma.orderItem.deleteMany({ where: { orderId } });
      await prisma.payment.deleteMany({ where: { orderId } });
      await prisma.order.delete({ where: { id: orderId } });
      console.log(
        `Order ${orderId} and its payments and last orderItem deleted`
      );
    } else {
      // Otherwise, just delete the specified orderItem
      await prisma.orderItem.delete({ where: { id: itemId } });
      console.log(`OrderItem deleted from Order ${orderId}`);
    }

    revalidatePath("/sistema/ventas/pedidos");
    revalidatePath("/sistema/ventas/pagos");
    revalidatePath(`/sistema/ventas/pedidos/${orderId}`);

    return {
      errors: {},
      success: true,
      message: "Pago eliminado con éxito!",
    };
  } catch (error) {
    console.error("Error al eliminar pago:", error);
    return {
      errors: {},
      success: false,
      message: "Failed to delete payment",
    };
  }
}
