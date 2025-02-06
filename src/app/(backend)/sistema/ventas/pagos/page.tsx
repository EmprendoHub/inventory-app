import React from "react";
import InventoryHeader from "../_components/SalesHeader";
import { PaymentList } from "./_components/PaymentList";
import prisma from "@/lib/db";

export default async function Payments() {
  const paymentsWithProductCount = await prisma.payment.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-white">
      <InventoryHeader title={"pagos"} link={`pagos/nuevo`} />
      <PaymentList payments={paymentsWithProductCount} />
    </div>
  );
}
