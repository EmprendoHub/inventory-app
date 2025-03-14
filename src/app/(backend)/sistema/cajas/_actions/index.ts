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
          auditDate: new Date(rawData.auditDate),
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
            decrement: rawData.endBalance, // deducts cash withdraw to the current balance
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
          date: new Date(),
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
          updatedAt: createdAt,
        },
      });

      const branchRegister = await prisma.cashRegister.update({
        where: { userId: manager?.id },
        data: {
          balance: {
            increment: rawData.endBalance, // adds cash withdraw to the current balance
          },
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
