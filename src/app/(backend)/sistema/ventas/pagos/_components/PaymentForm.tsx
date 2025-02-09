"use client";

import React from "react";
import { useFormState } from "react-dom";
import { processPayment } from "../../_actions";

export default function PaymentForm() {
  const [state, formAction] = useFormState(processPayment, {
    errors: {},
    success: false,
    message: "",
  });

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-center gap-4">
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-muted"
          >
            Cantidad
          </label>
          <input
            name="amount"
            id="amount"
            type="number"
            step="0.01"
            className="mt-1 block w-full rounded-md bg-input border-gray-300 shadow-sm"
          />
          {state.errors?.amount && (
            <p className="text-sm text-red-500">
              {state.errors.amount.join(", ")}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="method"
            className="block text-sm font-medium text-muted"
          >
            Método de Pago
          </label>
          <select
            name="method"
            id="method"
            className="mt-1 block w-full rounded-md bg-input border-gray-300 shadow-sm"
          >
            <option value="">Seleccione el método de pago</option>
            <option value="Credit Card">Tarjeta de crédito</option>
            <option value="Bank Transfer">Transferencia bancaria</option>
            <option value="PayPal">PayPal</option>
            <option value="Cash">Efectivo</option>
          </select>
          {state.errors?.method && (
            <p className="text-sm text-red-500">
              {state.errors.method.join(", ")}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="reference"
          className="block text-sm font-medium text-muted"
        >
          Referencia (Opcional)
        </label>
        <input
          name="reference"
          id="reference"
          type="text"
          className="mt-1 block w-full rounded-md bg-input border-gray-300 shadow-sm"
        />
      </div>

      <button
        type="submit"
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        Procesar Pago
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
