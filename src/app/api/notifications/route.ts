import { NextRequest, NextResponse } from "next/server";
import {
  getNotificationsForWarehouse,
  createBranchNotification,
} from "@/lib/branchNotifications";
import { BranchDeliveryMethod, NotificationPriority } from "@prisma/client";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

// GET /api/notifications - Get notifications for a warehouse
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId");
    const toWarehouseId = searchParams.get("toWarehouseId");
    const type = searchParams.get("type") as "incoming" | "outgoing" | "all";
    const status = searchParams.get("status")?.split(",");

    // Support both old warehouseId and new toWarehouseId parameters
    const targetWarehouseId = toWarehouseId || warehouseId;

    if (!targetWarehouseId) {
      return NextResponse.json(
        { error: "warehouseId or toWarehouseId is required" },
        { status: 400 }
      );
    }

    // If toWarehouseId is specified, only show incoming notifications
    const notificationType = toWarehouseId ? "incoming" : type || "all";

    const notifications = await getNotificationsForWarehouse(
      targetWarehouseId,
      notificationType,
      status as any
    );

    return NextResponse.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Error getting notifications:", error);
    return NextResponse.json(
      { error: "Failed to get notifications" },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      itemId,
      orderId,
      posOrderId,
      fromWarehouseId,
      requestedQty,
      customerInfo,
      deliveryMethod,
      priority,
      urgency,
      notes,
      createdBy,
    } = body;

    // Validation
    if (!itemId || !fromWarehouseId || !requestedQty || !createdBy) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: itemId, fromWarehouseId, requestedQty, createdBy",
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

    const notificationId = await createBranchNotification({
      itemId,
      orderId,
      posOrderId,
      fromWarehouseId,
      requestedQty,
      customerInfo,
      deliveryMethod: deliveryMethod || BranchDeliveryMethod.PICKUP,
      priority: priority || NotificationPriority.NORMAL,
      urgency: urgency || false,
      notes,
      createdBy,
    });

    return NextResponse.json({
      success: true,
      data: { notificationId },
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create notification",
      },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - Bulk update notifications
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationIds, updates } = body;

    if (
      !notificationIds ||
      !Array.isArray(notificationIds) ||
      notificationIds.length === 0
    ) {
      return NextResponse.json(
        { error: "notificationIds array is required" },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== "object") {
      return NextResponse.json(
        { error: "updates object is required" },
        { status: 400 }
      );
    }

    // Import db here to avoid circular dependencies
    const db = (await import("@/lib/db")).default;

    const result = await db.branchNotification.updateMany({
      where: {
        id: { in: notificationIds },
      },
      data: updates,
    });

    return NextResponse.json({
      success: true,
      data: { updatedCount: result.count },
    });
  } catch (error) {
    console.error("Error bulk updating notifications:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Bulk delete notifications (for cleanup/admin)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationIds = searchParams.get("ids")?.split(",");
    const warehouseId = searchParams.get("warehouseId");
    const olderThan = searchParams.get("olderThan"); // ISO date string

    if (!notificationIds && !warehouseId && !olderThan) {
      return NextResponse.json(
        {
          error: "Either ids, warehouseId, or olderThan parameter is required",
        },
        { status: 400 }
      );
    }

    // Import db here to avoid circular dependencies
    const db = (await import("@/lib/db")).default;

    const where: any = {};

    if (notificationIds) {
      where.id = { in: notificationIds };
    } else {
      // Build conditions for batch deletion
      if (warehouseId) {
        where.OR = [
          { fromWarehouseId: warehouseId },
          { toWarehouseId: warehouseId },
        ];
      }

      if (olderThan) {
        where.createdAt = {
          lt: new Date(olderThan),
        };
      }

      // Only allow deletion of completed or cancelled notifications
      where.status = {
        in: ["COMPLETED", "CANCELLED", "EXPIRED"],
      };
    }

    const result = await db.branchNotification.deleteMany({ where });

    return NextResponse.json({
      success: true,
      data: { deletedCount: result.count },
    });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    return NextResponse.json(
      { error: "Failed to delete notifications" },
      { status: 500 }
    );
  }
}
