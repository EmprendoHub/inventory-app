import React from "react";
import DeliveryForm from "../_components/DeliveryForm";
import prisma from "@/lib/db";
import FormSalesHeader from "../../_components/FormSalesHeader";

export default async function NewDelivery() {
  const orders = await prisma.order.findMany({
    include: {
      client: true, // Include the related client data
    },
  });
  const drivers = await prisma.user.findMany({ where: { role: "CHOFER" } });
  const trucks = await prisma.truck.findMany();

  return (
    <div>
      {/* Header */}
      <FormSalesHeader title={"Nuevo Envió"} />
      {/* Form */}
      <DeliveryForm orders={orders} drivers={drivers} trucks={trucks} />
    </div>
  );
}
