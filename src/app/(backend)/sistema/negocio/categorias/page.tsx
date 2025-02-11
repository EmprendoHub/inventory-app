import prisma from "@/lib/db";
import React from "react";
import { CategoryList } from "./_components/CategoryList";
import BusinessHeader from "../../_components/BusinessHeader";

export default async function Categories() {
  const categories = await prisma.category.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <BusinessHeader
        title={"categorías"}
        link={`negocio/categorias/nueva`}
        btn="Nueva"
      />

      <CategoryList categories={categories} />
    </div>
  );
}
