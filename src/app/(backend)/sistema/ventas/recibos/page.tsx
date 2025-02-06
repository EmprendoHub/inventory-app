import React from "react";
import InventoryHeader from "../_components/SalesHeader";
import prisma from "@/lib/db";
import { ReceiptList } from "./_components/ReceiptList";

export default async function Receipts() {
  const receiptsWithProductCount = await prisma.receipt.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-white">
      <InventoryHeader title={"recibos"} link={`recibos/nuevo`} />
      <ReceiptList receipts={receiptsWithProductCount} />
    </div>
  );
}
