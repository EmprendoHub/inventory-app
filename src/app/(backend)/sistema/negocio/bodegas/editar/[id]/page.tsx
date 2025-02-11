import React from "react";
import FormHeader from "../../../_components/FormHeader";
import prisma from "@/lib/db";
import Link from "next/link";
import WarehouseEdit from "../../_components/WarehouseEdit";

export default async function EditWarehouse({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;

  if (id.length !== 24) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró el bodega.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/negocio/categorias"}
        >
          Ver bodegas
        </Link>
      </div>
    );
  }

  const warehouse = await prisma.warehouse.findUnique({
    where: {
      id: id,
    },
  });

  if (!warehouse) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró la bodega.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/negocio/categorias"}
        >
          Ver bodegas
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <FormHeader title={"Editar bodega"} />
      {/* Form */}
      <WarehouseEdit warehouse={warehouse} />
    </div>
  );
}
