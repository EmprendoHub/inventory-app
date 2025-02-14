import React from "react";
import prisma from "@/lib/db";
import BusinessHeader from "../_components/BusinessHeader";
import { CashRegisterList } from "./_components/CashRegisterList";

export default async function CashRegisterPage() {
  const registers = await prisma.cashRegister.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <BusinessHeader title={"Cajas"} link={`cajas/nueva`} btn="Nueva" />
      <CashRegisterList registers={registers} />
    </div>
  );
}
