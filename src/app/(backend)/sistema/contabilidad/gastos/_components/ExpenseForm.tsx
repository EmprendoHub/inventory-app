"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import TextInput from "@/components/TextInput";
import SelectInput from "@/components/SelectInput";
import { ExpenseFormState } from "@/types/expenses";
import { createExpenseAction } from "../_actions";
import TextAreaInput from "@/components/TextAreaInput";
import NumericInput from "@/components/NumericInput";
import DateInput from "@/components/DateInput";
import { useModal } from "@/app/context/ModalContext";
import { TruckType } from "@/types/truck";
import { supplierType } from "@/types/categories";
import { UserType } from "@/types/users";
import { SearchSelectInput } from "@/components/SearchSelectInput";

export default function ExpenseForm({
  drivers,
  trucks,
  suppliers,
}: {
  drivers: UserType[];
  trucks: TruckType[];
  suppliers: supplierType[];
}) {
  // eslint-disable-next-line
  const [state, formAction] = useFormState<ExpenseFormState, FormData>(
    createExpenseAction,
    {
      errors: {},
      success: false,
      message: "",
    }
  );

  const [selectedDriver, setSelectedDriver] = React.useState<UserType | null>(
    null
  );
  const [selectedTruck, setSelectedTruck] = React.useState<TruckType | null>(
    null
  );
  const [selectedSupplier, setSelectedSupplier] =
    React.useState<supplierType | null>(null);
  const [selectedExpenseType, setSelectedExpenseType] = React.useState<
    string | null
  >(null);

  const [sending, setSending] = useState(false);
  const { showModal } = useModal();

  // Custom form submission handler
  const handleSubmit = async (formData: FormData) => {
    setSending(true);

    formData.set("driver", JSON.stringify(selectedDriver));
    formData.set("supplier", JSON.stringify(selectedSupplier));
    formData.set("truck", JSON.stringify(selectedTruck));
    const result = await createExpenseAction(state, formData);

    if (result.success) {
      await showModal({
        title: "Gasto Creado!",
        type: "delete",
        text: "El gasto ha sido creado exitosamente.",
        icon: "success",
      });
      const formElement = document.getElementById(
        "expense-form"
      ) as HTMLFormElement;
      formElement.reset();
    }
    setSending(false);
  };

  return (
    <form
      id="expense-form"
      action={handleSubmit}
      className="space-y-4 flex flex-col gap-4"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault(); // Prevent form submission
        }
      }}
    >
      <div className="flex items-center gap-4">
        <SelectInput
          label="Tipo"
          name="type"
          options={[
            { value: "", name: "Seleccionar..." },
            { value: "GASOLINA", name: "GASOLINA" },
            { value: "PROVEEDOR", name: "PROVEEDOR" },
            { value: "MANTENIMIENTO", name: "MANTENIMIENTO" },
            { value: "OFICINA", name: "OFICINA" },
            { value: "OTRO", name: "OTRO" },
          ]}
          state={state}
          onChange={(e) => setSelectedExpenseType(e.target.value)}
        />
        <SelectInput
          label="Estado"
          name="status"
          options={[
            { value: "PENDING", name: "Pendiente" },
            { value: "APPROVED", name: "Aprobado" },
            { value: "PAID", name: "Pagado" },
            { value: "REJECTED", name: "Rechazado" },
          ]}
          state={state}
        />
        <TextInput
          name="reference"
          label="Referencia (opcional)"
          state={state}
        />
      </div>

      <div className="flex items-center gap-4">
        <NumericInput name="amount" label="Monto" state={state} />
        <DateInput
          name="paymentDate"
          label="Fecha de Gasto"
          state={state}
          defaultValue={new Date()}
        />
      </div>
      <div className="flex items-center gap-4">
        {selectedExpenseType === "GASOLINA" && (
          <SearchSelectInput
            label="Seleccionar Chofer:"
            name="driver"
            state={state}
            className="flex-1 mb-4"
            options={drivers.map((item) => ({
              value: item.id,
              name: item.name,
            }))}
            onChange={(value) => {
              const driver = drivers.find((d) => d.id === value);
              setSelectedDriver(driver || null);
            }}
          />
        )}
        {selectedExpenseType === "MANTENIMIENTO" && (
          <SearchSelectInput
            label="Seleccionar Camioneta:"
            name="truck"
            state={state}
            className="flex-1 mb-4"
            options={trucks.map((item) => ({
              value: item.id,
              name: item.name,
            }))}
            onChange={(value) => {
              const truck = trucks.find((t) => t.id === value);
              setSelectedTruck(truck || null);
            }}
          />
        )}
        {selectedExpenseType === "PROVEEDOR" && (
          <SearchSelectInput
            label="Seleccionar Proveedor:"
            name="supplier"
            state={state}
            className="flex-1 mb-4"
            options={suppliers.map((item) => ({
              value: item.id,
              name: item.name,
            }))}
            onChange={(value) => {
              const supplier = suppliers.find((s) => s.id === value);
              setSelectedSupplier(supplier || null);
            }}
          />
        )}
      </div>

      <TextAreaInput name="description" label="Descripción" state={state} />
      <div className="space-y-2 bg-card p-4 rounded-lg">
        {selectedDriver && (
          <>
            <h3 className="font-semibold text-lg">{selectedDriver.name}</h3>
            <p className="text-sm text-muted leading-none">
              Tel: {selectedDriver.phone}
            </p>
            {selectedDriver.email && (
              <p className="text-sm text-muted leading-none">
                Email: {selectedDriver.email}
              </p>
            )}
          </>
        )}
        {selectedTruck && (
          <>
            <h3 className="font-semibold text-lg">{selectedTruck.name}</h3>
            <p className="text-sm text-muted leading-none">
              Km: {selectedTruck.km}
            </p>
          </>
        )}
        {selectedSupplier && (
          <>
            <h3 className="font-semibold text-lg">{selectedSupplier.name}</h3>
            <p className="text-sm text-muted leading-none">
              Tel: {selectedSupplier.phone}
            </p>
            {selectedSupplier.email && (
              <p className="text-sm text-muted leading-none">
                Email: {selectedSupplier.email}
              </p>
            )}
          </>
        )}
      </div>
      <button
        type="submit"
        disabled={sending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
        Crear Gasto
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
