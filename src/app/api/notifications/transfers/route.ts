import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// GET /api/notifications/transfers - Get all transfers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId");
    const status = searchParams.get("status");

    const where: any = {};

    if (warehouseId) {
      where.OR = [
        { fromWarehouseId: warehouseId },
        { toWarehouseId: warehouseId },
      ];
    }

    if (status) {
      where.status = status;
    }

    const transfers = await db.branchStockTransfer.findMany({
      where,
      include: {
        notification: true,
        fromWarehouse: true,
        toWarehouse: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: transfers,
    });
  } catch (error) {
    console.error("Error getting transfers:", error);
    return NextResponse.json(
      { error: "Failed to get transfers" },
      { status: 500 }
    );
  }
}

// POST /api/notifications/transfers - Create a new transfer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      notificationId,
      fromWarehouseId,
      toWarehouseId,
      itemId,
      requestedQty,
      method,
      deliveryAddress,
      customerInfo,
      notes,
      createdBy,
    } = body;

    // Validation
    if (
      !notificationId ||
      !fromWarehouseId ||
      !toWarehouseId ||
      !itemId ||
      !requestedQty ||
      !createdBy
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: notificationId, fromWarehouseId, toWarehouseId, itemId, requestedQty, createdBy",
        },
        { status: 400 }
      );
    }

    if (requestedQty <= 0) {
      return NextResponse.json(
        { error: "requestedQty must be greater than 0" },
        { status: 400 }
      );
    }

    // Import the function here to avoid circular dependencies
    const { createBranchStockTransfer } = await import(
      "@/lib/branchNotifications"
    );

    const transfer = await createBranchStockTransfer({
      notificationId,
      fromWarehouseId,
      toWarehouseId,
      itemId,
      requestedQty,
      method,
      deliveryAddress,
      customerInfo,
      notes,
      createdBy,
    });

    return NextResponse.json({
      success: true,
      data: transfer,
    });
  } catch (error) {
    console.error("Error creating transfer:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create transfer",
      },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/transfers - Bulk update transfers
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { transferIds, updates, userId } = body;

    if (
      !transferIds ||
      !Array.isArray(transferIds) ||
      transferIds.length === 0
    ) {
      return NextResponse.json(
        { error: "transferIds array is required" },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== "object") {
      return NextResponse.json(
        { error: "updates object is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const result = await db.branchStockTransfer.updateMany({
      where: {
        id: { in: transferIds },
      },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: { updatedCount: result.count },
    });
  } catch (error) {
    console.error("Error bulk updating transfers:", error);
    return NextResponse.json(
      { error: "Failed to update transfers" },
      { status: 500 }
    );
  }
}
