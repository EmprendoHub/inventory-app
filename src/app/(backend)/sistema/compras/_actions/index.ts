"use server";

import prisma from "@/lib/db";
import { PurchaseOrderFormState } from "@/types/purchaseOrders";
import { POStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export const createPurchaseOrderAction = async (
  state: PurchaseOrderFormState,
  formData: FormData
): Promise<PurchaseOrderFormState> => {
  const rawData = {
    poNumber: formData.get("poNumber"),
    supplierId: formData.get("supplierId"),
    status: formData.get("status"),
    totalAmount: parseFloat(formData.get("totalAmount") as string),
    taxAmount: parseFloat(formData.get("taxAmount") as string),
    notes: formData.get("notes"),
    expectedDate: formData.get("expectedDate"),
    items: JSON.parse(formData.get("items") as string),
  };
  if (
    !rawData.poNumber ||
    !rawData.supplierId ||
    !rawData.status ||
    !rawData.expectedDate
  ) {
    return {
      errors: { general: ["Missing required fields"] },
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  try {
    await prisma.$transaction(async (prisma) => {
      const newPurchaseOrder = await prisma.purchaseOrder.create({
        data: {
          poNumber: rawData.poNumber as string,
          supplierId: rawData.supplierId as string,
          status: rawData.status as POStatus,
          totalAmount: rawData.totalAmount,
          taxAmount: rawData.taxAmount,
          notes: rawData.notes as string,
          expectedDate: new Date(rawData.expectedDate as string),
        },
      });

      for (const item of rawData.items) {
        await prisma.purchaseOrderItem.create({
          data: {
            purchaseOrderId: newPurchaseOrder.id,
            itemId: item.itemId,
            name: "",
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            tax: item.tax,
            receivedQty: item.receivedQty,
          },
        });
      }
    });

    revalidatePath("/sistema/compras/ordenes");
    return {
      success: true,
      message: "Purchase order created successfully!",
    };
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return { success: false, message: "Error al crear orden de compra." };
  }
};

export async function updatePurchaseOrderAction(
  state: PurchaseOrderFormState,
  formData: FormData
): Promise<PurchaseOrderFormState> {
  const rawData = {
    id: formData.get("id") as string,
    poNumber: formData.get("poNumber") as string,
    supplierId: formData.get("supplierId") as string,
    status: formData.get("status") as string,
    totalAmount: parseFloat(formData.get("totalAmount") as string),
    taxAmount: parseFloat(formData.get("taxAmount") as string),
    notes: formData.get("notes") as string,
    expectedDate: formData.get("expectedDate") as string,
    items: JSON.parse(formData.get("items") as string),
  };

  if (
    !rawData.poNumber ||
    !rawData.supplierId ||
    !rawData.status ||
    !rawData.expectedDate
  ) {
    return {
      errors: { general: ["Missing required fields"] },
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  try {
    await prisma.$transaction(async (prisma) => {
      await prisma.purchaseOrder.update({
        where: {
          id: rawData.id,
        },
        data: {
          poNumber: rawData.poNumber,
          supplierId: rawData.supplierId,
          status: rawData.status as POStatus,
          totalAmount: rawData.totalAmount,
          taxAmount: rawData.taxAmount,
          notes: rawData.notes,
          expectedDate: new Date(rawData.expectedDate),
        },
      });

      await prisma.purchaseOrderItem.deleteMany({
        where: {
          purchaseOrderId: rawData.id,
        },
      });

      for (const item of rawData.items) {
        await prisma.purchaseOrderItem.create({
          data: {
            purchaseOrderId: rawData.id,
            itemId: item.itemId,
            name: "",
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            tax: item.tax,
            receivedQty: item.receivedQty,
          },
        });
      }
    });

    revalidatePath("/sistema/compras/ordenes");
    return {
      success: true,
      message: "Purchase order updated successfully!",
    };
  } catch (error) {
    console.error("Error updating purchase order:", error);
    return { success: false, message: "Error al actualizar orden de compra." };
  }
}

export async function deletePurchaseOrderAction(formData: FormData) {
  const rawData = {
    id: formData.get("id") as string,
  };

  try {
    await prisma.purchaseOrder.delete({
      where: {
        id: rawData.id,
      },
    });

    revalidatePath("/sistema/compras/ordenes");
    return {
      success: true,
      message: "Purchase order deleted successfully!",
    };
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return { success: false, message: "Error al eliminar orden de compra." };
  }
}
