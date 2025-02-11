import prisma from "@/lib/db";
import React from "react";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import { TransactionList } from "./_components/TransactionList";
import { TransactionType } from "@/types/transactions";
import BusinessHeader from "../../_components/BusinessHeader";

export default async function ListTransactions() {
  const session = await getServerSession(options);

  // Calculate total stock for each item
  let transactions: TransactionType[];
  if (session.user.role === "GERENTE") {
    transactions = await prisma.transaction.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });
  } else if (session.user.role === "ADMIN") {
    transactions = await prisma.transaction.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });
  } else {
    transactions = await prisma.transaction.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });
  }

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4  rounded-md">
      <BusinessHeader
        title={"Transacciones"}
        link={`contabilidad/transacciones/nueva`}
        btn="Nueva"
      />
      <TransactionList transactions={transactions} />
    </div>
  );
}
