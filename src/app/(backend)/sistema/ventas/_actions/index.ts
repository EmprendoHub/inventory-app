"use server";

import prisma from "@/lib/db";
import { AddInventorySchema, AdjustmentSchema } from "@/lib/schemas";
import { getMexicoGlobalUtcDate } from "@/lib/utils";

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
  const createdAt = getMexicoGlobalUtcDate();
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
      data: {
        quantity: { increment: validatedData.data.transAmount },
        updatedAt: createdAt,
      },
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
      data: {
        quantity: { decrement: validatedAdjustData.data.transAmount },
        updatedAt: createdAt,
      },
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
        data: {
          quantity: { increment: validatedAdjustData.data.transAmount },
          updatedAt: createdAt,
        },
      });
    } else {
      await prisma.stock.create({
        data: {
          itemId: validatedAdjustData.data.articulo,
          warehouseId: validatedAdjustData.data.receivingWarehouse,
          quantity: validatedAdjustData.data.transAmount, // Set initial stock amount
          createdAt,
          updatedAt: createdAt,
        },
      });
    }
  }

  return { success: true, message: "Ajuste de inventario exitoso!" };
};

export async function processPayment(
  state: {
    errors: { [key: string]: string[] };
    success: boolean;
    message: string;
  },
  formData: FormData
) {
  "use server";
  const createdAt = getMexicoGlobalUtcDate();
  const amount = Number(formData.get("amount"));
  const method = formData.get("method") as string;
  const reference = formData.get("reference") as string;

  // Validate inputs
  const errors: { [key: string]: string[] } = {};

  if (!amount || amount <= 0) {
    errors.amount = ["Amount must be greater than zero"];
  }

  if (!method) {
    errors.method = ["Payment method is required"];
  }

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      success: false,
      message: "Please fix the errors before submitting.",
    };
  }

  try {
    await prisma.payment.create({
      data: {
        amount: Math.round(amount * 100), // convert to cents
        method,
        orderNo: "",
        invoiceId: "",
        reference: reference || undefined,
        status: "PAGADO",
        order: {
          connect: { id: formData.get("orderId") as string },
        },
        createdAt,
        updatedAt: createdAt,
      },
    });

    return {
      errors: {},
      success: true,
      message: "Payment processed successfully!",
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
