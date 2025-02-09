"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import TextInput from "@/components/TextInput";
import SelectInput from "@/components/SelectInput";
import { PurchaseOrderGroupType } from "@/types/purchaseOrders";
import { useRouter } from "next/navigation";
import { updatePurchaseOrderAction } from "../_actions";
import { Button } from "@/components/ui/button";
import { useModal } from "@/app/context/ ModalContext";
import NumericInput from "@/components/NumericInput";
import TextAreaInput from "@/components/TextAreaInput";
import DateInput from "@/components/DateInput";

export default function PurchaseOrderEdit({
  suppliers,
  items,
  purchaseOrder,
  purchaseOrderItems,
}: PurchaseOrderGroupType) {
  const router = useRouter();
  // eslint-disable-next-line
  const [state, formAction] = useFormState(updatePurchaseOrderAction, {
    errors: {},
    success: false,
    message: "",
  });
  const [sending, setSending] = useState(false);
  const { showModal } = useModal();

  const [formData, setFormData] = useState({
    id: purchaseOrder?.id,
    poNumber: purchaseOrder?.poNumber || "",
    supplierId: purchaseOrder?.supplierId || "",
    status: purchaseOrder?.status || "",
    totalAmount: purchaseOrder?.totalAmount || 0,
    taxAmount: purchaseOrder?.taxAmount || 0,
    notes: purchaseOrder?.notes || "",
    expectedDate:
      purchaseOrder?.expectedDate?.toISOString().split("T")[0] || "",
  });

  const [selectedItems, setSelectedItems] = useState<
    {
      itemId: string;
      quantity: number;
      unitPrice: number;
      tax: number;
      receivedQty: number;
    }[]
  >(purchaseOrderItems || []);

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddItem = (
    itemId: string,
    quantity: number,
    unitPrice: number,
    tax: number,
    receivedQty: number
  ) => {
    setSelectedItems((prev) => [
      ...prev,
      { itemId, quantity, unitPrice, tax, receivedQty },
    ]);
  };

  const handleSubmit = async (formSubmitData: FormData) => {
    setSending(true);
    formSubmitData.set("id", purchaseOrder?.id || "");
    formSubmitData.set("items", JSON.stringify(selectedItems));

    const result = await updatePurchaseOrderAction(state, formSubmitData);

    if (result.success) {
      await showModal({
        title: "Orden de Compra Actualizada!",
        type: "delete",
        text: "La orden de compra ha sido actualizada exitosamente.",
        icon: "success",
      });
      router.push("/sistema/compras/ordenes");
    }
    setSending(false);
  };

  return (
    <form action={handleSubmit} className="space-y-4 flex flex-col gap-4">
      <TextInput
        value={formData.poNumber}
        onChange={handleInputChange}
        name="poNumber"
        label="Número de Orden"
        state={state}
      />
      <SelectInput
        label="Proveedor"
        name="supplierId"
        options={suppliers.map((supplier) => ({
          value: supplier.id,
          name: supplier.name,
        }))}
        state={state}
      />
      <SelectInput
        label="Estado"
        name="status"
        options={[
          { value: "DRAFT", name: "Borrador" },
          { value: "SUBMITTED", name: "Enviado" },
          { value: "APPROVED", name: "Aprobado" },
          { value: "ORDERED", name: "Ordenado" },
          { value: "PARTIALLY_RECEIVED", name: "Parcialmente Recibido" },
          { value: "RECEIVED", name: "Recibido" },
          { value: "CANCELLED", name: "Cancelado" },
        ]}
        state={state}
      />
      <NumericInput
        value={formData.totalAmount}
        onChange={handleInputChange}
        name="totalAmount"
        label="Monto Total"
        state={state}
      />
      <NumericInput
        value={formData.taxAmount}
        onChange={handleInputChange}
        name="taxAmount"
        label="Impuesto"
        state={state}
      />
      <TextAreaInput
        value={formData.notes}
        onChange={handleInputChange}
        name="notes"
        label="Notas"
        state={state}
      />
      <DateInput
        defaultValue={formData.expectedDate}
        name="expectedDate"
        label="Fecha Esperada"
        state={state}
      />

      <div className="space-y-4">
        <h3 className="text-base font-semibold">Artículos</h3>
        {selectedItems.map((item, index) => (
          <div key={index} className="flex gap-3">
            <SelectInput
              label="Artículo"
              name={`itemId-${index}`}
              options={items.map((item) => ({
                value: item.id,
                name: item.name,
              }))}
              state={state}
            />
            <NumericInput
              value={item.quantity}
              onChange={handleInputChange}
              name={`quantity-${index}`}
              label="Cantidad"
              state={state}
            />
            <NumericInput
              value={item.unitPrice}
              onChange={handleInputChange}
              name={`unitPrice-${index}`}
              label="Precio Unitario"
              state={state}
            />
            <NumericInput
              value={item.tax}
              onChange={handleInputChange}
              name={`tax-${index}`}
              label="Impuesto"
              state={state}
            />
            <NumericInput
              value={item.receivedQty}
              onChange={handleInputChange}
              name={`receivedQty-${index}`}
              label="Cantidad Recibida"
              state={state}
            />
          </div>
        ))}
        <Button
          type="button"
          onClick={() => handleAddItem("", 0, 0, 0, 0)}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Agregar Artículo
        </Button>
      </div>

      <button
        type="submit"
        disabled={sending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
        Actualizar Orden de Compra
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
