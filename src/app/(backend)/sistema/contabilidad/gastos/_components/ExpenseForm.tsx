"use client";
import React, { useState, useEffect } from "react";
import { useFormState } from "react-dom";
import TextInput from "@/components/TextInput";
import SelectInput from "@/components/SelectInput";
import { ExpenseFormState } from "@/types/expenses";
import {
  createExpenseAction,
  getCustomExpenseTypesAction,
  createCustomExpenseTypeAction,
} from "../_actions";
import NumericInput from "@/components/NumericInput";
import DateInput from "@/components/DateInput";
import { useModal } from "@/app/context/ModalContext";
import { TruckType } from "@/types/truck";
import { supplierType } from "@/types/categories";
import { UserType } from "@/types/users";
import { useRouter } from "next/navigation";

export default function ExpenseForm() {
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
  const router = useRouter();
  const [selectedDriver, setSelectedDriver] = React.useState<UserType | null>(
    null
  );
  const [selectedTruck, setSelectedTruck] = React.useState<TruckType | null>(
    null
  );
  const [selectedSupplier, setSelectedSupplier] =
    React.useState<supplierType | null>(null);
  // eslint-disable-next-line
  const [selectedExpenseType, setSelectedExpenseType] = React.useState<
    string | null
  >(null);

  const [sending, setSending] = useState(false);
  const { showModal } = useModal();
  const [customTypes, setCustomTypes] = useState<string[]>([]);
  const [showCustomTypeInput, setShowCustomTypeInput] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [creatingType, setCreatingType] = useState(false);

  // Load custom expense types on mount
  useEffect(() => {
    loadCustomTypes();
  }, []);

  const loadCustomTypes = async () => {
    const types = await getCustomExpenseTypesAction();
    setCustomTypes(types);
  };

  const handleCreateCustomType = async () => {
    if (!newTypeName.trim()) {
      await showModal({
        title: "Error",
        type: "delete",
        text: "Por favor ingresa un nombre para el tipo de gasto.",
        icon: "error",
      });
      return;
    }

    setCreatingType(true);
    const result = await createCustomExpenseTypeAction(newTypeName.trim());
    setCreatingType(false);

    if (result.success) {
      await showModal({
        title: "¡Tipo Creado!",
        type: "delete",
        text: result.message,
        icon: "success",
      });
      await loadCustomTypes();
      setSelectedExpenseType(newTypeName.trim().toUpperCase());
      setDescription(newTypeName.trim().toUpperCase());
      setNewTypeName("");
      setShowCustomTypeInput(false);
    } else {
      await showModal({
        title: "Error",
        type: "delete",
        text: result.message,
        icon: "error",
      });
    }
  };

  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;

    if (selectedValue === "CREAR_NUEVO") {
      setShowCustomTypeInput(true);
      setSelectedExpenseType(null);
      setDescription("");
    } else {
      setShowCustomTypeInput(false);
      setSelectedExpenseType(selectedValue);
      setDescription(selectedValue);
    }
  };

  // Custom form submission handler
  const handleSubmit = async (formData: FormData) => {
    setSending(true);

    formData.set("driver", JSON.stringify(selectedDriver));
    formData.set("supplier", JSON.stringify(selectedSupplier));
    formData.set("truck", JSON.stringify(selectedTruck));
    formData.set("status", "PAGADO");
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

    setSelectedDriver(null);
    setSelectedTruck(null);
    setSelectedSupplier(null);
    setSending(false);
    router.push(`/sistema/contabilidad/gastos`);
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
          <div className="w-full">
            <SelectInput
              label="Tipo"
              name="type"
              options={[
                { value: "", name: "Seleccionar..." },
                { value: "GASOLINA", name: "GASOLINA" },
                { value: "PROVEEDOR", name: "PROVEEDOR" },
                { value: "NOMINA", name: "NOMINA" },
                { value: "MANTENIMIENTO", name: "MANTENIMIENTO" },
                { value: "OFICINA", name: "OFICINA" },
                { value: "OTRO", name: "OTRO" },
                ...customTypes.map((type) => ({ value: type, name: type })),
                { value: "CREAR_NUEVO", name: "➕ CREAR NUEVO TIPO" },
              ]}
              state={state}
              onChange={handleTypeChange}
            />
          </div>

          <TextInput
            name="reference"
            label="Referencia (opcional)"
            state={state}
          />
        </div>

        {showCustomTypeInput && (
          <div className="flex items-end gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Nombre del Nuevo Tipo de Gasto
              </label>
              <input
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Ej: PUBLICIDAD, LIMPIEZA, etc."
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                disabled={creatingType}
              />
            </div>
            <button
              type="button"
              onClick={handleCreateCustomType}
              disabled={creatingType}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {creatingType ? "Creando..." : "Crear"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCustomTypeInput(false);
                setNewTypeName("");
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        )}

        <div className="flex items-center gap-4">
          <NumericInput name="amount" label="Monto" state={state} />
          <DateInput
            name="paymentDate"
            label="Fecha de Gasto"
            state={state}
            defaultValue={new Date()}
          />
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
          {sending ? "Creando Gasto..." : "Crear Gasto"}
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
