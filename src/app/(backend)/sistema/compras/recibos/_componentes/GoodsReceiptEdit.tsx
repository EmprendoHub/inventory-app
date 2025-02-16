"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import TextInput from "@/components/TextInput";
import SelectInput from "@/components/SelectInput";
import { GoodsReceiptGroupType } from "@/types/goodsReceipts";
import { useRouter } from "next/navigation";
import { updateGoodsReceiptAction } from "../_actions";
import { Button } from "@/components/ui/button";
import { useModal } from "@/app/context/ModalContext";
import TextAreaInput from "@/components/TextAreaInput";
import DateInput from "@/components/DateInput";

export default function GoodsReceiptEdit({
  purchaseOrders,
  items,
  goodsReceipt,
  receivedItems,
}: GoodsReceiptGroupType) {
  const router = useRouter();
  // eslint-disable-next-line
  const [state, formAction] = useFormState(updateGoodsReceiptAction, {
    errors: {},
    success: false,
    message: "",
  });
  const [sending, setSending] = useState(false);
  const { showModal } = useModal();

  const [formData, setFormData] = useState({
    id: goodsReceipt?.id,
    receiptNumber: goodsReceipt?.receiptNumber || "",
    purchaseOrderId: goodsReceipt?.purchaseOrderId || "",
    receivedDate: goodsReceipt?.receivedDate.toISOString().split("T")[0] || "",
    notes: goodsReceipt?.notes || "",
  });

  const [selectedItems, setSelectedItems] = useState<
    { itemId: string; quantity: number; notes?: string }[]
  >(receivedItems || []);

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddItem = (itemId: string, quantity: number, notes?: string) => {
    setSelectedItems((prev) => [...prev, { itemId, quantity, notes }]);
  };

  const handleSubmit = async (formSubmitData: FormData) => {
    setSending(true);
    formSubmitData.set("id", goodsReceipt?.id || "");
    formSubmitData.set("items", JSON.stringify(selectedItems));

    const result = await updateGoodsReceiptAction(state, formSubmitData);

    if (result.success) {
      await showModal({
        title: "Recepción de Mercancía Actualizada!",
        type: "delete",
        text: "La recepción de mercancía ha sido actualizada exitosamente.",
        icon: "success",
      });
      router.push("/sistema/compras/recepciones");
    }
    setSending(false);
  };

  return (
    <form action={handleSubmit} className="space-y-4 flex flex-col gap-4">
      <TextInput
        value={formData.receiptNumber}
        onChange={handleInputChange}
        name="receiptNumber"
        label="Número de Recepción"
        state={state}
      />
      <SelectInput
        label="Orden de Compra"
        name="purchaseOrderId"
        options={purchaseOrders.map((purchaseOrder) => ({
          value: purchaseOrder.id,
          name: purchaseOrder.poNumber || "",
        }))}
        state={state}
      />
      <DateInput
        defaultValue={formData.receivedDate}
        name="receivedDate"
        label="Fecha de Recepción"
        state={state}
      />
      <TextAreaInput
        value={formData.notes}
        onChange={handleInputChange}
        name="notes"
        label="Notas"
        state={state}
      />

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
            <TextInput
              value={item.quantity.toString()}
              onChange={handleInputChange}
              name={`quantity-${index}`}
              label="Cantidad"
              state={state}
            />
            <TextAreaInput
              value={item.notes || ""}
              onChange={handleInputChange}
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
        Actualizar Recepción de Mercancía
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
