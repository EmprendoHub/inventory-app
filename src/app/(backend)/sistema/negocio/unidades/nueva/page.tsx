import React from "react";
import FormHeader from "../../_components/FormHeader";
import UnitForm from "../_components/UnitForm";

export default function NewUnit() {
  return (
    <div>
      {/* Header */}
      <FormHeader title={"Unidad"} />
      {/* Form */}
      <UnitForm />
    </div>
  );
}
