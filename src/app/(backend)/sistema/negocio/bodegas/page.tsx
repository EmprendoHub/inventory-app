import prisma from "@/lib/db";
import React from "react";
import { WarehouseList } from "./_components/WarehouseList";
import BusinessHeader from "../../_components/BusinessHeader";

export default async function Warehouse() {
  const warehousesWithProductCount = await prisma.warehouse.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <BusinessHeader
        title={"bodegas"}
        link={`negocio/bodegas/nueva`}
        btn="Nueva"
      />
      <WarehouseList warehouses={warehousesWithProductCount} />
    </div>
  );
}
