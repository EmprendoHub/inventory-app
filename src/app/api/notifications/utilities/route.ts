import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { NotificationStatus } from "@prisma/client";

// POST /api/notifications/utilities - Utility operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case "markAllAsRead":
        return await markNotificationsAsRead(params);
      case "expireOldNotifications":
        return await expireOldNotifications(params);
      case "cancelNotifications":
        return await cancelNotifications(params);
      case "resendNotification":
        return await resendNotification(params);
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in utilities endpoint:", error);
    return NextResponse.json(
      { error: "Failed to execute utility action" },
      { status: 500 }
    );
  }
}

async function markNotificationsAsRead(params: any) {
  const { warehouseId, userId, notificationIds } = params;

  if (!warehouseId || !userId) {
    return NextResponse.json(
      { error: "warehouseId and userId are required" },
      { status: 400 }
    );
  }

  const where: any = {
    toWarehouseId: warehouseId,
    status: "PENDING",
  };

  if (notificationIds && Array.isArray(notificationIds)) {
    where.id = { in: notificationIds };
  }

  const result = await db.branchNotification.updateMany({
    where,
    data: {
      status: NotificationStatus.ACKNOWLEDGED,
      respondedBy: userId,
      respondedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    data: { updatedCount: result.count },
  });
}

async function expireOldNotifications(params: any) {
  const { olderThanHours = 24 } = params;

  const expireDate = new Date();
  expireDate.setHours(expireDate.getHours() - olderThanHours);

  const result = await db.branchNotification.updateMany({
    where: {
      status: "PENDING",
      createdAt: {
        lt: expireDate,
      },
    },
    data: {
      status: NotificationStatus.EXPIRED,
    },
  });

  return NextResponse.json({
    success: true,
    data: { expiredCount: result.count },
  });
}

async function cancelNotifications(params: any) {
  const { notificationIds, userId, reason } = params;

  if (!notificationIds || !Array.isArray(notificationIds) || !userId) {
    return NextResponse.json(
      { error: "notificationIds array and userId are required" },
      { status: 400 }
    );
  }

  const result = await db.branchNotification.updateMany({
    where: {
      id: { in: notificationIds },
      status: {
        in: ["PENDING", "ACKNOWLEDGED", "ACCEPTED"],
      },
    },
    data: {
      status: NotificationStatus.CANCELLED,
      responseNotes: reason || "Cancelled by user",
      respondedBy: userId,
      respondedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    data: { cancelledCount: result.count },
  });
}

async function resendNotification(params: any) {
  const { notificationId, newWarehouseId } = params;

  if (!notificationId) {
    return NextResponse.json(
      { error: "notificationId is required" },
      { status: 400 }
    );
  }

  // Get original notification
  const originalNotification = await db.branchNotification.findUnique({
    where: { id: notificationId },
  });

  if (!originalNotification) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 }
    );
  }

  // Create new notification or update target warehouse
  let result;

  if (newWarehouseId) {
    // Resend to different warehouse
    const { createBranchNotification } = await import(
      "@/lib/branchNotifications"
    );

    result = await createBranchNotification({
      itemId: originalNotification.itemId,
      orderId: originalNotification.orderId || undefined,
      posOrderId: originalNotification.posOrderId || undefined,
      fromWarehouseId: originalNotification.fromWarehouseId,
      requestedQty: originalNotification.requestedQty,
      customerInfo: originalNotification.customerInfo,
      deliveryMethod: originalNotification.deliveryMethod,
      priority: originalNotification.priority,
      urgency: originalNotification.urgency,
      notes: `${originalNotification.notes || ""}\n\nResent from notification ${
        originalNotification.notificationNo
      }`,
      createdBy: originalNotification.createdBy,
    });

    // Mark original as cancelled
    await db.branchNotification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.CANCELLED,
        responseNotes: `Resent to different warehouse (${newWarehouseId})`,
      },
    });
  } else {
    // Reset existing notification to pending
    result = await db.branchNotification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.PENDING,
        respondedBy: null,
        respondedAt: null,
        responseNotes: null,
        createdAt: new Date(), // Update timestamp
      },
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      notificationId: newWarehouseId
        ? result
        : typeof result === "string"
        ? result
        : result.id,
    },
  });
}
