import React from "react";
import OrderForm from "../_components/OrderForm";
import prisma from "@/lib/db";
import FormSalesHeader from "../../_components/FormSalesHeader";
import { ItemType, ProcessedItemGroup } from "@/types/items";

export default async function NewOrder() {
  // Fetch clients
  const clients = await prisma.client.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch items and include their associated itemGroups
  const items = await prisma.item.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch all itemGroups
  const rawItemGroups = await prisma.itemGroup.findMany({
    include: {
      items: true, // Include the items associated with each itemGroup
    },
  });

  // Create a Map of items for efficient lookup
  const itemsMap = new Map(items.map((item) => [item.id, item]));

  // Process each itemGroup to include its corresponding items
  const itemGroups: ProcessedItemGroup[] = rawItemGroups.map((group) => {
    // Get all items in the group, filtering out undefined values
    const groupItems = (group.items || [])
      .map((item) => itemsMap.get(item.id))
      .filter((item): item is ItemType => item !== undefined);

    return {
      ...group,
      items: groupItems, // Attach the processed items to the group
    };
  });

  return (
    <div>
      <FormSalesHeader title={"Nuevo Pedido"} />
      <OrderForm clients={clients} items={items} itemGroups={itemGroups} />
    </div>
  );
}
