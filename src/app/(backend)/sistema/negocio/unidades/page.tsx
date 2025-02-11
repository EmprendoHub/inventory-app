import prisma from "@/lib/db";
import React from "react";
import { UnitList } from "./_components/UnitList";
import BusinessHeader from "../../_components/BusinessHeader";

export default async function Units() {
  const units = await prisma.unit.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <BusinessHeader
        title={"unidades"}
        link={`negocio/unidades/nueva`}
        btn="Nueva"
      />
      <UnitList units={units} />
    </div>
  );
}
