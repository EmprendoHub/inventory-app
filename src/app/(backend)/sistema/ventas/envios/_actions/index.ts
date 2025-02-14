"use server";

import prisma from "@/lib/db";
import { DeliveryFormState } from "@/types/delivery";
import { revalidatePath } from "next/cache";
import { DeliverySchema } from "@/lib/schemas";
import { generateDeliveryOTP, generateTrackingNumber } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";

export const createDeliveryAction = async (
  state: DeliveryFormState,
  formData: FormData
): Promise<DeliveryFormState> => {
  // Parse and validate form data
  const rawData = {
    orderId: formData.get("orderId") as string,
    method: formData.get("method") as "INTERNO" | "EXTERNO",
    driverId: formData.get("driverId") as string | null,
    truckId: formData.get("truckId") as string | null,
    carrier: "YUNUEN CO",
    otp: formData.get("otp") as string,
    price: formData.get("price") as string,
    trackingNumber: formData.get("trackingNumber") as string,
    deliveryDate: formData.get("deliveryDate") as string | null,
    status: formData.get("status") as
      | "Pendiente para entrega"
      | "Fuera para entrega"
      | "Entregado"
      | "Fallido",
  };

  const session = await getServerSession(options);
  const user = session?.user;

  // Validate the data using Zod
  const validatedData = DeliverySchema.safeParse(rawData);

  if (!validatedData.success) {
    const errors = validatedData.error.flatten().fieldErrors;
    return {
      errors,
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  const deliveryData = validatedData.data;

  // Convert deliveryDate to Date object if provided
  let deliveryDate: Date | undefined = undefined;
  if (deliveryData.deliveryDate) {
    deliveryDate = new Date(deliveryData.deliveryDate);
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
  try {
    await prisma.$transaction(async (prisma) => {
      await prisma.delivery.create({
        data: {
          orderId: deliveryData.orderId,
          orderNo: deliveryData.orderNo,
          method: deliveryData.method,
          driverId: deliveryData.driverId || undefined,
          truckId: deliveryData.truckId || undefined,
          price: Number(deliveryData.price),
          carrier: deliveryData.carrier,
          otp,
          trackingNumber,
          deliveryDate: deliveryDate,
          status: deliveryData.status,
          userId: user.id,
        },
      });
    });

    revalidatePath("/sistema/shipping/deliveries");
    return {
      success: true,
      message: "Delivery created successfully!",
    };
  } catch (error) {
    console.error("Error creating delivery:", error);
    return { success: false, message: "Error creating delivery." };
  }
};

export const updateDeliveryAction = async (
  state: DeliveryFormState,
  formData: FormData
): Promise<DeliveryFormState> => {
  // Parse and validate form data
  const rawData = {
    id: formData.get("id") as string,
    orderId: formData.get("orderId") as string,
    method: formData.get("method") as "INTERNO" | "EXTERNO",
    driverId: formData.get("driverId") as string | null,
    truckId: formData.get("truckId") as string | null,
    externalShipId: formData.get("externalShipId") as string | null,
    carrier: "YUNUEN CO" as string,
    price: formData.get("price") as string,
    otp: formData.get("otp") as string,
    trackingNumber: formData.get("trackingNumber") as string,
    deliveryDate: formData.get("deliveryDate") as string | null,
    status: formData.get("status") as
      | "Pendiente para entrega"
      | "Fuera para entrega"
      | "Entregado"
      | "Fallido",
  };

  // Validate the data using Zod
  const validatedData = DeliverySchema.safeParse(rawData);
  if (!validatedData.success) {
    const errors = validatedData.error.flatten().fieldErrors;
    return {
      errors,
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  const deliveryData = validatedData.data;

  // Convert deliveryDate to Date object if provided
  let deliveryDate: Date | undefined = undefined;
  if (deliveryData.deliveryDate) {
    deliveryDate = new Date(deliveryData.deliveryDate);
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
  try {
    await prisma.$transaction(async (prisma) => {
      await prisma.delivery.update({
        where: { id: deliveryData.id },
        data: {
          orderId: deliveryData.orderId,
          method: deliveryData.method,
          driverId: deliveryData.driverId || undefined,
          truckId: deliveryData.truckId || undefined,
          price: Number(deliveryData.price),
          carrier: deliveryData.carrier,
          otp,
          trackingNumber,
          deliveryDate: deliveryDate,
          status: deliveryData.status,
        },
      });
    });

    revalidatePath("/sistema/ventas/envios");
    return {
      success: true,
      message: "Delivery updated successfully!",
    };
  } catch (error) {
    console.error("Error updating delivery:", error);
    return { success: false, message: "Error updating delivery." };
  }
};

export const deleteDeliveryAction = async (formData: FormData) => {
  const id = formData.get("id") as string;

  if (!id) {
    return { success: false, message: "Delivery ID is required." };
  }

  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id },
    });

    const order = await prisma.order.findUnique({
      where: {
        id: delivery?.orderId,
      },
      include: {
        payments: {
          where: {
            status: "PAGADO",
          },
        },
      },
    });

    if (order && delivery) {
      // Try to find an exact match first
      let matchingPayment = order.payments.find(
        (payment) => payment.amount === delivery.price
      );

      if (matchingPayment) {
        // If exact match is found, update the payment status to "CANCELADO"
        await prisma.payment.update({
          where: { id: matchingPayment.id },
          data: { status: "CANCELADO" },
        });
        console.log("Exact match found. Payment status updated to CANCELADO.");
      } else {
        // If no exact match, find a payment with an amount larger than delivery.price
        matchingPayment = order.payments.find(
          (payment) => payment.amount > delivery.price
        );

        if (matchingPayment) {
          // Subtract delivery.price from the matching payment's amount
          const updatedAmount = matchingPayment.amount - delivery.price;

          await prisma.payment.update({
            where: { id: matchingPayment.id },
            data: { amount: updatedAmount },
          });
          console.log(
            "No exact match. Subtracted delivery price from the matching payment. Updated amount:",
            updatedAmount
          );
        } else {
          console.log("No matching payment found (exact or larger).");
        }
      }
    } else {
      console.log("Delivery or Order not found.");
    }

    await prisma.delivery.update({
      where: { id },
      data: {
        status: "CANCELADO",
      },
    });

    revalidatePath("/sistema/ventas/envios");
    revalidatePath("/sistema/ventas/pedidos");
    return {
      success: true,
      message: "Delivery deleted successfully!",
    };
  } catch (error) {
    console.error("Error deleting delivery:", error);
    return {
      success: false,
      message: "Failed to delete delivery.",
    };
  }
};

export const acceptDeliveryAction = async (formData: FormData) => {
  const id = formData.get("id") as string;

  if (!id) {
    return { success: false, message: "Delivery ID is required." };
  }

  try {
    const session = await getServerSession(options);
    if (session?.user?.id) {
      const driver = await prisma.driver.findFirst({
        where: { userId: session.user.id as string },
      });

      await prisma.delivery.update({
        where: { id },
        data: {
          userId: session?.user.id,
          driverId: driver?.id,
          status: "EN CAMINO",
        },
      });
    }

    revalidatePath("/sistema/ventas/envios");
    revalidatePath("/sistema/ventas/pedidos");
    return {
      success: true,
      message: "Delivery deleted successfully!",
    };
  } catch (error) {
    console.error("Error deleting delivery:", error);
    return {
      success: false,
      message: "Failed to delete delivery.",
    };
  }
};

export const deliverDeliveryAction = async (formData: FormData) => {
  const id = formData.get("id") as string;

  if (!id) {
    return { success: false, message: "Delivery ID is required." };
  }

  try {
    const session = await getServerSession(options);
    if (session?.user?.id) {
      const driver = await prisma.driver.findFirst({
        where: { userId: session.user.id as string },
      });

      await prisma.delivery.update({
        where: { id },
        data: {
          userId: session?.user.id,
          driverId: driver?.id,
          status: "ENTREGADO",
        },
      });
    }

    revalidatePath("/sistema/ventas/envios");
    revalidatePath("/sistema/ventas/pedidos");
    return {
      success: true,
      message: "Delivery delivered successfully!",
    };
  } catch (error) {
    console.error("Error delivering delivery:", error);
    return {
      success: false,
      message: "Failed to deliver delivery.",
    };
  }
};
