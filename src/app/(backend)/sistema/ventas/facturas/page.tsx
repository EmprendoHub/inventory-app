import React from "react";
import InventoryHeader from "../_components/SalesHeader";
import { InvoiceList } from "./_components/InvoiceList";
import prisma from "@/lib/db";

export default async function Invoices() {
  const invoicesWithProductCount = await prisma.invoice.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <InventoryHeader title={"facturas"} link={`facturas/nueva`} />
      <InvoiceList invoices={invoicesWithProductCount} />
    </div>
  );
}
