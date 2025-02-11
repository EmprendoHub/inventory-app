import React from "react";
import ClientFormHeader from "../../_components/ClientFormHeader";
import ClientForm from "../_components/ClientForm";

export default async function NewItem() {
  return (
    <div>
      {/* Header */}
      <ClientFormHeader title={"Cliente Nuevo"} />
      {/* Form */}
      <ClientForm />
    </div>
  );
}
