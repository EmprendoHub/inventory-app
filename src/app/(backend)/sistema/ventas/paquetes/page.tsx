import React from "react";
import InventoryHeader from "../_components/SalesHeader";
import { PackagesList } from "./_components/PackagesList";
import prisma from "@/lib/db";

export default async function Packages() {
  const packagesWithProductCount = await prisma.package.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-white">
      <InventoryHeader title={"paquetes"} link={`paquetes/nuevo`} />
      <PackagesList packages={packagesWithProductCount} />
    </div>
  );
}
