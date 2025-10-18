import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/api/auth/[...nextauth]/options";
import { getMexicoGlobalUtcDate } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(options);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    const notificationId = params.id;

    // Get the notification to verify it exists and is pending
    const notification = await prisma.branchNotification.findUnique({
      where: { id: notificationId },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notificación no encontrada" },
        { status: 404 }
      );
    }

    if (notification.status !== "PENDING") {
      return NextResponse.json(
        { error: "La notificación ya fue procesada" },
        { status: 400 }
      );
    }

    // Verify the user has permission to accept this notification
    // (user should be from the target warehouse)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.warehouseId !== notification.toWarehouseId) {
      return NextResponse.json(
        { error: "No tienes permisos para aceptar esta notificación" },
        { status: 403 }
      );
    }

    const updatedAt = getMexicoGlobalUtcDate();

    const updatedNotification = await prisma.branchNotification.update({
      where: { id: notificationId },
      data: {
        status: "ACCEPTED",
        respondedBy: session.user.id,
        respondedAt: updatedAt,
        responseNotes: "Solicitud aceptada desde la cabecera",
        updatedAt,
      },
    });

    return NextResponse.json({
      success: true,
      notification: updatedNotification,
    });
  } catch (error) {
    console.error("Error accepting notification:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
