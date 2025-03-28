"use server";

import { options } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/db";
import { idSchema, PaymentSchema, TwoIdSchema } from "@/lib/schemas";
import {
  generateDeliveryOTP,
  generateOrderId,
  generateTrackingNumber,
  getMexicoGlobalUtcDate,
} from "@/lib/utils";
import { OrderItemsType } from "@/types/sales";
import { OrderStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export async function createNewOrder(
  state: {
    errors?: Record<string, string[]>;
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
  const discount = formData.get("discount") as number | null;

  const client = JSON.parse(clientData);

  type LocalItemsType = {
    id: string;
    quantity: number;
    price: number;
    name: string;
    description: string;
    notes: string;
    mainImage: string;
    isGroup: boolean;
    items: OrderItemsType[];
  }[];

  const items = JSON.parse(itemsInput) as LocalItemsType;

  if (items.length === 0) {
    return {
      errors: {},
      success: false,
      message: "No se seleccionaron productos.",
    };
  }

  if (!client) {
    return {
      errors: {},
      success: false,
      message: "No se selecciono un  cliente.",
    };
  }

  try {
    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    let deliveryDate: Date | undefined = undefined;
    if (deliverDate) {
      deliveryDate = new Date(deliverDate);
      if (isNaN(deliveryDate.getTime())) {
        return {
          errors: {},
          success: false,
          message: "Invalid delivery date provided.",
        };
      }
    }

    const otp = generateDeliveryOTP();
    const trackingNumber = generateTrackingNumber();
    const deliveryMethod = "INTERNO";
    const carrier = "YUNUEN COMPANY";
    const deliveryStatus = "PENDIENTE";

    const dueDate = new Date(); // Current date and time
    dueDate.setDate(dueDate.getDate() + 30); // Add 30 days
    const orderNo = await generateOrderId(prisma);
    const session = await getServerSession(options);
    const user = session?.user;
    const createdAt = getMexicoGlobalUtcDate();
    await prisma.$transaction(
      async (prisma) => {
        // Create the order
        const newOrder = await prisma.order.create({
          data: {
            orderNo,
            clientId: client.id,
            status: "PENDIENTE" as OrderStatus,
            totalAmount,
            discount: Number(discount) || 0,
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
                isGroup: item.isGroup,
              })),
            },
            createdAt,
            updatedAt: createdAt,
          },
          include: {
            orderItems: true,
          },
        });

        // Batch stock updates and stock movements
        const stockUpdates = [];
        const stockMovements = [];

        for (const orderItem of items) {
          if (orderItem.isGroup) {
            const orderItems = await prisma.itemGroup.findFirst({
              where: {
                id: orderItem.id,
              },
              include: {
                items: true,
              },
            });

            if (orderItems?.items) {
              for (const groupOrderItem of orderItems.items) {
                const stock = await prisma.stock.findFirst({
                  where: { itemId: groupOrderItem.itemId },
                });
                const item = await prisma.item.findFirst({
                  where: {
                    id: groupOrderItem.itemId,
                  },
                });
                if (!stock) {
                  throw new Error(
                    `No hay suficiente existencias del artículo ${orderItems.name}`
                  );
                }

                const newAvailableQty =
                  stock.quantity - groupOrderItem.quantity;

                if (newAvailableQty < 0) {
                  const shortageAmount = Math.abs(newAvailableQty);

                  throw new Error(
                    `No hay suficiente existencias del artículo ${item?.name}. Articulo: ${groupOrderItem.id}, Faltante: ${shortageAmount}`
                  );
                }

                stockUpdates.push(
                  prisma.stock.update({
                    where: { id: stock.id },
                    data: {
                      quantity: newAvailableQty,
                      availableQty: newAvailableQty,
                      reservedQty: stock.reservedQty,
                      updatedAt: createdAt,
                    },
                  })
                );

                stockMovements.push(
                  prisma.stockMovement.create({
                    data: {
                      itemId: groupOrderItem.itemId,
                      type: "SALE",
                      quantity: groupOrderItem.quantity,
                      reference: `Order ${newOrder.orderNo}`,
                      status: "COMPLETED",
                      createdBy: newOrder.clientId,
                      createdAt,
                      updatedAt: createdAt,
                    },
                  })
                );
              }
            }
          } else {
            const stock = await prisma.stock.findFirst({
              where: { itemId: orderItem.id },
            });

            if (!stock) {
              throw new Error(`Stock not found for item ${orderItem.id}`);
            }

            const newAvailableQty = stock.quantity - orderItem.quantity;

            if (newAvailableQty < 0) {
              const shortageAmount = Math.abs(newAvailableQty);
              throw new Error(
                `No hay suficiente existencias del artículo ${orderItem.id}. Articulo: ${orderItem.name}, Faltante: ${shortageAmount}`
              );
            }

            stockUpdates.push(
              prisma.stock.update({
                where: { id: stock.id },
                data: {
                  quantity: newAvailableQty,
                  availableQty: newAvailableQty,
                  reservedQty: stock.reservedQty,
                  updatedAt: createdAt,
                },
              })
            );

            stockMovements.push(
              prisma.stockMovement.create({
                data: {
                  itemId: orderItem.id,
                  type: "SALE",
                  quantity: orderItem.quantity,
                  reference: `Order ${newOrder.orderNo}`,
                  status: "COMPLETED",
                  createdBy: newOrder.clientId,
                  createdAt,
                  updatedAt: createdAt,
                },
              })
            );
          }
        }

        // Execute all stock updates and stock movements in parallel
        await Promise.all([...stockUpdates, ...stockMovements]);

        if (Number(deliveryPrice) > 0) {
          // Create delivery
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
              createdAt,
              updatedAt: createdAt,
            },
          });

          await prisma.order.update({
            where: {
              id: newOrder.id,
            },
            data: {
              deliveryId: newDelivery.id,
              updatedAt: createdAt,
            },
          });
        }
      },
      {
        timeout: 10000, // Increase timeout to 10 seconds
      }
    );

    revalidatePath("/sistema/negocio/articulos");
    revalidatePath("/sistema/ventas/pedidos");
    revalidatePath("/sistema/ventas/envios");

    return {
      errors: {},
      success: true,
      message: "Order created successfully!",
    };
  } catch (error) {
    console.error("Error creating order:", error);

    // Check if the error is related to insufficient stock
    if (
      error instanceof Error &&
      error.message.includes("No hay suficiente existencias")
    ) {
      // Extract the item ID, name, and shortage amount from the error message
      //const itemIdMatch = error.message.match(/item\s+([a-f0-9]+)/);
      const itemNameMatch = error.message.match(/Articulo:\s+([^,]+)/);
      const shortageMatch = error.message.match(/Faltante:\s+(\d+)/);

      //const itemId = itemIdMatch ? itemIdMatch[1] : null;
      const itemName = itemNameMatch ? itemNameMatch[1] : "Unknown Item";
      const shortageAmount = shortageMatch ? shortageMatch[1] : "Unknown";

      // Return a custom error message with item name and shortage amount
      return {
        errors: {},
        success: false,
        message: `No hay suficiente existencias del artículo "${itemName}". Faltan ${shortageAmount} unidades. Ajuste la cantidad o elimine el artículo del pedido.`,
      };
    }

    // Handle other generic errors
    return {
      errors: {},
      success: false,
      message: "An unexpected error occurred while creating the order.",
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

  const session = await getServerSession(options);
  const user = session?.user;
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
    const createdAt = getMexicoGlobalUtcDate();
    await prisma.$transaction(async (prisma) => {
      // Create new payment
      const payment = await prisma.payment.create({
        data: {
          amount: Math.round(paymentAmount),
          method: method || "EFECTIVO",
          orderNo: order.orderNo,
          orderId: order.id,
          reference,
          status: "PAGADO",
          invoiceId: "",
          createdAt,
          updatedAt: createdAt,
        },
      });

      if (payment.method === "EFECTIVO") {
        const updatedRegister = await prisma.cashRegister.update({
          where: { userId: user.id || "" },
          data: {
            balance: {
              increment: Math.round(paymentAmount), // deducts cash withdraw to the current balance
            },
            updatedAt: createdAt,
          },
        });
        await prisma.cashTransaction.create({
          data: {
            type: "DEPOSITO",
            amount: Math.round(paymentAmount),
            description: `PAGO DE PEDIDO: ${order.orderNo}`,
            cashRegisterId: updatedRegister.id,
            userId: user.id,
            createdAt,
            updatedAt: createdAt,
          },
        });
      }

      if (payment.method === "TRANSFERENCIA") {
        const account = await prisma.account.findFirst({
          where: {
            parentAccount: null,
          },
        });
        await prisma.transaction.create({
          data: {
            type: "DEPOSITO",
            date: createdAt,
            amount: Math.round(paymentAmount),
            description: `TRANSFERENCIA PAGO ACEPTADO POR: (${user?.name})`,
            accountId: account?.id || "",
            createdAt,
            updatedAt: createdAt,
          },
        });
        await prisma.account.update({
          where: {
            id: account?.id,
          },
          data: {
            balance: { increment: Math.round(paymentAmount) },
            updatedAt: createdAt,
          },
        });
      }

      let orderStatus = "PENDIENTE";

      if (previousPayments + paymentAmount >= order.totalAmount) {
        orderStatus = "PROCESANDO";

        if (order.delivery) {
          await prisma.delivery.update({
            where: {
              id: order.delivery.id,
            },
            data: {
              status: orderStatus,
              updatedAt: createdAt,
            },
          });
        }
      }

      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: orderStatus as OrderStatus,
          updatedAt: createdAt,
        },
      });
    });

    revalidatePath("/sistema/cajas");
    revalidatePath("/sistema/cajas/personal");
    revalidatePath(`/sistema/ventas/pedidos/ver/${order.id}`);
    revalidatePath("/sistema/ventas/pedidos");
    revalidatePath("/sistema/ventas/envios");
    revalidatePath("/sistema/ventas/pagos");
    revalidatePath("/sistema/contabilidad/transacciones");
    revalidatePath("/sistema/contabilidad/cuentas");

    return {
      errors: {},
      success: true,
      message: `Pago de $${paymentAmount} aceptado.`,
    };
  } catch (error) {
    return {
      errors: {},
      success: false,
      message: `Failed to process payment ${error}`,
    };
  }
}

export async function markCompletedOrderAction(formData: FormData) {
  // Extract and validate form data
  const rawData = {
    id: formData.get("id"),
    status: formData.get("status"),
  };
  const createdAt = getMexicoGlobalUtcDate();
  try {
    const order = await prisma.order.update({
      where: { id: rawData.id as string },
      data: {
        status: rawData.status as OrderStatus,
        updatedAt: createdAt,
      },
    });

    if (!order) {
      return {
        errors: {},
        success: false,
        message: "Order not found",
      };
    }

    revalidatePath("/sistema/cajas");
    revalidatePath("/sistema/cajas/personal");
    revalidatePath(`/sistema/ventas/pedidos/ver/${order.id}`);
    revalidatePath("/sistema/ventas/pedidos");
    revalidatePath("/sistema/ventas/envios");
    revalidatePath("/sistema/ventas/pagos");

    return {
      errors: {},
      success: true,
      message: `Pedido entregado.`,
    };
  } catch (error) {
    return {
      errors: {},
      success: false,
      message: `Failed to process payment ${error}`,
    };
  }
}

export async function payOrderActionOnDelivery(formData: FormData) {
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

  const session = await getServerSession(options);
  const user = session?.user;
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

    if (
      previousPayments + paymentAmount <
      order.totalAmount + (order.delivery?.price || 0)
    ) {
      const balance =
        order.totalAmount + (order.delivery?.price || 0) - previousPayments;
      return {
        errors: {},
        success: false,
        message: `Debe pagar total remanente: $${balance} del pedido para entregar!.`,
      };
    }
    const createdAt = getMexicoGlobalUtcDate();
    await prisma.$transaction(async (prisma) => {
      // Create new payment
      await prisma.payment.create({
        data: {
          amount: Math.round(paymentAmount),
          method: method || "Efectivo",
          orderNo: order.orderNo,
          orderId: order.id,
          reference,
          status: "PAGADO",
          invoiceId: "",
          createdAt,
          updatedAt: createdAt,
        },
      });

      const updatedRegister = await prisma.cashRegister.update({
        where: { userId: user.id },
        data: {
          balance: {
            increment: paymentAmount, // Adds paymentAmount to the current balance
          },
          updatedAt: createdAt,
        },
      });

      await prisma.cashTransaction.create({
        data: {
          type: "DEPOSITO",
          amount: Math.round(paymentAmount),
          description: `PAGO A LA ENTREGA PEDIDO: ${order.orderNo}`,
          cashRegisterId: updatedRegister.id,
          userId: user.id,
          createdAt,
          updatedAt: createdAt,
        },
      });

      if (
        previousPayments + paymentAmount ===
        order.totalAmount + (order.delivery?.price || 0)
      ) {
        const deliveryStatus = "ENTREGADO";

        if (order.delivery) {
          await prisma.delivery.update({
            where: {
              id: order.deliveryId || "",
            },
            data: {
              status: deliveryStatus,
              updatedAt: createdAt,
            },
          });
        }
      }
    });

    revalidatePath("/sistema/cajas");
    revalidatePath("/sistema/cajas/personal");
    revalidatePath(`/sistema/ventas/pedidos/ver/${order.id}`);
    revalidatePath("/sistema/ventas/envios");
    revalidatePath("/sistema/ventas/pedidos");
    revalidatePath("/sistema/ventas/pagos");

    return {
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

export async function updateOrderOnDelivery(formData: FormData) {
  // Extract and validate form data
  const rawData = {
    id: formData.get("id"),
    signature: formData.get("signature"),
    // imageUrl: formData.get("imageUrl"),
  };
  const createdAt = getMexicoGlobalUtcDate();
  try {
    const order = await prisma.order.update({
      where: { id: rawData.id as string },
      data: {
        signature: rawData.signature as string,
        // imageUrl: rawData.imageUrl as string,
        status: "ENTREGADO",
        updatedAt: createdAt,
      },
    });

    if (!order) {
      return {
        errors: {},
        success: false,
        message: "Order not found",
      };
    }

    const delivery = await prisma.delivery.update({
      where: { id: order.deliveryId as string },
      data: {
        signature: rawData.signature as string,
        // imageUrl: rawData.imageUrl as string,
        status: "ENTREGADO",
        updatedAt: createdAt,
      },
    });

    if (!delivery) {
      return {
        errors: {},
        success: false,
        message: "Order not found",
      };
    }

    revalidatePath(`/sistema/ventas/pedidos/ver/${order.id}`);
    revalidatePath("/sistema/ventas/envios");
    revalidatePath("/sistema/ventas/pedidos");
    revalidatePath("/sistema/ventas/pagos");

    return {
      errors: {},
      success: true,
      message: `Pedido y entrega aceptada.`,
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
  const createdAt = getMexicoGlobalUtcDate();
  try {
    const canceledPayment = await prisma.payment.update({
      where: {
        id: validatedData.data.id,
      },
      data: {
        status: "CANCELADO",
        updatedAt: createdAt,
      },
      include: {
        order: true,
      },
    });

    const updatedRegister = await prisma.cashRegister.update({
      where: { userId: validatedData.data.userId || "" },
      data: {
        balance: {
          decrement: canceledPayment.amount, // Adds paymentAmount to the current balance
        },
        updatedAt: createdAt,
      },
    });

    await prisma.cashTransaction.create({
      data: {
        type: "RETIRO",
        amount: Math.round(canceledPayment.amount),
        description: `CANCELACIÓN DE PAGO - PEDIDO: ${canceledPayment.orderNo}`,
        cashRegisterId: updatedRegister.id,
        userId: validatedData.data.userId,
        createdAt,
        updatedAt: createdAt,
      },
    });

    revalidatePath("/sistema/cajas");
    revalidatePath("/sistema/ventas/pedidos");
    revalidatePath("/sistema/ventas/pagos");
    revalidatePath(`/sistema/ventas/pedidos/ver/${validatedData.data.id}`);
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
    const createdAt = getMexicoGlobalUtcDate();

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
                reservedQty: stock.reservedQty,
                availableQty: stock.availableQty + quantityToRelease,
                quantity: stock.quantity + quantityToRelease,
                updatedAt: createdAt,
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
                createdAt,
                updatedAt: createdAt,
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

      // Update order status to cancelled
      const updatedOrder = await prisma.order.update({
        where: {
          id: validatedData.data.id,
        },
        data: {
          status: "CANCELADO",
          updatedAt: createdAt,
        },
        include: {
          payments: {
            where: {
              status: "PAGADO",
            },
          },
        },
      });

      const previousPayments = updatedOrder.payments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );

      const updatedRegister = await prisma.cashRegister.update({
        where: { userId: validatedData.data.userId || "" },
        data: {
          balance: {
            decrement: previousPayments, // Adds paymentAmount to the current balance
          },
          updatedAt: createdAt,
        },
      });

      await prisma.cashTransaction.create({
        data: {
          type: "RETIRO",
          amount: Math.round(previousPayments),
          description: `CANCELACIÓN DE PEDIDO: ${order.orderNo}`,
          cashRegisterId: updatedRegister.id,
          userId: validatedData.data.userId,
          createdAt,
          updatedAt: createdAt,
        },
      });

      // Update payments status to cancelled
      await prisma.payment.updateMany({
        where: {
          orderId: validatedData.data.id,
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
            updatedAt: createdAt,
          },
        });
      }
    });

    // console.log("Order deleted and stock updated successfully");
    revalidatePath("/sistema/cajas");
    revalidatePath("/sistema/cajas/personal");
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
    const createdAt = getMexicoGlobalUtcDate();
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
                reservedQty: stock.reservedQty,
                availableQty: stock.availableQty + quantityToRelease,
                quantity: stock.quantity + quantityToRelease,
                updatedAt: createdAt,
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
                createdAt,
                updatedAt: createdAt,
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
            updatedAt: createdAt,
          },
        });

        // Update the order status to CANCELADO
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "CANCELADO", updatedAt: createdAt },
        });
      } else {
        // Delete the specified order item
        await prisma.orderItem.delete({ where: { id: itemId } });
      }

      // console.log(
      //   `Order ${orderId} status updated to CANCELADO and stock released`
      // );
    });

    revalidatePath("/sistema/ventas/pedidos");
    revalidatePath("/sistema/ventas/pagos");
    revalidatePath(`/sistema/ventas/pedidos/ver/${orderId}`);
    revalidatePath("/sistema/cajas");

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
