import prisma from "@/lib/db";
import React from "react";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import { DeliveryList } from "./_components/DeliveryList";
import { DeliveryType } from "@/types/delivery";
import SalesHeader from "../_components/SalesHeader";

export default async function ListUsers() {
  const session = await getServerSession(options);

  // Calculate total stock for each item
  let deliveries: DeliveryType[];
  if (session.user.role === "GERENTE") {
    deliveries = await prisma.delivery.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });
  } else if (session.user.role === "ADMIN") {
    deliveries = await prisma.delivery.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });
  } else {
    deliveries = await prisma.delivery.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });
  }

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <SalesHeader title={"Envíos"} link={`envios/nuevo`} />
      <DeliveryList deliveries={deliveries} />
    </div>
  );
}
