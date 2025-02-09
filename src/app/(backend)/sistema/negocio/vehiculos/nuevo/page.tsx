import React from "react";
import TruckForm from "../_components/TruckForm";
import FormHeader from "../../../inventario/_components/FormHeader";

export default async function NewItem() {
  return (
    <div>
      {/* Header */}
      <FormHeader title={"Vehículo"} />
      {/* Form */}
      <TruckForm />
    </div>
  );
}
