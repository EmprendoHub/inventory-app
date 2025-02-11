"use server";

import prisma from "@/lib/db";
import { ExpenseFormState } from "@/types/expenses";
import { ExpenseStatus, ExpenseType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export const createExpenseAction = async (
  state: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> => {
  const rawData = {
    type: formData.get("type"),
    amount: parseFloat(formData.get("amount") as string),
    description: formData.get("description"),
    reference: formData.get("reference"),
    status: formData.get("status"),
    paymentDate: formData.get("paymentDate"),
    deliveryId: formData.get("deliveryId"),
    driverId: formData.get("driverId"),
    truckId: formData.get("truckId"),
    externalShipId: formData.get("externalShipId"),
    supplierId: formData.get("supplierId"),
  };

  if (!rawData.type || !rawData.amount || !rawData.status) {
    return {
      errors: { general: ["Missing required fields"] },
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  try {
    await prisma.expense.create({
      data: {
        type: rawData.type as ExpenseType,
        amount: rawData.amount,
        description: rawData.description as string,
        reference: rawData.reference as string,
        status: rawData.status as ExpenseStatus,
        paymentDate: rawData.paymentDate
          ? new Date(rawData.paymentDate as string)
          : undefined,
        deliveryId: rawData.deliveryId as string,
        driverId: rawData.driverId as string,
        truckId: rawData.truckId as string,
        externalShipId: rawData.externalShipId as string,
        supplierId: rawData.supplierId as string,
      },
    });

    revalidatePath("/sistema/contabilidad/gastos");
    return {
      success: true,
      message: "Expense created successfully!",
    };
  } catch (error) {
    console.error("Error creating expense:", error);
    return { success: false, message: "Error al crear gasto." };
  }
};

export async function updateExpenseAction(
  state: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  const rawData = {
    id: formData.get("id") as string,
    type: formData.get("type") as string,
    amount: parseFloat(formData.get("amount") as string),
    description: formData.get("description") as string,
    reference: formData.get("reference") as string,
    status: formData.get("status") as string,
    paymentDate: formData.get("paymentDate") as string,
    deliveryId: formData.get("deliveryId") as string,
    driverId: formData.get("driverId") as string,
    truckId: formData.get("truckId") as string,
    externalShipId: formData.get("externalShipId") as string,
    supplierId: formData.get("supplierId") as string,
  };

  if (!rawData.type || !rawData.amount || !rawData.status) {
    return {
      errors: { general: ["Missing required fields"] },
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  try {
    await prisma.expense.update({
      where: {
        id: rawData.id,
      },
      data: {
        type: rawData.type as ExpenseType,
        amount: rawData.amount,
        description: rawData.description,
        reference: rawData.reference,
        status: rawData.status as ExpenseStatus,
        paymentDate: rawData.paymentDate
          ? new Date(rawData.paymentDate)
          : undefined,
        deliveryId: rawData.deliveryId,
        driverId: rawData.driverId,
        truckId: rawData.truckId,
        externalShipId: rawData.externalShipId,
        supplierId: rawData.supplierId,
      },
    });

    revalidatePath("/sistema/contabilidad/gastos");
    return {
      success: true,
      message: "Expense updated successfully!",
    };
  } catch (error) {
    console.error("Error updating expense:", error);
    return { success: false, message: "Error al actualizar gasto." };
  }
}

export async function deleteExpenseAction(formData: FormData) {
  const rawData = {
    id: formData.get("id") as string,
  };

  try {
    await prisma.expense.delete({
      where: {
        id: rawData.id,
      },
    });

    revalidatePath("/sistema/contabilidad/gastos");
    return {
      success: true,
      message: "Expense deleted successfully!",
    };
  } catch (error) {
    console.error("Error deleting expense:", error);
    return { success: false, message: "Error al eliminar gasto." };
  }
}
