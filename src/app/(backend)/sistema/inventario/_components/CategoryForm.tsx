"use client";
import React, { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { createCategory } from "../_actions";

export default function CategoryForm() {
  const [state, formAction] = useFormState(createCategory, {
    errors: {},
    success: false,
    message: "",
  });
  // Create a ref to access the form element
  const formRef = useRef<HTMLFormElement>(null);

  // Reset the form if the submission is successful
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset(); // Reset the form
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Titulo
        </label>
        <input
          name="title"
          id="title"
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {state.errors?.title && (
          <p className="text-sm text-red-500">
            {state.errors.title.join(", ")}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          name="description"
          id="description"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {state.errors?.description && (
          <p className="text-sm text-red-500">
            {state.errors.description.join(", ")}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
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
