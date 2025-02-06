import prisma from "@/lib/db";
import React from "react";
import { CategoryList } from "./_components/CategoryList";
import InventoryHeader from "../_components/InventoryHeader";

export default async function Categories() {
  const categoriesWithProductCount = await prisma.category.findMany({
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
  const categoriesWithCounts = categoriesWithProductCount.map((cat) => ({
    ...cat,
    productCount: cat.items.length, // Number of products in this category
  }));

  return (
    <div className="flex flex-col items-start justify-start bg-white">
      <InventoryHeader title={"categorías"} link={`categorias/nueva`} />

      <CategoryList cats={categoriesWithCounts} />
    </div>
  );
}
