"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import { updateBrandAction } from "../_actions";
import { brandType } from "@/types/categories";
import { useRouter } from "next/navigation";
import { useModal } from "@/app/context/ModalContext";
import TextInput from "@/components/TextInput";
import TextAreaInput from "@/components/TextAreaInput";

export default function BrandEdit({ brand }: { brand: brandType }) {
  const router = useRouter();
  // eslint-disable-next-line
  const [state, formAction] = useFormState(updateBrandAction, {
    errors: {},
    success: false,
    message: "",
  });

  // Add state for form fields
  const [formData, setFormData] = useState({
    id: brand?.id,
    name: brand?.name,
    description: brand?.description,
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
    formData.set("id", brand?.id || "");
    // Call the form action
    const result = await updateBrandAction(state, formData);

    // Check if the product was created successfully
    if (result.success) {
      // Reset the form fields
      await showModal({
        title: "Marca Actualizada!",
        type: "delete",
        text: "La Marca ha sido Actualizada exitosamente.",
        icon: "success",
      });

      router.push("/sistema/negocio/marcas");
      setSending((prev) => !prev);
    }
  };

  return (
    <form
      id="brand-form"
      action={handleSubmit}
      className="space-y-4 flex flex-col gap-4"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault(); // Prevent form submission
        }
      }}
    >
      <TextInput
        value={formData.name}
        onChange={handleInputChange}
        name="name"
        label="Nombre"
        state={state}
      />
      <TextAreaInput
        value={formData.description}
        onChange={handleInputChange}
        name="description"
        label="Descripción"
        state={state}
      />

      <button
        type="submit"
        disabled={sending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
        Actualizar Marca
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
