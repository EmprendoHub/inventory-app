import React from "react";
import prisma from "@/lib/db";
import BusinessHeader from "../../_components/BusinessHeader";
import { CashAuditList } from "../_components/CashAuditList";

export default async function CashAuditPage() {
  const audits = await prisma.cashAudit.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <BusinessHeader
        title={"Cortes"}
        link={`cajas/auditoria/nueva`}
        btn="Nuevo"
      />
      <CashAuditList audits={audits} />
    </div>
  );
}
