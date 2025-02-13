"use server";

import { options } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/db";
import { idSchema, PaymentSchema, TwoIdSchema } from "@/lib/schemas";
import {
  generateDeliveryOTP,
  generateOrderId,
  generateTrackingNumber,
} from "@/lib/utils";
import { OrderStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
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
  const deliveryPrice = formData.get("price") as string;
  const deliverDate = formData.get("deliveryDate") as string | null;
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

    // Convert deliveryDate to Date object if provided
    let deliveryDate: Date | undefined = undefined;
    if (deliverDate) {
      deliveryDate = new Date(deliverDate);
      if (isNaN(deliveryDate.getTime())) {
        return {
          errors: { deliveryDate: ["Invalid delivery date"] },
          success: false,
          message: "Invalid delivery date provided.",
        };
      }
    }

    const otp = generateDeliveryOTP();
    const trackingNumber = generateTrackingNumber();
    const deliveryMethod = "INTERNO";
    const carrier = "YUNUEN COMPANY";
    const deliveryStatus = "Pendiente de Pago";

    const dueDate = new Date();
    const orderNo = await generateOrderId(prisma);
    const session = await getServerSession(options);
    const user = session?.user;

    await prisma.$transaction(async (prisma) => {
      const newOrder = await prisma.order.create({
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
        include: {
          orderItems: true,
        },
      });

      // Iterate through each item in the order
      for (const orderItem of newOrder.orderItems) {
        // Find the stock entry for the item
        const stock = await prisma.stock.findFirst({
          where: { itemId: orderItem.itemId },
        });

        if (!stock) {
          throw new Error(`Stock not found for item ${orderItem.itemId}`);
        }

        // Calculate the new available quantity
        const newAvailableQty = stock.availableQty - orderItem.quantity;

        if (newAvailableQty < 0) {
          throw new Error(`Insufficient stock for item ${orderItem.itemId}`);
        }

        // Update the stock
        await prisma.stock.update({
          where: { id: stock.id },
          data: {
            availableQty: newAvailableQty,
            reservedQty: stock.reservedQty + orderItem.quantity, // Reserve the quantity
          },
        });

        // Create a stock movement record
        await prisma.stockMovement.create({
          data: {
            itemId: orderItem.itemId,
            type: "SALE",
            quantity: orderItem.quantity,
            reference: `Order ${newOrder.orderNo}`,
            status: "COMPLETED",
            createdBy: newOrder.clientId, // Assuming the client is the one placing the order
          },
        });
      }

      // ADD delivery

      const newDelivery = await prisma.delivery.create({
        data: {
          orderId: newOrder.id,
          orderNo,
          method: deliveryMethod,
          price: Number(deliveryPrice),
          carrier,
          otp,
          trackingNumber,
          deliveryDate: deliveryDate,
          status: deliveryStatus,
          userId: user.id,
        },
      });

      await prisma.order.update({
        where: {
          id: newOrder.id,
        },
        data: {
          deliveryId: newDelivery.id,
        },
      });
    });

    revalidatePath("/sistema/ventas/pedidos");
    revalidatePath("/sistema/ventas/envios");

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
    const order = await prisma.order.findUnique({
      where: { id: id as string },
      include: {
        delivery: true,
        payments: {
          select: { amount: true },
          where: {
            status: "PAGADO",
          },
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

    const previousPayments = order.payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    // Check if order is already paid off
    if (previousPayments > order.totalAmount + (order.delivery?.price || 0)) {
      return {
        errors: {},
        success: false,
        message: "El pedido ya está pagado en su totalidad",
      };
    }

    console.log(
      previousPayments + paymentAmount,
      order.totalAmount + (order.delivery?.price || 0)
    );
    // Check if new payment would exceed order total
    if (
      previousPayments + paymentAmount >
      order.totalAmount + (order.delivery?.price || 0)
    ) {
      return {
        errors: {},
        success: false,
        message: `El monto del pago de $${paymentAmount} excedería el total del pedido!.`,
      };
    }

    // Create new payment
    const payment = await prisma.payment.create({
      data: {
        amount: Math.round(paymentAmount),
        method: method || "Efectivo",
        orderNo: order.orderNo,
        orderId: order.id,
        reference,
        status: "PAGADO",
        invoiceId: "",
      },
    });

    let orderStatus = "PENDIENTE";

    if (
      previousPayments + paymentAmount ===
      order.totalAmount + (order.delivery?.price || 0)
    ) {
      orderStatus = "PROCESANDO";
    }

    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: orderStatus as OrderStatus,
      },
    });

    revalidatePath(`/sistema/ventas/pedidos/${order.id}`);
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
    await prisma.payment.update({
      where: {
        id: validatedData.data.id,
      },
      data: {
        status: "CANCELADO",
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

export async function deleteOrderAction(formData: FormData) {
  const rawData = {
    id: formData.get("id"),
    userId: formData.get("userId"),
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
    // Fetch the order with its items
    const order = await prisma.order.findUnique({
      where: { id: validatedData.data.id },
      include: { orderItems: true },
    });

    if (!order) {
      return {
        errors: {},
        success: false,
        message: "Order not found",
      };
    }

    // Start a transaction to ensure atomicity
    await prisma.$transaction(async (prisma) => {
      // Release reserved stock for each item in the order
      for (const orderItem of order.orderItems) {
        // Find the stock entries for the item
        const stocks = await prisma.stock.findMany({
          where: { itemId: orderItem.itemId },
        });

        // Calculate the total reserved quantity to release
        const quantityToRelease = orderItem.quantity;

        // Update each stock entry to release the reserved quantity
        for (const stock of stocks) {
          if (stock.reservedQty >= quantityToRelease) {
            // Release the reserved quantity
            await prisma.stock.update({
              where: { id: stock.id },
              data: {
                reservedQty: stock.reservedQty - quantityToRelease,
                availableQty: stock.availableQty + quantityToRelease,
              },
            });

            // Create a stock movement record for the release
            await prisma.stockMovement.create({
              data: {
                itemId: orderItem.itemId,
                type: "RETURN", // Indicates stock is being returned to available
                quantity: quantityToRelease,
                reference: `Order ${order.orderNo} deleted`,
                status: "COMPLETED",
                createdBy: rawData.userId as string, // Or the user ID who deleted the order
              },
            });

            break; // Exit the loop after releasing the quantity
          }
        }
      }

      // Delete order items
      // await prisma.orderItem.deleteMany({
      //   where: {
      //     orderId: validatedData.data.id,
      //   },
      // });

      // Update payments status to cancelled
      await prisma.payment.updateMany({
        where: {
          orderId: validatedData.data.id,
        },
        data: {
          status: "CANCELADO",
        },
      });

      // Update order status to cancelled
      const updatedOrder = await prisma.order.update({
        where: {
          id: validatedData.data.id,
        },
        data: {
          status: "CANCELADO",
        },
      });

      if (updatedOrder.deliveryId) {
        await prisma.delivery.update({
          where: {
            id: updatedOrder.deliveryId,
          },
          data: {
            status: "CANCELADO",
          },
        });
      }
    });

    console.log("Order deleted and stock updated successfully");
    revalidatePath("/sistema/ventas/pedidos");
    revalidatePath("/sistema/ventas/pagos");
    return {
      errors: {},
      success: true,
      message: "Order deleted successfully!",
    };
  } catch (error) {
    console.error("Error deleting order:", error);
    return {
      errors: {},
      success: false,
      message: "Failed to delete order",
    };
  }
}

export async function deleteOrderItemsAction(formData: FormData) {
  const rawData = {
    id: formData.get("id"),
    orderId: formData.get("orderId"),
    userId: formData.get("userId"),
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

    // Fetch the order with its items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });

    if (!order) {
      return {
        errors: {},
        success: false,
        message: "Order not found",
      };
    }

    // Start a transaction to ensure atomicity
    await prisma.$transaction(async (prisma) => {
      // Release reserved stock for each item in the order
      for (const orderItem of order.orderItems) {
        // Find the stock entries for the item
        const stocks = await prisma.stock.findMany({
          where: { itemId: orderItem.itemId },
        });

        // Calculate the total reserved quantity to release
        const quantityToRelease = orderItem.quantity;

        // Update each stock entry to release the reserved quantity
        for (const stock of stocks) {
          if (stock.reservedQty >= quantityToRelease) {
            // Release the reserved quantity
            await prisma.stock.update({
              where: { id: stock.id },
              data: {
                reservedQty: stock.reservedQty - quantityToRelease,
                availableQty: stock.availableQty + quantityToRelease,
              },
            });

            // Create a stock movement record for the release
            await prisma.stockMovement.create({
              data: {
                itemId: orderItem.itemId,
                type: "RETURN", // Indicates stock is being returned to available
                quantity: quantityToRelease,
                reference: `Order ${order.orderNo} cancelled`,
                status: "COMPLETED",
                createdBy: rawData.userId as string, // Or the user ID who cancelled the order
              },
            });

            break; // Exit the loop after releasing the quantity
          }
        }
      }

      const remainingItems = await prisma.orderItem.findMany({
        where: { orderId: orderId },
      });

      // if its the last item
      if (remainingItems.length === 1) {
        // Update payments status to cancelled
        await prisma.payment.updateMany({
          where: {
            orderId: validatedData.data.orderId,
          },
          data: {
            status: "CANCELADO",
          },
        });

        // Update the order status to CANCELADO
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "CANCELADO" },
        });
      } else {
        // Delete the specified order item
        await prisma.orderItem.delete({ where: { id: itemId } });
      }

      console.log(
        `Order ${orderId} status updated to CANCELADO and stock released`
      );
    });

    revalidatePath("/sistema/ventas/pedidos");
    revalidatePath("/sistema/ventas/pagos");
    revalidatePath(`/sistema/ventas/pedidos/${orderId}`);

    return {
      errors: {},
      success: true,
      message:
        "Order status updated to CANCELADO and stock released successfully!",
    };
  } catch (error) {
    console.error("Error updating order status and releasing stock:", error);
    return {
      errors: {},
      success: false,
      message: "Failed to update order status and release stock",
    };
  }
}
