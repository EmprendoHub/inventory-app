import React from "react";

import FormBusinessHeader from "@/app/(backend)/sistema/negocio/_components/FormBusinessHeader";
import ExpenseForm from "../_components/ExpenseForm";
// import prisma from "@/lib/db";

export default async function NewExpense() {
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
      <ExpenseForm />
    </div>
  );
}
