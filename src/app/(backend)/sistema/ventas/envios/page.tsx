import prisma from "@/lib/db";
import React from "react";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import { DeliveryList } from "./_components/DeliveryList";
import SalesHeader from "../_components/SalesHeader";
import { DeliveryAndDriverType } from "@/types/delivery";

export default async function ListUsers() {
  const session = await getServerSession(options);

  // Calculate total stock for each item
  let deliveries;
  if (session.user.role === "GERENTE") {
    deliveries = await prisma.delivery.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
      include: {
        driver: true,
      },
    });
  } else if (session.user.role === "ADMIN") {
    deliveries = await prisma.delivery.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
      include: {
        driver: true,
      },
    });
  } else {
    deliveries = await prisma.delivery.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
      include: {
        driver: true,
      },
    });
  }

  // Filter out deliveries with null drivers and cast driver to non-nullable type
  deliveries = deliveries.filter(
    (delivery) => delivery.driver !== null
  ) as DeliveryAndDriverType[];

  console.log(deliveries);

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <SalesHeader title={"Envíos"} link={`envios/nuevo`} />
      <DeliveryList deliveries={deliveries} />
    </div>
  );
}
