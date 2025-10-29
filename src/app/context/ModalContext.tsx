"use client";

import { ModalOptions, ModalResult } from "@/types/delivery";
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { BsCurrencyExchange } from "react-icons/bs";
import { DeliveryConfirmationModal } from "../(backend)/sistema/ventas/envios/_components/DeliveryConfirmationModal";
import SelectInput from "@/components/SelectInput";

type ModalContextType = {
  showModal: (options: ModalOptions) => Promise<ModalResult>;
};

const ModalContext = createContext<ModalContextType>({} as ModalContextType);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<ModalOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<
    ((value: ModalResult) => void) | null
  >(null);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    reference: "",
    method: "",
    code: "",
  });

  const modalRef = useRef<HTMLDivElement>(null);
  const paymentInputRef = useRef<HTMLInputElement>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpValues, setOtpValues] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    // Update the code in paymentData
    setPaymentData((prev) => ({
      ...prev,
      code: newOtpValues.join(""),
    }));

    // Auto-focus next input if value entered
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      if (!otpValues[index] && index > 0) {
        // If current input is empty, move to previous and clear it
        const newOtpValues = [...otpValues];
        newOtpValues[index - 1] = "";
        setOtpValues(newOtpValues);
        setPaymentData((prev) => ({
          ...prev,
          code: newOtpValues.join(""),
        }));
        otpInputRefs.current[index - 1]?.focus();
      } else if (otpValues[index]) {
        // Clear current input
        const newOtpValues = [...otpValues];
        newOtpValues[index] = "";
        setOtpValues(newOtpValues);
        setPaymentData((prev) => ({
          ...prev,
          code: newOtpValues.join(""),
        }));
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const digits = pastedData.replace(/\D/g, "").split("");

    const newOtpValues = [...otpValues];
    digits.forEach((digit, index) => {
      if (index < 6) {
        newOtpValues[index] = digit;
      }
    });

    setOtpValues(newOtpValues);
    setPaymentData((prev) => ({
      ...prev,
      code: newOtpValues.join(""),
    }));

    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtpValues.findIndex((val) => !val);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    otpInputRefs.current[focusIndex]?.focus();
  };

  const handleConfirm = () => {
    if (modal?.type === "payment") {
      handleClose({ confirmed: true, data: paymentData });
    } else if (modal?.type === "supervisorCode") {
      handleClose({
        confirmed: true,
        data: { code: paymentData.code },
      });
    } else {
      handleClose({ confirmed: true });
    }
  };

  const handleCancel = () => {
    if (modal?.showCancelButton) {
      handleClose({ confirmed: false });
    }
  };

  // Focus trap
  useEffect(() => {
    if (!modal) return;

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (!modalRef.current || e.key !== "Tab") return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstFocusable = focusableElements[0] as HTMLElement;
      const lastFocusable = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    window.addEventListener("keydown", handleFocusTrap);
    return () => window.removeEventListener("keydown", handleFocusTrap);
  }, [modal]);

  // Auto-focus for supervisor code input
  useEffect(() => {
    if (modal?.type === "supervisorCode" && otpInputRefs.current[0]) {
      const timeoutId = setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 50);

      return () => clearTimeout(timeoutId);
    }

    if (modal?.type === "payment" && paymentInputRef.current) {
      const timeoutId = setTimeout(() => {
        if (paymentInputRef.current) {
          paymentInputRef.current.focus();
        }
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [modal]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!modal) return;

      if (event.key === "Enter") {
        event.preventDefault();
        handleConfirm();
      } else if (event.key === "Escape" && modal.showCancelButton) {
        event.preventDefault();
        handleCancel();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
    // eslint-disable-next-line
  }, [modal, paymentData]);

  // Reset payment data when modal type changes
  useEffect(() => {
    if (modal?.type === "payment") {
      setPaymentData({ amount: "", reference: "", method: "", code: "" });
    } else if (modal?.type === "supervisorCode") {
      setOtpValues(["", "", "", "", "", ""]);
      setPaymentData({ amount: "", reference: "", method: "", code: "" });
    }
  }, [modal]);

  // Reset payment data when modal closes
  useEffect(() => {
    if (!modal) {
      setPaymentData({
        amount: "",
        reference: "",
        method: "",
        code: "",
      });
      setOtpValues(["", "", "", "", "", ""]);
    }
  }, [modal]);

  const showModal = (options: ModalOptions): Promise<ModalResult> => {
    return new Promise((resolve) => {
      setModal(options);
      setResolvePromise(() => resolve);
    });
  };

  const handleClose = (result: ModalResult) => {
    setModal(null);
    resolvePromise?.(result);
    setResolvePromise(null);
    setPaymentData({
      amount: "",
      reference: "",
      method: "",
      code: "",
    });
    setOtpValues(["", "", "", "", "", ""]);
  };

  return (
    <ModalContext.Provider value={{ showModal }}>
      {children}
      {modal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center min-w-full min-h-screen z-50"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && modal.showCancelButton) {
              e.preventDefault();
              handleCancel();
            }
          }}
        >
          <div
            ref={modalRef}
            className={`${
              modal.icon === "warning" ? "bg-yellow-700" : "bg-card"
            } rounded-lg p-6 py-6 max-w-md w-96`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              {modal.type === "deliveryConfirmation" ? (
                <DeliveryConfirmationModal
                  onConfirm={(signature) => {
                    handleClose({
                      confirmed: true,
                      data: { signature },
                    });
                  }}
                  onCancel={() => handleClose({ confirmed: false })}
                />
              ) : modal.type === "payment" ? (
                <div className="flex flex-col justify-center items-center gap-1">
                  <BsCurrencyExchange size={60} color="green" />
                  <h3
                    className={`text-2xl font-bold mt-2 ${
                      modal.icon === "warning" ? "text-white" : ""
                    }`}
                  >
                    {modal.title}
                  </h3>
                  <p className="text-muted text-sm">{modal.text}</p>

                  <h3 className="text-xs mt-3">Cantidad</h3>
                  <input
                    ref={paymentInputRef}
                    name="payment"
                    type="number"
                    min={1}
                    tabIndex={0}
                    placeholder="$100.00"
                    value={paymentData.amount}
                    onChange={(e) =>
                      setPaymentData((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center"
                  />

                  <h3 className="text-xs">Referencia</h3>
                  <input
                    name="reference"
                    type="text"
                    tabIndex={0}
                    placeholder="546576546574"
                    value={paymentData.reference} // Value is controlled by state
                    onChange={(e) =>
                      setPaymentData((prev) => ({
                        ...prev,
                        reference: e.target.value, // Update state on change
                      }))
                    }
                    className="text-center rounded-md text-sm peer w-full px-4 py-2 border outline-none focus:ring-2 focus:ring-blue-500 bg-input"
                  />
                  <SelectInput
                    label="Método de Pago"
                    name="method"
                    options={[
                      { value: "EFECTIVO", name: "EFECTIVO" },
                      { value: "TARJETA", name: "TARJETA" },
                      { value: "TRANSFERENCIA", name: "TRANSFERENCIA" },
                    ]}
                    onChange={(e) =>
                      setPaymentData((prev) => ({
                        ...prev,
                        method: e.target.value, // Update state on change
                      }))
                    }
                  />
                </div>
              ) : modal.type === "supervisorCode" ? (
                <div className="flex flex-col justify-center items-center gap-1">
                  <p className="text-4xl">
                    {modal.icon === "warning" && "⚠️"}
                    {modal.icon === "success" && "✅"}
                    {modal.icon === "error" && "❌"}
                  </p>
                  <h3
                    className={`text-2xl font-bold mt-2 ${
                      modal.icon === "warning" ? "text-white" : ""
                    }`}
                  >
                    {modal.title}
                  </h3>

                  <div className="px-4 py-1 bg-black rounded-full my-2">
                    <p className="text-slate-300 text-xs">{modal.text}</p>
                  </div>

                  <div className="flex gap-2 justify-center mt-4">
                    {otpValues.map((value, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          otpInputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={value}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={index === 0 ? handleOtpPaste : undefined}
                        autoComplete="off"
                        className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-webkit-text-security:disc] [text-security:disc]"
                        style={
                          { WebkitTextSecurity: "disc" } as React.CSSProperties
                        }
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col justify-center items-center gap-1">
                  <p className="text-4xl">
                    {modal.icon === "warning" && "⚠️"}
                    {modal.icon === "success" && "✅"}
                    {modal.icon === "error" && "❌"}
                  </p>
                  <h3
                    className={`text-2xl font-bold mt-2 ${
                      modal.icon === "warning" ? "text-white" : ""
                    }`}
                  >
                    {modal.title}
                  </h3>
                  <p
                    className={`text-sm italic ${
                      modal.icon === "warning" ? "text-slate-200" : ""
                    }`}
                  >
                    {modal.text}
                  </p>
                </div>
              )}
            </div>
            {modal.type !== "deliveryConfirmation" ? (
              <div className="flex gap-3 justify-center mt-6">
                {modal.showCancelButton && (
                  <button
                    onClick={handleCancel}
                    className="px-8 text-sm py-2 bg-slate-800 hover:bg-black text-white rounded duration-300 ease-in-out"
                  >
                    {modal.cancelButtonText || "Cancel"}
                  </button>
                )}
                <button
                  onClick={handleConfirm}
                  className="px-8 text-sm py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded"
                >
                  {modal.confirmButtonText || "OK"}
                </button>
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export const useModal = () => useContext(ModalContext);
