"use client";
import React from "react";
import { useFormState } from "react-dom";
import { createUnit } from "../_actions";

export default function UnitForm() {
  const [state, formAction] = useFormState(createUnit, {
    errors: {},
    success: false,
    message: "",
  });

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-center gap-4">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Unidad de Medida
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
            htmlFor="abbreviation"
            className="block text-sm font-medium text-gray-700"
          >
            Abreviación de Unidad
          </label>

          <input
            name="abbreviation"
            id="abbreviation"
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          {state.errors?.abbreviation && (
            <p className="text-sm text-red-500">
              {state.errors.abbreviation.join(", ")}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
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
