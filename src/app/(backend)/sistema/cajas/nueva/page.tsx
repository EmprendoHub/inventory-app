import React from "react";
import CashRegisterForm from "../_components/CashRegisterForm";

export default function page() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Caja Nueva</h1>
      <CashRegisterForm />
    </div>
  );
}
