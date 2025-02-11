"use server";

import prisma from "@/lib/db";
import { AddInventorySchema, AdjustmentSchema } from "@/lib/schemas";

export const createAdjustment = async (
  state: {
    errors?: Record<string, string[]>;
    success?: boolean;
    message?: string;
  },
  formData: FormData
) => {
  const rawData = {
    articulo: formData.get("articulo"),
    transAmount: parseFloat(formData.get("transAmount") as string),
    sendingWarehouse: formData.get("sendingWarehouse"),
    receivingWarehouse: formData.get("receivingWarehouse"),
    formType: formData.get("formType"),
    notes: formData.get("notes"),
  };

  if (rawData.formType === "add") {
    const validatedData = AddInventorySchema.safeParse(rawData);
    if (!validatedData.success) {
      // Format Zod errors into a field-specific error object
      const errors = validatedData.error.flatten().fieldErrors;
      return {
        errors,
        success: false,
        message: "Validation failed. Please check the fields.",
      };
    }
    await prisma.stock.update({
      where: {
        itemId_warehouseId: {
          itemId: validatedData.data.articulo,
          warehouseId: validatedData.data.sendingWarehouse,
        },
      },
      data: { quantity: { increment: validatedData.data.transAmount } },
    });
  } else {
    // Validate the data using Zod
    const validatedAdjustData = AdjustmentSchema.safeParse(rawData);
    if (!validatedAdjustData.success) {
      // Format Zod errors into a field-specific error object
      const errors = validatedAdjustData.error.flatten().fieldErrors;
      return {
        errors,
        success: false,
        message: "Validation failed. Please check the fields.",
      };
    }

    await prisma.stock.update({
      where: {
        itemId_warehouseId: {
          itemId: validatedAdjustData.data.articulo,
          warehouseId: validatedAdjustData.data.sendingWarehouse,
        },
      },
      data: { quantity: { decrement: validatedAdjustData.data.transAmount } },
    });
    // Check if stock exists in the receiving warehouse
    const existingStock = await prisma.stock.findUnique({
      where: {
        itemId_warehouseId: {
          itemId: validatedAdjustData.data.articulo,
          warehouseId: validatedAdjustData.data.receivingWarehouse,
        },
      },
    });

    // If stock exists, update it; otherwise, create a new stock entry
    if (existingStock) {
      await prisma.stock.update({
        where: {
          itemId_warehouseId: {
            itemId: validatedAdjustData.data.articulo,
            warehouseId: validatedAdjustData.data.receivingWarehouse,
          },
        },
        data: { quantity: { increment: validatedAdjustData.data.transAmount } },
      });
    } else {
      await prisma.stock.create({
        data: {
          itemId: validatedAdjustData.data.articulo,
          warehouseId: validatedAdjustData.data.receivingWarehouse,
          quantity: validatedAdjustData.data.transAmount, // Set initial stock amount
        },
      });
    }
  }

  return { success: true, message: "Ajuste de inventario exitoso!" };
};

// Example server action
export async function createItemGroup(
  state: {
    errors?: Record<string, string[]>;
    success?: boolean;
    message?: string;
  },
  formData: FormData
) {
  const rawData = Object.fromEntries(formData);

  const itemIds = rawData.itemIds
    ? Array.isArray(rawData.itemIds)
      ? rawData.itemIds.map(String)
      : [String(rawData.itemIds)]
    : [];

  await prisma.itemGroup.create({
    data: {
      itemId: itemIds,
    },
  });
}

// In _actions.ts
export async function createItemGroupTwo(
  state: {
    errors: { [key: string]: string[] };
    success: boolean;
    message: string;
  },
  formData: FormData
) {
  "use server";

  const name = formData.get("name") as string;
  const itemsInput = formData.get("items") as string;

  // Validate inputs
  const errors: { [key: string]: string[] } = {};

  if (!name || name.trim() === "") {
    errors.name = ["Group name is required"];
  }

  const items = itemsInput
    ? itemsInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  if (items.length === 0) {
    errors.items = ["At least one item ID is required"];
  }

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      success: false,
      message: "Please fix the errors before submitting.",
    };
  }

  try {
    // Note: This would require a ItemGroup model in your Prisma schema
    const itemGroup = await prisma.itemGroup.create({
      data: {
        itemId: items,
      },
    });

    console.log(itemGroup);

    return {
      errors: {},
      success: true,
      message: "Item group created successfully!",
    };
  } catch (error) {
    console.error("Error creating item group:", error);
    return {
      errors: {},
      success: false,
      message: "Failed to create item group",
    };
  }
}
