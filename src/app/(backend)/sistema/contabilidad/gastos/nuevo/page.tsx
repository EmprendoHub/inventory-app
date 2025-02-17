import React from "react";

import FormBusinessHeader from "@/app/(backend)/sistema/negocio/_components/FormBusinessHeader";
import ExpenseForm from "../_components/ExpenseForm";
import prisma from "@/lib/db";

export default async function NewExpense() {
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
      <FormBusinessHeader title={"Gasto"} />
      {/* Form */}
      <ExpenseForm drivers={drivers} trucks={trucks} suppliers={suppliers} />
    </div>
  );
}
