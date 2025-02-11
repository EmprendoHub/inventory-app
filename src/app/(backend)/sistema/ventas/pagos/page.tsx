import React from "react";

import { PaymentList } from "./_components/PaymentList";
import prisma from "@/lib/db";
import BusinessHeader from "../../_components/BusinessHeader";

export default async function Payments() {
  const paymentsWithProductCount = await prisma.payment.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <BusinessHeader title={"pagos"} link={`ventas/pagos/nuevo`} btn="Nuevo" />
      <PaymentList payments={paymentsWithProductCount} />
    </div>
  );
}
