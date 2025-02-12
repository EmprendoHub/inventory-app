import React from "react";
import Link from "next/link";
import ClientEdit from "../../_components/ClientEdit";
import prisma from "@/lib/db";
import FormSalesHeader from "../../../_components/FormSalesHeader";

export default async function EditClient({
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

  return (
    <div>
      {/* Header */}
      <FormSalesHeader title={"Editar Cliente"} />
      {/* Form */}
      <ClientEdit client={client} />
    </div>
  );
}
