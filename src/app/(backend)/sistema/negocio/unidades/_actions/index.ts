"use server";
import prisma from "@/lib/db";
import { idSchema, UnitSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

export const createUnit = async (
  state: {
    errors?: Record<string, string[]>;
    success?: boolean;
    message?: string;
  },
  formData: FormData
) => {
  const rawData = {
    title: formData.get("title"),
    abbreviation: formData.get("abbreviation"),
  };

  // Validate the data using Zod
  const validatedData = UnitSchema.safeParse(rawData);

  if (!validatedData.success) {
    // Format Zod errors into a field-specific error object
    const errors = validatedData.error.flatten().fieldErrors;
    return {
      errors,
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  const newUnitData = {
    title: validatedData.data.title,
    abbreviation: validatedData.data.abbreviation,
  };

  await prisma.unit.create({ data: newUnitData });
  revalidatePath(`/sistemas/negocio/unidades`);
  return { success: true, message: "Unidad creada exitosamente!" };
};

export async function updateUnitAction(
  state: {
    errors: { [key: string]: string[] };
    success: boolean;
    message: string;
  },
  formData: FormData
) {
  const rawData = {
    unitId: formData.get("id") as string,
    title: formData.get("title") as string,
    abbreviation: formData.get("abbreviation") as string,
  };

  // Validate the data using Zod
  const validatedData = UnitSchema.safeParse(rawData);
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

  try {
    await prisma.unit.update({
      where: {
        id: rawData.unitId,
      },
      data: {
        title: rawData.title,
        abbreviation: rawData.abbreviation,
      },
    });
    revalidatePath(`/sistemas/negocio/unidades/editar/${rawData.unitId}`);
    return {
      errors: {},
      success: true,
      message: "Unidad actualizada correctamente!",
    };
  } catch (error) {
    console.error("Error al actualizar Unidad:", error);

    return {
      errors: {},
      success: false,
      message: "Fallo al actualizar Unidad",
    };
  }
}

export async function deleteUnitAction(formData: FormData) {
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
      prisma.unit.delete({
        where: {
          id: validatedData.data.id,
        },
      }),
    ]);

    revalidatePath("/sistema/negocio/unidades");
    return {
      errors: {},
      success: true,
      message: "Unit deleted successfully!",
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
