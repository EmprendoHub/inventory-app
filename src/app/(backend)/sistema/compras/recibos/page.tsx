import prisma from "@/lib/db";
import React from "react";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import PurchaseHeader from "../../_components/PurchaseHeader";
import { GoodsReceiptList } from "./_componentes/GoodsReceiptList";
import { GoodsReceiptType } from "@/types/goodsReceipts";

export default async function ListReceived() {
  const session = await getServerSession(options);

  // Calculate total stock for each item
  let goodsReceipts: GoodsReceiptType[];
  if (session.user.role === "GERENTE") {
    goodsReceipts = await prisma.goodsReceipt.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });
  } else if (session.user.role === "ADMIN") {
    goodsReceipts = await prisma.goodsReceipt.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });
  } else {
    goodsReceipts = await prisma.goodsReceipt.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });
  }

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <PurchaseHeader title={"Recibidos"} link={`recibos/nuevo`} />
      <GoodsReceiptList goodsReceipts={goodsReceipts} />
    </div>
  );
}
