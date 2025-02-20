import React from "react";
import prisma from "@/lib/db";
import OrderView from "../_components/OrderView";
import Link from "next/link";
import FormSalesHeader from "../../_components/FormSalesHeader";

export default async function ViewOrder({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;

  if (id.length !== 24) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró el pedido.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/ventas/pedidos"}
        >
          Ver Pedidos
        </Link>
      </div>
    );
  }

  const order = await prisma.order.findUnique({
    where: {
      id: id,
    },
    include: {
      delivery: true,
      orderItems: true, // Includes all related order items
      payments: {
        where: {
          status: "PAGADO",
        },
      }, // Includes all related order payments
      client: true, // Includes related order client
    },
  });

  if (!order) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró el pedido.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/ventas/pedidos"}
        >
          Ver Pedidos
        </Link>
      </div>
    );
  }

  console.log(order);

  // Function to fetch item details
  const fetchItemDetails = async (itemId: string) => {
    return await prisma.item.findUnique({
      where: {
        id: itemId,
      },
    });
  };

  // Function to process order items
  const processOrderItems = async (orderItems: any) => {
    const processedItems = [];

    for (const item of orderItems) {
      if (item.isGroup) {
        // Fetch the group details
        const group = await prisma.itemGroup.findUnique({
          where: {
            id: item.itemId,
          },
          include: {
            items: {
              include: {
                item: true, // Include the item details
              },
            },
          },
        });

        if (group) {
          // Generate a description for the group
          const groupDescription = group.items
            .map(
              (groupItem) => `${groupItem.item.name} (x${groupItem.quantity})`
            )
            .join(", ");

          // Modify the orderItem to include the group description
          processedItems.push({
            ...item,
            description: groupDescription, // Add the generated description
          });
        }
      } else {
        // For non-group items, just add them as-is
        const itemDetails = await fetchItemDetails(item.itemId);
        processedItems.push({
          ...item,
          description: itemDetails?.name || "Item no encontrado",
        });
      }
    }

    return processedItems;
  };

  // Process the order items
  const processedOrderItems = await processOrderItems(order.orderItems);
  // console.log("Processed Order Items:", processedOrderItems);

  return (
    <div>
      {/* Header */}
      <FormSalesHeader title={"Ver Pedido"} />
      {/* Form */}
      <OrderView order={{ ...order, orderItems: processedOrderItems }} />
    </div>
  );
}
