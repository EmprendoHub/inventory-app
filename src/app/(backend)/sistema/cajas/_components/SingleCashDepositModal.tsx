"use client";

import { useFormState } from "react-dom";
import { createPettyCashAction } from "../_actions";
import { CashRegisterResponse } from "@/types/accounting";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/app/context/ModalContext";
import { verifySupervisorCode } from "@/app/_actions";
import { useSession } from "next-auth/react";
import { UserType } from "@/types/users";
import { BanknoteIcon, X, Plus, Minus } from "lucide-react";
import { CashBreakdown } from "@/types/pos";
import dayjs from "dayjs";

interface SingleCashDepositModalProps {
  cashRegister: CashRegisterResponse;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SingleCashDepositModal({
  cashRegister,
  isOpen,
  onClose,
  onSuccess,
}: SingleCashDepositModalProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as UserType;
  const { showModal } = useModal();
  const formattedDate = dayjs(new Date()).format("YYYY-MM-DD");
  // eslint-disable-next-line
  const [state, formAction] = useFormState(createPettyCashAction, {
    success: false,
    message: "",
    errors: {},
  });
  const [sending, setSending] = useState(false);

  const [selectedRegister, setSelectedRegister] =
    useState<CashRegisterResponse | null>(cashRegister);

  // State for cash breakdown
  const [cashBreakdown, setCashBreakdown] = useState<CashBreakdown>({
    bills: {
      thousands: { value: 1000, count: 0, total: 0 },
      fiveHundreds: { value: 500, count: 0, total: 0 },
      twoHundreds: { value: 200, count: 0, total: 0 },
      hundreds: { value: 100, count: 0, total: 0 },
      fifties: { value: 50, count: 0, total: 0 },
      twenties: { value: 20, count: 0, total: 0 },
      tens: { value: 10, count: 0, total: 0 },
      fives: { value: 5, count: 0, total: 0 },
      ones: { value: 1, count: 0, total: 0 },
    },
    coins: {
      peso20: { value: 20, count: 0, total: 0 },
      peso10: { value: 10, count: 0, total: 0 },
      peso5: { value: 5, count: 0, total: 0 },
      peso2: { value: 2, count: 0, total: 0 },
      peso1: { value: 1, count: 0, total: 0 },
      centavos50: { value: 0.5, count: 0, total: 0 },
      centavos20: { value: 0.2, count: 0, total: 0 },
      centavos10: { value: 0.1, count: 0, total: 0 },
    },
    totalCash: 0,
  });

  // Function to calculate total from cash breakdown
  const calculateTotal = useCallback((breakdown: CashBreakdown): number => {
    const billTotal = Object.values(breakdown.bills).reduce(
      (sum, bill) => sum + bill.total,
      0
    );
    const coinTotal = Object.values(breakdown.coins).reduce(
      (sum, coin) => sum + coin.total,
      0
    );
    return billTotal + coinTotal;
  }, []);

  // Update denomination count and total
  const updateDenomination = useCallback(
    (category: "bills" | "coins", key: string, count: number) => {
      setCashBreakdown((prev) => {
        const newBreakdown = { ...prev };
        if (category === "bills") {
          (newBreakdown.bills as any)[key].count = Math.max(0, count);
          (newBreakdown.bills as any)[key].total =
            (newBreakdown.bills as any)[key].value * Math.max(0, count);
        } else {
          (newBreakdown.coins as any)[key].count = Math.max(0, count);
          (newBreakdown.coins as any)[key].total =
            (newBreakdown.coins as any)[key].value * Math.max(0, count);
        }
        newBreakdown.totalCash = calculateTotal(newBreakdown);
        return newBreakdown;
      });
    },
    [calculateTotal]
  );

  // Increment/Decrement helpers for touch-friendly buttons
  const incrementDenomination = (category: "bills" | "coins", key: string) => {
    const currentCount =
      category === "bills"
        ? (cashBreakdown.bills as any)[key].count
        : (cashBreakdown.coins as any)[key].count;
    updateDenomination(category, key, currentCount + 1);
  };

  const decrementDenomination = (category: "bills" | "coins", key: string) => {
    const currentCount =
      category === "bills"
        ? (cashBreakdown.bills as any)[key].count
        : (cashBreakdown.coins as any)[key].count;
    updateDenomination(category, key, Math.max(0, currentCount - 1));
  };

  const handleSubmit = async () => {
    setSending(true);

    // First, prompt for supervisor code
    const supervisorCodeResult = await showModal({
      title: "Verificación de Supervisor",
      type: "supervisorCode",
      text: "Por favor, ingrese el código de supervisor para continuar.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Verificar",
      cancelButtonText: "Cancelar",
    });

    if (supervisorCodeResult.confirmed) {
      const isAuthorized = await verifySupervisorCode(
        supervisorCodeResult.data?.code
      );

      if (isAuthorized.success && user.role === "GERENTE") {
        const formData = new FormData();
        formData.set("endBalance", cashBreakdown.totalCash.toString());
        formData.set("managerId", isAuthorized.authUserId.toString());
        formData.set("register", JSON.stringify(selectedRegister));
        formData.set(
          "startBalance",
          selectedRegister?.balance?.toString() || ""
        );
        formData.set("auditDate", formattedDate);

        const result = await createPettyCashAction(state, formData);

        if (result.success) {
          await showModal({
            title: "Agregar fondo completado!",
            type: "delete",
            text: "Se agrego el fondo a la caja exitosamente.",
            icon: "success",
          });

          // Clear the breakdown inputs
          setCashBreakdown({
            bills: {
              thousands: { value: 1000, count: 0, total: 0 },
              fiveHundreds: { value: 500, count: 0, total: 0 },
              twoHundreds: { value: 200, count: 0, total: 0 },
              hundreds: { value: 100, count: 0, total: 0 },
              fifties: { value: 50, count: 0, total: 0 },
              twenties: { value: 20, count: 0, total: 0 },
              tens: { value: 10, count: 0, total: 0 },
              fives: { value: 5, count: 0, total: 0 },
              ones: { value: 1, count: 0, total: 0 },
            },
            coins: {
              peso20: { value: 20, count: 0, total: 0 },
              peso10: { value: 10, count: 0, total: 0 },
              peso5: { value: 5, count: 0, total: 0 },
              peso2: { value: 2, count: 0, total: 0 },
              peso1: { value: 1, count: 0, total: 0 },
              centavos50: { value: 0.5, count: 0, total: 0 },
              centavos20: { value: 0.2, count: 0, total: 0 },
              centavos10: { value: 0.1, count: 0, total: 0 },
            },
            totalCash: 0,
          });

          setSelectedRegister(cashRegister);
          onSuccess?.();
          onClose();
          router.push(`/sistema/cajas/personal/${user?.id || ""}`);
        }
      }
    }
    setSending(false);
  };

  const DenominationRow = ({
    label,
    count,
    total,
    category,
    denominationKey,
  }: {
    label: string;
    count: number;
    total: number;
    category: "bills" | "coins";
    denominationKey: string;
  }) => (
    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border">
      <span className="text-lg font-semibold text-gray-700 min-w-[80px]">
        {label}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => decrementDenomination(category, denominationKey)}
          className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center text-xl font-bold hover:bg-red-600 active:bg-red-700 transition-colors touch-manipulation"
          disabled={count === 0}
        >
          <Minus size={24} />
        </button>

        <div className="flex flex-col items-center min-w-[100px]">
          <input
            type="number"
            min="0"
            value={count}
            onChange={(e) =>
              updateDenomination(
                category,
                denominationKey,
                parseInt(e.target.value, 10) || 0
              )
            }
            className="w-20 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg text-gray-800 bg-white focus:border-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            style={{ fontSize: "18px" }}
          />
        </div>

        <button
          type="button"
          onClick={() => incrementDenomination(category, denominationKey)}
          className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-xl font-bold hover:bg-green-600 active:bg-green-700 transition-colors touch-manipulation"
        >
          <Plus size={24} />
        </button>
      </div>
      <div className="min-w-[120px] text-right">
        <span className="text-lg font-bold text-green-700">
          ${total.toFixed(2)}
        </span>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-green-50">
          <div className="flex items-center gap-3">
            <BanknoteIcon size={28} className="text-green-700" />
            <h2 className="text-2xl font-bold text-green-800">Agregar Fondo</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors touch-manipulation"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          <div className="flex items-start justify-between maxmd:flex-wrap gap-1">
            {/* Bills Section */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-blue-200 pb-2">
                💵 Billetes
              </h3>
              <div className="space-y-4">
                <DenominationRow
                  label="$1000"
                  count={cashBreakdown.bills.thousands.count}
                  total={cashBreakdown.bills.thousands.total}
                  category="bills"
                  denominationKey="thousands"
                />
                <DenominationRow
                  label="$500"
                  count={cashBreakdown.bills.fiveHundreds.count}
                  total={cashBreakdown.bills.fiveHundreds.total}
                  category="bills"
                  denominationKey="fiveHundreds"
                />
                <DenominationRow
                  label="$200"
                  count={cashBreakdown.bills.twoHundreds.count}
                  total={cashBreakdown.bills.twoHundreds.total}
                  category="bills"
                  denominationKey="twoHundreds"
                />
                <DenominationRow
                  label="$100"
                  count={cashBreakdown.bills.hundreds.count}
                  total={cashBreakdown.bills.hundreds.total}
                  category="bills"
                  denominationKey="hundreds"
                />
                <DenominationRow
                  label="$50"
                  count={cashBreakdown.bills.fifties.count}
                  total={cashBreakdown.bills.fifties.total}
                  category="bills"
                  denominationKey="fifties"
                />
                <DenominationRow
                  label="$20"
                  count={cashBreakdown.bills.twenties.count}
                  total={cashBreakdown.bills.twenties.total}
                  category="bills"
                  denominationKey="twenties"
                />
              </div>
            </div>

            {/* Coins Section */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-yellow-200 pb-2">
                🪙 Monedas
              </h3>
              <div className="space-y-4">
                <DenominationRow
                  label="$10"
                  count={cashBreakdown.coins.peso10.count}
                  total={cashBreakdown.coins.peso10.total}
                  category="coins"
                  denominationKey="peso10"
                />
                <DenominationRow
                  label="$5"
                  count={cashBreakdown.coins.peso5.count}
                  total={cashBreakdown.coins.peso5.total}
                  category="coins"
                  denominationKey="peso5"
                />
                <DenominationRow
                  label="$2"
                  count={cashBreakdown.coins.peso2.count}
                  total={cashBreakdown.coins.peso2.total}
                  category="coins"
                  denominationKey="peso2"
                />
                <DenominationRow
                  label="$1"
                  count={cashBreakdown.coins.peso1.count}
                  total={cashBreakdown.coins.peso1.total}
                  category="coins"
                  denominationKey="peso1"
                />
                <DenominationRow
                  label="$0.50"
                  count={cashBreakdown.coins.centavos50.count}
                  total={cashBreakdown.coins.centavos50.total}
                  category="coins"
                  denominationKey="centavos50"
                />
              </div>
            </div>
          </div>

          {/* Total Section */}
          <div className="bg-green-100 px-6 py-1 rounded-lg border-2 border-green-300">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-green-800">
                Total a Agregar:
              </span>
              <span className="text-3xl font-bold text-green-900">
                ${cashBreakdown.totalCash.toFixed(2)}
              </span>
            </div>
          </div>

          {state.message && (
            <p className="text-base text-red-600 bg-red-50 p-3 rounded">
              {state.message}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-4 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={sending}
            className="flex-1 h-14 px-6 text-lg font-bold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 active:bg-gray-400 transition-colors touch-manipulation disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={sending || cashBreakdown.totalCash === 0}
            className="flex-1 h-14 px-6 text-lg font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Procesando...
              </div>
            ) : (
              `AGREGAR ${cashBreakdown.totalCash.toFixed(2)}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
