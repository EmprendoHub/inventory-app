import prisma from "@/lib/db";
import React from "react";
import { SupplierList } from "./_components/SupplierList";
import InventoryHeader from "../_components/InventoryHeader";

export default async function Suppliers() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-white">
      <InventoryHeader title={"proveedores"} link={`proveedores/nuevo`} />
      <SupplierList suppliers={suppliers} />
    </div>
  );
}
