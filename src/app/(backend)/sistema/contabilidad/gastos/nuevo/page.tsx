import React from "react";

import FormHeader from "@/app/(backend)/sistema/negocio/_components/FormHeader";
import ExpenseForm from "../_components/ExpenseForm";

export default async function NewExpense() {
  return (
    <div>
      {/* Header */}
      <FormHeader title={"Gasto"} />
      {/* Form */}
      <ExpenseForm />
    </div>
  );
}
