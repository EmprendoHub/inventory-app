"use server";

import prisma from "@/lib/db";
import { AccountingFormState } from "@/types/accounting";
import {
  AccountType,
  ExpenseStatus,
  ExpenseType,
  TransactionType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

// Accounts Actions
export const createAccountAction = async (
  state: AccountingFormState,
  formData: FormData
): Promise<AccountingFormState> => {
  const rawData = {
    code: formData.get("code"),
    name: formData.get("name"),
    type: formData.get("type"),
    description: formData.get("description"),
    parentAccount: formData.get("parentAccount"),
  };

  if (!rawData.code || !rawData.name || !rawData.type) {
    return {
      errors: { general: ["Missing required fields"] },
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  try {
    await prisma.account.create({
      data: {
        code: rawData.code as string,
        name: rawData.name as string,
        type: rawData.type as AccountType,
        description: rawData.description as string,
        parentAccount: rawData.parentAccount as string,
      },
    });

    revalidatePath("/sistema/contabilidad/cuentas");
    return {
      success: true,
      message: "Account created successfully!",
    };
  } catch (error) {
    console.error("Error creating account:", error);
    return { success: false, message: "Error al crear cuenta." };
  }
};

export async function updateAccountAction(
  state: AccountingFormState,
  formData: FormData
): Promise<AccountingFormState> {
  const rawData = {
    id: formData.get("id") as string,
    code: formData.get("code") as string,
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    description: formData.get("description") as string,
    parentAccount: formData.get("parentAccount") as string,
  };

  if (!rawData.code || !rawData.name || !rawData.type) {
    return {
      errors: { general: ["Missing required fields"] },
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  try {
    await prisma.account.update({
      where: {
        id: rawData.id,
      },
      data: {
        code: rawData.code,
        name: rawData.name,
        type: rawData.type as AccountType,
        description: rawData.description,
        parentAccount: rawData.parentAccount,
      },
    });

    revalidatePath("/sistema/contabilidad/cuentas");
    return {
      success: true,
      message: "Account updated successfully!",
    };
  } catch (error) {
    console.error("Error updating account:", error);
    return { success: false, message: "Error al actualizar cuenta." };
  }
}

export async function deleteAccountAction(formData: FormData) {
  const rawData = {
    id: formData.get("id") as string,
  };

  try {
    await prisma.account.delete({
      where: {
        id: rawData.id,
      },
    });

    revalidatePath("/sistema/contabilidad/cuentas");
    return {
      success: true,
      message: "Account deleted successfully!",
    };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { success: false, message: "Error al eliminar cuenta." };
  }
}

// Transactions Actions
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

// Expenses Actions
export const createExpenseAction = async (
  state: AccountingFormState,
  formData: FormData
): Promise<AccountingFormState> => {
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
  state: AccountingFormState,
  formData: FormData
): Promise<AccountingFormState> {
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
