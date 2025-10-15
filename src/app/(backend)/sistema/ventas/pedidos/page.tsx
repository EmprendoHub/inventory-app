import React from "react";

import { OrderList } from "./_components/OrderList";
import prisma from "@/lib/db";
import BusinessHeader from "../../_components/BusinessHeader";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import { UserType } from "@/types/users";

export default async function SalesOrders() {
  const session = await getServerSession(options);
  const user = session?.user as UserType;

  // Build the where clause based on user role and warehouse
  const whereClause: any = {};

  // If user has a specific warehouse, only show orders from that warehouse
  if (
    user?.warehouseId &&
    user.role &&
    !["SUPER_ADMIN", "ADMIN"].includes(user.role)
  ) {
    whereClause.user = {
      warehouseId: user.warehouseId,
    };
  }

  const ordersWithItems = await prisma.order.findMany({
    orderBy: {
      createdAt: "desc",
    },
    where: whereClause,
    include: {
      delivery: {
        where: {
          status: {
            in: ["CANCELADO", "PAGADO", "PENDIENTE", "ENTREGADO", "PROCESANDO"],
          },
        },
      },
      orderItems: true, // Includes all related order items
      payments: {
        where: {
          status: "PAGADO",
        },
      },
      client: true,
      user: {
        include: {
          warehouse: true,
        },
      },
    },
  });

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <BusinessHeader title={"Pedidos"} link={`pos/register`} btn="Nuevo" />
      <OrderList orders={ordersWithItems} />
    </div>
  );
}
