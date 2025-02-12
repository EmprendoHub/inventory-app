import React from "react";
import prisma from "@/lib/db";
import PurchaseOrderForm from "../_components/PurchaseOrderForm";
import FormBusinessHeader from "../../negocio/_components/FormBusinessHeader";

export default async function NewItem() {
  const suppliers = await prisma.supplier.findMany();
  const items = await prisma.item.findMany();

  return (
    <div>
      {/* Header */}
      <FormBusinessHeader title={"Orden de Compra"} />
      {/* Form */}
      <PurchaseOrderForm suppliers={suppliers} items={items} />
    </div>
  );
}
