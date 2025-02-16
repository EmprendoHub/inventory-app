"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import { updateWarehouseAction } from "../_actions";
import SelectInput from "@/components/SelectInput";
import TextInput from "@/components/TextInput";
import { useModal } from "@/app/context/ModalContext";
import { useRouter } from "next/navigation";
import { warehouseType } from "@/types/warehouse";

export default function WarehouseEdit({
  warehouse,
}: {
  warehouse: warehouseType;
}) {
  const router = useRouter();
  // eslint-disable-next-line
  const [state, formAction] = useFormState(updateWarehouseAction, {
    errors: {},
    success: false,
    message: "",
  });

  const options = [
    { name: "Principal", value: "PRINCIPAL" },
    { name: "Sucursal", value: "SUCURSAL" },
  ];

  // Add state for form fields
  const [formData, setFormData] = useState({
    id: warehouse?.id,
    title: warehouse?.title as string,
    code: warehouse?.code as string,
    type: warehouse?.type,
    street: warehouse?.address.street,
    city: warehouse?.address.city,
    state: warehouse?.address.state,
    country: warehouse?.address.country,
    postalCode: warehouse?.address.postalCode,
    updatedAt: new Date(),
  });

  const [sending, setSending] = useState(false);
  const { showModal } = useModal();

  // Handle input changes
  const handleInputChange = (name: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Custom submit handler to handle the file upload
  const handleSubmit = async (formData: FormData) => {
    setSending((prev) => !prev);
    formData.set("id", warehouse?.id || "");
    // Call the form action
    const result = await updateWarehouseAction(state, formData);

    // Check if the product was created successfully
    if (result.success) {
      // Reset the form fields
      await showModal({
        title: "Bodega actualizada!",
        type: "delete",
        text: "La Bodega ha sido actualizada exitosamente.",
        icon: "success",
      });
      router.push("/sistema/negocio/bodegas");
      setSending((prev) => !prev);
    }
  };

  return (
    <form
      id="warehouse-form"
      action={handleSubmit}
      className="space-y-4 flex flex-col gap-4"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault(); // Prevent form submission
        }
      }}
    >
      <div className="flex items-center gap-3">
        <TextInput
          value={formData.title}
          onChange={handleInputChange}
          name="title"
          label="Titulo"
          state={state}
        />
        <TextInput
          value={formData.code}
          onChange={handleInputChange}
          name="code"
          label="Código"
          state={state}
        />
      </div>

      <SelectInput
        className="w-full"
        name="type"
        label="Tipo de Bodega"
        options={options}
        state={state}
      />

      <TextInput
        value={formData.street}
        onChange={handleInputChange}
        name="street"
        label="Calle"
        state={state}
      />
      <div className="flex items-center gap-3">
        <TextInput
          value={formData.city}
          onChange={handleInputChange}
          name="city"
          label="Ciudad"
          state={state}
        />
        <TextInput
          value={formData.state}
          onChange={handleInputChange}
          name="state"
          label="Estado"
          state={state}
        />
      </div>
      <div className="flex items-center gap-3">
        <TextInput
          value={formData.country}
          onChange={handleInputChange}
          name="country"
          label="País"
          state={state}
        />
        <TextInput
          value={formData.postalCode}
          onChange={handleInputChange}
          name="postalCode"
          label="Código Postal"
          state={state}
        />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
        Actualizar Bodega
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
