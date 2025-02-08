import prisma from "@/lib/db";
import React from "react";
import { BrandList } from "./_components/BrandList";
import InventoryHeader from "../_components/InventoryHeader";

export default async function Brands() {
  const brands = await prisma.brand.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-white">
      <InventoryHeader title={"marcas"} link={`marcas/nueva`} />

      <BrandList brands={brands} />
    </div>
  );
}
