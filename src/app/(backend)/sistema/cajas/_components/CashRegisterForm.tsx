"use client";

import { useFormState } from "react-dom";
import { createCashRegisterAction } from "../_actions";

export default function CashRegisterForm() {
  const [state, formAction] = useFormState(createCashRegisterAction, {
    success: false,
    message: "",
  });

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          type="text"
          name="name"
          required
          className="mt-1 bg-input block w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Crear Caja
      </button>
      {state.message && (
        <p className="text-sm text-gray-600">{state.message}</p>
      )}
    </form>
  );
}
