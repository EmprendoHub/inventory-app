"use client";
import React from "react";
import { useFormState } from "react-dom";
import { createWarehouse } from "../_actions";
import SelectInput from "@/components/SelectInput";

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
      <div className="flex gap-4 items-center">
        <div className="w-full">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-muted"
          >
            Titulo
          </label>
          <input
            name="title"
            id="title"
            type="text"
            className="mt-1 block w-full rounded-md bg-input border-gray-300 shadow-sm"
          />
          {state.errors?.title && (
            <p className="text-sm text-red-500">
              {state.errors.title.join(", ")}
            </p>
          )}
        </div>

        <div className="w-full">
          <SelectInput
            className="w-full"
            name="type"
            label="Tipo de Bodega"
            options={options}
            state={state}
          />
          {state.errors?.type && (
            <p className="text-sm text-red-500">
              {state.errors.type.join(", ")}
            </p>
          )}
        </div>
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
