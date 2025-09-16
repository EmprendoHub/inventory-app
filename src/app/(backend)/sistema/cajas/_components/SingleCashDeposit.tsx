"use client";

import { useFormState } from "react-dom";
import { createPettyCashAction } from "../_actions";
import { CashRegisterResponse } from "@/types/accounting";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/app/context/ModalContext";
import { verifySupervisorCode } from "@/app/_actions";
import { useSession } from "next-auth/react";
import { UserType } from "@/types/users";
import { BanknoteIcon } from "lucide-react";
import { CashBreakdown } from "@/types/pos";
import { calculateOptimalChange } from "@/lib/changeCalculation";
import dayjs from "dayjs";

export default function SingleCashDeposit({
  cashRegister,
}: {
  cashRegister: CashRegisterResponse;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as UserType;
  const { showModal } = useModal();
  const [hidden, setHidden] = useState(true);
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

  // State for change calculation warnings
  const [changeWarnings, setChangeWarnings] = useState<string[]>([]);

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
          (newBreakdown.bills as any)[key].count = count;
          (newBreakdown.bills as any)[key].total =
            (newBreakdown.bills as any)[key].value * count;
        } else {
          (newBreakdown.coins as any)[key].count = count;
          (newBreakdown.coins as any)[key].total =
            (newBreakdown.coins as any)[key].value * count;
        }
        newBreakdown.totalCash = calculateTotal(newBreakdown);
        return newBreakdown;
      });
    },
    [calculateTotal]
  ); // Check change-making capability for common amounts
  const checkChangeCapability = useCallback(() => {
    // Get current register breakdown plus what we're adding
    let currentBreakdown = selectedRegister?.billBreakdown as CashBreakdown;

    if (!currentBreakdown) {
      // If no existing breakdown, use only what we're adding
      currentBreakdown = cashBreakdown;
    } else {
      // Combine existing with what we're adding
      const combined: CashBreakdown = JSON.parse(
        JSON.stringify(currentBreakdown)
      );

      // Add bills
      Object.keys(cashBreakdown.bills).forEach((key) => {
        if ((combined.bills as any)[key] && (cashBreakdown.bills as any)[key]) {
          (combined.bills as any)[key].count += (cashBreakdown.bills as any)[
            key
          ].count;
          (combined.bills as any)[key].total =
            (combined.bills as any)[key].count *
            (combined.bills as any)[key].value;
        }
      });

      // Add coins
      Object.keys(cashBreakdown.coins).forEach((key) => {
        if ((combined.coins as any)[key] && (cashBreakdown.coins as any)[key]) {
          (combined.coins as any)[key].count += (cashBreakdown.coins as any)[
            key
          ].count;
          (combined.coins as any)[key].total =
            (combined.coins as any)[key].count *
            (combined.coins as any)[key].value;
        }
      });

      // Update total
      combined.totalCash = calculateTotal(combined);
      currentBreakdown = combined;
    }

    // Test common change amounts
    const commonChangeAmounts = [50, 100, 150, 200, 250, 300, 500];
    const warnings: string[] = [];

    for (const amount of commonChangeAmounts) {
      const result = calculateOptimalChange(amount, currentBreakdown);
      if (!result.success) {
        warnings.push(
          `Cambio de $${amount}: ${result.error || "No disponible"}`
        );
      }
    }

    setChangeWarnings(warnings);
  }, [cashBreakdown, selectedRegister, calculateTotal]);

  // Check change capability when breakdown changes
  useEffect(() => {
    if (cashBreakdown.totalCash > 0) {
      checkChangeCapability();
    } else {
      setChangeWarnings([]);
    }
  }, [cashBreakdown, checkChangeCapability]);

  const handleAuditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    event.preventDefault();
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
        // Set the total amount from cash breakdown
        formData.set("endBalance", cashBreakdown.totalCash.toString());
        formData.set("managerId", isAuthorized.authUserId.toString());
        formData.set("register", JSON.stringify(selectedRegister));
        formData.set(
          "startBalance",
          selectedRegister?.balance?.toString() || ""
        );
        // Add the cash breakdown to be added to the register
        formData.set("billBreakdown", JSON.stringify(cashBreakdown));
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

          const formElement = document.getElementById(
            "single-audit-register-form"
          ) as HTMLFormElement;
          formElement.reset();
          setSelectedRegister(cashRegister);
          router.push(`/sistema/cajas/personal/${user?.id || ""}`);
        }
      }

      setSending(false);
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col items-end">
      {!hidden && (
        <form
          id="single-audit-register-form"
          onSubmit={handleAuditSubmit}
          className="flex-1 space-y-4"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // Prevent form submission
            }
          }}
        >
          <div className="bg-card border rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-3 text-green-700">
              Desglose de Denominaciones a Agregar
            </h4>

            {/* Bills Section */}
            <div className="mb-4">
              <h5 className="text-xs font-medium text-gray-600 mb-2">
                Billetes
              </h5>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-12">$1000:</span>
                  <input
                    type="number"
                    min="0"
                    value={cashBreakdown.bills.thousands.count}
                    onChange={(e) =>
                      updateDenomination(
                        "bills",
                        "thousands",
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    className="w-16 px-2 py-1 border rounded text-xs bg-background"
                  />
                  <span className="text-gray-600 flex-1">
                    ${cashBreakdown.bills.thousands.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12">$500:</span>
                  <input
                    type="number"
                    min="0"
                    value={cashBreakdown.bills.fiveHundreds.count}
                    onChange={(e) =>
                      updateDenomination(
                        "bills",
                        "fiveHundreds",
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    className="w-16 px-2 py-1 border rounded text-xs bg-background"
                  />
                  <span className="text-gray-600 flex-1">
                    ${cashBreakdown.bills.fiveHundreds.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12">$200:</span>
                  <input
                    type="number"
                    min="0"
                    value={cashBreakdown.bills.twoHundreds.count}
                    onChange={(e) =>
                      updateDenomination(
                        "bills",
                        "twoHundreds",
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    className="w-16 px-2 py-1 border rounded text-xs bg-background"
                  />
                  <span className="text-gray-600 flex-1">
                    ${cashBreakdown.bills.twoHundreds.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12">$100:</span>
                  <input
                    type="number"
                    min="0"
                    value={cashBreakdown.bills.hundreds.count}
                    onChange={(e) =>
                      updateDenomination(
                        "bills",
                        "hundreds",
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    className="w-16 px-2 py-1 border rounded text-xs bg-background"
                  />
                  <span className="text-gray-600 flex-1">
                    ${cashBreakdown.bills.hundreds.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12">$50:</span>
                  <input
                    type="number"
                    min="0"
                    value={cashBreakdown.bills.fifties.count}
                    onChange={(e) =>
                      updateDenomination(
                        "bills",
                        "fifties",
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    className="w-16 px-2 py-1 border rounded text-xs bg-background"
                  />
                  <span className="text-gray-600 flex-1">
                    ${cashBreakdown.bills.fifties.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12">$20:</span>
                  <input
                    type="number"
                    min="0"
                    value={cashBreakdown.bills.twenties.count}
                    onChange={(e) =>
                      updateDenomination(
                        "bills",
                        "twenties",
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    className="w-16 px-2 py-1 border rounded text-xs bg-background"
                  />
                  <span className="text-gray-600 flex-1">
                    ${cashBreakdown.bills.twenties.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Coins Section */}
            <div className="mb-4">
              <h5 className="text-xs font-medium text-gray-600 mb-2">
                Monedas
              </h5>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-12">$10:</span>
                  <input
                    type="number"
                    min="0"
                    value={cashBreakdown.coins.peso10.count}
                    onChange={(e) =>
                      updateDenomination(
                        "coins",
                        "peso10",
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    className="w-16 px-2 py-1 border rounded text-xs bg-background"
                  />
                  <span className="text-gray-600 flex-1">
                    ${cashBreakdown.coins.peso10.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12">$5:</span>
                  <input
                    type="number"
                    min="0"
                    value={cashBreakdown.coins.peso5.count}
                    onChange={(e) =>
                      updateDenomination(
                        "coins",
                        "peso5",
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    className="w-16 px-2 py-1 border rounded text-xs bg-background"
                  />
                  <span className="text-gray-600 flex-1">
                    ${cashBreakdown.coins.peso5.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12">$1:</span>
                  <input
                    type="number"
                    min="0"
                    value={cashBreakdown.coins.peso1.count}
                    onChange={(e) =>
                      updateDenomination(
                        "coins",
                        "peso1",
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    className="w-16 px-2 py-1 border rounded text-xs bg-background"
                  />
                  <span className="text-gray-600 flex-1">
                    ${cashBreakdown.coins.peso1.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12">$0.50:</span>
                  <input
                    type="number"
                    min="0"
                    value={cashBreakdown.coins.centavos50.count}
                    onChange={(e) =>
                      updateDenomination(
                        "coins",
                        "centavos50",
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    className="w-16 px-2 py-1 border rounded text-xs bg-background"
                  />
                  <span className="text-gray-600 flex-1">
                    ${cashBreakdown.coins.centavos50.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Section */}
            <div className="bg-green-50 p-3 rounded border-t-2 border-green-600">
              <div className="flex justify-between items-center font-semibold text-green-800">
                <span>Total a Agregar:</span>
                <span className="text-lg">
                  ${cashBreakdown.totalCash.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Change Capability Warnings */}
            {changeWarnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mt-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      ⚠️ Advertencia de Cambio Insuficiente
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p className="mb-2">
                        Después de agregar este fondo, la caja NO podrá dar
                        cambio para:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {changeWarnings.map((warning, index) => (
                          <li key={index} className="font-medium">
                            ${warning}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-xs font-medium bg-yellow-100 p-2 rounded">
                        💡 Considera agregar billetes más pequeños para poder
                        dar cambio correctamente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <input type="hidden" name="auditDate" value={formattedDate} />

          <button
            type="submit"
            disabled={sending || cashBreakdown.totalCash === 0}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-[12px] font-medium rounded-md text-white ${
              cashBreakdown.totalCash === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-emerald-700 hover:bg-emerald-900"
            } mt-3 w-full`}
          >
            {sending && <span className="loader"></span>}
            AGREGAR ${cashBreakdown.totalCash.toFixed(2)}
          </button>
          {state.message && (
            <p className="text-sm text-gray-600">{state.message}</p>
          )}
        </form>
      )}
      {user?.role === "GERENTE" && (
        <button
          onClick={() => setHidden((prev) => !prev)}
          className={`flex items-center gap-2 bg-slate-900 text-white text-xs px-6 py-1 rounded-md mt-2  leading-none`}
        >
          <BanknoteIcon size={18} className="text-2xl" />
          <span className={`text-[12px] `}>AGREGAR FONDO</span>
        </button>
      )}
    </div>
  );
}
