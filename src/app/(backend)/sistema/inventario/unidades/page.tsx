import prisma from "@/lib/db";
import React from "react";
import { UnitList } from "./_components/UnitList";
import InventoryHeader from "../_components/InventoryHeader";

export default async function Units() {
  const unitsWithProductCount = await prisma.unit.findMany({
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
  const unitsWithCounts = unitsWithProductCount.map((cat) => ({
    ...cat,
    productCount: cat.items.length, // Number of products in this category
  }));

  return (
    <div className="flex flex-col items-start justify-start bg-white">
      <InventoryHeader title={"unidades"} link={`unidades/nueva`} />
      <UnitList units={unitsWithCounts} />
    </div>
  );
}
