import prisma from "@/lib/db";
import React from "react";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import { ExpenseList } from "./_components/ExpenseList";
import { ExpenseType } from "@/types/expenses";
import SalesHeader from "../../ventas/_components/SalesHeader";

export default async function ListTrucks() {
  const session = await getServerSession(options);

  // Get user's warehouse
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { warehouseId: true },
  });

  // Fetch expenses filtered by warehouse and exclude cancelled
  const expenses: ExpenseType[] = await prisma.expense.findMany({
    where: {
      warehouseId: user?.warehouseId || undefined,
      status: {
        not: "CANCELADO",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <SalesHeader
        title={"Gastos"}
        link={`contabilidad/gastos/nuevo`}
        btn="Nuevo"
      />
      <ExpenseList expenses={expenses} />
    </div>
  );
}
