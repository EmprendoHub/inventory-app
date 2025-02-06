import prisma from "@/lib/db";
import React from "react";
import InventoryHeader from "../_components/InventoryHeader";
import { ProductList } from "./_components/ProductList";

export default async function ItemsGroups() {
  const getItemsWithTotalStock = async () => {
    // Fetch all items
    const items = await prisma.item.findMany({
      orderBy: {
        createdAt: "desc", // Latest product
      },
    });

    // Fetch all stocks
    const stocks = await prisma.stock.findMany({
      orderBy: {
        createdAt: "desc", // Latest stock entries
      },
    });

    // Combine items with their corresponding stocks and calculate total stock
    const itemsWithTotalStock = items.map((item) => {
      const itemStocks = stocks.filter((stock) => stock.itemId === item.id);
      const totalStock = itemStocks.reduce(
        (sum, stock) => sum + stock.quantity,
        0
      );

      return {
        ...item,
        stocks: itemStocks,
        totalStock, // Add total stock for the item
      };
    });

    return itemsWithTotalStock;
  };

  // Calculate total stock for each item
  const itemsWithTotalStock = await getItemsWithTotalStock();

  console.log(itemsWithTotalStock);

  return (
    <div className="flex flex-col items-start justify-start bg-white">
      <InventoryHeader title={"articulos"} link={`articulos/nuevo`} />
      <ProductList items={itemsWithTotalStock} />;
    </div>
  );
}
