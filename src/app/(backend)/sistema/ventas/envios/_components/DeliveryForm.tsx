"use client";

import React, { useState } from "react";
import { useFormState } from "react-dom";
import SelectInput from "@/components/SelectInput";
import TextInput from "@/components/TextInput";
import { useRouter } from "next/navigation";
import { DeliveryFormState } from "@/types/delivery";
import { createDeliveryAction } from "../_actions";
import { useModal } from "@/app/context/ ModalContext";
import DateInput from "@/components/DateInput";

type DeliveryFormProps = {
  orders: { id: string; orderNo: string }[];
  drivers: { id: string; name: string }[];
  trucks: { id: string; licensePlate: string }[];
};

export default function DeliveryForm({
  orders,
  drivers,
  trucks,
}: DeliveryFormProps) {
  const router = useRouter();
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
    await formAction(formData);
    setSending(false);

    if (state.success) {
      await showModal({
        title: "Delivery Created!",
        type: "info",
        text: "The delivery record has been created successfully.",
        icon: "success",
      });
      router.push("/sistema/shipping/deliveries");
    }
  };

  return (
    <form action={handleSubmit} className="space-y-4 flex flex-col gap-4">
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
            name="externalShipId"
            label="External Shipping"
            state={state}
          />
        </div>
      </div>

      <TextInput name="carrier" label="Carrier" state={state} />
      <TextInput name="otp" label="OTP" state={state} />
      <TextInput name="trackingNumber" label="Tracking Number" state={state} />
      <DateInput
        defaultValue={new Date()}
        name="deliveryDate"
        label="Delivery Date"
        state={state}
      />

      <SelectInput
        label="Status"
        name="status"
        options={[
          { value: "Out for Delivery", name: "Out for Delivery" },
          { value: "Delivered", name: "Delivered" },
          { value: "Failed", name: "Failed" },
        ]}
        state={state}
      />

      <button
        type="submit"
        disabled={sending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
        Create Delivery
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
