import React from "react";
import prisma from "@/lib/db";
import Link from "next/link";
import FormBusinessHeader from "@/app/(backend)/sistema/negocio/_components/FormBusinessHeader";
import PurchaseOrderReceived from "../../_components/PurchaseOrderReceived";

export default async function ReceivePurchaseOrder({
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

  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: {
      id: id,
    },
  });

  const purchaseOrderItems = await prisma.purchaseOrderItem.findMany({
    where: {
      purchaseOrderId: purchaseOrder?.id,
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
    <div className="flex flex-col gap-1">
      {/* Header */}
      <FormBusinessHeader
        title={`Recibir Orden de Compra: ${purchaseOrder.poNumber}`}
      />
      {/* Form */}
      <PurchaseOrderReceived
        suppliers={suppliers}
        purchaseOrder={purchaseOrder}
        items={items}
        purchaseOrderItems={purchaseOrderItems}
        formType="Recibir"
      />
    </div>
  );
}
