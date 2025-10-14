import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/warehouses - Get all warehouses
export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      select: {
        id: true,
        title: true,
        code: true,
        type: true,
        status: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: warehouses,
    });
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error fetching warehouses",
        data: [],
      },
      { status: 500 }
    );
  }
}
