"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import { createCategory } from "../_actions";
import { useModal } from "@/app/context/ ModalContext";
import TextInput from "@/components/TextInput";
import TextAreaInput from "@/components/TextAreaInput";
import { useRouter } from "next/navigation";

export default function CategoryForm() {
  const router = useRouter();
  // eslint-disable-next-line
  const [state, formAction] = useFormState(createCategory, {
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
    const result = await createCategory(state, formData);

    // Check if the product was created successfully
    if (result.success) {
      // Reset the form fields
      await showModal({
        title: "Categoría Creada!",
        type: "delete",
        text: "La Categoría ha sido creada exitosamente.",
        icon: "success",
      });
      const formElement = document.getElementById(
        "category-form"
      ) as HTMLFormElement;
      formElement.reset();
      router.push("/sistema/negocio/bodegas");
      setSending((prev) => !prev);
    }
  };

  return (
    <form
      id="category-form"
      action={handleSubmit}
      className="space-y-4 flex flex-col gap-4"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault(); // Prevent form submission
        }
      }}
    >
      <div>
        <TextInput name="title" label="Titulo" state={state} />
        <TextAreaInput name="description" label="Descripción" state={state} />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
        Crear Categoría
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
