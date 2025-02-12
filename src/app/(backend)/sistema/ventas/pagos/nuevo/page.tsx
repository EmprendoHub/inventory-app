import React from "react";
import PaymentForm from "../_components/PaymentForm";
import FormSalesHeader from "../../_components/FormSalesHeader";

export default function NewPayment() {
  return (
    <div>
      {/* Header */}
      <FormSalesHeader title={"Nuevo Pago"} />
      {/* Form */}
      <PaymentForm />;
    </div>
  );
}
