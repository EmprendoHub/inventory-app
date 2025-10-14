import { NextRequest, NextResponse } from "next/server";
import { checkStockAvailabilityAcrossBranches } from "@/lib/branchNotifications";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

// GET /api/notifications/stock-availability - Check stock across branches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    const requestedQty = searchParams.get("requestedQty");
    const excludeWarehouseId = searchParams.get("excludeWarehouseId");

    if (!itemId || !requestedQty) {
      return NextResponse.json(
        { error: "itemId and requestedQty are required" },
        { status: 400 }
      );
    }

    const qty = parseInt(requestedQty);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json(
        { error: "requestedQty must be a positive number" },
        { status: 400 }
      );
    }

    const availability = await checkStockAvailabilityAcrossBranches(
      itemId,
      qty,
      excludeWarehouseId || undefined
    );

    return NextResponse.json({
      success: true,
      data: {
        itemId,
        requestedQty: qty,
        branchesWithStock: availability,
        totalAvailable: availability.reduce(
          (sum, branch) => sum + branch.availableQty,
          0
        ),
        canFulfill: availability.some((branch) => branch.availableQty >= qty),
      },
    });
  } catch (error) {
    console.error("Error checking stock availability:", error);
    return NextResponse.json(
      { error: "Failed to check stock availability" },
      { status: 500 }
    );
  }
}
