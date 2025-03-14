"use server";

import prisma from "@/lib/db";
import { getMexicoGlobalUtcDate } from "@/lib/utils";
import { AccountingFormState } from "@/types/accounting";
import { TransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export const createTransactionAction = async (
  state: AccountingFormState,
  formData: FormData
): Promise<AccountingFormState> => {
  const rawData = {
    date: formData.get("date"),
    description: formData.get("description"),
    amount: parseFloat(formData.get("amount") as string),
    type: formData.get("type"),
    reference: formData.get("reference"),
    accountId: formData.get("accountId"),
    orderId: formData.get("orderId"),
    purchaseOrderId: formData.get("purchaseOrderId"),
    expenseId: formData.get("expenseId"),
  };

  if (
    !rawData.date ||
    !rawData.description ||
    !rawData.amount ||
    !rawData.type ||
    !rawData.accountId
  ) {
    return {
      errors: { general: ["Missing required fields"] },
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  try {
    const createdAt = getMexicoGlobalUtcDate();
    await prisma.transaction.create({
      data: {
        date: new Date(rawData.date as string),
        description: rawData.description as string,
        amount: rawData.amount,
        type: rawData.type as TransactionType,
        reference: rawData.reference as string,
        accountId: rawData.accountId as string,
        orderId: rawData.orderId as string,
        purchaseOrderId: rawData.purchaseOrderId as string,
        expenseId: rawData.expenseId as string,
        createdAt,
        updatedAt: createdAt,
      },
    });

    revalidatePath("/sistema/contabilidad/transacciones");
    return {
      success: true,
      message: "Transaction created successfully!",
    };
  } catch (error) {
    console.error("Error creating transaction:", error);
    return { success: false, message: "Error al crear transacción." };
  }
};

export async function updateTransactionAction(
  state: AccountingFormState,
  formData: FormData
): Promise<AccountingFormState> {
  const rawData = {
    id: formData.get("id") as string,
    date: formData.get("date") as string,
    description: formData.get("description") as string,
    amount: parseFloat(formData.get("amount") as string),
    type: formData.get("type") as string,
    reference: formData.get("reference") as string,
    accountId: formData.get("accountId") as string,
    orderId: formData.get("orderId") as string,
    purchaseOrderId: formData.get("purchaseOrderId") as string,
    expenseId: formData.get("expenseId") as string,
  };

  if (
    !rawData.date ||
    !rawData.description ||
    !rawData.amount ||
    !rawData.type ||
    !rawData.accountId
  ) {
    return {
      errors: { general: ["Missing required fields"] },
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  try {
    const createdAt = getMexicoGlobalUtcDate();
    await prisma.transaction.update({
      where: {
        id: rawData.id,
      },
      data: {
        date: new Date(rawData.date),
        description: rawData.description,
        amount: rawData.amount,
        type: rawData.type as TransactionType,
        reference: rawData.reference,
        accountId: rawData.accountId,
        orderId: rawData.orderId,
        purchaseOrderId: rawData.purchaseOrderId,
        expenseId: rawData.expenseId,
        updatedAt: createdAt,
      },
    });

    revalidatePath("/sistema/contabilidad/transacciones");
    return {
      success: true,
      message: "Transaction updated successfully!",
    };
  } catch (error) {
    console.error("Error updating transaction:", error);
    return { success: false, message: "Error al actualizar transacción." };
  }
}

export async function deleteTransactionAction(formData: FormData) {
  const rawData = {
    id: formData.get("id") as string,
  };

  try {
    await prisma.transaction.delete({
      where: {
        id: rawData.id,
      },
    });

    revalidatePath("/sistema/contabilidad/transacciones");
    return {
      success: true,
      message: "Transaction deleted successfully!",
    };
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return { success: false, message: "Error al eliminar transacción." };
  }
}
