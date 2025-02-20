import React from "react";
import prisma from "@/lib/db";
import { CashAuditList } from "../_components/CashAuditList";
import SalesHeader from "../../ventas/_components/SalesHeader";

export default async function CashAuditPage() {
  const audits = await prisma.cashAudit.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <SalesHeader
        title={"Cortes"}
        link={`cajas/auditoria/nueva`}
        btn="Nuevo"
      />
      <CashAuditList audits={audits} />
    </div>
  );
}
