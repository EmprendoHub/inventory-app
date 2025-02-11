import React from "react";
import FormHeader from "../../_components/FormHeader";
import AdjustmentForm from "../../_components/AdjustmentForm";
import prisma from "@/lib/db";

export default async function newAdjustment() {
  const warehouses = await prisma.warehouse.findMany();
  const items = await prisma.item.findMany();
  console.log(items);

  return (
    <div>
      {/* Header */}
      <FormHeader title={"Ajuste"} />
      {/* Form */}
      <AdjustmentForm items={items} warehouses={warehouses} />
    </div>
  );
}
