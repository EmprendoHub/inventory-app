import prisma from "@/lib/db";
import React from "react";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import { AccountList } from "./_components/AccountList";
import { AccountOneType } from "@/types/accounting";
import BusinessHeader from "../../../_components/BusinessHeader";

export default async function ListAccounts() {
  const session = await getServerSession(options);

  // Calculate total stock for each item
  let accounts: AccountOneType[];
  if (session.user.role === "GERENTE") {
    accounts = await prisma.account.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });
  } else if (session.user.role === "ADMIN") {
    accounts = await prisma.account.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });
  } else {
    accounts = await prisma.account.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });
  }

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <BusinessHeader title={"Cuentas"} link={`contabilidad/cuentas/nueva`} />
      <AccountList accounts={accounts} />
    </div>
  );
}
