import React from "react";
import FormBusinessHeader from "@/app/(backend)/sistema/negocio/_components/FormBusinessHeader";
import prisma from "@/lib/db";
import Link from "next/link";
import ExpenseEdit from "../../_components/ExpenseEdit";

export default async function EditExpense({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;

  if (id.length !== 24) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró el gasto.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/ventas/clientes"}
        >
          Ver Gastos
        </Link>
      </div>
    );
  }

  const expense = await prisma.expense.findUnique({
    where: {
      id: id,
    },
  });

  if (!expense) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró el gasto.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/ventas/pedidos"}
        >
          Ver Gastos
        </Link>
      </div>
    );
  }
  const drivers = await prisma.user.findMany({
    where: { role: "CHOFER" },
    orderBy: {
      createdAt: "desc", // Latest product
    },
  });
  const trucks = await prisma.truck.findMany({
    orderBy: {
      createdAt: "desc", // Latest product
    },
  });
  const suppliers = await prisma.supplier.findMany({
    orderBy: {
      createdAt: "desc", // Latest product
    },
  });
  // const employees = await prisma.user.findMany({
  //   where: {
  //     role: {
  //       not: "SUPER_ADMIN",
  //     },
  //   },
  //   orderBy: {
  //     createdAt: "desc", // Latest product
  //   },
  // });

  return (
    <div>
      {/* Header */}
      <FormBusinessHeader title={"Editar Gasto"} />
      {/* Form */}
      <ExpenseEdit
        expense={expense}
        drivers={drivers}
        trucks={trucks}
        suppliers={suppliers}
      />
    </div>
  );
}
