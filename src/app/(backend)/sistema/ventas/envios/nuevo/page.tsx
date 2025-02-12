import React from "react";
import FormHeader from "@/app/(backend)/sistema/negocio/_components/FormHeader";
import DeliveryForm from "../_components/DeliveryForm";
import prisma from "@/lib/db";

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
      <FormHeader title={"Nuevo Envió"} />
      {/* Form */}
      <DeliveryForm orders={orders} drivers={drivers} trucks={trucks} />
    </div>
  );
}
