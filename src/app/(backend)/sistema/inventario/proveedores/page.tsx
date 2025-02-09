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
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <InventoryHeader title={"proveedores"} link={`proveedores/nuevo`} />
      <SupplierList suppliers={suppliers} />
    </div>
  );
}
