"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export const createCashRegisterAction = async (
  prevState: { success: boolean; message: string }, // Add this parameter
  formData: FormData
): Promise<{ success: boolean; message: string }> => {
  const rawData = {
    name: formData.get("name") as string,
  };

  if (!rawData.name) {
    return {
      success: false,
      message: "Name is required.",
    };
  }

  try {
    await prisma.cashRegister.create({
      data: {
        name: rawData.name,
      },
    });

    revalidatePath("/sistema/caja");
    return {
      success: true,
      message: "Cash Register created successfully!",
    };
  } catch (error) {
    console.error("Error creating cash register:", error);
    return { success: false, message: "Error al crear caja." };
  }
};

export const createCashTransactionAction = async (
  prevState: { success: boolean; message: string }, // Add this parameter
  formData: FormData
): Promise<{ success: boolean; message: string }> => {
  const rawData = {
    type: formData.get("type") as string,
    amount: parseFloat(formData.get("amount") as string),
    description: formData.get("description") as string,
    cashRegisterId: formData.get("cashRegisterId") as string,
  };

  if (!rawData.type || !rawData.amount || !rawData.cashRegisterId) {
    return {
      success: false,
      message: "Missing required fields.",
    };
  }

  try {
    await prisma.cashTransaction.create({
      data: {
        type: rawData.type as "DEPOSIT" | "WITHDRAWAL",
        amount: rawData.amount,
        description: rawData.description,
        cashRegisterId: rawData.cashRegisterId,
      },
    });

    revalidatePath("/sistema/caja");
    return {
      success: true,
      message: "Transaction created successfully!",
    };
  } catch (error) {
    console.error("Error creating transaction:", error);
    return { success: false, message: "Error al crear transacción." };
  }
};

export const createCashAuditAction = async (
  prevState: { success: boolean; message: string }, // Add this parameter
  formData: FormData
): Promise<{ success: boolean; message: string }> => {
  const rawData = {
    cashRegisterId: formData.get("cashRegisterId") as string,
    startBalance: parseFloat(formData.get("startBalance") as string),
    endBalance: parseFloat(formData.get("endBalance") as string),
    auditDate: formData.get("auditDate") as string,
  };

  if (
    !rawData.cashRegisterId ||
    !rawData.startBalance ||
    !rawData.endBalance ||
    !rawData.auditDate
  ) {
    return {
      success: false,
      message: "Missing required fields.",
    };
  }

  try {
    await prisma.cashAudit.create({
      data: {
        cashRegisterId: rawData.cashRegisterId,
        startBalance: rawData.startBalance,
        endBalance: rawData.endBalance,
        auditDate: new Date(rawData.auditDate),
      },
    });

    revalidatePath("/sistema/auditoria-caja");
    return {
      success: true,
      message: "Cash Audit created successfully!",
    };
  } catch (error) {
    console.error("Error creating cash audit:", error);
    return { success: false, message: "Error al crear auditoría de caja." };
  }
};
