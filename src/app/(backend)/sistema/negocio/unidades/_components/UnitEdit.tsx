"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import { updateUnitAction } from "../_actions";
import { unitType } from "@/types/categories";
import { useRouter } from "next/router";
import TextInput from "@/components/TextInput";
import { useModal } from "@/app/context/ ModalContext";

export default function UnitEdit({ unit }: { unit: unitType }) {
  const router = useRouter();
  // eslint-disable-next-line
  const [state, formAction] = useFormState(updateUnitAction, {
    errors: {},
    success: false,
    message: "",
  });

  // Add state for form fields
  const [formData, setFormData] = useState({
    id: unit?.id,
    title: unit?.title,
    abbreviation: unit?.abbreviation,
    updatedAt: new Date(),
  });

  const [sending, setSending] = useState(false);

  const { showModal } = useModal();
  // Handle input changes
  const handleInputChange = (name: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Custom submit handler to handle the file upload
  const handleSubmit = async (formData: FormData) => {
    setSending((prev) => !prev);
    formData.set("id", unit?.id || "");
    // Call the form action
    const result = await updateUnitAction(state, formData);

    // Check if the product was created successfully
    if (result.success) {
      // Reset the form fields
      await showModal({
        title: "Unidad Actualizada!",
        type: "delete",
        text: "La Unidad ha sido Actualizada exitosamente.",
        icon: "success",
      });

      router.push("/sistema/negocio/unidades");
      setSending((prev) => !prev);
    }
  };

  return (
    <form
      id="unit-form"
      action={handleSubmit}
      className="space-y-4 flex flex-col gap-4"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault(); // Prevent form submission
        }
      }}
    >
      <div className="flex items-center gap-4">
        <TextInput
          value={formData.title}
          onChange={handleInputChange}
          name="title"
          label="Unidad de Medida"
          state={state}
        />
        <TextInput
          value={formData.title}
          onChange={handleInputChange}
          name="abbreviation"
          label="Abreviación"
          state={state}
        />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
        Actualizar Unidad
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
