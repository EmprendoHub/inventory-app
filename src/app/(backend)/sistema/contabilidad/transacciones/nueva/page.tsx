import React from "react";

import FormBusinessHeader from "@/app/(backend)/sistema/negocio/_components/FormBusinessHeader";
import TransactionForm from "../_components/TransactionForm";
import prisma from "@/lib/db";

export default async function NewExpense() {
  const accounts = await prisma.account.findMany();
  return (
    <div>
      {/* Header */}
      <FormBusinessHeader title={"Transacción"} />
      {/* Form */}
      <TransactionForm accounts={accounts} />
    </div>
  );
}
