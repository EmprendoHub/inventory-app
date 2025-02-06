import prisma from "@/lib/db";
import React from "react";
import { SupplierList } from "./_components/SupplierList";
import InventoryHeader from "../_components/InventoryHeader";

export default async function Suppliers() {
  const categoriesWithProductCount = await prisma.supplier.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      item: {
        select: {
          id: true, // We only need the product ID
        },
      },
    },
  });

  // Count the number of products per category
  const categoriesWithCounts = categoriesWithProductCount.map((supplier) => ({
    ...supplier,
    productCount: supplier.item.length, // Number of products in this category
  }));

  return (
    <div className="flex flex-col items-start justify-start bg-white">
      <InventoryHeader title={"proveedores"} link={`proveedores/nuevo`} />
      <SupplierList suppliers={categoriesWithCounts} />
    </div>
  );
}
