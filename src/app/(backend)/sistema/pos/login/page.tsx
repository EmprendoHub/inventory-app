import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import PinLogin from "../_components/PinLogin";
import prisma from "@/lib/db";

export default async function PosLoginPage() {
  // Check if user is already authenticated
  const session = await getServerSession();

  // Simple authentication check - in a real app you'd verify roles
  if (session?.user) {
    redirect("/sistema/pos/register");
  }

  const handleLogin = async (userId: string, pin: string) => {
    "use server";
    // prisma is now imported at the top of the file

    try {
      // Find user by email/id and verify PIN
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ id: userId }, { email: userId }],
          active: true,
          posPin: pin,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          posPin: true,
        },
      });

      if (!user) {
        return {
          success: false,
          error: "Usuario o PIN incorrecto",
        };
      }

      // Check if user has POS access permissions
      const allowedRoles = ["EMPLEADO", "GERENTE", "ADMIN", "SUPER_ADMIN"];
      if (!allowedRoles.includes(user.role)) {
        return {
          success: false,
          error: "No tiene permisos para acceder al POS",
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          permissions: ["pos.access", "pos.session.create", "pos.order.create"],
        },
      };
    } catch (error) {
      console.error("POS login error:", error);
      return {
        success: false,
        error: "Error de autenticación",
      };
    }
  };

  return (
    <PinLogin
      onLogin={handleLogin}
      title="Acceso POS"
      subtitle="Sistema de Punto de Venta"
    />
  );
}
