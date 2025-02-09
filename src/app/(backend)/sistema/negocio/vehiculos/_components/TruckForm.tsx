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

  const handleSubmit = async (formData: FormData) => {
    setSending(true);
    await formAction(formData);
    setSending(false);

    if (state.success) {
      await showModal({
        title: "Truck Created!",
        type: "info",
        text: "The truck record has been created successfully.",
        icon: "success",
      });
      router.push("/sistema/shipping/trucks");
    }
  };

  return (
    <form action={handleSubmit} className="space-y-4 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <TextInput name="licensePlate" label="License Plate" state={state} />

        <SelectInput
          label="Status"
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
