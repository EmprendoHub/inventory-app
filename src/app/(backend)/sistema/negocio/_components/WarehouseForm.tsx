"use client";
import React from "react";
import { useFormState } from "react-dom";
import { createWarehouse } from "../_actions";
import SelectInput from "@/components/SelectInput";
import TextInput from "@/components/TextInput";

export default function WarehouseForm() {
  const [state, formAction] = useFormState(createWarehouse, {
    errors: {},
    success: false,
    message: "",
  });

  const options = [
    { name: "Principal", value: "PRINCIPAL" },
    { name: "Sucursal", value: "SUCURSAL" },
  ];

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-center gap-3">
        <TextInput name="title" label="Titulo" state={state} />
        <TextInput name="code" label="Código" state={state} />
      </div>

      <SelectInput
        className="w-full"
        name="type"
        label="Tipo de Bodega"
        options={options}
        state={state}
      />

      <TextInput name="street" label="Calle" state={state} />
      <div className="flex items-center gap-3">
        <TextInput name="city" label="Ciudad" state={state} />
        <TextInput name="state" label="Estado" state={state} />
      </div>
      <div className="flex items-center gap-3">
        <TextInput name="country" label="País" state={state} />
        <TextInput name="postalCode" label="Código Postal" state={state} />
      </div>

      <button
        type="submit"
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        Crear Bodega
      </button>

      {state.message && (
        <p
          className={`text-sm ${
            state.success ? "text-green-700" : "text-red-500"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
