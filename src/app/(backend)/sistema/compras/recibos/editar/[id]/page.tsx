import React from "react";
import prisma from "@/lib/db";
import Link from "next/link";
import GoodsReceiptEdit from "../../_componentes/GoodsReceiptEdit";
import FormBusinessHeader from "@/app/(backend)/sistema/negocio/_components/FormBusinessHeader";

export default async function EditGoods({
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

  const purchaseOrders = await prisma.purchaseOrder.findMany();
  const items = await prisma.item.findMany();

  const goodsReceipt = await prisma.goodsReceipt.findUnique({
    where: {
      id: id,
    },
  });

  if (!goodsReceipt) {
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
      <GoodsReceiptEdit
        purchaseOrders={purchaseOrders}
        goodsReceipt={goodsReceipt}
        items={items}
      />
    </div>
  );
}
