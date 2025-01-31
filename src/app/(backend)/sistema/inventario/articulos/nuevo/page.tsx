import React from "react";
import FormHeader from "../../_components/FormHeader";
import ProductForm from "../../_components/ProductForm";

export default function NewItem() {
  return (
    <div>
      {/* Header */}
      <FormHeader title={"Nuevo Articulo"} />
      {/* Form */}
      <ProductForm />
    </div>
  );
}
