"use client";

import React from "react";
import { useFormState } from "react-dom";
import { createItemGroupTwo } from "../../_actions";

export default function ItemGroupForm() {
  const [state, formAction] = useFormState(createItemGroupTwo, {
    errors: {},
    success: false,
    message: "",
  });

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-muted">
          Group Name
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
        <label htmlFor="items" className="block text-sm font-medium text-muted">
          Item IDs (comma-separated)
        </label>
        <input
          name="items"
          id="items"
          type="text"
          className="mt-1 block w-full rounded-md bg-input border-gray-300 shadow-sm"
        />
        {state.errors?.items && (
          <p className="text-sm text-red-500">
            {state.errors.items.join(", ")}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        Create Item Group
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
