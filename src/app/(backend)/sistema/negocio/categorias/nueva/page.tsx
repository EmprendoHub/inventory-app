import React from "react";
import FormBusinessHeader from "../../_components/FormBusinessHeader";
import CategoryForm from "../_components/CategoryForm";

export default function NewCategory() {
  return (
    <div>
      {/* Header */}
      <FormBusinessHeader title={"Categoría"} />
      {/* Form */}
      <CategoryForm />
    </div>
  );
}
