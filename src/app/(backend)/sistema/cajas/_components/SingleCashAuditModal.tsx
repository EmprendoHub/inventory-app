"use client";

import { useFormState } from "react-dom";
import { createCashAuditAction, createCashHandoffAction } from "../_actions";
import { CashRegisterResponse } from "@/types/accounting";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/app/context/ModalContext";
import { verifySupervisorCode } from "@/app/_actions";
import { useSession } from "next-auth/react";
import { UserType } from "@/types/users";
import { BanknoteIcon, X, Plus, Minus } from "lucide-react";
import dayjs from "dayjs";
import { CashBreakdown } from "@/types/pos";

interface SingleCashAuditModalProps {
  cashRegister: CashRegisterResponse;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SingleCashAuditModal({
  cashRegister,
  isOpen,
  onClose,
  onSuccess,
}: SingleCashAuditModalProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as UserType;
  const { showModal } = useModal();
  const formattedDate = dayjs(new Date()).format("YYYY-MM-DD");
  // eslint-disable-next-line
  const [state, formAction] = useFormState(createCashAuditAction, {
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
      centavos20: { value: 0, count: 0, total: 0 },
      centavos10: { value: 0, count: 0, total: 0 },
    },
    totalCash: 0,
  });

  // Expected breakdown from cash register (what should be there based on POS transactions)
  const expectedBreakdown = cashRegister.billBreakdown as CashBreakdown | null;

  // Function to calculate total from cash breakdown
  const calculateTotal = (breakdown: CashBreakdown): number => {
    const billTotal = Object.values(breakdown.bills).reduce(
      (sum, bill) => sum + bill.total,
      0
    );
    const coinTotal = Object.values(breakdown.coins).reduce(
      (sum, coin) => sum + coin.total,
      0
    );
    return billTotal + coinTotal;
  };

  // Function to subtract cash breakdown amounts (for updating register after audit)
  const subtractCashBreakdowns = (
    existing: CashBreakdown | null,
    toSubtract: CashBreakdown
  ): CashBreakdown => {
    if (!existing) {
      // If no existing breakdown, return zero breakdown
      return {
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
          centavos20: { value: 0, count: 0, total: 0 },
          centavos10: { value: 0, count: 0, total: 0 },
        },
        totalCash: 0,
      };
    }

    const result: CashBreakdown = {
      bills: {
        thousands: {
          value: 1000,
          count: Math.max(
            0,
            (existing.bills?.thousands?.count || 0) -
              toSubtract.bills.thousands.count
          ),
          total: 0,
        },
        fiveHundreds: {
          value: 500,
          count: Math.max(
            0,
            (existing.bills?.fiveHundreds?.count || 0) -
              toSubtract.bills.fiveHundreds.count
          ),
          total: 0,
        },
        twoHundreds: {
          value: 200,
          count: Math.max(
            0,
            (existing.bills?.twoHundreds?.count || 0) -
              toSubtract.bills.twoHundreds.count
          ),
          total: 0,
        },
        hundreds: {
          value: 100,
          count: Math.max(
            0,
            (existing.bills?.hundreds?.count || 0) -
              toSubtract.bills.hundreds.count
          ),
          total: 0,
        },
        fifties: {
          value: 50,
          count: Math.max(
            0,
            (existing.bills?.fifties?.count || 0) -
              toSubtract.bills.fifties.count
          ),
          total: 0,
        },
        twenties: {
          value: 20,
          count: Math.max(
            0,
            (existing.bills?.twenties?.count || 0) -
              toSubtract.bills.twenties.count
          ),
          total: 0,
        },
        tens: { value: 10, count: 0, total: 0 },
        fives: { value: 5, count: 0, total: 0 },
        ones: { value: 1, count: 0, total: 0 },
      },
      coins: {
        peso20: {
          value: 20,
          count: Math.max(
            0,
            (existing.coins?.peso20?.count || 0) - toSubtract.coins.peso20.count
          ),
          total: 0,
        },
        peso10: {
          value: 10,
          count: Math.max(
            0,
            (existing.coins?.peso10?.count || 0) - toSubtract.coins.peso10.count
          ),
          total: 0,
        },
        peso5: {
          value: 5,
          count: Math.max(
            0,
            (existing.coins?.peso5?.count || 0) - toSubtract.coins.peso5.count
          ),
          total: 0,
        },
        peso2: {
          value: 2,
          count: Math.max(
            0,
            (existing.coins?.peso2?.count || 0) - toSubtract.coins.peso2.count
          ),
          total: 0,
        },
        peso1: {
          value: 1,
          count: Math.max(
            0,
            (existing.coins?.peso1?.count || 0) - toSubtract.coins.peso1.count
          ),
          total: 0,
        },
        centavos50: {
          value: 0.5,
          count: Math.max(
            0,
            (existing.coins?.centavos50?.count || 0) -
              toSubtract.coins.centavos50.count
          ),
          total: 0,
        },
        centavos20: { value: 0, count: 0, total: 0 },
        centavos10: { value: 0, count: 0, total: 0 },
      },
      totalCash: 0,
    };

    // Calculate totals for each denomination
    Object.entries(result.bills).forEach(([key, bill]) => {
      (result.bills as any)[key].total = bill.value * bill.count;
    });
    Object.entries(result.coins).forEach(([key, coin]) => {
      (result.coins as any)[key].total = coin.value * coin.count;
    });

    result.totalCash = calculateTotal(result);
    return result;
  };

  // Function to update denomination count and total
  const updateDenomination = (
    category: "bills" | "coins",
    key: string,
    count: number
  ) => {
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
  };

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

  // Print receipt function
  const printCashBreakdownReceipt = () => {
    const currentDate = new Date();
    const formattedDateTime = currentDate.toLocaleString("es-MX");

    const receiptContent = `
      <html>
        <head>
          <title>Corte de Caja - Desglose de Billetes</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; font-size: 14px; }
            .header { text-align: center; border-bottom: 2px solid #000; margin-bottom: 20px; }
            .section { margin: 15px 0; }
            .denomination-line { display: flex; justify-content: space-between; margin: 5px 0; }
            .total-line { font-weight: bold; border-top: 1px solid #000; padding-top: 10px; }
            .footer { margin-top: 30px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>CORTE DE CAJA</h2>
            <h3>Desglose de Denominaciones</h3>
            <p>Fecha: ${formattedDateTime}</p>
            <p>Empleado: ${user?.name || "N/A"}</p>
            <p>Caja: ${selectedRegister?.name || "N/A"}</p>
          </div>
          
          <div class="section">
            <h3>BILLETES</h3>
            <div class="denomination-line">
              <span>$1000 x ${cashBreakdown.bills.thousands.count}</span>
              <span>$${cashBreakdown.bills.thousands.total.toFixed(2)}</span>
            </div>
            <div class="denomination-line">
              <span>$500 x ${cashBreakdown.bills.fiveHundreds.count}</span>
              <span>$${cashBreakdown.bills.fiveHundreds.total.toFixed(2)}</span>
            </div>
            <div class="denomination-line">
              <span>$200 x ${cashBreakdown.bills.twoHundreds.count}</span>
              <span>$${cashBreakdown.bills.twoHundreds.total.toFixed(2)}</span>
            </div>
            <div class="denomination-line">
              <span>$100 x ${cashBreakdown.bills.hundreds.count}</span>
              <span>$${cashBreakdown.bills.hundreds.total.toFixed(2)}</span>
            </div>
            <div class="denomination-line">
              <span>$50 x ${cashBreakdown.bills.fifties.count}</span>
              <span>$${cashBreakdown.bills.fifties.total.toFixed(2)}</span>
            </div>
            <div class="denomination-line">
              <span>$20 x ${cashBreakdown.bills.twenties.count}</span>
              <span>$${cashBreakdown.bills.twenties.total.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="section">
            <h3>MONEDAS</h3>
            <div class="denomination-line">
              <span>$20 x ${cashBreakdown.coins.peso20.count}</span>
              <span>$${cashBreakdown.coins.peso20.total.toFixed(2)}</span>
            </div>
            <div class="denomination-line">
              <span>$10 x ${cashBreakdown.coins.peso10.count}</span>
              <span>$${cashBreakdown.coins.peso10.total.toFixed(2)}</span>
            </div>
            <div class="denomination-line">
              <span>$5 x ${cashBreakdown.coins.peso5.count}</span>
              <span>$${cashBreakdown.coins.peso5.total.toFixed(2)}</span>
            </div>
            <div class="denomination-line">
              <span>$2 x ${cashBreakdown.coins.peso2.count}</span>
              <span>$${cashBreakdown.coins.peso2.total.toFixed(2)}</span>
            </div>
            <div class="denomination-line">
              <span>$1 x ${cashBreakdown.coins.peso1.count}</span>
              <span>$${cashBreakdown.coins.peso1.total.toFixed(2)}</span>
            </div>
            <div class="denomination-line">
              <span>50¢ x ${cashBreakdown.coins.centavos50.count}</span>
              <span>$${cashBreakdown.coins.centavos50.total.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="section total-line">
            <div class="denomination-line">
              <span>TOTAL CONTADO:</span>
              <span>$${cashBreakdown.totalCash.toFixed(2)}</span>
            </div>
            <div class="denomination-line">
              <span>SALDO SISTEMA:</span>
              <span>$${(selectedRegister?.balance || 0).toFixed(2)}</span>
            </div>
            <div class="denomination-line">
              <span>DIFERENCIA:</span>
              <span>$${(
                cashBreakdown.totalCash - (selectedRegister?.balance || 0)
              ).toFixed(2)}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>_____________________________</p>
            <p>Firma del Supervisor</p>
            <br>
            <p>_____________________________</p>
            <p>Firma del Empleado</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
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

        // Update the cash register's billBreakdown by subtracting the counted amounts
        const updatedRegisterBreakdown = subtractCashBreakdowns(
          expectedBreakdown,
          cashBreakdown
        );
        formData.set("billBreakdown", JSON.stringify(updatedRegisterBreakdown));
        formData.set("auditDate", formattedDate);

        const result = await createCashAuditAction(state, formData);

        if (result.success) {
          // Print the cash breakdown receipt automatically
          printCashBreakdownReceipt();

          await showModal({
            title: "Corte de Caja completado!",
            type: "delete",
            text: "El corte de caja ha sido completado exitosamente.",
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
              centavos20: { value: 0, count: 0, total: 0 },
              centavos10: { value: 0, count: 0, total: 0 },
            },
            totalCash: 0,
          });

          setSelectedRegister(cashRegister);
          onSuccess?.();
          onClose();
          router.push(`/sistema/cajas/personal/${user?.id || ""}`);
        }
      }

      if (isAuthorized.success && user.role === "CHOFER") {
        const formData = new FormData();
        formData.set("endBalance", cashBreakdown.totalCash.toString());
        formData.set("managerId", isAuthorized.authUserId.toString());
        formData.set("register", JSON.stringify(selectedRegister));
        formData.set(
          "startBalance",
          selectedRegister?.balance?.toString() || ""
        );

        // Update the cash register's billBreakdown by subtracting the counted amounts
        const updatedRegisterBreakdown = subtractCashBreakdowns(
          expectedBreakdown,
          cashBreakdown
        );
        formData.set("billBreakdown", JSON.stringify(updatedRegisterBreakdown));
        formData.set("auditDate", formattedDate);

        const result = await createCashHandoffAction(state, formData);

        if (result.success) {
          // Print the cash breakdown receipt automatically
          printCashBreakdownReceipt();

          await showModal({
            title: "Entrega de Efectivo completado!",
            type: "delete",
            text: "Entrega de Efectivo ha sido completado exitosamente.",
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
              centavos20: { value: 0, count: 0, total: 0 },
              centavos10: { value: 0, count: 0, total: 0 },
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
    expectedCount = 0,
  }: {
    label: string;
    count: number;
    total: number;
    category: "bills" | "coins";
    denominationKey: string;
    expectedCount?: number;
  }) => {
    const difference = count - expectedCount;
    const hasDiscrepancy = difference !== 0;

    return (
      <div
        className={`flex items-center justify-between p-2 rounded-lg border-2 ${
          hasDiscrepancy
            ? difference > 0
              ? "bg-green-50 border-green-300"
              : "bg-red-50 border-red-300"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-gray-700 min-w-[80px]">
            {label}
          </span>
          {expectedCount > 0 && (
            <span className="text-sm text-gray-500">
              Esperado: {expectedCount}
            </span>
          )}
          {hasDiscrepancy && (
            <span
              className={`text-sm font-bold ${
                difference > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {difference > 0 ? "+" : ""}
              {difference}
            </span>
          )}
        </div>

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

        <div className="min-w-[100px] text-right">
          <span className="text-lg font-bold text-green-700">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  const systemBalance = selectedRegister?.balance || 0;
  const countedBalance = cashBreakdown.totalCash;
  const difference = countedBalance - systemBalance;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-purple-50">
          <div className="flex items-center gap-3">
            <BanknoteIcon size={28} className="text-purple-700" />
            <h2 className="text-2xl font-bold text-purple-800">
              {user?.role === "CHOFER" ? "Entregar Efectivo" : "Corte de Caja"}
            </h2>
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
          {/* Summary Section */}
          <div className="bg-blue-50 p-2 rounded-lg border-2 border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Saldo del Sistema</p>
                <p className="text-2xl font-bold text-blue-700">
                  ${systemBalance.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Contado</p>
                <p className="text-2xl font-bold text-green-700">
                  ${countedBalance.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Diferencia</p>
                <p
                  className={`text-2xl font-bold ${
                    difference === 0
                      ? "text-gray-700"
                      : difference > 0
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {difference >= 0 ? "+" : ""}${difference.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between maxmd:flex-wrap gap-1">
            {/* Bills Section */}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-blue-200 pb-2">
                💵 Billetes
              </h3>
              <div className="space-y-2 flex flex-wrap">
                <DenominationRow
                  label="$1000"
                  count={cashBreakdown.bills.thousands.count}
                  total={cashBreakdown.bills.thousands.total}
                  category="bills"
                  denominationKey="thousands"
                  expectedCount={
                    expectedBreakdown?.bills?.thousands?.count || 0
                  }
                />
                <DenominationRow
                  label="$500"
                  count={cashBreakdown.bills.fiveHundreds.count}
                  total={cashBreakdown.bills.fiveHundreds.total}
                  category="bills"
                  denominationKey="fiveHundreds"
                  expectedCount={
                    expectedBreakdown?.bills?.fiveHundreds?.count || 0
                  }
                />
                <DenominationRow
                  label="$200"
                  count={cashBreakdown.bills.twoHundreds.count}
                  total={cashBreakdown.bills.twoHundreds.total}
                  category="bills"
                  denominationKey="twoHundreds"
                  expectedCount={
                    expectedBreakdown?.bills?.twoHundreds?.count || 0
                  }
                />
                <DenominationRow
                  label="$100"
                  count={cashBreakdown.bills.hundreds.count}
                  total={cashBreakdown.bills.hundreds.total}
                  category="bills"
                  denominationKey="hundreds"
                  expectedCount={expectedBreakdown?.bills?.hundreds?.count || 0}
                />
                <DenominationRow
                  label="$50"
                  count={cashBreakdown.bills.fifties.count}
                  total={cashBreakdown.bills.fifties.total}
                  category="bills"
                  denominationKey="fifties"
                  expectedCount={expectedBreakdown?.bills?.fifties?.count || 0}
                />
                <DenominationRow
                  label="$20"
                  count={cashBreakdown.bills.twenties.count}
                  total={cashBreakdown.bills.twenties.total}
                  category="bills"
                  denominationKey="twenties"
                  expectedCount={expectedBreakdown?.bills?.twenties?.count || 0}
                />
              </div>
            </div>

            {/* Coins Section */}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-yellow-200 pb-2">
                🪙 Monedas
              </h3>
              <div className="space-y-4 flex flex-wrap">
                <DenominationRow
                  label="$10"
                  count={cashBreakdown.coins.peso10.count}
                  total={cashBreakdown.coins.peso10.total}
                  category="coins"
                  denominationKey="peso10"
                  expectedCount={expectedBreakdown?.coins?.peso10?.count || 0}
                />
                <DenominationRow
                  label="$5"
                  count={cashBreakdown.coins.peso5.count}
                  total={cashBreakdown.coins.peso5.total}
                  category="coins"
                  denominationKey="peso5"
                  expectedCount={expectedBreakdown?.coins?.peso5?.count || 0}
                />
                <DenominationRow
                  label="$2"
                  count={cashBreakdown.coins.peso2.count}
                  total={cashBreakdown.coins.peso2.total}
                  category="coins"
                  denominationKey="peso2"
                  expectedCount={expectedBreakdown?.coins?.peso2?.count || 0}
                />
                <DenominationRow
                  label="$1"
                  count={cashBreakdown.coins.peso1.count}
                  total={cashBreakdown.coins.peso1.total}
                  category="coins"
                  denominationKey="peso1"
                  expectedCount={expectedBreakdown?.coins?.peso1?.count || 0}
                />
                <DenominationRow
                  label="$0.50"
                  count={cashBreakdown.coins.centavos50.count}
                  total={cashBreakdown.coins.centavos50.total}
                  category="coins"
                  denominationKey="centavos50"
                  expectedCount={
                    expectedBreakdown?.coins?.centavos50?.count || 0
                  }
                />
              </div>
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
            disabled={sending}
            className="flex-1 h-14 px-6 text-lg font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors touch-manipulation disabled:opacity-50"
          >
            {sending ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Procesando...
              </div>
            ) : user?.role === "CHOFER" ? (
              "ENTREGAR"
            ) : (
              "RECIBIR"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
