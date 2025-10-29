//expenses
"use server";

import { options } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/db";
import { getMexicoGlobalUtcDate } from "@/lib/utils";
import { ExpenseFormState } from "@/types/expenses";
import { ExpenseStatus } from "@prisma/client";
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
    paymentMethod: formData.get("paymentMethod") as string,
    cashBreakdown: formData.get("cashBreakdown") as string,
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
      const cashRegister = await prisma.cashRegister.findFirst({
        where: { userId: user.id || "" },
        include: {
          user: true,
        },
      });

      if (!cashRegister) {
        return {
          success: false,
          message: "No se encontró la caja chica.",
        };
      }

      // Get the user's warehouse ID
      const userWarehouseId = cashRegister.user.warehouseId;

      await prisma.expense.create({
        data: {
          type: rawData.type as string, // Now accepts string instead of enum
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
          warehouseId: userWarehouseId || undefined, // Assign to user's warehouse
          createdAt,
          updatedAt: createdAt,
        },
      });

      if (Number(rawData.amount) > Number(cashRegister?.balance)) {
        // Check if the cash register has enough balance

        const account = await prisma.account.findFirst({
          where: {
            parentAccount: null,
          },
        });

        await prisma.transaction.create({
          data: {
            type: "RETIRO",
            date: createdAt,
            amount: Math.round(rawData.amount),
            description: `PAGO DE (${rawData.type}: ${rawData.description}) PAGADO POR: (${user?.name})`,
            registerId: cashRegister.id,
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
            balance: { decrement: Math.round(rawData.amount) },
            updatedAt: createdAt,
          },
        });
      } else {
        // If the cash register has enough balance, update the cash register balance
        let updateData: any = {
          balance: {
            decrement: rawData.amount, // deducts cash withdraw to the current balance
          },
          updatedAt: createdAt,
        };

        // If payment method is CASH and we have cash breakdown, update the bill breakdown
        if (rawData.paymentMethod === "CASH" && rawData.cashBreakdown) {
          try {
            const breakdown = JSON.parse(rawData.cashBreakdown);

            // Get the current cash register to get existing breakdown
            const currentRegister = await prisma.cashRegister.findFirst({
              where: { userId: user.id || "" },
            });

            if (currentRegister?.billBreakdown) {
              const currentBreakdown = currentRegister.billBreakdown as any;

              // Subtract the used denominations from the current breakdown
              const updatedBreakdown = {
                bills: {
                  thousands: {
                    value: 1000,
                    count: Math.max(
                      0,
                      (currentBreakdown.bills?.thousands?.count || 0) -
                        (breakdown.bills?.thousands?.count || 0)
                    ),
                    total: 0,
                  },
                  fiveHundreds: {
                    value: 500,
                    count: Math.max(
                      0,
                      (currentBreakdown.bills?.fiveHundreds?.count || 0) -
                        (breakdown.bills?.fiveHundreds?.count || 0)
                    ),
                    total: 0,
                  },
                  twoHundreds: {
                    value: 200,
                    count: Math.max(
                      0,
                      (currentBreakdown.bills?.twoHundreds?.count || 0) -
                        (breakdown.bills?.twoHundreds?.count || 0)
                    ),
                    total: 0,
                  },
                  hundreds: {
                    value: 100,
                    count: Math.max(
                      0,
                      (currentBreakdown.bills?.hundreds?.count || 0) -
                        (breakdown.bills?.hundreds?.count || 0)
                    ),
                    total: 0,
                  },
                  fifties: {
                    value: 50,
                    count: Math.max(
                      0,
                      (currentBreakdown.bills?.fifties?.count || 0) -
                        (breakdown.bills?.fifties?.count || 0)
                    ),
                    total: 0,
                  },
                  twenties: {
                    value: 20,
                    count: Math.max(
                      0,
                      (currentBreakdown.bills?.twenties?.count || 0) -
                        (breakdown.bills?.twenties?.count || 0)
                    ),
                    total: 0,
                  },
                  tens: { value: 10, count: 0, total: 0 },
                  fives: { value: 5, count: 0, total: 0 },
                  ones: { value: 1, count: 0, total: 0 },
                },
                coins: {
                  peso20: { value: 20, count: 0, total: 0 },
                  peso10: {
                    value: 10,
                    count: Math.max(
                      0,
                      (currentBreakdown.coins?.peso10?.count || 0) -
                        (breakdown.coins?.peso10?.count || 0)
                    ),
                    total: 0,
                  },
                  peso5: {
                    value: 5,
                    count: Math.max(
                      0,
                      (currentBreakdown.coins?.peso5?.count || 0) -
                        (breakdown.coins?.peso5?.count || 0)
                    ),
                    total: 0,
                  },
                  peso2: {
                    value: 2,
                    count: Math.max(
                      0,
                      (currentBreakdown.coins?.peso2?.count || 0) -
                        (breakdown.coins?.peso2?.count || 0)
                    ),
                    total: 0,
                  },
                  peso1: {
                    value: 1,
                    count: Math.max(
                      0,
                      (currentBreakdown.coins?.peso1?.count || 0) -
                        (breakdown.coins?.peso1?.count || 0)
                    ),
                    total: 0,
                  },
                  centavos50: {
                    value: 0.5,
                    count: Math.max(
                      0,
                      (currentBreakdown.coins?.centavos50?.count || 0) -
                        (breakdown.coins?.centavos50?.count || 0)
                    ),
                    total: 0,
                  },
                  centavos20: { value: 0.2, count: 0, total: 0 },
                  centavos10: { value: 0.1, count: 0, total: 0 },
                },
                totalCash: 0,
              };

              // Calculate totals for each denomination
              Object.entries(updatedBreakdown.bills).forEach(([key, bill]) => {
                (updatedBreakdown.bills as any)[key].total =
                  bill.value * bill.count;
              });
              Object.entries(updatedBreakdown.coins).forEach(([key, coin]) => {
                (updatedBreakdown.coins as any)[key].total =
                  coin.value * coin.count;
              });

              // Calculate total cash
              const billTotal = Object.values(updatedBreakdown.bills).reduce(
                (sum, bill) => sum + bill.total,
                0
              );
              const coinTotal = Object.values(updatedBreakdown.coins).reduce(
                (sum, coin) => sum + coin.total,
                0
              );
              updatedBreakdown.totalCash = billTotal + coinTotal;

              updateData = {
                ...updateData,
                billBreakdown: updatedBreakdown,
              };
            }
          } catch (error) {
            console.error("Error parsing cash breakdown:", error);
            // Continue without updating breakdown if parsing fails
          }
        }

        const updatedRegister = await prisma.cashRegister.update({
          where: { userId: user.id || "" },
          data: updateData,
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
      }
    });

    revalidatePath("/sistema/contabilidad/transacciones");
    revalidatePath("/sistema/contabilidad/cuentas");
    revalidatePath("/sistema/cajas");
    revalidatePath("/sistema/cajas/auditoria");
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
        type: rawData.type as string,
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
    // Instead of deleting, update status to CANCELADO
    await prisma.expense.update({
      where: {
        id: rawData.id,
      },
      data: {
        status: "CANCELADO",
        updatedAt: getMexicoGlobalUtcDate(),
      },
    });

    revalidatePath("/sistema/contabilidad/gastos");
    return {
      success: true,
      message: "Gasto cancelado exitosamente!",
    };
  } catch (error) {
    console.error("Error cancelling expense:", error);
    return { success: false, message: "Error al cancelar gasto." };
  }
}

// Create custom expense type
export async function createCustomExpenseTypeAction(
  typeName: string
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await getServerSession(options);
    const user = session?.user;

    if (!user) {
      return { success: false, message: "Usuario no autenticado." };
    }

    // Get user's warehouse
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { warehouseId: true },
    });

    if (!userData?.warehouseId) {
      return {
        success: false,
        message: "Usuario no tiene almacén asignado.",
      };
    }

    // Check if type already exists for this warehouse
    const existing = await prisma.customExpenseType.findUnique({
      where: {
        name_warehouseId: {
          name: typeName.toUpperCase(),
          warehouseId: userData.warehouseId,
        },
      },
    });

    if (existing) {
      return { success: false, message: "Este tipo de gasto ya existe." };
    }

    await prisma.customExpenseType.create({
      data: {
        name: typeName.toUpperCase(),
        warehouseId: userData.warehouseId,
      },
    });

    revalidatePath("/sistema/contabilidad/gastos");
    return { success: true, message: "Tipo de gasto creado exitosamente." };
  } catch (error) {
    console.error("Error creating custom expense type:", error);
    return { success: false, message: "Error al crear tipo de gasto." };
  }
}

// Get custom expense types for current user's warehouse
export async function getCustomExpenseTypesAction(): Promise<string[]> {
  try {
    const session = await getServerSession(options);
    const user = session?.user;

    if (!user) {
      return [];
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { warehouseId: true },
    });

    if (!userData?.warehouseId) {
      return [];
    }

    const customTypes = await prisma.customExpenseType.findMany({
      where: { warehouseId: userData.warehouseId },
      select: { name: true },
      orderBy: { name: "asc" },
    });

    return customTypes.map((type) => type.name);
  } catch (error) {
    console.error("Error fetching custom expense types:", error);
    return [];
  }
}
