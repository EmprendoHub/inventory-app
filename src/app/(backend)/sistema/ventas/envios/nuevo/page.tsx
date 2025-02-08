import React from "react";
import FormHeader from "@/app/(backend)/sistema/inventario/_components/FormHeader";
import DeliveryForm from "../_components/DeliveryForm";
import prisma from "@/lib/db";

export default async function NewDelivery() {
  const orders = await prisma.order.findMany();
  const drivers = await prisma.driver.findMany();
  const trucks = await prisma.truck.findMany();

  return (
    <div>
      {/* Header */}
      <FormHeader title={"Articulo"} />
      {/* Form */}
      <DeliveryForm orders={orders} drivers={drivers} trucks={trucks} />
    </div>
  );
}
