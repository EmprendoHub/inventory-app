"use client";

import { useFormState } from "react-dom";
import { createCashAuditAction, createCashHandoffAction } from "../_actions";
import { CashRegisterResponse } from "@/types/accounting";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/app/context/ModalContext";
import { verifySupervisorCode } from "@/app/_actions";
import { useSession } from "next-auth/react";
import { UserType } from "@/types/users";
import { BanknoteIcon } from "lucide-react";
import dayjs from "dayjs";
import { CashBreakdown } from "@/types/pos";
import { getMexicoGlobalUtcSelectedDate } from "@/lib/utils";

export default function SingleCashAudit({
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
  const [state, formAction] = useFormState(createCashAuditAction, {
    success: false,
    message: "",
    errors: {},
  });
  const [sending, setSending] = useState(false);
  const [endBalance, setEndBalance] = useState(0);

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

  // Sync endBalance with cashBreakdown total
  useEffect(() => {
    setEndBalance(cashBreakdown.totalCash);
  }, [cashBreakdown.totalCash]);

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
  };

  // Print receipt function
  const printCashBreakdownReceipt = () => {
    const formattedDateTime = getMexicoGlobalUtcSelectedDate(new Date());

    const receiptContent = `
      <html>
        <head>
          <title>Corte de Caja - Desglose de Billetes</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; }
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
        // Set the total counted amount in the "Se recibe" input
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

          const formElement = document.getElementById(
            "single-audit-register-form"
          ) as HTMLFormElement;
          formElement.reset();
          setSelectedRegister(cashRegister);
          router.push(`/sistema/cajas/personal/${user?.id || ""}`);
        }
      }

      if (isAuthorized.success && user.role === "CHOFER") {
        // Set the total counted amount in the "Se recibe" input
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
          className="flex-1 "
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // Prevent form submission
            }
          }}
        >
          <div className="w-full">
            <label
              htmlFor="endBalance"
              className="block mb-2 text-sm font-medium text-muted"
            >
              Se recibe
            </label>
            <input
              type="number"
              id="endBalance"
              name="endBalance"
              value={endBalance.toFixed(2)}
              readOnly
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-not-allowed"
              min={0}
            />
            {state?.errors?.endBalance && (
              <p className="text-sm text-red-500">
                {state.errors.endBalance.join(", ")}
              </p>
            )}
          </div>

          {/* Cash Breakdown Section */}
          <div className="mt-6 p-4 border rounded-lg bg-card">
            <h3 className="text-sm font-medium mb-4">Desglose de Efectivo</h3>

            <div className="flex flex-wrap justify-center items-center gap-5">
              {/* Bills Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium">Billetes</h4>
                  {expectedBreakdown && (
                    <div className="text-xs text-gray-500 flex items-center justify-between gap-2 w-10">
                      <span>Recibido</span>
                    </div>
                  )}
                  {expectedBreakdown && (
                    <div className="text-xs text-gray-500 flex items-center justify-between gap-2 w-10">
                      <span>Actual</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-12">$1000:</span>
                    {expectedBreakdown && (
                      <span className="w-8 text-gray-500 text-center">
                        {expectedBreakdown.bills?.thousands?.count || 0}
                      </span>
                    )}
                    <input
                      type="number"
                      min="0"
                      value={cashBreakdown.bills.thousands.count}
                      onChange={(e) =>
                        updateDenomination(
                          "bills",
                          "thousands",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-16 px-2 py-1 border rounded text-xs bg-background"
                    />
                    <span className="text-gray-600 flex-1">
                      ${cashBreakdown.bills.thousands.total.toFixed(2)}
                    </span>
                    {expectedBreakdown &&
                      cashBreakdown.bills.thousands.count !==
                        (expectedBreakdown.bills?.thousands?.count || 0) && (
                        <span className="text-red-500 text-xs">
                          (
                          {cashBreakdown.bills.thousands.count -
                            (expectedBreakdown.bills?.thousands?.count || 0) >
                          0
                            ? "+"
                            : ""}
                          {cashBreakdown.bills.thousands.count -
                            (expectedBreakdown.bills?.thousands?.count || 0)}
                          )
                        </span>
                      )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-12">$500:</span>
                    {expectedBreakdown && (
                      <span className="w-8 text-gray-500 text-center">
                        {expectedBreakdown.bills?.fiveHundreds?.count || 0}
                      </span>
                    )}
                    <input
                      type="number"
                      min="0"
                      value={cashBreakdown.bills.fiveHundreds.count}
                      onChange={(e) =>
                        updateDenomination(
                          "bills",
                          "fiveHundreds",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-16 px-2 py-1 border rounded text-xs bg-background"
                    />
                    <span className="text-gray-600 flex-1">
                      ${cashBreakdown.bills.fiveHundreds.total.toFixed(2)}
                    </span>
                    {expectedBreakdown &&
                      cashBreakdown.bills.fiveHundreds.count !==
                        (expectedBreakdown.bills?.fiveHundreds?.count || 0) && (
                        <span className="text-red-500 text-xs">
                          (
                          {cashBreakdown.bills.fiveHundreds.count -
                            (expectedBreakdown.bills?.fiveHundreds?.count ||
                              0) >
                          0
                            ? "+"
                            : ""}
                          {cashBreakdown.bills.fiveHundreds.count -
                            (expectedBreakdown.bills?.fiveHundreds?.count || 0)}
                          )
                        </span>
                      )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-12">$200:</span>
                    {expectedBreakdown && (
                      <span className="w-8 text-gray-500 text-center">
                        {expectedBreakdown.bills?.twoHundreds?.count || 0}
                      </span>
                    )}
                    <input
                      type="number"
                      min="0"
                      value={cashBreakdown.bills.twoHundreds.count}
                      onChange={(e) =>
                        updateDenomination(
                          "bills",
                          "twoHundreds",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-16 px-2 py-1 border rounded text-xs bg-background"
                    />
                    <span className="text-gray-600 flex-1">
                      ${cashBreakdown.bills.twoHundreds.total.toFixed(2)}
                    </span>
                    {expectedBreakdown &&
                      cashBreakdown.bills.twoHundreds.count !==
                        (expectedBreakdown.bills?.twoHundreds?.count || 0) && (
                        <span className="text-red-500 text-xs">
                          (
                          {cashBreakdown.bills.twoHundreds.count -
                            (expectedBreakdown.bills?.twoHundreds?.count || 0) >
                          0
                            ? "+"
                            : ""}
                          {cashBreakdown.bills.twoHundreds.count -
                            (expectedBreakdown.bills?.twoHundreds?.count || 0)}
                          )
                        </span>
                      )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-12">$100:</span>
                    {expectedBreakdown && (
                      <span className="w-8 text-gray-500 text-center">
                        {expectedBreakdown.bills?.hundreds?.count || 0}
                      </span>
                    )}
                    <input
                      type="number"
                      min="0"
                      value={cashBreakdown.bills.hundreds.count}
                      onChange={(e) =>
                        updateDenomination(
                          "bills",
                          "hundreds",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-16 px-2 py-1 border rounded text-xs bg-background"
                    />
                    <span className="text-gray-600 flex-1">
                      ${cashBreakdown.bills.hundreds.total.toFixed(2)}
                    </span>
                    {expectedBreakdown &&
                      cashBreakdown.bills.hundreds.count !==
                        (expectedBreakdown.bills?.hundreds?.count || 0) && (
                        <span className="text-red-500 text-xs">
                          (
                          {cashBreakdown.bills.hundreds.count -
                            (expectedBreakdown.bills?.hundreds?.count || 0) >
                          0
                            ? "+"
                            : ""}
                          {cashBreakdown.bills.hundreds.count -
                            (expectedBreakdown.bills?.hundreds?.count || 0)}
                          )
                        </span>
                      )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-12">$50:</span>
                    {expectedBreakdown && (
                      <span className="w-8 text-gray-500 text-center">
                        {expectedBreakdown.bills?.fifties?.count || 0}
                      </span>
                    )}
                    <input
                      type="number"
                      min="0"
                      value={cashBreakdown.bills.fifties.count}
                      onChange={(e) =>
                        updateDenomination(
                          "bills",
                          "fifties",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-16 px-2 py-1 border rounded text-xs bg-background"
                    />
                    <span className="text-gray-600 flex-1">
                      ${cashBreakdown.bills.fifties.total.toFixed(2)}
                    </span>
                    {expectedBreakdown &&
                      cashBreakdown.bills.fifties.count !==
                        (expectedBreakdown.bills?.fifties?.count || 0) && (
                        <span className="text-red-500 text-xs">
                          (
                          {cashBreakdown.bills.fifties.count -
                            (expectedBreakdown.bills?.fifties?.count || 0) >
                          0
                            ? "+"
                            : ""}
                          {cashBreakdown.bills.fifties.count -
                            (expectedBreakdown.bills?.fifties?.count || 0)}
                          )
                        </span>
                      )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-12">$20:</span>
                    {expectedBreakdown && (
                      <span className="w-8 text-gray-500 text-center">
                        {expectedBreakdown.bills?.twenties?.count || 0}
                      </span>
                    )}
                    <input
                      type="number"
                      min="0"
                      value={cashBreakdown.bills.twenties.count}
                      onChange={(e) =>
                        updateDenomination(
                          "bills",
                          "twenties",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-16 px-2 py-1 border rounded text-xs bg-background"
                    />
                    <span className="text-gray-600 flex-1">
                      ${cashBreakdown.bills.twenties.total.toFixed(2)}
                    </span>
                    {expectedBreakdown &&
                      cashBreakdown.bills.twenties.count !==
                        (expectedBreakdown.bills?.twenties?.count || 0) && (
                        <span className="text-red-500 text-xs">
                          (
                          {cashBreakdown.bills.twenties.count -
                            (expectedBreakdown.bills?.twenties?.count || 0) >
                          0
                            ? "+"
                            : ""}
                          {cashBreakdown.bills.twenties.count -
                            (expectedBreakdown.bills?.twenties?.count || 0)}
                          )
                        </span>
                      )}
                  </div>
                </div>
              </div>

              {/* Coins Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium">Monedas</h4>
                  {expectedBreakdown && (
                    <div className="text-xs text-gray-500 flex items-center justify-between gap-2 w-10">
                      <span>Recibido</span>
                    </div>
                  )}
                  {expectedBreakdown && (
                    <div className="text-xs text-gray-500 flex items-center justify-between gap-2 w-10">
                      <span>Actual</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-12">$20:</span>
                    {expectedBreakdown && (
                      <span className="w-8 text-gray-500 text-center">
                        {expectedBreakdown.coins?.peso20?.count || 0}
                      </span>
                    )}
                    <input
                      type="number"
                      min="0"
                      value={cashBreakdown.coins.peso20.count}
                      onChange={(e) =>
                        updateDenomination(
                          "coins",
                          "peso20",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-16 px-2 py-1 border rounded text-xs bg-background"
                    />
                    <span className="text-gray-600 flex-1">
                      ${cashBreakdown.coins.peso20.total.toFixed(2)}
                    </span>
                    {expectedBreakdown &&
                      cashBreakdown.coins.peso20.count !==
                        (expectedBreakdown.coins?.peso20?.count || 0) && (
                        <span className="text-red-500 text-xs">
                          (
                          {cashBreakdown.coins.peso20.count -
                            (expectedBreakdown.coins?.peso20?.count || 0) >
                          0
                            ? "+"
                            : ""}
                          {cashBreakdown.coins.peso20.count -
                            (expectedBreakdown.coins?.peso20?.count || 0)}
                          )
                        </span>
                      )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-12">$10:</span>
                    {expectedBreakdown && (
                      <span className="w-8 text-gray-500 text-center">
                        {expectedBreakdown.coins?.peso10?.count || 0}
                      </span>
                    )}
                    <input
                      type="number"
                      min="0"
                      value={cashBreakdown.coins.peso10.count}
                      onChange={(e) =>
                        updateDenomination(
                          "coins",
                          "peso10",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-16 px-2 py-1 border rounded text-xs bg-background"
                    />
                    <span className="text-gray-600 flex-1">
                      ${cashBreakdown.coins.peso10.total.toFixed(2)}
                    </span>
                    {expectedBreakdown &&
                      cashBreakdown.coins.peso10.count !==
                        (expectedBreakdown.coins?.peso10?.count || 0) && (
                        <span className="text-red-500 text-xs">
                          (
                          {cashBreakdown.coins.peso10.count -
                            (expectedBreakdown.coins?.peso10?.count || 0) >
                          0
                            ? "+"
                            : ""}
                          {cashBreakdown.coins.peso10.count -
                            (expectedBreakdown.coins?.peso10?.count || 0)}
                          )
                        </span>
                      )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-12">$5:</span>
                    {expectedBreakdown && (
                      <span className="w-8 text-gray-500 text-center">
                        {expectedBreakdown.coins?.peso5?.count || 0}
                      </span>
                    )}
                    <input
                      type="number"
                      min="0"
                      value={cashBreakdown.coins.peso5.count}
                      onChange={(e) =>
                        updateDenomination(
                          "coins",
                          "peso5",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-16 px-2 py-1 border rounded text-xs bg-background"
                    />
                    <span className="text-gray-600 flex-1">
                      ${cashBreakdown.coins.peso5.total.toFixed(2)}
                    </span>
                    {expectedBreakdown &&
                      cashBreakdown.coins.peso5.count !==
                        (expectedBreakdown.coins?.peso5?.count || 0) && (
                        <span className="text-red-500 text-xs">
                          (
                          {cashBreakdown.coins.peso5.count -
                            (expectedBreakdown.coins?.peso5?.count || 0) >
                          0
                            ? "+"
                            : ""}
                          {cashBreakdown.coins.peso5.count -
                            (expectedBreakdown.coins?.peso5?.count || 0)}
                          )
                        </span>
                      )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-12">$2:</span>
                    {expectedBreakdown && (
                      <span className="w-8 text-gray-500 text-center">
                        {expectedBreakdown.coins?.peso2?.count || 0}
                      </span>
                    )}
                    <input
                      type="number"
                      min="0"
                      value={cashBreakdown.coins.peso2.count}
                      onChange={(e) =>
                        updateDenomination(
                          "coins",
                          "peso2",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-16 px-2 py-1 border rounded text-xs bg-background"
                    />
                    <span className="text-gray-600 flex-1">
                      ${cashBreakdown.coins.peso2.total.toFixed(2)}
                    </span>
                    {expectedBreakdown &&
                      cashBreakdown.coins.peso2.count !==
                        (expectedBreakdown.coins?.peso2?.count || 0) && (
                        <span className="text-red-500 text-xs">
                          (
                          {cashBreakdown.coins.peso2.count -
                            (expectedBreakdown.coins?.peso2?.count || 0) >
                          0
                            ? "+"
                            : ""}
                          {cashBreakdown.coins.peso2.count -
                            (expectedBreakdown.coins?.peso2?.count || 0)}
                          )
                        </span>
                      )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-12">$1:</span>
                    {expectedBreakdown && (
                      <span className="w-8 text-gray-500 text-center">
                        {expectedBreakdown.coins?.peso1?.count || 0}
                      </span>
                    )}
                    <input
                      type="number"
                      min="0"
                      value={cashBreakdown.coins.peso1.count}
                      onChange={(e) =>
                        updateDenomination(
                          "coins",
                          "peso1",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-16 px-2 py-1 border rounded text-xs bg-background"
                    />
                    <span className="text-gray-600 flex-1">
                      ${cashBreakdown.coins.peso1.total.toFixed(2)}
                    </span>
                    {expectedBreakdown &&
                      cashBreakdown.coins.peso1.count !==
                        (expectedBreakdown.coins?.peso1?.count || 0) && (
                        <span className="text-red-500 text-xs">
                          (
                          {cashBreakdown.coins.peso1.count -
                            (expectedBreakdown.coins?.peso1?.count || 0) >
                          0
                            ? "+"
                            : ""}
                          {cashBreakdown.coins.peso1.count -
                            (expectedBreakdown.coins?.peso1?.count || 0)}
                          )
                        </span>
                      )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-12">50¢:</span>
                    {expectedBreakdown && (
                      <span className="w-8 text-gray-500 text-center">
                        {expectedBreakdown.coins?.centavos50?.count || 0}
                      </span>
                    )}
                    <input
                      type="number"
                      min="0"
                      value={cashBreakdown.coins.centavos50.count}
                      onChange={(e) =>
                        updateDenomination(
                          "coins",
                          "centavos50",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-16 px-2 py-1 border rounded text-xs bg-background"
                    />
                    <span className="text-gray-600 flex-1">
                      ${cashBreakdown.coins.centavos50.total.toFixed(2)}
                    </span>
                    {expectedBreakdown &&
                      cashBreakdown.coins.centavos50.count !==
                        (expectedBreakdown.coins?.centavos50?.count || 0) && (
                        <span className="text-red-500 text-xs">
                          (
                          {cashBreakdown.coins.centavos50.count -
                            (expectedBreakdown.coins?.centavos50?.count || 0) >
                          0
                            ? "+"
                            : ""}
                          {cashBreakdown.coins.centavos50.count -
                            (expectedBreakdown.coins?.centavos50?.count || 0)}
                          )
                        </span>
                      )}
                  </div>
                </div>
              </div>
            </div>
            {/* Total Section */}
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between text-sm font-medium">
                <span>Total Contado:</span>
                <span>${cashBreakdown.totalCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Saldo Sistema:</span>
                <span>${(selectedRegister?.balance || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-red-600">
                <span>Diferencia:</span>
                <span>
                  $
                  {(
                    cashBreakdown.totalCash - (selectedRegister?.balance || 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <input type="hidden" name="auditDate" value={formattedDate} />

          <button
            type="submit"
            disabled={sending}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-[12px] font-medium rounded-md text-white bg-emerald-700 hover:bg-emerald-900 mt-5 w-full`}
          >
            {sending && <span className="loader"></span>}
            {user?.role === "CHOFER" ? "ENTREGAR" : "RECIBIR"}
          </button>
          {state.message && (
            <p className="text-sm text-gray-600">{state.message}</p>
          )}
        </form>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setHidden((prev) => !prev)}
          className={`flex items-center gap-2 bg-purple-800 text-white text-xs px-6 py-1 rounded-md mt-2 leading-none`}
        >
          <BanknoteIcon size={18} className="text-2xl" />
          <span className={`text-[12px] `}>
            {user?.role === "CHOFER" ? "ENTREGAR EFECTIVO" : "CORTE DE CAJA"}
          </span>
        </button>
      </div>
    </div>
  );
}
