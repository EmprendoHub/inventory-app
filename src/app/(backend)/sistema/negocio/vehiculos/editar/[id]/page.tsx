import React from "react";
import FormHeader from "@/app/(backend)/sistema/inventario/_components/FormHeader";
import prisma from "@/lib/db";
import Link from "next/link";
import TruckEdit from "../../_components/TruckEdit";

export default async function EditTruck({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;

  if (id.length !== 24) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró el articulo.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/ventas/clientes"}
        >
          Ver artículos
        </Link>
      </div>
    );
  }

  const truck = await prisma.truck.findUnique({
    where: {
      id: id,
    },
  });

  if (!truck) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró el articulo.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/ventas/pedidos"}
        >
          Ver artículos
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <FormHeader title={"Editar Articulo"} />
      {/* Form */}
      <TruckEdit truck={truck} />
    </div>
  );
}
