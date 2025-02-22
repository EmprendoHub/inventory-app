import React from "react";
import CashAuditForm from "../../_components/CashAuditForm";
import prisma from "@/lib/db";

export default async function NewAuditPage() {
  const cashRegisters = await prisma.cashRegister.findMany({});
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Corte Nuevo</h1>
      <CashAuditForm cashRegisters={cashRegisters} />
    </div>
  );
}
