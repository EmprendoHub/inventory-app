"use server";
import { options } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/db";
import { AddInventorySchema, AdjustmentSchema } from "@/lib/schemas";
import { getMexicoGlobalUtcDate } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export const createAdjustment = async (
  state: {
    errors?: Record<string, string[]>;
    success?: boolean;
    message?: string;
  },
  formData: FormData
) => {
  const session = await getServerSession(options);
  const user = session?.user;
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
    try {
      const createdAt = getMexicoGlobalUtcDate();
      await prisma.$transaction(async (prisma) => {
        await prisma.stock.update({
          where: {
            itemId_warehouseId: {
              itemId: validatedData.data.articulo,
              warehouseId: validatedData.data.sendingWarehouse,
            },
          },
          data: {
            availableQty: { increment: validatedData.data.transAmount },
            quantity: { increment: validatedData.data.transAmount },
            updatedAt: createdAt,
          },
        });

        // Create a stock movement record for the release
        await prisma.stockMovement.create({
          data: {
            itemId: validatedData.data.articulo,
            type: "ADJUSTMENT", // Indicates stock is being returned to available
            quantity: validatedData.data.transAmount,
            reference: `Ajuste de inventario`,
            status: "COMPLETED",
            createdBy: user.id as string, // Or the user ID who cancelled the order
            createdAt,
            updatedAt: createdAt,
          },
        });
      });
    } catch (error) {
      console.log(error);
    }
    revalidatePath("/sistema/negocio/ajustes/nuevo");
    revalidatePath("/sistema/negocio/articulos/nuevo");
    revalidatePath("/sistema/negocio/articulos");
    revalidatePath("/sistema/ventas/pedidos/nuevo");
    revalidatePath("/sistema/ventas/pos/register");
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
    const createdAt = getMexicoGlobalUtcDate();
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
