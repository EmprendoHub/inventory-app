import React from "react";
import FormHeader from "../../_components/FormHeader";
import CategoryForm from "../../_components/CategoryForm";

export default function NewCategory() {
  return (
    <div>
      {/* Header */}
      <FormHeader title={"Categoría"} />
      {/* Form */}
      <CategoryForm />
    </div>
  );
}
