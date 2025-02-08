import prisma from "@/lib/db";
import React from "react";
import { UnitList } from "./_components/UnitList";
import InventoryHeader from "../_components/InventoryHeader";

export default async function Units() {
  const units = await prisma.unit.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-white">
      <InventoryHeader title={"unidades"} link={`unidades/nueva`} />
      <UnitList units={units} />
    </div>
  );
}
