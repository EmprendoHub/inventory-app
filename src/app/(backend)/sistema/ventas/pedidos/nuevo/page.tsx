import React from "react";
import OrderForm from "../_components/OrderForm";
import prisma from "@/lib/db";

export default async function NewLayaway() {
  const clients = await prisma.client.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
  const items = await prisma.item.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return <OrderForm clients={clients} items={items} />;
}
