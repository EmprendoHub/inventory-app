"use server";

import { options } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/db";
import {
  AddInventorySchema,
  AdjustmentSchema,
  PaymentSchema,
} from "@/lib/schemas";
import {
  getMexicoGlobalUtcDate,
  getMexicoGlobalUtcSelectedDate,
} from "@/lib/utils";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export const createAdjustment = async (
  state: {
    errors?: Record<string, string[]>;
    success?: boolean;
    message?: string;
  },
  formData: FormData
) => {
  const rawData = {
    articulo: formData.get("articulo"),
    transAmount: parseFloat(formData.get("transAmount") as string),
    sendingWarehouse: formData.get("sendingWarehouse"),
    receivingWarehouse: formData.get("receivingWarehouse"),
    formType: formData.get("formType"),
    notes: formData.get("notes"),
  };
  const createdAt = getMexicoGlobalUtcDate();
  if (rawData.formType === "add") {
    const validatedData = AddInventorySchema.safeParse(rawData);
    if (!validatedData.success) {
      // Format Zod errors into a field-specific error object
      const errors = validatedData.error.flatten().fieldErrors;
      return {
        errors,
        success: false,
        message: "Validation failed. Please check the fields.",
      };
    }
    await prisma.stock.update({
      where: {
        itemId_warehouseId: {
          itemId: validatedData.data.articulo,
          warehouseId: validatedData.data.sendingWarehouse,
        },
      },
      data: {
        quantity: { increment: validatedData.data.transAmount },
        updatedAt: createdAt,
      },
    });
  } else {
    // Validate the data using Zod
    const validatedAdjustData = AdjustmentSchema.safeParse(rawData);
    if (!validatedAdjustData.success) {
      // Format Zod errors into a field-specific error object
      const errors = validatedAdjustData.error.flatten().fieldErrors;
      return {
        errors,
        success: false,
        message: "Validation failed. Please check the fields.",
      };
    }

    await prisma.stock.update({
      where: {
        itemId_warehouseId: {
          itemId: validatedAdjustData.data.articulo,
          warehouseId: validatedAdjustData.data.sendingWarehouse,
        },
      },
      data: {
        quantity: { decrement: validatedAdjustData.data.transAmount },
        updatedAt: createdAt,
      },
    });
    // Check if stock exists in the receiving warehouse
    const existingStock = await prisma.stock.findUnique({
      where: {
        itemId_warehouseId: {
          itemId: validatedAdjustData.data.articulo,
          warehouseId: validatedAdjustData.data.receivingWarehouse,
        },
      },
    });

    // If stock exists, update it; otherwise, create a new stock entry
    if (existingStock) {
      await prisma.stock.update({
        where: {
          itemId_warehouseId: {
            itemId: validatedAdjustData.data.articulo,
            warehouseId: validatedAdjustData.data.receivingWarehouse,
          },
        },
        data: {
          quantity: { increment: validatedAdjustData.data.transAmount },
          updatedAt: createdAt,
        },
      });
    } else {
      await prisma.stock.create({
        data: {
          itemId: validatedAdjustData.data.articulo,
          warehouseId: validatedAdjustData.data.receivingWarehouse,
          quantity: validatedAdjustData.data.transAmount, // Set initial stock amount
          createdAt,
          updatedAt: createdAt,
        },
      });
    }
  }

  return { success: true, message: "Ajuste de inventario exitoso!" };
};

export async function processPayment(
  state: {
    errors: { [key: string]: string[] };
    success: boolean;
    message: string;
  },
  formData: FormData
) {
  "use server";
  const createdAt = getMexicoGlobalUtcDate();
  const amount = Number(formData.get("amount"));
  const method = formData.get("method") as string;
  const reference = formData.get("reference") as string;

  // Validate inputs
  const errors: { [key: string]: string[] } = {};

  if (!amount || amount <= 0) {
    errors.amount = ["Amount must be greater than zero"];
  }

  if (!method) {
    errors.method = ["Payment method is required"];
  }

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      success: false,
      message: "Por favor corrija los errores antes de enviar.",
    };
  }

  try {
    await prisma.payment.create({
      data: {
        amount: Math.round(amount * 100), // convert to cents
        method,
        orderNo: "",
        invoiceId: "",
        reference: reference || undefined,
        status: "PAGADO",
        order: {
          connect: { id: formData.get("orderId") as string },
        },
        createdAt,
        updatedAt: createdAt,
      },
    });

    revalidatePath("/sistema/ventas/pedidos/nuevo");
    revalidatePath("/sistema/ventas/pedidos");
    revalidatePath("/sistema/ventas/pagos");

    return {
      errors: {},
      success: true,
      message: "Payment processed successfully!",
    };
  } catch (error) {
    console.error("Error processing payment:", error);
    return {
      errors: {},
      success: false,
      message: "Failed to process payment",
    };
  }
}

export async function updatePaymentAction(formData: FormData) {
  // Extract and validate form data
  const rawData = {
    id: formData.get("id"),
    amount: formData.get("amount"),
    reference: formData.get("reference"),
    method: formData.get("method"),
    createdAt: formData.get("createdAt"),
  };

  // Validate the data using Zod
  const validatedData = PaymentSchema.safeParse(rawData);
  if (!validatedData.success) {
    return {
      errors: validatedData.error.flatten().fieldErrors,
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  const session = await getServerSession(options);
  const user = session?.user;
  const { id, amount, reference, method } = validatedData.data;
  const paymentAmount = Number(amount);

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: id as string },
      include: {
        order: true,
      },
    });

    if (!payment) {
      return {
        errors: {},
        success: false,
        message: "Payment not found",
      };
    }

    const createdAt = getMexicoGlobalUtcSelectedDate(
      rawData.createdAt as string
    );
    await prisma.$transaction(async (prisma) => {
      // Create new payment
      await prisma.payment.update({
        where: { id },
        data: {
          amount: Math.round(paymentAmount),
          method: method,
          reference,
          status: "PAGADO",
          createdAt,
          updatedAt: createdAt,
        },
      });
    });

    if (payment.method === "EFECTIVO") {
      const updatedRegister = await prisma.cashRegister.update({
        where: { userId: user.id || "" },
        data: {
          balance: {
            increment: Math.round(paymentAmount), // deducts cash withdraw to the current balance
          },
          updatedAt: createdAt,
        },
      });
      await prisma.cashTransaction.update({
        where: { id: updatedRegister.id },
        data: {
          type: "DEPOSITO",
          amount: Math.round(paymentAmount),
          userId: user.id,
          createdAt,
          updatedAt: createdAt,
        },
      });
    }

    if (payment.method === "TRANSFERENCIA") {
      const account = await prisma.account.findFirst({
        where: {
          parentAccount: null,
        },
      });
      await prisma.transaction.update({
        where: { id: account?.id },
        data: {
          date: createdAt,
          amount: Math.round(paymentAmount),
          createdAt,
          updatedAt: createdAt,
        },
      });
      await prisma.account.update({
        where: {
          id: account?.id,
        },
        data: {
          balance: { increment: Math.round(paymentAmount) },
          updatedAt: createdAt,
        },
      });
    }

    revalidatePath("/sistema/cajas");
    revalidatePath("/sistema/cajas/personal");
    revalidatePath(`/sistema/ventas/pedidos/ver/${payment.order.id}`);
    revalidatePath("/sistema/ventas/pedidos");
    revalidatePath("/sistema/ventas/envios");
    revalidatePath("/sistema/ventas/pagos");
    revalidatePath("/sistema/contabilidad/transacciones");
    revalidatePath("/sistema/contabilidad/cuentas");

    return {
      errors: {},
      success: true,
      message: `Pago de $${paymentAmount} aceptado.`,
    };
  } catch (error) {
    return {
      errors: {},
      success: false,
      message: `Failed to process payment ${error}`,
    };
  }
}
