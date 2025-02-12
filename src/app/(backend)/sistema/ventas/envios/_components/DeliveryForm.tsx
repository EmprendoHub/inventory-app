"use client";

import React, { useState } from "react";
import { useFormState } from "react-dom";
import SelectInput from "@/components/SelectInput";
import { useRouter } from "next/navigation";
import { DeliveryFormState } from "@/types/delivery";
import { createDeliveryAction } from "../_actions";
import { useModal } from "@/app/context/ ModalContext";
import DateInput from "@/components/DateInput";
import { clientType } from "@/types/sales";

type DeliveryFormProps = {
  orders: { id: string; orderNo: string; client: clientType }[];
  drivers: { id: string; name: string }[];
  trucks: { id: string; licensePlate: string; name: string }[];
};

export default function DeliveryForm({
  orders,
  drivers,
  trucks,
}: DeliveryFormProps) {
  const router = useRouter();
  // eslint-disable-next-line
  const [state, formAction] = useFormState<DeliveryFormState, FormData>(
    createDeliveryAction,
    {
      errors: {},
      success: false,
      message: "",
    }
  );
  const [sending, setSending] = useState(false);
  const { showModal } = useModal();

  const handleSubmit = async (formData: FormData) => {
    setSending(true);
    // Call the form action
    const result = await createDeliveryAction(state, formData);

    if (result.success) {
      await showModal({
        title: "Envió Creado!",
        type: "info",
        text: "El envió de entrega se ha creado correctamente.",
        icon: "success",
      });
      const formElement = document.getElementById(
        "delivery-form"
      ) as HTMLFormElement;
      formElement.reset();
      router.push("/sistema/ventas/envios");
      setSending(false);
    }
  };

  return (
    <form
      id="delivery-form"
      action={handleSubmit}
      className="space-y-4 flex flex-col gap-4"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault(); // Prevent form submission
        }
      }}
    >
      <div className="w-full">
        <SelectInput
          label="Order"
          name="orderId"
          options={orders.map((order) => ({
            value: order.id,
            name: `Pedido #${order.orderNo} - ${order.client.name}`,
          }))}
          state={state}
        />
      </div>
      <div className="flex maxmd:flex-col gap-3 w-full">
        <div className="w-full">
          <SelectInput
            label="Method"
            name="method"
            options={[
              { value: "INTERNO", name: "Interno" },
              { value: "EXTERNO", name: "Externo" },
            ]}
            state={state}
          />
        </div>
        <DateInput
          defaultValue={new Date()}
          name="deliveryDate"
          label="Fecha Entrega"
          state={state}
        />
      </div>

      <div className="flex maxmd:flex-col gap-3 w-full">
        <div className="w-full">
          <SelectInput
            label="Chofer"
            name="driverId"
            options={drivers.map((driver) => ({
              value: driver.id,
              name: driver.name,
            }))}
            state={state}
          />
        </div>
        <div className="w-full">
          <SelectInput
            label="Vehículo"
            name="truckId"
            options={trucks.map((truck) => ({
              value: truck.id,
              name: truck.name,
            }))}
            state={state}
          />
        </div>
        <div className="w-full">
          <SelectInput
            label="Estado de envió"
            name="status"
            options={[
              {
                value: "Pendiente para entrega",
                name: "Pendiente para entrega",
              },
              { value: "Fuera para entrega", name: "Fuera para entrega" },
              { value: "Entregado", name: "Entregado" },
              { value: "Fallido", name: "Fallido" },
            ]}
            state={state}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={sending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
        Crear Envió
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
