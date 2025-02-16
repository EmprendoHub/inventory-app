"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import { createUnit } from "../_actions";
import TextInput from "@/components/TextInput";
import { useRouter } from "next/navigation";
import { useModal } from "@/app/context/ModalContext";

export default function UnitForm() {
  const router = useRouter();
  // eslint-disable-next-line
  const [state, formAction] = useFormState(createUnit, {
    errors: {},
    success: false,
    message: "",
  });

  const [sending, setSending] = useState(false);

  const { showModal } = useModal();

  // Custom submit handler to handle the file upload
  const handleSubmit = async (formData: FormData) => {
    setSending((prev) => !prev);

    // Call the form action
    const result = await createUnit(state, formData);

    // Check if the product was created successfully
    if (result.success) {
      // Reset the form fields
      await showModal({
        title: "Unidad Creada!",
        type: "delete",
        text: "La Unidad de medida ha sido creada exitosamente.",
        icon: "success",
      });
      const formElement = document.getElementById(
        "unit-form"
      ) as HTMLFormElement;
      formElement.reset();
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
        <TextInput name="title" label="Unidad de Medida" state={state} />
        <TextInput name="abbreviation" label="Abreviación" state={state} />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
        Guardad Unidad
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
