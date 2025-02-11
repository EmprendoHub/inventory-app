import React from "react";
import FormHeader from "../../_components/FormHeader";
import SupplierForm from "../_components/SupplierForm";

export default async function NewItem() {
  return (
    <div>
      {/* Header */}
      <FormHeader title={"Proveedor"} />
      {/* Form */}
      <SupplierForm />
    </div>
  );
}
