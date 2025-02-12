import React from "react";
import FormBusinessHeader from "../../../_components/FormBusinessHeader";
import prisma from "@/lib/db";
import Link from "next/link";
import CategoryEdit from "../../_components/CategoryEdit";

export default async function EditCategory({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;

  if (id.length !== 24) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró el categoría.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/negocio/categorias"}
        >
          Ver categorías
        </Link>
      </div>
    );
  }

  const category = await prisma.category.findUnique({
    where: {
      id: id,
    },
  });

  if (!category) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró la categoría.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/negocio/categorias"}
        >
          Ver categorías
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <FormBusinessHeader title={"Editar categoría"} />
      {/* Form */}
      <CategoryEdit category={category} />
    </div>
  );
}
