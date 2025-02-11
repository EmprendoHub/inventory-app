"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import { createWarehouse } from "../_actions";
import SelectInput from "@/components/SelectInput";
import TextInput from "@/components/TextInput";
import { useModal } from "@/app/context/ ModalContext";

export default function WarehouseForm() {
  // eslint-disable-next-line
  const [state, formAction] = useFormState(createWarehouse, {
    errors: {},
    success: false,
    message: "",
  });

  const options = [
    { name: "Principal", value: "PRINCIPAL" },
    { name: "Sucursal", value: "SUCURSAL" },
  ];

  const [sending, setSending] = useState(false);

  const { showModal } = useModal();

  // Custom submit handler to handle the file upload
  const handleSubmit = async (formData: FormData) => {
    setSending((prev) => !prev);

    // Call the form action
    const result = await createWarehouse(state, formData);

    // Check if the product was created successfully
    if (result.success) {
      // Reset the form fields
      await showModal({
        title: "Bodega Creada!",
        type: "delete",
        text: "La Bodega ha sido creada exitosamente.",
        icon: "success",
      });
      const formElement = document.getElementById(
        "warehouse-form"
      ) as HTMLFormElement;
      formElement.reset();

      setSending((prev) => !prev);
    }
  };

  return (
    <form
      id="warehouse-form"
      action={handleSubmit}
      className="space-y-4 flex flex-col gap-4"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault(); // Prevent form submission
        }
      }}
    >
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
        disabled={sending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
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
