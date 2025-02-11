import React from "react";
import { ClientList } from "./_components/ClientList";
import prisma from "@/lib/db";
import SalesHeader from "../_components/SalesHeader";

export default async function Clients() {
  const clientsWithProductCount = await prisma.client.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <SalesHeader title={"clientes"} link={`clientes/crear`} />
      <ClientList clients={clientsWithProductCount} />
    </div>
  );
}
