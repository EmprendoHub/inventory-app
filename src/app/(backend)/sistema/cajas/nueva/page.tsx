import React from "react";
import CashRegisterForm from "../_components/CashRegisterForm";
import prisma from "@/lib/db";

export default async function page() {
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ["GERENTE", "CHOFER"],
      },
    },
  });

  if (!users) {
    return (
      <div className="w-full min-h-full flex items-center justify-center">
        No se encontraron gerentes para asignar caja.
      </div>
    );
  }
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Caja Nueva</h1>
      <CashRegisterForm users={users} />
    </div>
  );
}
