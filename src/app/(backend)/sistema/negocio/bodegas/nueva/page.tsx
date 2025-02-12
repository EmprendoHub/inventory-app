import React from "react";
import FormBusinessHeader from "../../_components/FormBusinessHeader";
import WarehouseForm from "../_components/WarehouseForm";

export default function NewWarehouse() {
  return (
    <div>
      {/* Header */}
      <FormBusinessHeader title={"Bodega"} />
      {/* Form */}
      <WarehouseForm />
    </div>
  );
}
