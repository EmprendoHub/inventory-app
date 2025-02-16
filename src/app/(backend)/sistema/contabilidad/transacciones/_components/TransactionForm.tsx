"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import TextInput from "@/components/TextInput";
import SelectInput from "@/components/SelectInput";
import { TransactionFormState } from "@/types/transactions";
import { createTransactionAction } from "../_actions";
import { useModal } from "@/app/context/ModalContext";
import DateInput from "@/components/DateInput";
import NumericInput from "@/components/NumericInput";
import { AccountOneType } from "@/types/accounting";

export default function TransactionForm({
  accounts,
}: {
  accounts: AccountOneType[];
}) {
  // eslint-disable-next-line
  const [state, formAction] = useFormState<TransactionFormState, FormData>(
    createTransactionAction,
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
    const result = await createTransactionAction(state, formData);

    if (result.success) {
      await showModal({
        title: "Transacción Creada!",
        type: "delete",
        text: "La transacción ha sido creada exitosamente.",
        icon: "success",
      });
      const formElement = document.getElementById(
        "transaction-form"
      ) as HTMLFormElement;
      formElement.reset();
    }
    setSending(false);
  };

  return (
    <form
      id="transaction-form"
      action={handleSubmit}
      className="space-y-4 flex flex-col gap-4"
    >
      <div className="flex items-center gap-4">
        <DateInput
          name="date"
          label="Fecha"
          state={state}
          defaultValue={new Date()}
        />
        <SelectInput
          label="Tipo"
          name="type"
          options={[
            { value: "DEBIT", name: "Débito" },
            { value: "CREDIT", name: "Crédito" },
          ]}
          state={state}
        />
        <SelectInput
          label="Cuenta"
          name="accountId"
          options={accounts.map((account) => ({
            value: account.id,
            name: account.name,
          }))}
          state={state}
        />
      </div>
      <div className="flex items-center gap-4">
        <NumericInput name="amount" label="Monto" state={state} />

        <TextInput name="reference" label="Referencia" state={state} />
      </div>
      <div className="flex items-center gap-4">
        <TextInput name="orderId" label="ID de Orden" state={state} />
        <TextInput
          name="purchaseOrderId"
          label="ID de Orden de Compra"
          state={state}
        />
        <TextInput name="expenseId" label="ID de Gasto" state={state} />
      </div>
      <TextInput name="description" label="Descripción" state={state} />

      <button
        type="submit"
        disabled={sending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
        Crear Transacción
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
