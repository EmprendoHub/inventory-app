"use client";

import React, { useState } from "react";
import { useFormState } from "react-dom";
import SelectInput from "@/components/SelectInput";
import TextInput from "@/components/TextInput";
import { useRouter } from "next/navigation";
import { DeliveryFormState, DeliveryType } from "@/types/delivery";
import { useModal } from "@/app/context/ ModalContext";
import { updateDeliveryAction } from "../_actions";
import DateInput from "@/components/DateInput";
import { clientType } from "@/types/sales";

type DeliveryEditProps = {
  delivery: DeliveryType;
  orders: { id: string; orderNo: string; client: clientType }[];
  drivers: { id: string; name: string }[];
  trucks: { id: string; licensePlate: string; name: string }[];
};

export default function DeliveryEdit({
  delivery,
  orders,
  drivers,
  trucks,
}: DeliveryEditProps) {
  const router = useRouter();
  // eslint-disable-next-line
  const [state, formAction] = useFormState<DeliveryFormState, FormData>(
    updateDeliveryAction,
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
    const result = await updateDeliveryAction(state, formData);

    if (result.success) {
      await showModal({
        title: "Envió Actualizado!",
        type: "info",
        text: "El registro de entrega se ha actualizado correctamente.",
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
      <input type="hidden" name="id" value={delivery.id} />

      <div className="flex maxmd:flex-col gap-3 w-full">
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
        <div className="w-full">
          <SelectInput
            label="Method"
            name="method"
            options={[
              { value: "INTERNO", name: "Internal" },
              { value: "EXTERNO", name: "External" },
            ]}
            state={state}
          />
        </div>
      </div>

      <div className="flex maxmd:flex-col gap-3 w-full">
        <div className="w-full">
          <SelectInput
            label="Driver"
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
            label="Truck"
            name="truckId"
            options={trucks.map((truck) => ({
              value: truck.id,
              name: truck.name,
            }))}
            state={state}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <TextInput
          disabled={true}
          value={delivery.carrier}
          name="carrier"
          label="Paquetería"
          state={state}
          className="text-muted w-full"
        />

        <TextInput
          disabled={true}
          value={delivery.otp}
          name="otp"
          label="OTP"
          state={state}
          className="text-muted w-full"
        />

        <TextInput
          disabled={true}
          value={delivery.trackingNumber}
          name="trackingNumber"
          label="No. de rastreo"
          state={state}
          className="text-muted w-full"
        />
      </div>

      <div className="flex items-center gap-3">
        <DateInput
          name="deliveryDate"
          label="Fecha Entrega"
          defaultValue={delivery.deliveryDate}
          state={state}
        />

        <SelectInput
          label="Status"
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

      <button
        type="submit"
        disabled={sending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
        Actualizar Envió
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
