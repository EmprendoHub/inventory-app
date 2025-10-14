import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = params.id;
    const url = new URL(request.url);
    const currentWarehouseId = url.searchParams.get("currentWarehouse");

    const stocks = await prisma.stock.findMany({
      where: {
        itemId: itemId,
      },
      include: {
        warehouse: {
          select: {
            id: true,
            title: true,
            code: true,
            type: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Separate current warehouse stock vs other warehouses
    let currentWarehouseStock = 0;
    const otherWarehouses: Array<{
      id: string;
      name: string;
      code: string;
      stock: number;
    }> = [];

    stocks.forEach((stock) => {
      if (stock.warehouse.status !== "ACTIVE") return;

      if (currentWarehouseId && stock.warehouseId === currentWarehouseId) {
        currentWarehouseStock += stock.quantity;
      } else if (
        !currentWarehouseId ||
        stock.warehouseId !== currentWarehouseId
      ) {
        // If no current warehouse specified, include all warehouses in "other"
        // If current warehouse specified, exclude it from "other"
        otherWarehouses.push({
          id: stock.warehouse.id,
          name: stock.warehouse.title,
          code: stock.warehouse.code,
          stock: stock.quantity,
        });
      }
    });

    return NextResponse.json({
      itemId,
      currentWarehouseStock,
      otherWarehouses: otherWarehouses.filter((w) => w.stock > 0),
      allStocks: stocks, // Keep original format for backward compatibility
    });
  } catch (error) {
    console.error("Error fetching stock data:", error);
    return NextResponse.json(
      { error: "Error fetching stock data" },
      { status: 500 }
    );
  }
}
