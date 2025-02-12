import prisma from "@/lib/db";
import React from "react";
import { ProductList } from "./_components/ItemList";
import BusinessHeader from "../../_components/BusinessHeader";

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
        barcode: item.barcode || "", // Ensure barcode is a string
        dimensions: item.dimensions || "", // Ensure dimensions is a string
        notes: item.notes || "", // Ensure notes is a string
        stocks: itemStocks,
        totalStock, // Add total stock for the item
      };
    });

    return itemsWithTotalStock;
  };

  // Calculate total stock for each item
  const itemsWithTotalStock = await getItemsWithTotalStock();

  return (
    <div className="flex flex-col items-start justify-start bg-backgroundTwo p-4 rounded-md">
      <BusinessHeader
        title={"Artículos"}
        link={`negocio/articulos/nuevo`}
        btn="Nuevo"
      />
      <ProductList items={itemsWithTotalStock} />
    </div>
  );
}
