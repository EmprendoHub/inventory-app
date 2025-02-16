"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import TextInput from "@/components/TextInput";
import SelectInput from "@/components/SelectInput";
import {
  GoodsReceiptFormState,
  GoodsReceiptGroupType,
} from "@/types/goodsReceipts";
import { createGoodsReceiptAction } from "../_actions";
import { Button } from "@/components/ui/button";
import { useModal } from "@/app/context/ModalContext";
import TextAreaInput from "@/components/TextAreaInput";
import NumericInput from "@/components/NumericInput";
import DateInput from "@/components/DateInput";

export default function GoodsReceiptForm({
  purchaseOrders,
  items,
}: GoodsReceiptGroupType) {
  // eslint-disable-next-line
  const [state, formAction] = useFormState<GoodsReceiptFormState, FormData>(
    createGoodsReceiptAction,
    {
      errors: {},
      success: false,
      message: "",
    }
  );

  const [sending, setSending] = useState(false);
  const { showModal } = useModal();

  const [selectedItems, setSelectedItems] = useState<
    { itemId: string; quantity: number; notes?: string }[]
  >([]);

  const handleAddItem = (itemId: string, quantity: number, notes?: string) => {
    setSelectedItems((prev) => [...prev, { itemId, quantity, notes }]);
  };

  const handleSubmit = async (formData: FormData) => {
    setSending(true);
    formData.set("items", JSON.stringify(selectedItems));

    const result = await createGoodsReceiptAction(state, formData);

    if (result.success) {
      await showModal({
        title: "Recepción de Mercancía Creada!",
        type: "delete",
        text: "La recepción de mercancía ha sido creada exitosamente.",
        icon: "success",
      });
      const formElement = document.getElementById(
        "goods-receipt-form"
      ) as HTMLFormElement;
      formElement.reset();
      setSelectedItems([]);
    }
    setSending(false);
  };

  return (
    <form
      id="goods-receipt-form"
      action={handleSubmit}
      className="space-y-4 flex flex-col gap-4"
    >
      <div className="flex items-center gap-4">
        <TextInput name="receiptNumber" label="No" state={state} />
        <SelectInput
          label="ODC"
          name="purchaseOrderId"
          options={purchaseOrders.map((purchaseOrder) => ({
            value: purchaseOrder.id,
            name: purchaseOrder.poNumber || "",
          }))}
          state={state}
        />
        <DateInput
          name="receivedDate"
          defaultValue={new Date()}
          label="Fecha de Recepción"
          state={state}
        />
      </div>

      <TextAreaInput name="notes" label="Notas" state={state} />

      <div className="space-y-4">
        <h3 className="text-base font-semibold">Artículos Recibidos</h3>
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
              name={`quantity-${index}`}
              label="Cantidad"
              state={state}
            />
            <TextAreaInput
              name={`notes-${index}`}
              label="Notas"
              state={state}
            />
          </div>
        ))}
        <Button
          type="button"
          onClick={() => handleAddItem("", 0)}
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
        Crear Recepción de Mercancía
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
