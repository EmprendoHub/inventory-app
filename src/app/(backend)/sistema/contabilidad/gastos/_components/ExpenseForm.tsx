"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import TextInput from "@/components/TextInput";
import SelectInput from "@/components/SelectInput";
import { ExpenseFormState } from "@/types/expenses";
import { createExpenseAction } from "../_actions";
import TextAreaInput from "@/components/TextAreaInput";
import NumericInput from "@/components/NumericInput";
import DateInput from "@/components/DateInput";
import { useModal } from "@/app/context/ ModalContext";

export default function ExpenseForm() {
  // eslint-disable-next-line
  const [state, formAction] = useFormState<ExpenseFormState, FormData>(
    createExpenseAction,
    {
      errors: {},
      success: false,
      message: "",
    }
  );

  const [sending, setSending] = useState(false);
  const { showModal } = useModal();

  const handleSubmit = async (formData: FormData) => {
    setSending(true);
    const result = await createExpenseAction(state, formData);

    if (result.success) {
      await showModal({
        title: "Gasto Creado!",
        type: "delete",
        text: "El gasto ha sido creado exitosamente.",
        icon: "success",
      });
      const formElement = document.getElementById(
        "expense-form"
      ) as HTMLFormElement;
      formElement.reset();
    }
    setSending(false);
  };

  return (
    <form
      id="expense-form"
      action={handleSubmit}
      className="space-y-4 flex flex-col gap-4"
    >
      <div className="flex items-center gap-4">
        <SelectInput
          label="Tipo"
          name="type"
          options={[
            { value: "SALARY", name: "NOMINA" },
            { value: "EXTERNAL_SHIPPING", name: "PAQUETERÍA" },
            { value: "FUEL", name: "GASOLINA" },
            { value: "MAINTENANCE", name: "MANTENIMIENTO" },
            { value: "OFFICE", name: "OFICINA" },
            { value: "OTHER", name: "OTRO" },
          ]}
          state={state}
        />
        <SelectInput
          label="Estado"
          name="status"
          options={[
            { value: "PENDING", name: "Pendiente" },
            { value: "APPROVED", name: "Aprobado" },
            { value: "PAID", name: "Pagado" },
            { value: "REJECTED", name: "Rechazado" },
          ]}
          state={state}
        />
        <TextInput
          name="reference"
          label="Referencia (opcional)"
          state={state}
        />
      </div>

      <div className="flex items-center gap-4">
        <NumericInput name="amount" label="Monto" state={state} />
        <DateInput
          name="paymentDate"
          label="Fecha de Pago"
          state={state}
          defaultValue={new Date()}
        />
      </div>
      <div className="flex items-center gap-4">
        <TextInput name="deliveryId" label="ID de Envió" state={state} />
        <TextInput name="driverId" label="ID de Chofer" state={state} />
        <TextInput name="truckId" label="ID de Vehículo" state={state} />
      </div>
      <div className="flex items-center gap-4">
        <TextInput
          name="externalShipId"
          label="ID de Envío Externo"
          state={state}
        />
        <TextInput name="supplierId" label="ID de Proveedor" state={state} />
      </div>

      <TextAreaInput name="description" label="Descripción" state={state} />

      <button
        type="submit"
        disabled={sending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
        Crear Gasto
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
