import React from "react";

import { OrderList } from "./_components/OrderList";
import prisma from "@/lib/db";
import BusinessHeader from "../../_components/BusinessHeader";

export default async function SalesOrders() {
  const ordersWithItems = await prisma.order.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      delivery: {
        where: {
          status: {
            in: ["CANCELADO", "PAGADO", "PENDIENTE", "ENTREGADO", "PROCESANDO"],
          },
        },
      },
      orderItems: true, // Includes all related order items
      payments: {
        where: {
          status: "PAGADO",
        },
      },
      client: true,
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <BusinessHeader title={"Pedidos"} link={`pos/register`} btn="Nuevo" />
      <OrderList orders={ordersWithItems} />
    </div>
  );
}
