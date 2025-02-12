import React from "react";
import prisma from "@/lib/db";
import GoodsReceiptForm from "../_componentes/GoodsReceiptForm";
import FormBusinessHeader from "../../../negocio/_components/FormBusinessHeader";

export default async function NewItem() {
  const purchaseOrders = await prisma.purchaseOrder.findMany();
  const items = await prisma.item.findMany();

  return (
    <div>
      {/* Header */}
      <FormBusinessHeader title={"Recibido"} />
      {/* Form */}
      <GoodsReceiptForm purchaseOrders={purchaseOrders} items={items} />
    </div>
  );
}
