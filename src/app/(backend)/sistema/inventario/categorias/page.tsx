import prisma from "@/lib/db";
import React from "react";
import { CategoryList } from "./_components/CategoryList";
import InventoryHeader from "../_components/InventoryHeader";

export default async function Categories() {
  const categories = await prisma.category.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <InventoryHeader title={"categorías"} link={`categorias/nueva`} />

      <CategoryList categories={categories} />
    </div>
  );
}
