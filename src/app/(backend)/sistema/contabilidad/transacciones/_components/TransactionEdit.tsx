"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import TextInput from "@/components/TextInput";
import SelectInput from "@/components/SelectInput";
import { TransactionGroupType } from "@/types/transactions";
import { useRouter } from "next/navigation";
import { updateTransactionAction } from "../_actions";
import { useModal } from "@/app/context/ModalContext";
import DateInput from "@/components/DateInput";
import NumericInput from "@/components/NumericInput";

export default function TransactionEdit({
  accounts,
  transaction,
}: TransactionGroupType) {
  const router = useRouter();
  // eslint-disable-next-line
  const [state, formAction] = useFormState(updateTransactionAction, {
    errors: {},
    success: false,
    message: "",
  });
  const [sending, setSending] = useState(false);
  const { showModal } = useModal();

  const [formData, setFormData] = useState({
    id: transaction?.id,
    date: transaction?.date.toISOString().split("T")[0] || "",
    description: transaction?.description || "",
    amount: transaction?.amount || 0,
    type: transaction?.type || "",
    reference: transaction?.reference || "",
    accountId: transaction?.accountId || "",
    orderId: transaction?.orderId || "",
    purchaseOrderId: transaction?.purchaseOrderId || "",
    expenseId: transaction?.expenseId || "",
  });

  const handleInputChange = (name: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (formSubmitData: FormData) => {
    setSending(true);
    formSubmitData.set("id", transaction?.id || "");

    const result = await updateTransactionAction(state, formSubmitData);

    if (result.success) {
      await showModal({
        title: "Transacción Actualizada!",
        type: "delete",
        text: "La transacción ha sido actualizada exitosamente.",
        icon: "success",
      });
      router.push("/sistema/contabilidad/transacciones");
    }
    setSending(false);
  };

  return (
    <form action={handleSubmit} className="space-y-4 flex flex-col gap-4">
      <DateInput
        defaultValue={formData.date}
        name="date"
        label="Fecha"
        state={state}
      />
      <TextInput
        value={formData.description}
        onChange={handleInputChange}
        name="description"
        label="Descripción"
        state={state}
      />
      <NumericInput
        onChange={(value) => handleInputChange("amount", value)}
        name="amount"
        label="Monto"
        state={state}
      />
      <SelectInput
        label="Tipo"
        name="type"
        options={[
          { value: "DEPOSITO", name: "DEPOSITO" },
          { value: "RETIRO", name: "RETIRO" },
        ]}
        state={state}
      />
      <TextInput
        value={formData.reference}
        onChange={handleInputChange}
        name="reference"
        label="Referencia"
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
      <TextInput
        value={formData.orderId}
        onChange={handleInputChange}
        name="orderId"
        label="ID de Orden"
        state={state}
      />
      <TextInput
        value={formData.purchaseOrderId}
        onChange={handleInputChange}
        name="purchaseOrderId"
        label="ID de Orden de Compra"
        state={state}
      />
      <TextInput
        value={formData.expenseId}
        onChange={handleInputChange}
        name="expenseId"
        label="ID de Gasto"
        state={state}
      />
      <button
        type="submit"
        disabled={sending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
        Actualizar Transacción
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
