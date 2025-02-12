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
      orderItems: true, // Includes all related order items
      payments: {
        where: {
          status: "PAGADO",
        },
      },
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <BusinessHeader
        title={"Pedidos"}
        link={`ventas/pedidos/nuevo`}
        btn="Nuevo"
      />
      <OrderList orders={ordersWithItems} />
    </div>
  );
}
