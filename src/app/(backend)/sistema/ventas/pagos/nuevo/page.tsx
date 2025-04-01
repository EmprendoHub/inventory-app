import React from "react";
import PaymentForm from "../_components/PaymentForm";
import SuperHeader from "../../../_components/SuperHeader";

export default function NewPayment() {
  return (
    <div>
      {/* Header */}
      <SuperHeader title={"Nuevo Pago"} />
      {/* Form */}
      <PaymentForm />
    </div>
  );
}
