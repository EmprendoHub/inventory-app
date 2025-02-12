import React from "react";
import FormBusinessHeader from "../../_components/FormBusinessHeader";
import UnitForm from "../_components/UnitForm";

export default function NewUnit() {
  return (
    <div>
      {/* Header */}
      <FormBusinessHeader title={"Unidad"} />
      {/* Form */}
      <UnitForm />
    </div>
  );
}
