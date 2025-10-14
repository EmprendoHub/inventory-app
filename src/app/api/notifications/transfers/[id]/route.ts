import { NextRequest, NextResponse } from "next/server";
import { updateTransferStatus } from "@/lib/branchNotifications";
import { TransferStatus } from "@prisma/client";
import db from "@/lib/db";

// GET /api/notifications/transfers/[id] - Get specific transfer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transfer = await db.branchStockTransfer.findUnique({
      where: { id: params.id },
      include: {
        notification: {
          include: {
            fromWarehouse: true,
            toWarehouse: true,
          },
        },
        fromWarehouse: true,
        toWarehouse: true,
      },
    });

    if (!transfer) {
      return NextResponse.json(
        { error: "Transfer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transfer,
    });
  } catch (error) {
    console.error("Error getting transfer:", error);
    return NextResponse.json(
      { error: "Failed to get transfer" },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications/transfers/[id] - Update transfer status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, userId, notes } = body;

    if (!status || !userId) {
      return NextResponse.json(
        { error: "status and userId are required" },
        { status: 400 }
      );
    }

    if (!Object.values(TransferStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid transfer status" },
        { status: 400 }
      );
    }

    const transfer = await updateTransferStatus(
      params.id,
      status,
      userId,
      notes
    );

    return NextResponse.json({
      success: true,
      data: transfer,
    });
  } catch (error) {
    console.error("Error updating transfer status:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update transfer status",
      },
      { status: 500 }
    );
  }
}
