import React from "react";
import prisma from "@/lib/db";
import PurchaseOrderForm from "../_components/PurchaseOrderForm";
import FormHeader from "../../inventario/_components/FormHeader";

export default async function NewItem() {
  const suppliers = await prisma.supplier.findMany();
  const items = await prisma.item.findMany();
  const orders = await prisma.order.findMany();

  return (
    <div>
      {/* Header */}
      <FormHeader title={"Orden de Compra"} />
      {/* Form */}
      <PurchaseOrderForm suppliers={suppliers} items={items} />
    </div>
  );
}
