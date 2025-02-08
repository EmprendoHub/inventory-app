"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import TextInput from "@/components/TextInput";
import SelectInput from "@/components/SelectInput";
import { AccountingFormState, AccountGroupType } from "@/types/accounting";
import { useModal } from "@/app/context/ ModalContext";
import { createAccountAction } from "../_actions";
import TextAreaInput from "@/components/TextAreaInput";

export default function AccountForm({ accounts }: AccountGroupType) {
  // eslint-disable-next-line
  const [state, formAction] = useFormState<AccountingFormState, FormData>(
    createAccountAction,
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
    const result = await createAccountAction(state, formData);

    if (result.success) {
      await showModal({
        title: "Cuenta Creada!",
        type: "delete",
        text: "La cuenta ha sido creada exitosamente.",
        icon: "success",
      });
      const formElement = document.getElementById(
        "account-form"
      ) as HTMLFormElement;
      formElement.reset();
    }
    setSending(false);
  };

  return (
    <form
      id="account-form"
      action={handleSubmit}
      className="space-y-4 flex flex-col gap-4"
    >
      <TextInput name="code" label="Código" state={state} />
      <TextInput name="name" label="Nombre" state={state} />
      <SelectInput
        label="Tipo"
        name="type"
        options={[
          { value: "ASSET", name: "Activo" },
          { value: "LIABILITY", name: "Pasivo" },
          { value: "EQUITY", name: "Patrimonio" },
          { value: "REVENUE", name: "Ingreso" },
          { value: "EXPENSE", name: "Gasto" },
        ]}
        state={state}
      />
      <TextAreaInput name="description" label="Descripción" state={state} />
      <SelectInput
        label="Cuenta Padre"
        name="parentAccount"
        options={accounts.map((account) => ({
          value: account.id,
          name: account.name,
        }))}
        state={state}
      />
      <button
        type="submit"
        disabled={sending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
        Crear Cuenta
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
