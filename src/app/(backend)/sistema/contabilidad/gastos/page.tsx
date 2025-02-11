import prisma from "@/lib/db";
import React from "react";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import { ExpenseList } from "./_components/ExpenseList";
import { ExpenseType } from "@/types/expenses";
import BusinessHeader from "../../_components/BusinessHeader";

export default async function ListTrucks() {
  const session = await getServerSession(options);

  // Calculate total stock for each item
  let expenses: ExpenseType[];
  if (session.user.role === "GERENTE") {
    expenses = await prisma.expense.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });
  } else if (session.user.role === "ADMIN") {
    expenses = await prisma.expense.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });
  } else {
    expenses = await prisma.expense.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });
  }

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <BusinessHeader
        title={"Gastos"}
        link={`contabilidad/gastos/nuevo`}
        btn="Nuevo"
      />
      <ExpenseList expenses={expenses} />
    </div>
  );
}
