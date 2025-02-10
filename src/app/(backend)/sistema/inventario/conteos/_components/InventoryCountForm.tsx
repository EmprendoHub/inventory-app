"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import SelectInput from "@/components/SelectInput";
import TextInput from "@/components/TextInput";
import TextAreaInput from "@/components/TextAreaInput";
import {
  InventoryCountFormState,
  InventoryCountGroupType,
} from "@/types/inventoryCounts";
import { useModal } from "@/app/context/ ModalContext";
import { createInventoryCountAction } from "../_actions";
import { Button } from "@/components/ui/button";
import DateInput from "@/components/DateInput";
import NumericInput from "@/components/NumericInput";

export default function InventoryCountForm({
  warehouses,
  items,
}: InventoryCountGroupType) {
  // eslint-disable-next-line
  const [state, formAction] = useFormState<InventoryCountFormState, FormData>(
    createInventoryCountAction,
    {
      errors: {},
      success: false,
      message: "",
    }
  );

  const [sending, setSending] = useState(false);
  const { showModal } = useModal();

  const [selectedItems, setSelectedItems] = useState<
    { itemId: string; expectedQty: number; actualQty: number; notes?: string }[]
  >([]);

  const handleAddItem = (
    itemId: string,
    expectedQty: number,
    actualQty: number,
    notes?: string
  ) => {
    setSelectedItems((prev) => [
      ...prev,
      { itemId, expectedQty, actualQty, notes },
    ]);
  };

  const handleSubmit = async (formData: FormData) => {
    setSending(true);
    formData.set("items", JSON.stringify(selectedItems));

    const result = await createInventoryCountAction(state, formData);

    if (result.success) {
      await showModal({
        title: "Conteo de Inventario Creado!",
        type: "delete",
        text: "El conteo de inventario ha sido creado exitosamente.",
        icon: "success",
      });
      const formElement = document.getElementById(
        "inventory-count-form"
      ) as HTMLFormElement;
      formElement.reset();
      setSelectedItems([]);
    }
    setSending(false);
  };

  return (
    <form
      id="inventory-count-form"
      action={handleSubmit}
      className="space-y-4 flex flex-col gap-4"
    >
      <SelectInput
        label="Bodega"
        name="warehouseId"
        options={warehouses.map((warehouse) => ({
          value: warehouse.id,
          name: warehouse.title,
        }))}
        state={state}
      />
      <DateInput
        name="countDate"
        label="Fecha de Conteo"
        state={state}
        defaultValue={new Date()}
      />

      <TextAreaInput name="notes" label="Notas" state={state} />
      <TextInput name="createdBy" label="Creado Por" state={state} />

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
              name={`expectedQty-${index}`}
              label="Cantidad Esperada"
              state={state}
            />

            <NumericInput
              name={`actualQty-${index}`}
              label="Cantidad Real"
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
          onClick={() => handleAddItem("", 0, 0)}
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
        Crear Conteo de Inventario
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
