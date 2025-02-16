import React from "react";
import prisma from "@/lib/db";
import Link from "next/link";
import ItemGroupEdit from "../../../_components/ItemGroupEdit";
import FormBusinessHeader from "../../../../_components/FormBusinessHeader";

export default async function EditItem({ params }: { params: { id: string } }) {
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

  const items = await prisma.item.findMany({
    orderBy: {
      createdAt: "desc", // Latest product
    },
  });

  const itemGroup = await prisma.itemGroup.findUnique({
    where: {
      id: id,
    },
    include: {
      items: true, // Ensure items are included
    },
  });

  if (!itemGroup) {
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
      <FormBusinessHeader title={"Editar Articulo"} />
      {/* Form */}
      <ItemGroupEdit items={items} itemGroup={itemGroup} />
    </div>
  );
}
