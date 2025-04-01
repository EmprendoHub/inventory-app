"use client";
import React, { useState } from "react";
import TextInput from "@/components/TextInput";
import SelectInput from "@/components/SelectInput";
import { useRouter } from "next/navigation";
import { useModal } from "@/app/context/ModalContext";
import { PaymentType } from "@/types/sales";
import NumericInput from "@/components/NumericInput";
import DateInput from "@/components/DateInput";
import { updatePaymentAction } from "../../_actions";

export default function PaymentEdit({ payment }: { payment: PaymentType }) {
  const router = useRouter();

  const [sending, setSending] = useState<boolean>(false);
  const [amount, setAmount] = useState<number>(payment?.amount || 0);
  const { showModal } = useModal();

  const [formData, setFormData] = useState({
    id: payment?.id,
    reference: payment?.reference || "",
    method: payment?.method,
    createdAt: payment?.createdAt,
  });

  const handleInputAmount = (value: number) => {
    setAmount(value);
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  console.log("formData", formData);

  const handleSubmit = async (formSubmitData: FormData) => {
    setSending(true);
    formSubmitData.set("id", payment?.id || "");
    formSubmitData.set("amount", amount.toString());

    const result = await updatePaymentAction(formSubmitData);

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
      <div className="flex items-center gap-4 bg-card rounded-lg">
        <NumericInput
          label="Cantidad"
          name="amount"
          defaultValue={amount}
          onChange={handleInputAmount}
        />

        <DateInput
          defaultValue={formData.createdAt}
          name="createdAt"
          label="Fecha Entrega"
        />
      </div>

      <SelectInput
        label="Método de Pago"
        name="method"
        isSelected={formData.method}
        options={[
          { value: "EFECTIVO", name: "EFECTIVO" },
          { value: "TRANSFERENCIA", name: "TRANSFERENCIA" },
          { value: "TARJETA", name: "TARJETA" },
        ]}
      />
      <TextInput
        value={formData.reference}
        onChange={handleInputChange}
        name="reference"
        label="Ref. de Pago"
      />

      <button
        type="submit"
        disabled={sending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
        Actualizar Pago
      </button>
    </form>
  );
}
