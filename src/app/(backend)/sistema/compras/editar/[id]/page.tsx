import React from "react";
import prisma from "@/lib/db";
import Link from "next/link";
import FormHeader from "@/app/(backend)/sistema/inventario/_components/FormHeader";
import PurchaseOrderEdit from "../../_components/PurchaseOrderEdit";

export default async function EditPurchaseOrder({
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

  const suppliers = await prisma.supplier.findMany();
  const items = await prisma.item.findMany();
  const orders = await prisma.order.findMany();

  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: {
      id: id,
    },
  });

  if (!purchaseOrder) {
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
      <FormHeader title={`Editar Orden de Compra: ${purchaseOrder.poNumber}`} />
      {/* Form */}
      <PurchaseOrderEdit
        suppliers={suppliers}
        purchaseOrder={purchaseOrder}
        items={items}
      />
    </div>
  );
}
