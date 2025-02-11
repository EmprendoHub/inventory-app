import prisma from "@/lib/db";
import React from "react";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import { TruckList } from "../../contabilidad/_components/TruckList";
import { TruckType } from "@/types/truck";
import BusinessHeader from "../../_components/BusinessHeader";

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
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <BusinessHeader
        title={"Vehículos"}
        link={`negocio/vehiculos/nuevo`}
        btn="Nuevo"
      />
      <TruckList trucks={trucks} />
    </div>
  );
}
