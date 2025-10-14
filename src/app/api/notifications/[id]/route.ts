import { NextRequest, NextResponse } from "next/server";
import { respondToBranchNotification } from "@/lib/branchNotifications";
import { ResponseType } from "@prisma/client";
import db from "@/lib/db";

// GET /api/notifications/[id] - Get a specific notification
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notification = await db.branchNotification.findUnique({
      where: { id: params.id },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        responses: {
          orderBy: { createdAt: "desc" },
        },
        transfers: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("Error getting notification:", error);
    return NextResponse.json(
      { error: "Failed to get notification" },
      { status: 500 }
    );
  }
}

// POST /api/notifications/[id] - Respond to a notification
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { responseType, message, confirmedQty, estimatedTime, respondedBy } =
      body;

    // Validation
    if (!responseType || !respondedBy) {
      return NextResponse.json(
        { error: "Missing required fields: responseType, respondedBy" },
        { status: 400 }
      );
    }

    if (!Object.values(ResponseType).includes(responseType)) {
      return NextResponse.json(
        { error: "Invalid response type" },
        { status: 400 }
      );
    }

    const response = await respondToBranchNotification(
      params.id,
      responseType,
      respondedBy,
      message,
      confirmedQty,
      estimatedTime ? new Date(estimatedTime) : undefined
    );

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error responding to notification:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to respond to notification",
      },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications/[id] - Update notification status or details
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, assignedTo, notes, estimatedTime } = body;

    const updateData: any = {};

    if (status) updateData.status = status;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (notes) updateData.notes = notes;
    if (estimatedTime) updateData.estimatedTime = new Date(estimatedTime);

    const notification = await db.branchNotification.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}
