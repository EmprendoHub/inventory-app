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
    <div className="flex flex-col items-start justify-start bg-white">
      <SalesHeader title={"clientes"} link={`clientes/nuevo`} />
      <ClientList clients={clientsWithProductCount} />
    </div>
  );
}
