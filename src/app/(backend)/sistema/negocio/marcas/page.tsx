import prisma from "@/lib/db";
import React from "react";
import { BrandList } from "./_components/BrandList";
import BusinessHeader from "../../_components/BusinessHeader";

export default async function Brands() {
  const brands = await prisma.brand.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <BusinessHeader
        title={"marcas"}
        link={`negocio/marcas/nueva`}
        btn="Nueva"
      />

      <BrandList brands={brands} />
    </div>
  );
}
