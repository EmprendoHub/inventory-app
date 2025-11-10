"use server";

import prisma from "@/lib/db";
import { idSchema, WarehouseSchema } from "@/lib/schemas";
import { getMexicoGlobalUtcDate } from "@/lib/utils";
import { WarehouseType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export const createWarehouse = async (
  state: {
    errors?: Record<string, string[]>;
    success?: boolean;
    message?: string;
  },
  formData: FormData
) => {
  const rawData = {
    title: formData.get("title"),
    code: formData.get("code"),
    street: formData.get("street"),
    city: formData.get("city"),
    state: formData.get("state"),
    country: formData.get("country"),
    postalCode: formData.get("postalCode"),
    type: formData.get("type"),
  };

  // Validate the data using Zod
  const validatedData = WarehouseSchema.safeParse(rawData);

  if (!validatedData.success) {
    // Format Zod errors into a field-specific error object
    const errors = validatedData.error.flatten().fieldErrors;
    return {
      errors,
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }
  const createdAt = getMexicoGlobalUtcDate();
  const newWarehouseData = {
    title: validatedData.data.title,
    code: validatedData.data.code,
    address: {
      street: validatedData.data.street,
      city: validatedData.data.city,
      state: validatedData.data.state,
      country: validatedData.data.country,
      postalCode: validatedData.data.postalCode,
    },
    type: validatedData.data.type as WarehouseType,
    createdAt,
    updatedAt: createdAt,
  };

  await prisma.warehouse.create({
    data: newWarehouseData,
  });
  revalidatePath(`/sistema/negocio/bodegas`);
  revalidatePath("/sistema/negocio/articulos/nuevo");
  revalidatePath("/sistema/negocio/ajustes/nuevo");
  revalidatePath("/sistema/negocio/usuarios/nuevo");

  return { success: true, message: "Bodega creada exitosamente!" };
};

export async function updateWarehouseAction(
  state: {
    errors: { [key: string]: string[] };
    success: boolean;
    message: string;
  },
  formData: FormData
) {
  const rawData = {
    warehouseId: formData.get("id") as string,
    title: formData.get("title") as string,
    code: formData.get("code") as string,
    type: formData.get("type") as WarehouseType,
    street: formData.get("street") as string,
    city: formData.get("city") as string,
    state: formData.get("state") as string,
    country: formData.get("country") as string,
    postalCode: formData.get("postalCode") as string,
  };

  // Validate the data using Zod
  const validatedData = WarehouseSchema.safeParse(rawData);

  if (!validatedData.success) {
    const errors = validatedData.error.flatten().fieldErrors;
    return {
      errors,
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  if (!validatedData.data)
    return {
      errors: {},
      success: false,
      message: "Error al validar campos del producto",
    };
  const createdAt = getMexicoGlobalUtcDate();
  try {
    await prisma.warehouse.update({
      where: {
        id: rawData.warehouseId,
      },
      data: {
        title: rawData.title,
        code: rawData.code,
        type: rawData.type,
        address: {
          set: {
            street: rawData.street,
            city: rawData.city,
            state: rawData.state,
            country: rawData.country,
            postalCode: rawData.postalCode,
          },
        },
        updatedAt: createdAt,
      },
    });
    revalidatePath(`/sistema/negocio/bodegas`);
    revalidatePath("/sistema/negocio/articulos/nuevo");
    revalidatePath("/sistema/negocio/ajustes/nuevo");
    revalidatePath("/sistema/negocio/usuarios/nuevo");

    return {
      errors: {},
      success: true,
      message: "Categoría actualizada correctamente!",
    };
  } catch (error) {
    console.error("Error al actualizar Categoría:", error);

    return {
      errors: {},
      success: false,
      message: "Fallo al actualizar Categoría",
    };
  }
}

export async function deleteWarehouseAction(formData: FormData) {
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
    await prisma.$transaction([
      prisma.warehouse.delete({
        where: {
          id: validatedData.data.id,
        },
      }),
    ]);

    revalidatePath("/sistema/negocio/bodegas");
    revalidatePath("/sistema/negocio/articulos/nuevo");
    revalidatePath("/sistema/negocio/ajustes/nuevo");
    revalidatePath("/sistema/negocio/usuarios/nuevo");
    return {
      errors: {},
      success: true,
      message: "Warehouse deleted successfully!",
    };
  } catch (error) {
    console.error("Error creating warehouse:", error);
    return {
      errors: {},
      success: false,
      message: "Failed to delete warehouse",
    };
  }
}
