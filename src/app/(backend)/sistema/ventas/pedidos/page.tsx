import React from "react";
import InventoryHeader from "../_components/SalesHeader";
import { OrderList } from "./_components/OrderList";
import prisma from "@/lib/db";

export default async function SalesOrders() {
  const ordersWithItems = await prisma.order.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      orderItems: true, // Includes all related order items
      payments: true,
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-white">
      <InventoryHeader title={"Pedidos"} link={`pedidos/nuevo`} />
      <OrderList orders={ordersWithItems} />
    </div>
  );
}
