import React from "react";
import { InvoiceList } from "./_components/InvoiceList";
import prisma from "@/lib/db";
import BusinessHeader from "../../_components/BusinessHeader";

export default async function Invoices() {
  const invoicesWithProductCount = await prisma.invoice.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <BusinessHeader
        title={"facturas"}
        link={`negocio/facturas/nueva`}
        btn="Nueva"
      />
      <InvoiceList invoices={invoicesWithProductCount} />
    </div>
  );
}
