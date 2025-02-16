import prisma from "@/lib/db";
import React from "react";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import { DeliveryList } from "./_components/DeliveryList";
import SalesHeader from "../_components/SalesHeader";
import { UserType } from "@/types/users";

export default async function ListUsers() {
  const session = await getServerSession(options);
  const user = session.user as UserType;

  // Calculate total stock for each item
  let deliveries;
  if (user.role === "GERENTE") {
    deliveries = await prisma.delivery.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
      include: {
        driver: true,
      },
    });
  } else if (user.role === "ADMIN") {
    deliveries = await prisma.delivery.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
      include: {
        driver: true,
      },
      where: {
        status: {
          in: ["PAGADO", "PENDIENTE"],
        },
      },
    });
  } else if (user.role === "CHOFER") {
    deliveries = await prisma.delivery.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
      include: {
        driver: true,
      },
      where: {
        status: {
          in: ["PROCESANDO", "EN CAMINO", "ENTREGADO"],
        },
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

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <SalesHeader title={"Envíos"} link={`envios/nuevo`} role={user.role} />
      <DeliveryList deliveries={deliveries} />
    </div>
  );
}
