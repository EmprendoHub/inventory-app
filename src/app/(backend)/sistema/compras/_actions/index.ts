"use server";

import { options } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/db";
import { generatePurchaseOrderId } from "@/lib/utils";
import { supplierType } from "@/types/categories";
import { PurchaseOrderFormState } from "@/types/purchaseOrders";
import { POStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export const createPurchaseOrderAction = async (
  state: PurchaseOrderFormState,
  formData: FormData
): Promise<PurchaseOrderFormState> => {
  const rawData = {
    supplier: JSON.parse(
      (formData.get("supplier") as string) || "{}"
    ) as supplierType,
    status: formData.get("status"),
    totalAmount: parseFloat(formData.get("totalAmount") as string),
    taxAmount: parseFloat(formData.get("taxAmount") as string),
    notes: formData.get("notes"),
    expectedDate: formData.get("expectedDate"),
    items: JSON.parse((formData.get("items") as string) || "[]"),
  };
  if (!rawData.supplier || !rawData.expectedDate) {
    return {
      errors: { general: ["Missing required fields"] },
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  try {
    const poNumber = await generatePurchaseOrderId(prisma);
    await prisma.$transaction(async (prisma) => {
      const newPurchaseOrder = await prisma.purchaseOrder.create({
        data: {
          poNumber,
          supplierId: rawData.supplier.id as string,
          status: "PENDIENTE" as POStatus,
          totalAmount: rawData.totalAmount,
          taxAmount: rawData.taxAmount,
          notes: rawData.notes as string,
          expectedDate: new Date(rawData.expectedDate as string),
        },
      });

      const itemTax = rawData.taxAmount > 0 ? 0.16 : 0.0;
      for (const item of rawData.items) {
        await prisma.purchaseOrderItem.create({
          data: {
            purchaseOrderId: newPurchaseOrder.id,
            itemId: item.itemId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            tax: itemTax,
            receivedQty: item.receivedQty,
          },
        });
      }
    });

    revalidatePath("/sistema/compras");
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
    supplier: JSON.parse(
      (formData.get("supplier") as string) || "{}"
    ) as supplierType,
    status: formData.get("status") as string,
    formType: formData.get("formType") as string,
    totalAmount: parseFloat(formData.get("totalAmount") as string),
    taxAmount: parseFloat(formData.get("taxAmount") as string),
    taxEnabled: parseFloat(formData.get("taxEnabled") as string),
    notes: formData.get("notes") as string,
    expectedDate: formData.get("expectedDate") as string,
    items: JSON.parse(formData.get("items") as string),
  };

  if (!rawData.expectedDate) {
    return {
      errors: { general: ["Missing required fields"] },
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  const pOStatus =
    rawData.formType === "Autorizar"
      ? "APROBADO"
      : rawData.formType === "Recibir"
      ? "RECIBIDO"
      : "PENDIENTE";
  try {
    await prisma.$transaction(async (prisma) => {
      await prisma.purchaseOrder.update({
        where: {
          id: rawData.id,
        },
        data: {
          status: pOStatus as POStatus,
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
        const itemTax = rawData.taxAmount > 0 ? 0.16 : 0.0;
        await prisma.purchaseOrderItem.create({
          data: {
            purchaseOrderId: rawData.id,
            itemId: item.itemId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            tax: itemTax,
            receivedQty: item.receivedQty,
          },
        });
      }
    });

    revalidatePath("/sistema/compras");
    return {
      success: true,
      message: "Purchase order updated successfully!",
    };
  } catch (error) {
    console.error("Error updating purchase order:", error);
    return { success: false, message: "Error al actualizar orden de compra." };
  }
}

export async function authorizePurchaseOrderAction(
  state: PurchaseOrderFormState,
  formData: FormData
): Promise<PurchaseOrderFormState> {
  const rawData = {
    id: formData.get("id") as string,
    supplier: JSON.parse(
      (formData.get("supplier") as string) || "{}"
    ) as supplierType,
    status: formData.get("status") as string,
    totalAmount: parseFloat(formData.get("totalAmount") as string),
    taxAmount: parseFloat(formData.get("taxAmount") as string),
    taxEnabled: parseFloat(formData.get("taxEnabled") as string),
    notes: formData.get("notes") as string,
    expectedDate: formData.get("expectedDate") as string,
    items: JSON.parse(formData.get("items") as string),
  };

  if (!rawData.status || !rawData.expectedDate) {
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
          status: "APROBADO" as POStatus,
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
        const itemTax = rawData.taxAmount > 0 ? 0.16 : 0.0;
        await prisma.purchaseOrderItem.create({
          data: {
            purchaseOrderId: rawData.id,
            itemId: item.itemId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            tax: itemTax,
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

export async function receivePurchaseOrderAction(
  state: PurchaseOrderFormState,
  formData: FormData
): Promise<PurchaseOrderFormState> {
  const rawData = {
    id: formData.get("id") as string,
    status: formData.get("status") as string,
    notes: formData.get("notes") as string,
    items: JSON.parse(formData.get("items") as string),
  };
  const session = await getServerSession(options);
  const userId = session.user.id;
  if (!rawData.status) {
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
          status: "RECIBIDO" as POStatus,
          notes: rawData.notes,
          updatedAt: new Date(),
          userId,
        },
      });

      for (const item of rawData.items) {
        await prisma.purchaseOrderItem.update({
          where: {
            id: item.id,
          },
          data: {
            receivedQty: item.receivedQty,
          },
        });
      }
    });

    revalidatePath("/sistema/compras");
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
    await prisma.purchaseOrderItem.deleteMany({
      where: {
        purchaseOrderId: rawData.id,
      },
    });

    await prisma.purchaseOrder.delete({
      where: {
        id: rawData.id,
      },
    });

    revalidatePath("/sistema/compras");
    return {
      success: true,
      message: "Purchase order deleted successfully!",
    };
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return { success: false, message: "Error al eliminar orden de compra." };
  }
}

export async function cancelPurchaseOrderAction(formData: FormData) {
  const rawData = {
    id: formData.get("id") as string,
  };

  try {
    await prisma.purchaseOrderItem.updateMany({
      where: {
        purchaseOrderId: rawData.id,
      },
      data: {
        receivedQty: 0,
      },
    });

    await prisma.purchaseOrder.update({
      where: {
        id: rawData.id,
      },
      data: {
        status: "CANCELADO",
      },
    });

    revalidatePath("/sistema/compras");
    return {
      success: true,
      message: "Purchase order deleted successfully!",
    };
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return { success: false, message: "Error al eliminar orden de compra." };
  }
}
