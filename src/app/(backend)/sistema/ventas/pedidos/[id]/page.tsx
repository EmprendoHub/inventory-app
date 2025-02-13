import React from "react";
import prisma from "@/lib/db";
import OrderView from "../_components/OrderView";
import Link from "next/link";
import FormSalesHeader from "../../_components/FormSalesHeader";

export default async function ViewOrder({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;

  if (id.length !== 24) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró el pedido.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/ventas/pedidos"}
        >
          Ver Pedidos
        </Link>
      </div>
    );
  }
  const order = await prisma.order.findUnique({
    where: {
      id: id,
    },
    include: {
      delivery: true,
      orderItems: true, // Includes all related order items
      payments: {
        where: {
          status: "PAGADO",
        },
      }, // Includes all related order payments
      client: true, // Includes related order client
    },
  });

  if (!order) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró el pedido.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/ventas/pedidos"}
        >
          Ver Pedidos
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <FormSalesHeader title={"Ver Pedido"} />
      {/* Form */}
      <OrderView order={order} />;
    </div>
  );
}
