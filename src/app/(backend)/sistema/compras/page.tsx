import prisma from "@/lib/db";
import React from "react";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import { PurchaseOrderList } from "./_components/PurchaseOrderList";
import { PurchaseOrderType } from "@/types/purchaseOrders";
import BusinessHeader from "../_components/BusinessHeader";

export default async function ListPurchases() {
  const session = await getServerSession(options);

  // Calculate total stock for each item
  let purchaseOrders: PurchaseOrderType[];
  if (session.user.role === "GERENTE") {
    purchaseOrders = await prisma.purchaseOrder.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });
  } else if (session.user.role === "ADMIN") {
    purchaseOrders = await prisma.purchaseOrder.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });
  } else {
    purchaseOrders = await prisma.purchaseOrder.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
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
