import prisma from "@/lib/db";
import React from "react";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import SalesHeader from "../../ventas/_components/SalesHeader";
import { TruckList } from "./_components/TruckList";
import { TruckType } from "@/types/truck";

export default async function ListTrucks() {
  const session = await getServerSession(options);

  // Calculate total stock for each item
  let trucks: TruckType[];
  if (session.user.role === "GERENTE") {
    trucks = await prisma.truck.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });
  } else if (session.user.role === "ADMIN") {
    trucks = await prisma.truck.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });
  } else {
    trucks = await prisma.truck.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });
  }

  return (
    <div className="flex flex-col items-start justify-start bg-white">
      <SalesHeader title={"Envíos"} link={`envios/nuevo`} />
      <TruckList trucks={trucks} />
    </div>
  );
}
