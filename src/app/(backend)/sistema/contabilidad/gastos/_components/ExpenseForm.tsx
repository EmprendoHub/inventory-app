"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import TextInput from "@/components/TextInput";
import SelectInput from "@/components/SelectInput";
import { ExpenseFormState } from "@/types/expenses";
import { createExpenseAction } from "../_actions";
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

  const [description, setDescription] = React.useState<string>("");

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

  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    setSelectedExpenseType(selectedValue);

    setDescription(selectedValue);
  };

  // Custom form submission handler
  const handleSubmit = async (formData: FormData) => {
    setSending(true);

    formData.set("driver", JSON.stringify(selectedDriver));
    formData.set("supplier", JSON.stringify(selectedSupplier));
    formData.set("truck", JSON.stringify(selectedTruck));
    formData.set("status", "PAID");
    formData.set("description", JSON.stringify(description));
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
    setSelectedDriver(null);
    setSelectedTruck(null);
    setSelectedSupplier(null);
  };

  return (
    <section>
      {sending && (
        <div
          className={`fixed top-0 left-0 z-50 flex flex-col items-center justify-center w-screen h-screen bg-black/50`}
        >
          <h3>Generado gasto...</h3>
          <span className="loader" />
        </div>
      )}

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
            onChange={handleTypeChange}
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
                setDescription((prev) => prev + "-" + driver?.name);
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
                setDescription((prev) => prev + "-" + truck?.name);
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
                setDescription((prev) => prev + "-" + supplier?.name);
              }}
            />
          )}
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md bg-input border-gray-300 shadow-sm"
        />

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
    </section>
  );
}
