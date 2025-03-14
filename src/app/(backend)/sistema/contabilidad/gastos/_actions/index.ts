//expenses
"use server";

import { options } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/db";
import { getMexicoGlobalUtcDate } from "@/lib/utils";
import { ExpenseFormState } from "@/types/expenses";
import { ExpenseStatus, ExpenseType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export const createExpenseAction = async (
  state: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> => {
  const rawData = {
    type: formData.get("type"),
    amount: parseFloat(formData.get("amount") as string),
    description: formData.get("description") as string,
    reference: formData.get("reference") as string,
    status: formData.get("status") as string,
    paymentDate: formData.get("paymentDate"),
    driver: formData.get("driver") as string,
    truck: formData.get("truck") as string,
    supplier: formData.get("supplier") as string,
  };
  if (!rawData.type || !rawData.amount || !rawData.status) {
    return {
      errors: { general: ["Missing required fields"] },
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }
  const session = await getServerSession(options);
  const user = session?.user;

  const driver = JSON.parse(rawData.driver);
  const truck = JSON.parse(rawData.truck);
  const supplier = JSON.parse(rawData.supplier);
  const createdAt = getMexicoGlobalUtcDate();
  try {
    await prisma.$transaction(async (prisma) => {
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
          driverId: driver && (driver.id as string),
          truckId: truck && (truck.id as string),
          supplierId: supplier && (supplier.id as string),
          createdAt,
          updatedAt: createdAt,
        },
      });

      const updatedRegister = await prisma.cashRegister.update({
        where: { userId: user.id || "" },
        data: {
          balance: {
            decrement: rawData.amount, // deducts cash withdraw to the current balance
          },
          updatedAt: createdAt,
        },
      });

      await prisma.cashTransaction.create({
        data: {
          type: "RETIRO",
          amount: Number(rawData.amount),
          description: `GASTO ${rawData.type}: ${rawData.description}`,
          cashRegisterId: updatedRegister.id,
          userId: user.id,
          createdAt,
          updatedAt: createdAt,
        },
      });
    });

    revalidatePath("/sistema/cajas");
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
    const createdAt = getMexicoGlobalUtcDate();
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
        updatedAt: createdAt,
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
