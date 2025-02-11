"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { TruckFormState } from "@/types/truck";
import { TruckSchema } from "@/lib/schemas";
import { TruckStatus } from "@prisma/client";

export const createTruckAction = async (
  state: TruckFormState,
  formData: FormData
): Promise<TruckFormState> => {
  // Parse and validate form data
  const rawData = {
    name: formData.get("name") as string,
    km: formData.get("km") as string,
    licensePlate: formData.get("licensePlate") as string,
    status: formData.get("status") as "DISPONIBLE" | "EN_USO" | "MANTENIMIENTO",
  };

  // Validate the data using Zod
  const validatedData = TruckSchema.safeParse(rawData);
  if (!validatedData.success) {
    const errors = validatedData.error.flatten().fieldErrors;
    return {
      errors,
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  const truckData = validatedData.data;

  try {
    await prisma.$transaction(async (prisma) => {
      await prisma.truck.create({
        data: {
          name: truckData.name,
          km: truckData.km,
          licensePlate: truckData.licensePlate,
          status: truckData.status as TruckStatus,
        },
      });
    });

    revalidatePath("/sistema/shipping/trucks");
    return {
      success: true,
      message: "Truck created successfully!",
    };
  } catch (error) {
    console.error("Error creating truck:", error);
    return { success: false, message: "Error creating truck." };
  }
};

export const updateTruckAction = async (
  state: TruckFormState,
  formData: FormData
): Promise<TruckFormState> => {
  // Parse and validate form data
  const rawData = {
    id: formData.get("id") as string,
    name: formData.get("name") as string,
    km: formData.get("km") as string,
    licensePlate: formData.get("licensePlate") as string,
    status: formData.get("status") as "DISPONIBLE" | "EN_USO" | "MANTENIMIENTO",
  };

  // Validate the data using Zod
  const validatedData = TruckSchema.safeParse(rawData);
  if (!validatedData.success) {
    const errors = validatedData.error.flatten().fieldErrors;
    return {
      errors,
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  const truckData = validatedData.data;

  try {
    await prisma.$transaction(async (prisma) => {
      await prisma.truck.update({
        where: { id: truckData.id },
        data: {
          name: truckData.name,
          km: truckData.km,
          licensePlate: truckData.licensePlate,
          status: truckData.status,
        },
      });
    });

    revalidatePath("/sistema/shipping/trucks");
    return {
      success: true,
      message: "Truck updated successfully!",
    };
  } catch (error) {
    console.error("Error updating truck:", error);
    return { success: false, message: "Error updating truck." };
  }
};

export const deleteTruckAction = async (formData: FormData) => {
  const id = formData.get("id") as string;

  if (!id) {
    return { success: false, message: "Truck ID is required." };
  }

  try {
    await prisma.truck.delete({
      where: { id },
    });

    revalidatePath("/sistema/shipping/trucks");
    return {
      success: true,
      message: "Truck deleted successfully!",
    };
  } catch (error) {
    console.error("Error deleting truck:", error);
    return {
      success: false,
      message: "Failed to delete truck.",
    };
  }
};
