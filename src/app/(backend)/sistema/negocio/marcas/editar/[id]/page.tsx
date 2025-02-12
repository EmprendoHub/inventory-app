import React from "react";
import FormBusinessHeader from "../../../_components/FormBusinessHeader";
import prisma from "@/lib/db";
import Link from "next/link";
import BrandEdit from "../../_components/BrandEdit";

export default async function EditBrand({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;

  if (id.length !== 24) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró el marca.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/negocio/marcas"}
        >
          Ver marcas
        </Link>
      </div>
    );
  }

  const brand = await prisma.brand.findUnique({
    where: {
      id: id,
    },
  });

  if (!brand) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró la marca.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/negocio/marcas"}
        >
          Ver marcas
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <FormBusinessHeader title={"Editar categoría"} />
      {/* Form */}
      <BrandEdit brand={brand} />
    </div>
  );
}
