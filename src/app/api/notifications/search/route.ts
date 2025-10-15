import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

// POST /api/notifications/search - Advanced search for notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      warehouseId,
      itemId,
      status,
      priority,
      type,
      dateFrom,
      dateTo,
      urgentOnly,
      customerPhone,
      notificationNo,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = body;

    // Build where clause
    const where: any = {};

    if (warehouseId) {
      where.OR = [
        { fromWarehouseId: warehouseId },
        { toWarehouseId: warehouseId },
      ];
    }

    if (itemId) {
      where.itemId = itemId;
    }

    if (status && Array.isArray(status)) {
      where.status = { in: status };
    } else if (status) {
      where.status = status;
    }

    if (priority && Array.isArray(priority)) {
      where.priority = { in: priority };
    } else if (priority) {
      where.priority = priority;
    }

    if (type && Array.isArray(type)) {
      where.type = { in: type };
    } else if (type) {
      where.type = type;
    }

    if (urgentOnly) {
      where.urgency = true;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (customerPhone) {
      where.customerInfo = {
        path: ["phone"],
        string_contains: customerPhone,
      };
    }

    if (notificationNo) {
      where.notificationNo = {
        contains: notificationNo,
        mode: "insensitive",
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute search
    const [notifications, total] = await Promise.all([
      db.branchNotification.findMany({
        where,
        include: {
          fromWarehouse: {
            select: { id: true, title: true, code: true, type: true },
          },
          toWarehouse: {
            select: { id: true, title: true, code: true, type: true },
          },
          responses: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          transfers: {
            select: { id: true, transferNo: true, status: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      db.branchNotification.count({ where }),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore,
        },
        filters: {
          warehouseId,
          itemId,
          status,
          priority,
          type,
          dateFrom,
          dateTo,
          urgentOnly,
          customerPhone,
          notificationNo,
        },
      },
    });
  } catch (error) {
    console.error("Error searching notifications:", error);
    return NextResponse.json(
      { error: "Failed to search notifications" },
      { status: 500 }
    );
  }
}

// GET /api/notifications/search - Get saved searches or search templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "templates";

    if (type === "templates") {
      // Return predefined search templates
      const templates = [
        {
          id: "urgent_pending",
          name: "Urgent Pending Requests",
          description: "All urgent notifications waiting for response",
          filters: {
            status: ["PENDING"],
            urgentOnly: true,
            priority: ["ALTA", "CRÍTICA"],
          },
        },
        {
          id: "my_outgoing",
          name: "My Outgoing Requests",
          description: "Requests sent from my warehouse",
          filters: {
            status: ["PENDING", "ACKNOWLEDGED", "ACCEPTED", "IN_PROGRESS"],
          },
        },
        {
          id: "completed_today",
          name: "Completed Today",
          description: "All notifications completed today",
          filters: {
            status: ["COMPLETED"],
            dateFrom: new Date().toISOString().split("T")[0],
          },
        },
        {
          id: "rejected_requests",
          name: "Rejected Requests",
          description: "All rejected notifications needing follow-up",
          filters: {
            status: ["REJECTED"],
          },
        },
      ];

      return NextResponse.json({
        success: true,
        data: { templates },
      });
    }

    return NextResponse.json({
      success: true,
      data: { message: "Search endpoint ready" },
    });
  } catch (error) {
    console.error("Error getting search templates:", error);
    return NextResponse.json(
      { error: "Failed to get search data" },
      { status: 500 }
    );
  }
}
