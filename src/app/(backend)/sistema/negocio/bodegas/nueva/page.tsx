import React from "react";
import FormHeader from "../../_components/FormHeader";
import WarehouseForm from "../_components/WarehouseForm";

export default function NewWarehouse() {
  return (
    <div>
      {/* Header */}
      <FormHeader title={"Bodega"} />
      {/* Form */}
      <WarehouseForm />
    </div>
  );
}
