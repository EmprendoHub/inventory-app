"use client";

import { useFormState } from "react-dom";
import { createCashAuditAction } from "../_actions";

export default function CashAuditForm() {
  const [state, formAction] = useFormState(createCashAuditAction, {
    success: false,
    message: "",
  });

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Cash Register</label>
        <select
          name="cashRegisterId"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          {/* Fetch and map cash registers here */}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Start Balance</label>
        <input
          type="number"
          name="startBalance"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">End Balance</label>
        <input
          type="number"
          name="endBalance"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Audit Date</label>
        <input
          type="date"
          name="auditDate"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Crear Corte de Caja
      </button>
      {state.message && (
        <p className="text-sm text-gray-600">{state.message}</p>
      )}
    </form>
  );
}
