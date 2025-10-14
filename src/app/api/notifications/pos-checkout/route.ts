import { NextRequest, NextResponse } from "next/server";
import {
  checkStockAndCreateNotifications,
  linkNotificationToPosOrder,
  processPosOrderStockUpdates,
} from "@/lib/posNotifications";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

// POST /api/notifications/pos-checkout - Check stock and create notifications during POS checkout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      cashRegisterId,
      customerId,
      items,
      paymentType,
      totalAmount,
      userId,
    } = body;

    // Validation
    if (
      !sessionId ||
      !cashRegisterId ||
      !items ||
      !Array.isArray(items) ||
      !userId
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: sessionId, cashRegisterId, items, userId",
        },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Items array cannot be empty" },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.itemId || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { error: "Each item must have itemId and positive quantity" },
          { status: 400 }
        );
      }
    }

    const result = await checkStockAndCreateNotifications({
      sessionId,
      cashRegisterId,
      customerId,
      items,
      paymentType,
      totalAmount,
      userId,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error during POS checkout stock check:", error);
    return NextResponse.json(
      { error: "Failed to check stock during checkout" },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/pos-checkout - Complete POS order and update stock
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      posOrderId,
      items,
      warehouseId,
      userId,
      notificationIds = [],
    } = body;

    // Validation
    if (
      !posOrderId ||
      !items ||
      !Array.isArray(items) ||
      !warehouseId ||
      !userId
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: posOrderId, items, warehouseId, userId",
        },
        { status: 400 }
      );
    }

    // Process stock updates
    await processPosOrderStockUpdates(posOrderId, items, warehouseId, userId);

    // Link any notifications to the POS order
    if (notificationIds.length > 0) {
      await Promise.all(
        notificationIds.map((notificationId: string) =>
          linkNotificationToPosOrder(notificationId, posOrderId)
        )
      );
    }

    return NextResponse.json({
      success: true,
      message: "POS order completed and stock updated",
    });
  } catch (error) {
    console.error("Error completing POS order:", error);
    return NextResponse.json(
      { error: "Failed to complete POS order" },
      { status: 500 }
    );
  }
}
