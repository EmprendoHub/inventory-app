"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import TextInput from "@/components/TextInput";
import SelectInput from "@/components/SelectInput";
import {
  PurchaseOrderFormState,
  PurchaseOrderGroupType,
} from "@/types/purchaseOrders";
import { createPurchaseOrderAction } from "../_actions";
import { Button } from "@/components/ui/button";
import TextAreaInput from "@/components/TextAreaInput";
import NumericInput from "@/components/NumericInput";
import DateInput from "@/components/DateInput";
import { useModal } from "@/app/context/ ModalContext";

export default function PurchaseOrderForm({
  suppliers,
  items,
}: PurchaseOrderGroupType) {
  // eslint-disable-next-line
  const [state, formAction] = useFormState<PurchaseOrderFormState, FormData>(
    createPurchaseOrderAction,
    {
      errors: {},
      success: false,
      message: "",
    }
  );

  const [sending, setSending] = useState(false);
  const { showModal } = useModal();

  const [selectedItems, setSelectedItems] = useState<
    {
      itemId: string;
      quantity: number;
      unitPrice: number;
      tax: number;
      receivedQty: number;
    }[]
  >([]);

  const [newItem, setNewItem] = useState({
    itemId: "",
    quantity: 0,
    unitPrice: 0,
    tax: 0,
    receivedQty: 0,
  });

  const handleAddItem = () => {
    setSelectedItems((prev) => [...prev, newItem]);
    setNewItem({
      itemId: "",
      quantity: 0,
      unitPrice: 0,
      tax: 0,
      receivedQty: 0,
    });
  };

  const handleSubmit = async (formData: FormData) => {
    setSending(true);
    formData.set("items", JSON.stringify(selectedItems));

    const result = await createPurchaseOrderAction(state, formData);

    if (result.success) {
      await showModal({
        title: "Orden de Compra Creada!",
        type: "delete",
        text: "La orden de compra ha sido creada exitosamente.",
        icon: "success",
      });
      const formElement = document.getElementById(
        "purchase-order-form"
      ) as HTMLFormElement;
      formElement.reset();
      setSelectedItems([]);
    }
    setSending(false);
  };

  return (
    <form
      id="purchase-order-form"
      action={handleSubmit}
      className="space-y-4 flex flex-col gap-4"
    >
      <div className="flex items-center gap-4">
        <TextInput name="poNumber" label="Número de Orden" state={state} />
        <SelectInput
          label="Proveedor"
          name="supplierId"
          options={suppliers.map((supplier) => ({
            value: supplier.id,
            name: supplier.name,
          }))}
          state={state}
        />
      </div>
      <div className="flex items-center gap-4">
        <DateInput
          name="expectedDate"
          label="Fecha Esperada"
          state={state}
          defaultValue={new Date()}
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
      </div>

      <div className="flex items-center gap-4">
        <NumericInput name="totalAmount" label="Monto Total" state={state} />
        <NumericInput name="taxAmount" label="Impuesto" state={state} />
      </div>

      <TextAreaInput name="notes" label="Notas" state={state} />

      <div className="space-y-4">
        <h3 className="text-base font-semibold">Artículos</h3>
        {selectedItems.map((item, index) => (
          <div key={index} className="flex gap-3">
            <SelectInput
              label="Artículo"
              name="newItemId"
              options={items.map((item) => ({
                value: item.id,
                name: item.name,
              }))}
              state={state}
              onChange={(e) =>
                setNewItem({ ...newItem, itemId: e.target.value })
              } // Update itemId
            />
            <NumericInput
              name={`quantity-${index}`}
              label="Cantidad"
              state={state}
            />
            <NumericInput
              name={`unitPrice-${index}`}
              label="Precio Unitario"
              state={state}
            />
            <NumericInput
              name={`tax-${index}`}
              label="Impuesto"
              state={state}
            />
            <NumericInput
              name={`receivedQty-${index}`}
              label="Cantidad Recibida"
              state={state}
            />
          </div>
        ))}
        <div className="flex gap-3">
          <SelectInput
            label="Artículo"
            name="newItemId"
            options={items.map((item) => ({
              value: item.id,
              name: item.name,
            }))}
            state={state}
            onChange={(e) => setNewItem({ ...newItem, itemId: e.target.value })}
          />
          <NumericInput
            name="newQuantity"
            label="Cantidad"
            state={state}
            onChange={(value) => setNewItem({ ...newItem, quantity: value })} // Pass onChange
          />
          <NumericInput
            name="newUnitPrice"
            label="Precio Unitario"
            state={state}
            onChange={(value) => setNewItem({ ...newItem, unitPrice: value })} // Pass onChange
          />
          <NumericInput
            name="newTax"
            label="Impuesto"
            state={state}
            onChange={(value) => setNewItem({ ...newItem, tax: value })} // Pass onChange
          />
          <NumericInput
            name="newReceivedQty"
            label="Cantidad Recibida"
            state={state}
            onChange={(value) => setNewItem({ ...newItem, receivedQty: value })} // Pass onChange
          />
        </div>
        <Button
          type="button"
          onClick={handleAddItem}
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
        Crear Orden de Compra
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
