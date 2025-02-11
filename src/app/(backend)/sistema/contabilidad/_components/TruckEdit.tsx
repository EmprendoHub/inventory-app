"use client";

import React, { useState } from "react";
import { useFormState } from "react-dom";
import SelectInput from "@/components/SelectInput";
import TextInput from "@/components/TextInput";
import { useRouter } from "next/navigation";
import { TruckFormState, TruckType } from "@/types/truck";
import { updateTruckAction } from "../_actions";
import { useModal } from "@/app/context/ ModalContext";

type TruckEditProps = {
  truck: TruckType;
};

export default function TruckEdit({ truck }: TruckEditProps) {
  const router = useRouter();
  const [state, formAction] = useFormState<TruckFormState, FormData>(
    updateTruckAction,
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
        title: "Truck Updated!",
        type: "info",
        text: "The truck record has been updated successfully.",
        icon: "success",
      });
      router.push("/sistema/shipping/trucks");
    }
  };

  return (
    <form action={handleSubmit} className="space-y-4 flex flex-col gap-4">
      <input type="hidden" name="id" value={truck.id} />

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

      <button
        type="submit"
        disabled={sending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
        Update Truck
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
