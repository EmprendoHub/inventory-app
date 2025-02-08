"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import TextInput from "@/components/TextInput";
import SelectInput from "@/components/SelectInput";
import { AccountGroupType } from "@/types/accounting";
import { useRouter } from "next/navigation";
import { updateAccountAction } from "../_actions";
import TextAreaInput from "@/components/TextAreaInput";
import { useModal } from "@/app/context/ ModalContext";

export default function AccountEdit({ accounts, account }: AccountGroupType) {
  const router = useRouter();
  // eslint-disable-next-line
  const [state, formAction] = useFormState(updateAccountAction, {
    errors: {},
    success: false,
    message: "",
  });
  const [sending, setSending] = useState(false);
  const { showModal } = useModal();

  const [formData, setFormData] = useState({
    id: account?.id,
    code: account?.code || "",
    name: account?.name || "",
    type: account?.type || "",
    description: account?.description || "",
    parentAccount: account?.parentAccount || "",
  });

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (formSubmitData: FormData) => {
    setSending(true);
    formSubmitData.set("id", account?.id || "");

    const result = await updateAccountAction(state, formSubmitData);

    if (result.success) {
      await showModal({
        title: "Cuenta Actualizada!",
        type: "delete",
        text: "La cuenta ha sido actualizada exitosamente.",
        icon: "success",
      });
      router.push("/sistema/contabilidad/cuentas");
    }
    setSending(false);
  };

  return (
    <form action={handleSubmit} className="space-y-4 flex flex-col gap-4">
      <TextInput
        value={formData.code}
        onChange={handleInputChange}
        name="code"
        label="Código"
        state={state}
      />
      <TextInput
        value={formData.name}
        onChange={handleInputChange}
        name="name"
        label="Nombre"
        state={state}
      />
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
      <TextAreaInput
        value={formData.description}
        onChange={handleInputChange}
        name="description"
        label="Descripción"
        state={state}
      />
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
        Actualizar Cuenta
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
