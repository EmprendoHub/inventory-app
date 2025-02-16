"use client";

import { useFormState } from "react-dom";
import { createCashAuditAction } from "../_actions";
import TextInput from "@/components/TextInput";
import NumericInput from "@/components/NumericInput";
import DateInput from "@/components/DateInput";

export default function CashAuditForm() {
  const [state, formAction] = useFormState(createCashAuditAction, {
    success: false,
    message: "",
    errors: {},
  });

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <TextInput label="Caja" name="cashRegisterId" state={state} />
        <NumericInput
          label="Balance Inicial"
          name="startBalance"
          state={state}
        />
        <NumericInput label="Balance Final" name="endBalance" state={state} />
        <DateInput
          label="Fecha"
          name="auditDate"
          state={state}
          defaultValue={new Date()}
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
