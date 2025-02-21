import React from "react";

import { PaymentList } from "./_components/PaymentList";
import prisma from "@/lib/db";
import SuperHeader from "../../_components/SuperHeader";

export default async function Payments() {
  const payments = await prisma.payment.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md ">
      <SuperHeader title={"pagos"} link={`ventas/pagos/nuevo`} btn="Nuevo" />
      <PaymentList payments={payments} />
    </div>
  );
}
