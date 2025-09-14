"use server";

import prisma from "@/lib/db";
import { CategorySchema, idSchema } from "@/lib/schemas";
import { getMexicoGlobalUtcDate } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export const createCategory = async (
  state: {
    errors?: Record<string, string[]>;
    success?: boolean;
    message?: string;
  },
  formData: FormData
) => {
  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
  };

  // Validate the data using Zod
  const validatedData = CategorySchema.safeParse(rawData);

  if (!validatedData.success) {
    // Format Zod errors into a field-specific error object
    const errors = validatedData.error.flatten().fieldErrors;
    return {
      errors,
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  // Simulate saving to a database or API
  const newCatData = {
    title: validatedData.data.title,
    description: validatedData.data.description,
  };
  await prisma.category.create({ data: newCatData });
  revalidatePath("/sistema/negocio/categorias");
  revalidatePath("/sistema/negocio/articulos/nuevo");
  return { success: true, message: "Categoría creada exitosamente!" };
};

export async function updateCategoryAction(
  state: {
    errors: { [key: string]: string[] };
    success: boolean;
    message: string;
  },
  formData: FormData
) {
  const rawData = {
    categoryId: formData.get("id") as string,
    title: formData.get("title") as string,
    description: formData.get("description") as string,
  };

  // Validate the data using Zod
  const validatedData = CategorySchema.safeParse(rawData);
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
    await prisma.category.update({
      where: {
        id: rawData.categoryId,
      },
      data: {
        title: rawData.title,
        description: rawData.description,
        updatedAt: createdAt,
      },
    });
    revalidatePath(`/sistema/negocio/categorias/editar/${rawData.categoryId}`);
    revalidatePath("/sistema/negocio/articulos/nuevo");
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

export async function deleteCategoryAction(formData: FormData) {
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
      prisma.category.delete({
        where: {
          id: validatedData.data.id,
        },
      }),
    ]);

    revalidatePath("/sistema/negocio/categorias");
    revalidatePath("/sistema/negocio/articulos/nuevo");
    return {
      errors: {},
      success: true,
      message: "Category deleted successfully!",
    };
  } catch (error) {
    console.error("Error creating category:", error);
    return {
      errors: {},
      success: false,
      message: "Failed to delete category",
    };
  }
}
