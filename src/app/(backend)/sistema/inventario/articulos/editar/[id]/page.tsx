import React from "react";
import FormHeader from "../../../_components/FormHeader";
import prisma from "@/lib/db";
import Link from "next/link";
import ProductEdit from "../../_components/ItemEdit";

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

  const brands = await prisma.brand.findMany();
  const units = await prisma.unit.findMany();
  const categories = await prisma.category.findMany();
  const warehouses = await prisma.warehouse.findMany();
  const suppliers = await prisma.supplier.findMany();

  const item = await prisma.item.findUnique({
    where: {
      id: id,
    },
  });

  if (!item) {
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
      <ProductEdit
        categories={categories}
        brands={brands}
        units={units}
        warehouses={warehouses}
        suppliers={suppliers}
        item={item}
      />
    </div>
  );
}
