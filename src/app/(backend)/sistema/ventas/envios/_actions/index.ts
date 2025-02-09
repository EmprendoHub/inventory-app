"use server";

import prisma from "@/lib/db";
import { z } from "zod";
import { DeliveryFormState } from "@/types/delivery";
import { revalidatePath } from "next/cache";

// Define Zod schema for Delivery
const DeliverySchema = z.object({
  id: z.string().optional(),
  orderId: z.string(),
  method: z.enum(["INTERNO", "EXTERNO"]),
  driverId: z.string().optional(),
  truckId: z.string().optional(),
  externalShipId: z.string().optional(),
  carrier: z.string().min(1, "Paqueteria is required"),
  otp: z.string().min(1, "OTP is required"),
  trackingNumber: z.string().min(1, "No. de rastreo se requiere"),
  deliveryDate: z.string().optional(), // Will convert to Date in the action
  status: z.enum(["Out for Delivery", "Delivered", "Failed"]),
});

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
    externalShipId: formData.get("externalShipId") as string | null,
    carrier: formData.get("carrier") as string,
    otp: formData.get("otp") as string,
    trackingNumber: formData.get("trackingNumber") as string,
    deliveryDate: formData.get("deliveryDate") as string | null,
    status: formData.get("status") as
      | "Out for Delivery"
      | "Delivered"
      | "Failed",
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

  try {
    await prisma.$transaction(async (prisma) => {
      await prisma.delivery.create({
        data: {
          orderId: deliveryData.orderId,
          method: deliveryData.method,
          driverId: deliveryData.driverId || undefined,
          truckId: deliveryData.truckId || undefined,
          externalShipId: deliveryData.externalShipId || undefined,
          carrier: deliveryData.carrier,
          otp: deliveryData.otp,
          trackingNumber: deliveryData.trackingNumber,
          deliveryDate: deliveryDate,
          status: deliveryData.status,
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
    carrier: formData.get("carrier") as string,
    otp: formData.get("otp") as string,
    trackingNumber: formData.get("trackingNumber") as string,
    deliveryDate: formData.get("deliveryDate") as string | null,
    status: formData.get("status") as
      | "Out for Delivery"
      | "Delivered"
      | "Failed",
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

  try {
    await prisma.$transaction(async (prisma) => {
      await prisma.delivery.update({
        where: { id: deliveryData.id },
        data: {
          orderId: deliveryData.orderId,
          method: deliveryData.method,
          driverId: deliveryData.driverId || undefined,
          truckId: deliveryData.truckId || undefined,
          externalShipId: deliveryData.externalShipId || undefined,
          carrier: deliveryData.carrier,
          otp: deliveryData.otp,
          trackingNumber: deliveryData.trackingNumber,
          deliveryDate: deliveryDate,
          status: deliveryData.status,
        },
      });
    });

    revalidatePath("/sistema/shipping/deliveries");
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
    await prisma.delivery.delete({
      where: { id },
    });

    revalidatePath("/sistema/shipping/deliveries");
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
