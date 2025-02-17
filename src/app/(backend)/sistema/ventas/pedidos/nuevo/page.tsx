import React from "react";
import OrderForm from "../_components/OrderForm";
import prisma from "@/lib/db";
import FormSalesHeader from "../../_components/FormSalesHeader";
import { ProcessedItemGroup } from "@/types/items";

export default async function NewOrder() {
  const clients = await prisma.client.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const items = await prisma.item.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const rawItemGroups = await prisma.itemGroup.findMany({
    include: {
      items: {
        include: {
          item: true, // Include the actual item details
        },
      },
    },
  });

  // Process each itemGroup to include description
  const itemGroups: ProcessedItemGroup[] = rawItemGroups.map((group) => {
    // Generate description using the same format that works in ViewOrder
    const description = group.items
      .map((groupItem) => {
        const quantity = groupItem.quantity || 1;
        const qtyString = quantity === 1 ? "" : ` x${quantity}`;
        return `${groupItem.item.name}${qtyString}`;
      })
      .join(", ");

    return {
      ...group,
      items: group.items.map((item) => item.item), // Map to actual items
      description,
    };
  });

  return (
    <div>
      <FormSalesHeader title={"Nuevo Pedido"} />
      <OrderForm clients={clients} items={items} itemGroups={itemGroups} />
    </div>
  );
}
