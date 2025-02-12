import React from "react";
import FormBusinessHeader from "../../_components/FormBusinessHeader";
import SupplierForm from "../_components/SupplierForm";

export default async function NewItem() {
  return (
    <div>
      {/* Header */}
      <FormBusinessHeader title={"Proveedor"} />
      {/* Form */}
      <SupplierForm />
    </div>
  );
}
