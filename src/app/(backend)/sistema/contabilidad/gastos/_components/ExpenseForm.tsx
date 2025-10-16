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
import { useRouter } from "next/navigation";
import { CashBreakdown } from "@/types/pos";
import CashCalculator from "../../../pos/_components/CashCalculator";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";

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

  // Cash calculator state
  const [showCashCalculator, setShowCashCalculator] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [cashBreakdown, setCashBreakdown] = useState<CashBreakdown | null>(
    null
  );
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "OTHER">("OTHER");

  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    setSelectedExpenseType(selectedValue);
    setDescription(selectedValue);
  };

  // Handle cash payment from calculator
  const handleCashPayment = (amount: number, breakdown: CashBreakdown) => {
    setExpenseAmount(amount);
    setCashBreakdown(breakdown);
    setShowCashCalculator(false);
  };

  // Handle opening cash calculator
  const handleOpenCashCalculator = () => {
    const amountInput = document.querySelector(
      'input[name="amount"]'
    ) as HTMLInputElement;
    const currentAmount = parseFloat(amountInput?.value || "0");

    if (currentAmount <= 0) {
      showModal({
        title: "Monto requerido",
        type: "delete",
        text: "Por favor ingrese el monto del gasto antes de usar la calculadora.",
        icon: "warning",
      });
      return;
    }

    setExpenseAmount(currentAmount);
    setShowCashCalculator(true);
  };

  // Custom form submission handler
  const handleSubmit = async (formData: FormData) => {
    setSending(true);

    formData.set("driver", JSON.stringify(selectedDriver));
    formData.set("supplier", JSON.stringify(selectedSupplier));
    formData.set("truck", JSON.stringify(selectedTruck));
    formData.set("status", "PAID");
    formData.set("description", JSON.stringify(description));
    formData.set("paymentMethod", paymentMethod);

    // Add cash breakdown if paying with cash
    if (paymentMethod === "CASH" && cashBreakdown) {
      formData.set("cashBreakdown", JSON.stringify(cashBreakdown));
    }

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
    setCashBreakdown(null);
    setPaymentMethod("OTHER");
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

        {/* Payment Method Selection */}
        <div className="flex items-center gap-4">
          <SelectInput
            label="Método de Pago"
            name="paymentMethod"
            options={[
              { value: "OTHER", name: "Transferencia/Tarjeta" },
              { value: "CASH", name: "Efectivo" },
            ]}
            state={state}
            onChange={(e) =>
              setPaymentMethod(e.target.value as "CASH" | "OTHER")
            }
          />

          {/* Cash Calculator Button */}
          {paymentMethod === "CASH" && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calculadora de Denominaciones
              </label>
              <Button
                type="button"
                onClick={handleOpenCashCalculator}
                variant="outline"
                className="w-full h-12 text-base"
              >
                <Calculator className="w-5 h-5 mr-2" />
                {cashBreakdown
                  ? "Denominaciones Seleccionadas"
                  : "Calcular Denominaciones"}
              </Button>
              {cashBreakdown && (
                <p className="text-sm text-green-600 mt-1">
                  Total contado: ${(cashBreakdown.totalCash || 0).toFixed(2)}
                </p>
              )}
            </div>
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

      {/* Cash Calculator Modal */}
      {showCashCalculator && (
        <CashCalculator
          totalAmount={expenseAmount}
          onCashReceived={handleCashPayment}
          onClose={() => setShowCashCalculator(false)}
        />
      )}
    </section>
  );
}
