import React from "react";
import TruckForm from "../../../contabilidad/_components/TruckForm";
import FormHeader from "../../_components/FormHeader";

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
