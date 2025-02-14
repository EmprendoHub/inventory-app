import React from "react";
import { ClientList } from "./_components/ClientList";
import prisma from "@/lib/db";
import SalesHeader from "../_components/SalesHeader";
import { UserType } from "@/types/users";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";

export default async function Clients() {
  const session = await getServerSession(options);
  const user = session.user as UserType;

  const clientsWithProductCount = await prisma.client.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <SalesHeader
        title={"clientes"}
        link={`clientes/crear`}
        role={user.role}
      />
      <ClientList clients={clientsWithProductCount} />
    </div>
  );
}
