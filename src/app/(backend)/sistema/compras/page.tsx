import prisma from "@/lib/db";
import React from "react";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import { PurchaseOrderList } from "./_components/PurchaseOrderList";
import BusinessHeader from "../_components/BusinessHeader";

export default async function ListPurchases() {
  const session = await getServerSession(options);

  // Fetch purchase orders with supplier information
  let purchaseOrders;
  if (session.user.role === "GERENTE" || session.user.role === "ADMIN") {
    purchaseOrders = await prisma.purchaseOrder.findMany({
      orderBy: {
        createdAt: "desc", // Latest purchase order first
      },
      include: {
        supplier: true, // Include the supplier details
      },
    });
  } else {
    purchaseOrders = await prisma.purchaseOrder.findMany({
      orderBy: {
        createdAt: "desc", // Latest purchase order first
      },
      include: {
        supplier: true, // Include the supplier details
      },
    });
  }

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <BusinessHeader
        title={"Ordenes de Compra"}
        link={`compras/nueva`}
        btn="Nueva"
      />
      <PurchaseOrderList purchaseOrders={purchaseOrders} />
    </div>
  );
}
