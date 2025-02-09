import prisma from "@/lib/db";
import React from "react";
import { WarehouseList } from "./_components/WarehouseList";
import InventoryHeader from "../_components/InventoryHeader";

export default async function Warehouse() {
  const warehousesWithProductCount = await prisma.warehouse.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <InventoryHeader title={"bodegas"} link={`bodegas/nueva`} />
      <WarehouseList warehouses={warehousesWithProductCount} />
    </div>
  );
}
