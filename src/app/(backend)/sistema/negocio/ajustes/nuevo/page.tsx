import React from "react";
import FormBusinessHeader from "../../_components/FormBusinessHeader";
import AdjustmentForm from "../../_components/AdjustmentForm";
import prisma from "@/lib/db";

export default async function newAdjustment() {
  const warehouses = await prisma.warehouse.findMany();
  const items = await prisma.item.findMany();

  const stockMovements = await prisma.stockMovement.findMany({});

  return (
    <div>
      {/* Header */}
      <FormBusinessHeader title={"Ajuste"} />
      {/* Form */}
      <AdjustmentForm
        items={items}
        warehouses={warehouses}
        stockMovements={stockMovements}
      />
    </div>
  );
}
