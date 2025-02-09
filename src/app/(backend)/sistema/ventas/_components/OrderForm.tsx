"use client";
import React from "react";
import { useFormState } from "react-dom";
import { createBrand } from "../_actions";

export default function BrandForm() {
  const [state, formAction] = useFormState(createBrand, {
    errors: {},
    success: false,
    message: "",
  });

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-muted">
          Name
        </label>
        <input
          name="name"
          id="name"
          type="text"
          className="mt-1 block w-full rounded-md bg-input border-gray-300 shadow-sm"
        />
        {state.errors?.name && (
          <p className="text-sm text-red-500">{state.errors.name.join(", ")}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-muted"
        >
          Description
        </label>
        <textarea
          name="description"
          id="description"
          className="mt-1 block w-full rounded-md bg-input border-gray-300 shadow-sm"
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
        Crear Marca
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
