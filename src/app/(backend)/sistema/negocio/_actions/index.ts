"use server";
import { options } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/db";
import {
  AddInventorySchema,
  AdjustmentSchema,
  RemoveInventorySchema,
} from "@/lib/schemas";
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
        // Check if stock record exists
        const existingStock = await prisma.stock.findUnique({
          where: {
            itemId_warehouseId: {
              itemId: validatedData.data.articulo,
              warehouseId: validatedData.data.sendingWarehouse,
            },
          },
        });

        if (existingStock) {
          // Update existing stock
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
        } else {
          // Create new stock record
          await prisma.stock.create({
            data: {
              itemId: validatedData.data.articulo,
              warehouseId: validatedData.data.sendingWarehouse,
              quantity: validatedData.data.transAmount,
              availableQty: validatedData.data.transAmount,
              createdAt,
              updatedAt: createdAt,
            },
          });
        }

        await prisma.stockMovement.create({
          data: {
            itemId: validatedData.data.articulo,
            type: "ADJUSTMENT",
            quantity: validatedData.data.transAmount,
            reference: `Ajuste de inventario`,
            status: "COMPLETED",
            createdBy: user.id as string,
            createdAt,
            updatedAt: createdAt,
          },
        });
      });
    } catch (error) {
      console.log(error);
      return {
        errors: {},
        success: false,
        message: "Error al agregar inventario",
      };
    }
    revalidatePath("/sistema/negocio/ajustes/nuevo");
    revalidatePath("/sistema/negocio/articulos/nuevo");
    revalidatePath("/sistema/negocio/articulos");
    revalidatePath("/sistema/ventas/pedidos/nuevo");
    revalidatePath("/sistema/ventas/pos/register");
    revalidatePath("/sistema/negocio");
    revalidatePath("/sistema/qr/productos");

    revalidatePath("/sistema/qr/generador");

    return { success: true, message: "Inventario agregado exitosamente!" };
  } else if (rawData.formType === "remove") {
    const validatedData = RemoveInventorySchema.safeParse(rawData);
    if (!validatedData.success) {
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
        const currentStock = await prisma.stock.findUnique({
          where: {
            itemId_warehouseId: {
              itemId: validatedData.data.articulo,
              warehouseId: validatedData.data.sendingWarehouse,
            },
          },
        });

        if (!currentStock) {
          throw new Error(
            "Stock record not found for this item in the specified warehouse."
          );
        }

        if (currentStock.availableQty < validatedData.data.transAmount) {
          throw new Error(
            `Stock insuficiente. Disponible: ${currentStock.availableQty}, Solicitado: ${validatedData.data.transAmount}`
          );
        }

        await prisma.stock.update({
          where: {
            itemId_warehouseId: {
              itemId: validatedData.data.articulo,
              warehouseId: validatedData.data.sendingWarehouse,
            },
          },
          data: {
            availableQty: { decrement: validatedData.data.transAmount },
            quantity: { decrement: validatedData.data.transAmount },
            updatedAt: createdAt,
          },
        });

        await prisma.stockMovement.create({
          data: {
            itemId: validatedData.data.articulo,
            type: "ADJUSTMENT",
            quantity: -validatedData.data.transAmount,
            reference: `Remoción de inventario: ${
              validatedData.data.notes || "Sin razón especificada"
            }`,
            status: "COMPLETED",
            createdBy: user.id as string,
            createdAt,
            updatedAt: createdAt,
          },
        });
      });
    } catch (error) {
      console.log(error);
      return {
        errors: {},
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al remover inventario",
      };
    }

    revalidatePath("/sistema/negocio/ajustes/nuevo");
    revalidatePath("/sistema/negocio/articulos/nuevo");
    revalidatePath("/sistema/negocio/articulos");
    revalidatePath("/sistema/ventas/pedidos/nuevo");
    revalidatePath("/sistema/ventas/pos/register");
    revalidatePath("/sistema/negocio");
    revalidatePath("/sistema/qr/generador");
    revalidatePath("/sistema/qr/productos");

    return { success: true, message: "Inventario removido exitosamente!" };
  } else {
    const validatedAdjustData = AdjustmentSchema.safeParse(rawData);
    if (!validatedAdjustData.success) {
      const errors = validatedAdjustData.error.flatten().fieldErrors;
      return {
        errors,
        success: false,
        message: "Validation failed. Please check the fields.",
      };
    }

    const createdAt = getMexicoGlobalUtcDate();
    try {
      await prisma.$transaction(async (prisma) => {
        await prisma.stock.update({
          where: {
            itemId_warehouseId: {
              itemId: validatedAdjustData.data.articulo,
              warehouseId: validatedAdjustData.data.sendingWarehouse,
            },
          },
          data: {
            quantity: { decrement: validatedAdjustData.data.transAmount },
            availableQty: { decrement: validatedAdjustData.data.transAmount },
            updatedAt: createdAt,
          },
        });

        const existingStock = await prisma.stock.findUnique({
          where: {
            itemId_warehouseId: {
              itemId: validatedAdjustData.data.articulo,
              warehouseId: validatedAdjustData.data.receivingWarehouse,
            },
          },
        });

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
              availableQty: { increment: validatedAdjustData.data.transAmount },
              updatedAt: createdAt,
            },
          });
        } else {
          await prisma.stock.create({
            data: {
              itemId: validatedAdjustData.data.articulo,
              warehouseId: validatedAdjustData.data.receivingWarehouse,
              quantity: validatedAdjustData.data.transAmount,
              availableQty: validatedAdjustData.data.transAmount,
              createdAt,
              updatedAt: createdAt,
            },
          });
        }

        await prisma.stockMovement.create({
          data: {
            itemId: validatedAdjustData.data.articulo,
            fromWarehouseId: validatedAdjustData.data.sendingWarehouse,
            toWarehouseId: validatedAdjustData.data.receivingWarehouse,
            type: "TRANSFER",
            quantity: validatedAdjustData.data.transAmount,
            reference: `Transferencia de inventario: ${
              validatedAdjustData.data.notes || "Sin notas"
            }`,
            status: "COMPLETED",
            createdBy: user.id as string,
            createdAt,
            updatedAt: createdAt,
          },
        });
      });
    } catch (error) {
      console.log(error);
      return {
        errors: {},
        success: false,
        message: "Error al transferir inventario",
      };
    }

    revalidatePath("/sistema/negocio/ajustes/nuevo");
    revalidatePath("/sistema/negocio/articulos/nuevo");
    revalidatePath("/sistema/negocio/articulos");
    revalidatePath("/sistema/ventas/pedidos/nuevo");
    revalidatePath("/sistema/ventas/pos/register");
    revalidatePath("/sistema/negocio");
    revalidatePath("/sistema/qr/generador");
    revalidatePath("/sistema/qr/productos");

    return { success: true, message: "Transferencia de inventario exitosa!" };
  }
};
