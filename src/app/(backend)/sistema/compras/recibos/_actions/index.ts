"use server";

import prisma from "@/lib/db";
import { getMexicoGlobalUtcDate } from "@/lib/utils";
import { GoodsReceiptFormState } from "@/types/goodsReceipts";
import { revalidatePath } from "next/cache";

export const createGoodsReceiptAction = async (
  state: GoodsReceiptFormState,
  formData: FormData
): Promise<GoodsReceiptFormState> => {
  const rawData = {
    receiptNumber: formData.get("receiptNumber"),
    purchaseOrderId: formData.get("purchaseOrderId"),
    receivedDate: formData.get("receivedDate"),
    notes: formData.get("notes"),
    items: JSON.parse(formData.get("items") as string),
  };

  if (
    !rawData.receiptNumber ||
    !rawData.purchaseOrderId ||
    !rawData.receivedDate
  ) {
    return {
      errors: { general: ["Missing required fields"] },
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  try {
    const createdAt = getMexicoGlobalUtcDate();
    await prisma.$transaction(async (prisma) => {
      const newGoodsReceipt = await prisma.goodsReceipt.create({
        data: {
          receiptNumber: rawData.receiptNumber as string,
          purchaseOrderId: rawData.purchaseOrderId as string,
          receivedDate: new Date(rawData.receivedDate as string),
          notes: rawData.notes as string,
          createdAt,
          updatedAt: createdAt,
        },
      });

      for (const item of rawData.items) {
        await prisma.receivedItem.create({
          data: {
            goodsReceiptId: newGoodsReceipt.id,
            itemId: item.itemId,
            quantity: item.quantity,
            notes: item.notes,
            createdAt,
            updatedAt: createdAt,
          },
        });
      }
    });

    revalidatePath("/sistema/compras/recepciones");
    return {
      success: true,
      message: "Goods receipt created successfully!",
    };
  } catch (error) {
    console.error("Error creating goods receipt:", error);
    return {
      success: false,
      message: "Error al crear recepción de mercancía.",
    };
  }
};

export async function updateGoodsReceiptAction(
  state: GoodsReceiptFormState,
  formData: FormData
): Promise<GoodsReceiptFormState> {
  const rawData = {
    id: formData.get("id") as string,
    receiptNumber: formData.get("receiptNumber") as string,
    purchaseOrderId: formData.get("purchaseOrderId") as string,
    receivedDate: formData.get("receivedDate") as string,
    notes: formData.get("notes") as string,
    items: JSON.parse(formData.get("items") as string),
  };

  if (
    !rawData.receiptNumber ||
    !rawData.purchaseOrderId ||
    !rawData.receivedDate
  ) {
    return {
      errors: { general: ["Missing required fields"] },
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  try {
    const createdAt = getMexicoGlobalUtcDate();
    await prisma.$transaction(async (prisma) => {
      await prisma.goodsReceipt.update({
        where: {
          id: rawData.id,
        },
        data: {
          receiptNumber: rawData.receiptNumber,
          purchaseOrderId: rawData.purchaseOrderId,
          receivedDate: new Date(rawData.receivedDate),
          notes: rawData.notes,
          updatedAt: createdAt,
        },
      });

      await prisma.receivedItem.deleteMany({
        where: {
          goodsReceiptId: rawData.id,
        },
      });

      for (const item of rawData.items) {
        await prisma.receivedItem.create({
          data: {
            goodsReceiptId: rawData.id,
            itemId: item.itemId,
            quantity: item.quantity,
            notes: item.notes,
            createdAt,
            updatedAt: createdAt,
          },
        });
      }
    });

    revalidatePath("/sistema/compras/recepciones");
    return {
      success: true,
      message: "Goods receipt updated successfully!",
    };
  } catch (error) {
    console.error("Error updating goods receipt:", error);
    return {
      success: false,
      message: "Error al actualizar recepción de mercancía.",
    };
  }
}

export async function deleteGoodsReceiptAction(formData: FormData) {
  const rawData = {
    id: formData.get("id") as string,
  };

  try {
    await prisma.goodsReceipt.delete({
      where: {
        id: rawData.id,
      },
    });

    revalidatePath("/sistema/compras/recepciones");
    return {
      success: true,
      message: "Goods receipt deleted successfully!",
    };
  } catch (error) {
    console.error("Error deleting goods receipt:", error);
    return {
      success: false,
      message: "Error al eliminar recepción de mercancía.",
    };
  }
}
