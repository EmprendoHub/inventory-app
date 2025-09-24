import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = params.id;

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

    return NextResponse.json(stocks);
  } catch (error) {
    console.error("Error fetching stock data:", error);
    return NextResponse.json(
      { error: "Error fetching stock data" },
      { status: 500 }
    );
  }
}
