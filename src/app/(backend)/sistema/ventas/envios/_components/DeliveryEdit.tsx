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

type DeliveryEditProps = {
  delivery: DeliveryType;
  orders: { id: string; orderNo: string }[];
  drivers: { id: string; name: string }[];
  trucks: { id: string; licensePlate: string }[];
};

export default function DeliveryEdit({
  delivery,
  orders,
  drivers,
  trucks,
}: DeliveryEditProps) {
  const router = useRouter();
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
    await formAction(formData);
    setSending(false);

    if (state.success) {
      await showModal({
        title: "Delivery Updated!",
        type: "info",
        text: "The delivery record has been updated successfully.",
        icon: "success",
      });
      router.push("/sistema/shipping/deliveries");
    }
  };

  return (
    <form action={handleSubmit} className="space-y-4 flex flex-col gap-4">
      <input type="hidden" name="id" value={delivery.id} />

      <div className="flex maxmd:flex-col gap-3 w-full">
        <div className="w-full">
          <SelectInput
            label="Order"
            name="orderId"
            options={orders.map((order) => ({
              value: order.id,
              name: `Order #${order.orderNo}`,
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
              name: truck.licensePlate,
            }))}
            state={state}
          />
        </div>
        <div className="w-full">
          <TextInput
            value={delivery.externalShipId ?? ""}
            name="externalShipId"
            label="External Shipping"
            state={state}
          />
        </div>
      </div>

      <TextInput
        value={delivery.carrier}
        name="carrier"
        label="Paqueteria"
        state={state}
      />

      <TextInput value={delivery.otp} name="otp" label="OTP" state={state} />

      <TextInput
        value={delivery.trackingNumber}
        name="trackingNumber"
        label="No. de rastreo"
        state={state}
      />

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
          { value: "Procesando", name: "Procesando" },
          { value: "Fuera para entrega", name: "Fuera para entrega" },
          { value: "Entregado", name: "Entregado" },
          { value: "Fallo el envió", name: "Fallo el envió" },
        ]}
        state={state}
      />

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
