import React from "react";
import FormHeader from "../../../_components/FormHeader";
import prisma from "@/lib/db";
import Link from "next/link";
import UnitEdit from "../../_components/UnitEdit";

export default async function EditUnit({ params }: { params: { id: string } }) {
  const id = params.id;

  if (id.length !== 24) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró el unidad.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/negocio/categorias"}
        >
          Ver unidades
        </Link>
      </div>
    );
  }

  const unit = await prisma.unit.findUnique({
    where: {
      id: id,
    },
  });

  if (!unit) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró la unidad.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/negocio/unidades"}
        >
          Ver unidades
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <FormHeader title={"Editar unidad"} />
      {/* Form */}
      <UnitEdit unit={unit} />
    </div>
  );
}
