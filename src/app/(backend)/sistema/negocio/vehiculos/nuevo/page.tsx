import React from "react";
import TruckForm from "../_components/TruckForm";
import FormBusinessHeader from "../../_components/FormBusinessHeader";

export default async function NewItem() {
  return (
    <div>
      {/* Header */}
      <FormBusinessHeader title={"Vehículo"} />
      {/* Form */}
      <TruckForm />
    </div>
  );
}
