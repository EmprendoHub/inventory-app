import React from "react";
import { ClientList } from "./_components/ClientList";
import prisma from "@/lib/db";
import BusinessHeader from "../../_components/BusinessHeader";

export default async function Clients() {
  const clientsWithProductCount = await prisma.client.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <BusinessHeader
        title={"clientes"}
        link={`ventas/clientes/crear`}
        btn="Nuevo"
      />
      <ClientList clients={clientsWithProductCount} />
    </div>
  );
}
