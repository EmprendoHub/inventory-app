"use server";

import prisma from "@/lib/db";
import { InventoryCountFormState } from "@/types/inventoryCounts";
import { revalidatePath } from "next/cache";

export const createInventoryCountAction = async (
  state: InventoryCountFormState,
  formData: FormData
): Promise<InventoryCountFormState> => {
  const rawData = {
    warehouseId: formData.get("warehouseId"),
    countDate: formData.get("countDate"),
    notes: formData.get("notes"),
    createdBy: formData.get("createdBy"),
    items: JSON.parse(formData.get("items") as string),
  };

  if (!rawData.warehouseId || !rawData.countDate || !rawData.createdBy) {
    return {
      errors: { general: ["Missing required fields"] },
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  try {
    await prisma.$transaction(async (prisma) => {
      const newInventoryCount = await prisma.inventoryCount.create({
        data: {
          warehouseId: rawData.warehouseId as string,
          countDate: new Date(rawData.countDate as string),
          notes: rawData.notes as string,
          createdBy: rawData.createdBy as string,
        },
      });

      for (const item of rawData.items) {
        await prisma.countItem.create({
          data: {
            inventoryCountId: newInventoryCount.id,
            itemId: item.itemId,
            expectedQty: item.expectedQty,
            actualQty: item.actualQty,
            difference: item.expectedQty - item.actualQty,
            notes: item.notes,
          },
        });
      }
    });

    revalidatePath("/sistema/inventario/conteos");
    return {
      success: true,
      message: "Inventory count created successfully!",
    };
  } catch (error) {
    console.error("Error creating inventory count:", error);
    return { success: false, message: "Error al crear conteo de inventario." };
  }
};

export async function updateInventoryCountAction(
  state: InventoryCountFormState,
  formData: FormData
): Promise<InventoryCountFormState> {
  const rawData = {
    id: formData.get("id") as string,
    warehouseId: formData.get("warehouseId") as string,
    countDate: formData.get("countDate") as string,
    notes: formData.get("notes") as string,
    approvedBy: formData.get("approvedBy") as string,
    items: JSON.parse(formData.get("items") as string),
  };

  if (!rawData.warehouseId || !rawData.countDate) {
    return {
      errors: { general: ["Missing required fields"] },
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  try {
    await prisma.$transaction(async (prisma) => {
      await prisma.inventoryCount.update({
        where: {
          id: rawData.id,
        },
        data: {
          warehouseId: rawData.warehouseId,
          countDate: new Date(rawData.countDate),
          notes: rawData.notes,
          approvedBy: rawData.approvedBy,
        },
      });

      await prisma.countItem.deleteMany({
        where: {
          inventoryCountId: rawData.id,
        },
      });

      for (const item of rawData.items) {
        await prisma.countItem.create({
          data: {
            inventoryCountId: rawData.id,
            itemId: item.itemId,
            expectedQty: item.expectedQty,
            actualQty: item.actualQty,
            difference: item.expectedQty - item.actualQty,
            notes: item.notes,
          },
        });
      }
    });

    revalidatePath("/sistema/inventario/conteos");
    return {
      success: true,
      message: "Inventory count updated successfully!",
    };
  } catch (error) {
    console.error("Error updating inventory count:", error);
    return {
      success: false,
      message: "Error al actualizar conteo de inventario.",
    };
  }
}

export async function deleteInventoryCountAction(formData: FormData) {
  const rawData = {
    id: formData.get("id") as string,
  };

  try {
    await prisma.inventoryCount.delete({
      where: {
        id: rawData.id,
      },
    });

    revalidatePath("/sistema/inventario/conteos");
    return {
      success: true,
      message: "Inventory count deleted successfully!",
    };
  } catch (error) {
    console.error("Error deleting inventory count:", error);
    return {
      success: false,
      message: "Error al eliminar conteo de inventario.",
    };
  }
}
