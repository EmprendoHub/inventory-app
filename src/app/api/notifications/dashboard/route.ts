import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

// GET /api/notifications/dashboard - Get notification dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId");
    const days = parseInt(searchParams.get("days") || "7");

    if (!warehouseId) {
      return NextResponse.json(
        { error: "warehouseId is required" },
        { status: 400 }
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get notification counts by status
    const notificationStats = await db.branchNotification.groupBy({
      by: ["status"],
      where: {
        OR: [{ fromWarehouseId: warehouseId }, { toWarehouseId: warehouseId }],
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
    });

    // Get pending notifications (incoming requests)
    const pendingIncoming = await db.branchNotification.count({
      where: {
        toWarehouseId: warehouseId,
        status: {
          in: ["PENDING", "ACKNOWLEDGED"],
        },
      },
    });

    // Get recent activity
    const recentActivity = await db.branchNotification.findMany({
      where: {
        OR: [{ fromWarehouseId: warehouseId }, { toWarehouseId: warehouseId }],
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        fromWarehouse: {
          select: { title: true, code: true },
        },
        toWarehouse: {
          select: { title: true, code: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Get transfer statistics
    const transferStats = await db.branchStockTransfer.groupBy({
      by: ["status"],
      where: {
        OR: [{ fromWarehouseId: warehouseId }, { toWarehouseId: warehouseId }],
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
    });

    // Get top requested items
    const topRequestedItems = await db.branchNotification.findMany({
      where: {
        fromWarehouseId: warehouseId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        itemId: true,
        requestedQty: true,
      },
    });

    // Group and count top items
    const itemCounts = topRequestedItems.reduce((acc: any, notification) => {
      if (!acc[notification.itemId]) {
        acc[notification.itemId] = {
          itemId: notification.itemId,
          totalRequests: 0,
          totalQuantity: 0,
        };
      }
      acc[notification.itemId].totalRequests += 1;
      acc[notification.itemId].totalQuantity += notification.requestedQty;
      return acc;
    }, {});

    const topItems = Object.values(itemCounts)
      .sort((a: any, b: any) => b.totalRequests - a.totalRequests)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          pendingIncoming,
          totalNotifications: notificationStats.reduce(
            (sum, stat) => sum + stat._count.id,
            0
          ),
          totalTransfers: transferStats.reduce(
            (sum, stat) => sum + stat._count.id,
            0
          ),
        },
        notificationsByStatus: notificationStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        transfersByStatus: transferStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        recentActivity,
        topRequestedItems: topItems,
        period: {
          days,
          startDate,
          endDate: new Date(),
        },
      },
    });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to get dashboard statistics" },
      { status: 500 }
    );
  }
}
