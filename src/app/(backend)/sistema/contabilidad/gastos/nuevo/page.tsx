import React from "react";

import FormBusinessHeader from "@/app/(backend)/sistema/negocio/_components/FormBusinessHeader";
import ExpenseForm from "../_components/ExpenseForm";

export default async function NewExpense() {
  return (
    <div>
      {/* Header */}
      <FormBusinessHeader title={"Gasto"} />
      {/* Form */}
      <ExpenseForm />
    </div>
  );
}
