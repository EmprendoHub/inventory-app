import prisma from "@/lib/db";
import React from "react";
import { BrandList } from "./_components/BrandList";
import InventoryHeader from "../_components/InventoryHeader";

export default async function Brands() {
  const brandsWithProductCount = await prisma.brand.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      items: {
        select: {
          id: true, // We only need the product ID
        },
      },
    },
  });

  // Count the number of products per category
  const brandsWithCounts = brandsWithProductCount.map((brand) => ({
    ...brand,
    productCount: brand.items.length, // Number of products in this category
  }));

  return (
    <div className="flex flex-col items-start justify-start bg-white">
      <InventoryHeader title={"marcas"} link={`marcas/nueva`} />

      <BrandList brands={brandsWithCounts} />
    </div>
  );
}
