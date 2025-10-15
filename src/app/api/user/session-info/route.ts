import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/db";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

// GET /api/user/session-info - Get current user session information for POS
export async function GET() {
  try {
    const session = await getServerSession(options);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No authenticated user session" },
        { status: 401 }
      );
    }

    // Get user details including warehouse
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        warehouseId: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's cash register if exists
    const cashRegister = await prisma.cashRegister.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        warehouseId: user.warehouseId,
        cashRegisterId: cashRegister?.id || null,
        userName: user.name,
        userEmail: user.email,
        cashRegisterName: cashRegister?.name || null,
        cashRegisterStatus: cashRegister?.status || null,
      },
    });
  } catch (error) {
    console.error("Error getting user session info:", error);
    return NextResponse.json(
      { error: "Failed to get user session information" },
      { status: 500 }
    );
  }
}
