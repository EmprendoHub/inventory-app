import prisma from "@/lib/db";
import React from "react";
import { SupplierList } from "./_components/SupplierList";
import BusinessHeader from "../../_components/BusinessHeader";

export default async function Suppliers() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <BusinessHeader
        title={"proveedores"}
        link={`negocio/proveedores/nuevo`}
        btn="Nuevo"
      />
      <SupplierList suppliers={suppliers} />
    </div>
  );
}
