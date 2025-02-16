import prisma from "@/lib/db";
import React from "react";
import BusinessHeader from "../../../_components/BusinessHeader";
import { ItemsGroupList } from "../_components/ItemGroupList";

export default async function ItemsGroups() {
  // Fetch all items
  const itemGroups = await prisma.itemGroup.findMany({
    orderBy: {
      createdAt: "desc", // Latest product
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <BusinessHeader
        title={"Artículos Agrupados"}
        link={`negocio/articulos/conjuntos/nuevo`}
        btn="Nuevo"
      />
      <ItemsGroupList items={itemGroups} />
    </div>
  );
}
