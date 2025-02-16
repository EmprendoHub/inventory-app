"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import { updateCategoryAction } from "../_actions";
import { useModal } from "@/app/context/ModalContext";
import { categoryType } from "@/types/categories";
import TextAreaInput from "@/components/TextAreaInput";
import TextInput from "@/components/TextInput";
import { useRouter } from "next/navigation";

export default function CategoryEdit({ category }: { category: categoryType }) {
  const router = useRouter();
  // eslint-disable-next-line
  const [state, formAction] = useFormState(updateCategoryAction, {
    errors: {},
    success: false,
    message: "",
  });

  // Add state for form fields
  const [formData, setFormData] = useState({
    id: category?.id,
    title: category?.title,

    description: category?.description,
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
    formData.set("id", category?.id || "");
    // Call the form action
    const result = await updateCategoryAction(state, formData);

    // Check if the product was created successfully
    if (result.success) {
      // Reset the form fields
      await showModal({
        title: "Categoría Actualizada!",
        type: "delete",
        text: "La Categoría ha sido Actualizada exitosamente.",
        icon: "success",
      });

      router.push("/sistema/negocio/categorias");
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
        <TextInput
          value={formData.title}
          onChange={handleInputChange}
          name="title"
          label="Titulo"
          state={state}
        />
        <TextAreaInput
          value={formData.description}
          onChange={handleInputChange}
          name="description"
          label="Descripción"
          state={state}
        />
      </div>

      <div>
        {state.errors?.description && (
          <p className="text-sm text-red-500">
            {state.errors.description.join(", ")}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={sending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
        Actualizar Categoría
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
