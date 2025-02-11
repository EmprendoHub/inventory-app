"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import TextInput from "@/components/TextInput";
import SelectInput from "@/components/SelectInput";
import { ExpenseType } from "@/types/expenses";
import { useRouter } from "next/navigation";
import { updateExpenseAction } from "../_actions";
import { useModal } from "@/app/context/ ModalContext";
import NumericInput from "@/components/NumericInput";
import TextAreaInput from "@/components/TextAreaInput";
import DateInput from "@/components/DateInput";

export default function ExpenseEdit({ expense }: { expense: ExpenseType }) {
  const router = useRouter();
  // eslint-disable-next-line
  const [state, formAction] = useFormState(updateExpenseAction, {
    errors: {},
    success: false,
    message: "",
  });
  const [sending, setSending] = useState(false);
  const { showModal } = useModal();

  const [formData, setFormData] = useState({
    id: expense?.id,
    type: expense?.type || "",
    amount: expense?.amount || 0,
    description: expense?.description || "",
    reference: expense?.reference || "",
    status: expense?.status || "",
    paymentDate: expense?.paymentDate?.toISOString().split("T")[0] || "",
    deliveryId: expense?.deliveryId || "",
    driverId: expense?.driverId || "",
    truckId: expense?.truckId || "",
    externalShipId: expense?.externalShipId || "",
    supplierId: expense?.supplierId || "",
  });

  const handleInputChange = (name: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (formSubmitData: FormData) => {
    setSending(true);
    formSubmitData.set("id", expense?.id || "");

    const result = await updateExpenseAction(state, formSubmitData);

    if (result.success) {
      await showModal({
        title: "Gasto Actualizado!",
        type: "delete",
        text: "El gasto ha sido actualizado exitosamente.",
        icon: "success",
      });
      router.push("/sistema/contabilidad/gastos");
    }
    setSending(false);
  };

  return (
    <form action={handleSubmit} className="space-y-4 flex flex-col gap-4">
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
      <NumericInput
        onChange={(value) => handleInputChange("amount", value)}
        name="amount"
        label="Monto"
        state={state}
      />
      <TextAreaInput
        value={formData.description}
        onChange={handleInputChange}
        name="description"
        label="Descripción"
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
      <DateInput
        defaultValue={formData.paymentDate}
        name="paymentDate"
        label="Fecha de Pago"
        state={state}
      />
      <TextInput
        value={formData.deliveryId}
        onChange={handleInputChange}
        name="deliveryId"
        label="ID de Envió"
        state={state}
      />
      <TextInput
        value={formData.driverId}
        onChange={handleInputChange}
        name="driverId"
        label="ID de Chofer"
        state={state}
      />
      <TextInput
        value={formData.truckId}
        onChange={handleInputChange}
        name="truckId"
        label="ID de Vehículo"
        state={state}
      />
      <TextInput
        value={formData.externalShipId}
        onChange={handleInputChange}
        name="externalShipId"
        label="ID de Envío Externo"
        state={state}
      />
      <TextInput
        value={formData.supplierId}
        onChange={handleInputChange}
        name="supplierId"
        label="ID de Proveedor"
        state={state}
      />
      <button
        type="submit"
        disabled={sending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
        Actualizar Gasto
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
