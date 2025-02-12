import React from "react";
import ClientForm from "../_components/ClientForm";
import FormSalesHeader from "../../_components/FormSalesHeader";

export default async function NewItem() {
  return (
    <div>
      {/* Header */}
      <FormSalesHeader title={"Cliente Nuevo"} />
      {/* Form */}
      <ClientForm />
    </div>
  );
}
