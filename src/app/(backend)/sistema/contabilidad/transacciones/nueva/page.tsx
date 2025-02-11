import React from "react";

import FormHeader from "@/app/(backend)/sistema/negocio/_components/FormHeader";
import TransactionForm from "../_components/TransactionForm";
import prisma from "@/lib/db";

export default async function NewExpense() {
  const accounts = await prisma.account.findMany();
  return (
    <div>
      {/* Header */}
      <FormHeader title={"Transacción"} />
      {/* Form */}
      <TransactionForm accounts={accounts} />
    </div>
  );
}
