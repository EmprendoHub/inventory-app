"use server";

import prisma from "@/lib/db";
import { BrandSchema, idSchema } from "@/lib/schemas";
import { getMexicoGlobalUtcDate } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export const createBrand = async (
  state: {
    errors?: Record<string, string[]>;
    success?: boolean;
    message?: string;
  },
  formData: FormData
) => {
  const rawData = {
    name: formData.get("name"),
    description: formData.get("description"),
  };

  // Validate the data using Zod
  const validatedData = BrandSchema.safeParse(rawData);

  if (!validatedData.success) {
    // Format Zod errors into a field-specific error object
    const errors = validatedData.error.flatten().fieldErrors;
    return {
      errors,
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  const newBrandData = {
    name: validatedData.data.name,
    description: validatedData.data.description,
  };

  await prisma.brand.create({ data: newBrandData });

  return { success: true, message: "Marca creada exitosamente!" };
};

export async function updateBrandAction(
  state: {
    errors: { [key: string]: string[] };
    success: boolean;
    message: string;
  },
  formData: FormData
) {
  const rawData = {
    brandId: formData.get("id") as string,
    name: formData.get("name") as string,
    description: formData.get("description") as string,
  };

  // Validate the data using Zod
  const validatedData = BrandSchema.safeParse(rawData);
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
    await prisma.brand.update({
      where: {
        id: rawData.brandId,
      },
      data: {
        name: rawData.name,
        description: rawData.description,
        updatedAt: createdAt,
      },
    });
    revalidatePath(`/sistemas/negocio/marcas/editar/${rawData.brandId}`);
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

export async function deleteBrandAction(formData: FormData) {
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
    return { success: false, message: "Error al crear marca" };

  try {
    await prisma.$transaction([
      prisma.brand.delete({
        where: {
          id: validatedData.data.id,
        },
      }),
    ]);

    revalidatePath("/sistema/negocio/marcas");
    return {
      errors: {},
      success: true,
      message: "Marca eliminada exitosamente!",
    };
  } catch (error) {
    console.error("Error creando marca:", error);
    return {
      errors: {},
      success: false,
      message: "Fallo al eliminar marca",
    };
  }
}
