"use server";

import { options } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/db";
import { getMexicoGlobalUtcDate } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export const createCashRegisterAction = async (
  state: {
    errors?: Record<string, string[]>;
    success?: boolean;
    message?: string;
  },
  formData: FormData
): Promise<{
  success: boolean;
  message: string;
  errors: Record<string, string[]>;
}> => {
  const rawData = {
    name: formData.get("name") as string,
    fund: formData.get("fund") as string,
    managerId: formData.get("managerId") as string,
    ownerId: formData.get("ownerId") as string,
  };

  if (!rawData.name || !rawData.managerId || !rawData.ownerId) {
    return {
      success: false,
      message: "Name is required.",
      errors: {},
    };
  }

  try {
    const createdAt = getMexicoGlobalUtcDate();
    await prisma.$transaction(async (prisma) => {
      const newRegister = await prisma.cashRegister.create({
        data: {
          name: rawData.name,
          balance: Number(rawData.fund),
          managerId: rawData.managerId,
          userId: rawData.ownerId,
          createdAt,
          updatedAt: createdAt,
        },
      });

      await prisma.cashTransaction.create({
        data: {
          type: "DEPOSITO",
          amount: Number(rawData.fund),
          description: "FONDO DE CAJA",
          cashRegisterId: newRegister.id,
          userId: rawData.ownerId,
          createdAt,
          updatedAt: createdAt,
        },
      });
    });

    revalidatePath("/sistema/cajas");
    revalidatePath("/sistema/cajas/personal");
    return {
      success: true,
      message: "Cash Register created successfully!",
      errors: {},
    };
  } catch (error) {
    console.error("Error creating cash register:", error);
    return { errors: {}, success: false, message: "Error al crear caja." };
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
    const createdAt = getMexicoGlobalUtcDate();
    await prisma.cashTransaction.create({
      data: {
        type: rawData.type as "DEPOSITO" | "RETIRO",
        amount: rawData.amount,
        description: rawData.description,
        cashRegisterId: rawData.cashRegisterId,
        createdAt,
        updatedAt: createdAt,
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
  state: {
    errors?: Record<string, string[]>;
    success?: boolean;
    message?: string;
  },
  formData: FormData
): Promise<{
  success: boolean;
  message: string;
  errors: Record<string, string[]>;
}> => {
  const rawData = {
    managerId: formData.get("managerId") as string,
    register: formData.get("register") as string,
    startBalance: parseFloat(formData.get("startBalance") as string),
    endBalance: parseFloat(formData.get("endBalance") as string),
    auditDate: formData.get("auditDate") as string,
    billBreakdown: formData.get("billBreakdown") as string,
  };

  const register = JSON.parse(rawData.register);

  if (
    !register.id ||
    !rawData.endBalance ||
    !rawData.auditDate ||
    !rawData.managerId
  ) {
    return {
      errors: {},
      success: false,
      message: "Missing required fields.",
    };
  }
  const session = await getServerSession(options);
  const user = session?.user;
  try {
    const createdAt = getMexicoGlobalUtcDate();
    await prisma.$transaction(async (prisma) => {
      await prisma.cashAudit.create({
        data: {
          cashRegisterId: register.id,
          startBalance: rawData.startBalance,
          endBalance: rawData.endBalance,
          auditDate: createdAt,
          userId: user.id,
          managerId: rawData.managerId,
          billBreakdown: rawData.billBreakdown
            ? JSON.parse(rawData.billBreakdown)
            : null,
          createdAt,
          updatedAt: createdAt,
        },
      });

      const updatedRegister = await prisma.cashRegister.update({
        where: { userId: user?.id || "" },
        data: {
          balance: {
            decrement: rawData.endBalance, // deducts cash withdraw to the current balance
          },
          billBreakdown: rawData.billBreakdown
            ? JSON.parse(rawData.billBreakdown)
            : null, // Update the billBreakdown with remaining amounts
          updatedAt: createdAt,
        },
      });

      const managerUser = await prisma.user.findFirst({
        where: {
          id: rawData.managerId,
        },
      });

      await prisma.cashTransaction.create({
        data: {
          type: "RETIRO",
          amount: Math.round(rawData.endBalance),
          description: `CORTE DE CAJA (${updatedRegister.name}) RETIRADO POR: (${managerUser?.name})`,
          cashRegisterId: updatedRegister.id,
          userId: rawData.managerId,
          createdAt,
          updatedAt: createdAt,
        },
      });

      const account = await prisma.account.findFirst({
        where: {
          parentAccount: null,
        },
      });

      await prisma.transaction.create({
        data: {
          type: "DEPOSITO",
          date: createdAt,
          amount: Math.round(rawData.endBalance),
          description: `CORTE DE CAJA (${updatedRegister.name}) DEPOSITADO POR: (${managerUser?.name})`,
          registerId: updatedRegister.id,
          accountId: account?.id || "",
          createdAt,
          updatedAt: createdAt,
        },
      });

      await prisma.account.update({
        where: {
          id: account?.id,
        },
        data: {
          balance: { increment: Math.round(rawData.endBalance) },
          updatedAt: createdAt,
        },
      });
    });
    revalidatePath("/sistema/contabilidad/transacciones");
    revalidatePath("/sistema/contabilidad/cuentas");
    revalidatePath("/sistema/cajas");
    revalidatePath("/sistema/cajas/auditoria");
    return {
      errors: {},
      success: true,
      message: "Cash Audit created successfully!",
    };
  } catch (error) {
    console.error("Error creating cash audit:", error);
    return {
      errors: {},
      success: false,
      message: "Error al crear auditoría de caja.",
    };
  }
};

export const createPettyCashAction = async (
  state: {
    errors?: Record<string, string[]>;
    success?: boolean;
    message?: string;
  },
  formData: FormData
): Promise<{
  success: boolean;
  message: string;
  errors: Record<string, string[]>;
}> => {
  const rawData = {
    managerId: formData.get("managerId") as string,
    register: formData.get("register") as string,
    startBalance: parseFloat(formData.get("startBalance") as string),
    endBalance: parseFloat(formData.get("endBalance") as string),
    auditDate: formData.get("auditDate") as string,
  };

  const register = JSON.parse(rawData.register);

  if (
    !register.id ||
    !rawData.endBalance ||
    !rawData.auditDate ||
    !rawData.managerId
  ) {
    return {
      errors: {},
      success: false,
      message: "Missing required fields.",
    };
  }
  const session = await getServerSession(options);
  const user = session?.user;
  try {
    const createdAt = getMexicoGlobalUtcDate();
    await prisma.$transaction(async (prisma) => {
      await prisma.cashAudit.create({
        data: {
          cashRegisterId: register.id,
          startBalance: rawData.startBalance,
          endBalance: rawData.endBalance,
          auditDate: createdAt,
          userId: user.id,
          managerId: rawData.managerId,
          createdAt,
          updatedAt: createdAt,
        },
      });

      const updatedRegister = await prisma.cashRegister.update({
        where: { userId: user?.id || "" },
        data: {
          balance: {
            increment: rawData.endBalance, // deducts cash withdraw to the current balance
          },
          updatedAt: createdAt,
        },
      });

      const managerUser = await prisma.user.findFirst({
        where: {
          id: rawData.managerId,
        },
      });

      await prisma.cashTransaction.create({
        data: {
          type: "DEPOSITO",
          amount: Math.round(rawData.endBalance),
          description: `AGREGAR FONDO (${updatedRegister.name}) AGREGADO POR: (${managerUser?.name})`,
          cashRegisterId: updatedRegister.id,
          userId: rawData.managerId,
          createdAt,
          updatedAt: createdAt,
        },
      });

      const account = await prisma.account.findFirst({
        where: {
          parentAccount: null,
        },
      });

      await prisma.transaction.create({
        data: {
          type: "RETIRO",
          date: createdAt,
          amount: Math.round(rawData.endBalance),
          description: `AGREGAR FONDO (${updatedRegister.name}) RETIRADO POR: (${managerUser?.name})`,
          registerId: updatedRegister.id,
          accountId: account?.id || "",
          createdAt,
          updatedAt: createdAt,
        },
      });

      await prisma.account.update({
        where: {
          id: account?.id,
        },
        data: {
          balance: { decrement: Math.round(rawData.endBalance) },
          updatedAt: createdAt,
        },
      });
    });
    revalidatePath("/sistema/contabilidad/transacciones");
    revalidatePath("/sistema/contabilidad/cuentas");
    revalidatePath("/sistema/cajas");
    revalidatePath("/sistema/cajas/auditoria");
    return {
      errors: {},
      success: true,
      message: "Cash Audit created successfully!",
    };
  } catch (error) {
    console.error("Error creating cash audit:", error);
    return {
      errors: {},
      success: false,
      message: "Error al crear auditoría de caja.",
    };
  }
};

export const createCashHandoffAction = async (
  state: {
    errors?: Record<string, string[]>;
    success?: boolean;
    message?: string;
  },
  formData: FormData
): Promise<{
  success: boolean;
  message: string;
  errors: Record<string, string[]>;
}> => {
  const rawData = {
    managerId: formData.get("managerId") as string,
    register: formData.get("register") as string,
    startBalance: parseFloat(formData.get("startBalance") as string),
    endBalance: parseFloat(formData.get("endBalance") as string),
    auditDate: formData.get("auditDate") as string,
    billBreakdown: formData.get("billBreakdown") as string,
  };

  const register = JSON.parse(rawData.register);

  if (
    !register.id ||
    !rawData.endBalance ||
    !rawData.auditDate ||
    !rawData.managerId
  ) {
    return {
      errors: {},
      success: false,
      message: "Missing required fields.",
    };
  }
  const session = await getServerSession(options);
  const user = session?.user;
  const manager = await prisma.user.findFirst({
    where: {
      id: rawData.managerId,
    },
  });
  try {
    const createdAt = getMexicoGlobalUtcDate();
    await prisma.$transaction(async (prisma) => {
      const driverRegister = await prisma.cashRegister.update({
        where: { userId: user?.id || "" },
        data: {
          balance: {
            decrement: rawData.endBalance, // deducts cash withdraw to the current balance
          },
          billBreakdown: rawData.billBreakdown
            ? JSON.parse(rawData.billBreakdown)
            : null, // Update the driver's register with remaining amounts after handoff
          updatedAt: createdAt,
        },
      });

      // Get current manager register to add the delivered cash breakdown
      const currentManagerRegister = await prisma.cashRegister.findUnique({
        where: { userId: manager?.id },
      });

      // Helper function to add cash breakdowns
      const addCashBreakdowns = (existing: any, incoming: any) => {
        if (!existing) return incoming;
        if (!incoming) return existing;

        const result = { ...existing };

        // Add bills
        if (existing.bills && incoming.bills) {
          Object.keys(incoming.bills).forEach((key) => {
            if (result.bills[key] && incoming.bills[key]) {
              result.bills[key].count =
                (result.bills[key].count || 0) +
                (incoming.bills[key].count || 0);
              result.bills[key].total =
                (result.bills[key].total || 0) +
                (incoming.bills[key].total || 0);
            }
          });
        }

        // Add coins
        if (existing.coins && incoming.coins) {
          Object.keys(incoming.coins).forEach((key) => {
            if (result.coins[key] && incoming.coins[key]) {
              result.coins[key].count =
                (result.coins[key].count || 0) +
                (incoming.coins[key].count || 0);
              result.coins[key].total =
                (result.coins[key].total || 0) +
                (incoming.coins[key].total || 0);
            }
          });
        }

        // Update total cash
        result.totalCash =
          (existing.totalCash || 0) + (incoming.totalCash || 0);
        return result;
      };

      // Calculate the delivered breakdown (original breakdown minus remaining breakdown)
      const originalBreakdown = register.billBreakdown;
      const remainingBreakdown = rawData.billBreakdown
        ? JSON.parse(rawData.billBreakdown)
        : null;

      let deliveredBreakdown: any = null;
      if (originalBreakdown && remainingBreakdown) {
        deliveredBreakdown = { ...originalBreakdown };

        // Subtract remaining from original to get delivered amounts
        if (originalBreakdown.bills && remainingBreakdown.bills) {
          Object.keys(originalBreakdown.bills).forEach((key) => {
            if (
              deliveredBreakdown.bills[key] &&
              remainingBreakdown.bills[key]
            ) {
              deliveredBreakdown.bills[key].count = Math.max(
                0,
                (originalBreakdown.bills[key].count || 0) -
                  (remainingBreakdown.bills[key].count || 0)
              );
              deliveredBreakdown.bills[key].total = Math.max(
                0,
                (originalBreakdown.bills[key].total || 0) -
                  (remainingBreakdown.bills[key].total || 0)
              );
            }
          });
        }

        if (originalBreakdown.coins && remainingBreakdown.coins) {
          Object.keys(originalBreakdown.coins).forEach((key) => {
            if (
              deliveredBreakdown.coins[key] &&
              remainingBreakdown.coins[key]
            ) {
              deliveredBreakdown.coins[key].count = Math.max(
                0,
                (originalBreakdown.coins[key].count || 0) -
                  (remainingBreakdown.coins[key].count || 0)
              );
              deliveredBreakdown.coins[key].total = Math.max(
                0,
                (originalBreakdown.coins[key].total || 0) -
                  (remainingBreakdown.coins[key].total || 0)
              );
            }
          });
        }

        deliveredBreakdown.totalCash = Math.max(
          0,
          (originalBreakdown.totalCash || 0) -
            (remainingBreakdown.totalCash || 0)
        );
      }

      // Add delivered breakdown to manager's register
      const updatedManagerBreakdown = deliveredBreakdown
        ? addCashBreakdowns(
            currentManagerRegister?.billBreakdown,
            deliveredBreakdown
          )
        : currentManagerRegister?.billBreakdown;

      const branchRegister = await prisma.cashRegister.update({
        where: { userId: manager?.id },
        data: {
          balance: {
            increment: rawData.endBalance, // adds cash withdraw to the current balance
          },
          billBreakdown: updatedManagerBreakdown,
          updatedAt: createdAt,
        },
      });

      await prisma.user.findFirst({
        where: {
          id: rawData.managerId,
        },
      });

      await prisma.cashTransaction.create({
        data: {
          type: "RETIRO",
          amount: Math.round(rawData.endBalance),
          description: `ENTREGA DE EFECTIVO A (${branchRegister.name}) ENTREGADO POR: (${user?.name}) RECIBE: (${manager?.name})`,
          cashRegisterId: driverRegister.id,
          userId: user?.id,
          createdAt,
          updatedAt: createdAt,
        },
      });
      await prisma.cashTransaction.create({
        data: {
          type: "DEPOSITO",
          amount: Math.round(rawData.endBalance),
          description: `ENTREGA DE EFECTIVO A (${branchRegister.name}) ENTREGADO POR: (${user?.name}) RECIBE: (${manager?.name})`,
          cashRegisterId: branchRegister.id,
          userId: manager?.id,
          createdAt,
          updatedAt: createdAt,
        },
      });
    });
    revalidatePath("/sistema/contabilidad/transacciones");
    revalidatePath("/sistema/cajas");
    revalidatePath("/sistema/cajas/auditoria");
    revalidatePath(`/sistema/cajas/personal/${user?.id}`);
    revalidatePath(`/sistema/cajas/personal/${manager?.id}`);
    return {
      errors: {},
      success: true,
      message: "Cash Audit created successfully!",
    };
  } catch (error) {
    console.error("Error creating cash audit:", error);
    return {
      errors: {},
      success: false,
      message: "Error al crear auditoría de caja.",
    };
  }
};

export async function deleteCashAuditAction(formData: FormData) {
  const rawData = {
    id: formData.get("id") as string,
  };

  try {
    await prisma.cashAudit.delete({
      where: {
        id: rawData.id,
      },
    });

    revalidatePath("/sistema/cajas/auditoria");
    return {
      success: true,
      message: "Corte se borro exitosamente!",
    };
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return { success: false, message: "Error al eliminar orden de compra." };
  }
}

export async function deleteCashRegisterAction(formData: FormData) {
  const rawData = {
    id: formData.get("id") as string,
    managerId: formData.get("managerId") as string,
    ownerId: formData.get("ownerId") as string,
  };

  try {
    const createdAt = getMexicoGlobalUtcDate();
    await prisma.$transaction(async (prisma) => {
      const updatedRegister = await prisma.cashRegister.update({
        where: {
          id: rawData.id,
        },
        data: {
          status: "INACTIVA",
          updatedAt: createdAt,
        },
      });

      await prisma.cashTransaction.create({
        data: {
          type: "RETIRO",
          amount: Number(updatedRegister.balance),
          description: `ELIMINACIÓN DE CAJA: ${updatedRegister.name}`,
          cashRegisterId: updatedRegister.id,
          userId: rawData.managerId,
          createdAt,
          updatedAt: createdAt,
        },
      });
    });

    revalidatePath("/sistema/cajas");
    return {
      success: true,
      message: "Caja se borro exitosamente!",
    };
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return { success: false, message: "Error al eliminar orden de compra." };
  }
}
