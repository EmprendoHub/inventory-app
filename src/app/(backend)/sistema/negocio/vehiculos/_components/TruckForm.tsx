"use client";

import React, { useState } from "react";
import { useFormState } from "react-dom";
import SelectInput from "@/components/SelectInput";
import TextInput from "@/components/TextInput";
import { useRouter } from "next/navigation";
import { useModal } from "@/app/context/ ModalContext";
import { TruckFormState } from "@/types/truck";
import { createTruckAction } from "../_actions";

export default function TruckForm() {
  const router = useRouter();
  // eslint-disable-next-line
  const [state, formAction] = useFormState<TruckFormState, FormData>(
    createTruckAction,
    {
      errors: {},
      success: false,
      message: "",
    }
  );
  const [sending, setSending] = useState(false);
  const { showModal } = useModal();

  // Custom submit handler to handle the file upload
  const handleSubmit = async (formData: FormData) => {
    setSending((prev) => !prev);

    // Call the form action
    const result = await createTruckAction(state, formData);

    // Check if the product was created successfully
    if (result.success) {
      // Reset the form fields
      await showModal({
        title: "Vehículo Creado!",
        type: "delete",
        text: "El Vehículo ha sido creado exitosamente.",
        icon: "success",
      });
      const formElement = document.getElementById(
        "truck-form"
      ) as HTMLFormElement;
      formElement.reset();
      router.push("/sistema/negocio/vehiculos");
      setSending((prev) => !prev);
    }
  };

  return (
    <form
      id="truck-form"
      action={handleSubmit}
      className="space-y-4 flex flex-col gap-4"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault(); // Prevent form submission
        }
      }}
    >
      <div className="flex flex-col items-center gap-4">
        <TextInput name="name" label="Nombre" state={state} />
        <div className="flex items-center gap-3 w-full">
          <TextInput
            name="km"
            label="Kilómetros"
            state={state}
            className="w-full"
          />
          <TextInput
            name="licensePlate"
            label="No de Placa"
            state={state}
            className="w-full"
          />
        </div>

        <SelectInput
          label="Estado"
          name="status"
          options={[
            { value: "DISPONIBLE", name: "Disponible" },
            { value: "EN_USO", name: "En Uso" },
            { value: "MANTENIMIENTO", name: "Mantenimiento" },
          ]}
          state={state}
        />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
        Crear Vehículo
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
