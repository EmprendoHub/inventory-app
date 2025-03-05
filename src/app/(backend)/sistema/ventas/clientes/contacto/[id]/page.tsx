import React from "react";
import Link from "next/link";
import prisma from "@/lib/db";
import FormSalesHeader from "../../../_components/FormSalesHeader";
import ContactClient from "../../_components/ContactClient";

export default async function ContactClientPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;

  if (id.length !== 24) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró el cliente.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/ventas/clientes"}
        >
          Ver Clientes
        </Link>
      </div>
    );
  }

  const client = await prisma.client.findUnique({
    where: {
      id: id,
    },
    include: {},
  });

  if (!client) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró el cliente.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/ventas/pedidos"}
        >
          Ver clientes
        </Link>
      </div>
    );
  }

  const whatsAppMessages = await prisma.whatsAppMessage.findMany({
    where: {
      phone: client.phone,
    },
  });
  const orders = await prisma.order.findMany({
    where: {
      clientId: client.id,
      NOT: { status: "CANCELADO" },
    },
    include: {
      payments: { where: { NOT: { status: "CANCELADO" } } },
    },
    orderBy: {
      createdAt: "desc", // Sort by createdAt in descending order (most recent first)
    },
    take: 3, // Limit the results to 4 orders
  });

  return (
    <div>
      {/* Header */}
      <FormSalesHeader title={"Contactar Cliente"} />
      {/* Form */}
      <ContactClient
        client={client}
        whatsAppMessages={whatsAppMessages}
        orders={orders}
      />
    </div>
  );
}
