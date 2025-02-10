"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import { createAdjustment } from "../_actions";
import SelectInput from "@/components/SelectInput";
import TextAreaInput from "@/components/TextAreaInput";
import NumericInput from "@/components/NumericInput";
import { MinusCircle, PlusCircle } from "lucide-react";
import SupervisorVerificationModal from "@/components/system/SupervisorVerificationModal";
import { useSession } from "next-auth/react";
import { UserType } from "@/types/users";

type AdjustType = {
  items: {
    id: string;
    name: string;
    description: string;
    sku: string;
    barcode: string | null;
    dimensions: string | null;
    price: number;
    cost: number;
    minStock: number;
    tax: number;
    supplierId: string;
    notes: string | null;
    image?: string;
  }[];
  warehouses: { id: string; title: string; description?: string }[];
};

export default function AdjustmentForm({ items, warehouses }: AdjustType) {
  const { data: session } = useSession();
  const [state, formAction] = useFormState(createAdjustment, {
    errors: {},
    success: false,
    message: "",
  });

  const [formType, setFormType] = useState("add");
  const user = session?.user as UserType;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
      setIsModalOpen(true);
      // Store the form data for later submission
      setFormData(new FormData(e.target as HTMLFormElement));
    } else {
      formAction(new FormData(e.target as HTMLFormElement));
    }
  };

  const handleVerify = async (code: string) => {
    const isValid = await verifySupervisorCode(code);

    if (isValid && formData) {
      // Submit the form with the stored data
      formAction(formData);
      setIsModalOpen(false);
      setFormData(null);
    }

    return isValid;
  };

  const verifySupervisorCode = async (code: string) => {
    // Replace with your actual verification logic
    return code === "1234"; // Example code
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <ul className="flex flex-wrap mb-2 text-sm font-medium text-center text-gray-500 dark:text-gray-400">
        <li className="me-2">
          <button
            onClick={() => setFormType("add")}
            className={`inline-flex items-center justify-center p-4  ${
              formType === "add"
                ? "text-blue-600 border-b-2 border-blue-600dark:text-blue-500 dark:border-blue-500"
                : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
            }  rounded-t-lg active  group`}
          >
            <PlusCircle />
            Agregar inventario
          </button>
        </li>
        <li className="me-2">
          <button
            onClick={() => setFormType("transfer")}
            className={`inline-flex items-center justify-center p-4 ${
              formType === "transfer"
                ? "text-blue-600 border-b-2 border-blue-600dark:text-blue-500 dark:border-blue-500"
                : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
            }  rounded-t-lg active  group`}
            aria-current="page"
          >
            <MinusCircle />
            Transferir inventario
          </button>
        </li>
      </ul>

      {formType === "add" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={formType} type="hidden" name="formType" id="formType" />
          <div className="flex gap-3 items-center">
            <div className="flex flex-col gap-3 w-full">
              <SelectInput
                className="w-full"
                name="articulo"
                label="Articulo"
                options={items.map(
                  (item: {
                    id: string;
                    name: string;
                    description: string;
                  }) => ({
                    value: item.id,
                    name: item.name,
                    description: item.description,
                  })
                )}
                state={state}
              />
              <NumericInput name="transAmount" label="Cantidad" state={state} />
            </div>

            <div className="w-full flex flex-col gap-3 items-start justify-start h-full">
              <SelectInput
                className="w-full"
                name="sendingWarehouse"
                label="Bodega"
                options={warehouses.map(
                  (warehouse: {
                    id: string;
                    title: string;
                    description?: string;
                  }) => ({
                    value: warehouse.id,
                    name: warehouse.title,
                    description: warehouse.description || "",
                  })
                )}
                state={state}
              />
            </div>
          </div>

          <TextAreaInput state={state} name="notes" label="Notas de Ajuste" />

          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Agregar Inventario
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
      ) : (
        <form action={formAction} className="space-y-4">
          <input value={formType} type="hidden" name="formType" id="formType" />
          <div className="flex gap-3 items-center">
            <div className="flex flex-col gap-3 w-full">
              <SelectInput
                className="w-full"
                name="articulo"
                label="Articulo"
                options={items.map(
                  (item: {
                    id: string;
                    name: string;
                    description: string;
                  }) => ({
                    value: item.id,
                    name: item.name,
                    description: item.description,
                  })
                )}
                state={state}
              />
              <NumericInput
                name="transAmount"
                label="Cantidad a transferir"
                state={state}
              />
            </div>

            <div className="w-full flex flex-col gap-3 items-center">
              <SelectInput
                className="w-full"
                name="sendingWarehouse"
                label="Bodega de Envío"
                options={warehouses.map(
                  (warehouse: {
                    id: string;
                    title: string;
                    description?: string;
                  }) => ({
                    value: warehouse.id,
                    name: warehouse.title,
                    description: warehouse.description || "",
                  })
                )}
                state={state}
              />
              <SelectInput
                className="w-full"
                name="receivingWarehouse"
                label="Bodega Receptora"
                options={warehouses.map(
                  (warehouse: {
                    id: string;
                    title: string;
                    description?: string;
                  }) => ({
                    value: warehouse.id,
                    name: warehouse.title,
                    description: warehouse.description || "",
                  })
                )}
                state={state}
              />
            </div>
          </div>

          <TextAreaInput state={state} name="notes" label="Notas de Ajuste" />

          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Ajustar Inventario
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
      )}
      <SupervisorVerificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onVerify={handleVerify}
      />
    </div>
  );
}
