import React from "react";
import InventoryHeader from "../_components/SalesHeader";
import { DeliveryList } from "./_components/DeliveryList";
import prisma from "@/lib/db";

export default async function Deliveries() {
  const deliveriesWithProductCount = await prisma.delivery.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-white">
      <InventoryHeader title={"envios"} link={`envios/nuevo`} />
      <DeliveryList deliveries={deliveriesWithProductCount} />
    </div>
  );
}
