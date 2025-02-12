import React from "react";
import FormBusinessHeader from "../../../_components/FormBusinessHeader";
import prisma from "@/lib/db";
import Link from "next/link";
import SupplierEdit from "../../_components/SupplierEdit";

export default async function EditSupplier({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;

  if (id.length !== 24) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró el proveedor.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/negocio/proveedores"}
        >
          Ver proveedores
        </Link>
      </div>
    );
  }

  const supplier = await prisma.supplier.findUnique({
    where: {
      id: id,
    },
  });

  if (!supplier) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró la proveedor.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/negocio/proveedores"}
        >
          Ver proveedores
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <FormBusinessHeader title={"Editar proveedor"} />
      {/* Form */}
      <SupplierEdit supplier={supplier} />
    </div>
  );
}
