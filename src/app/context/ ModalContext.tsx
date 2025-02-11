// context/ModalContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { BsCurrencyExchange } from "react-icons/bs";

type ModalOptions = {
  title: string;
  text: string;
  type: "delete" | "payment" | "info" | "supervisorCode";
  icon?: "warning" | "success" | "error";
  showCancelButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
};

type ModalResult = {
  confirmed: boolean;
  data?: {
    amount?: string;
    reference?: string;
    method?: string;
    code?: string;
  };
};

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
  const supervisorCodeInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPaymentData((prev) => ({
      ...prev,
      code: value,
    }));
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
    if (modal?.type === "supervisorCode" && supervisorCodeInputRef.current) {
      const timeoutId = setTimeout(() => {
        if (supervisorCodeInputRef.current) {
          supervisorCodeInputRef.current.focus();

          const preventFocusSteal = (e: FocusEvent) => {
            e.preventDefault();
            supervisorCodeInputRef.current?.focus();
          };

          document.addEventListener("focusin", preventFocusSteal);
          return () =>
            document.removeEventListener("focusin", preventFocusSteal);
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
              modal.icon === "warning" ? "bg-red-800" : "bg-card"
            } rounded-lg p-6 py-12 max-w-md w-96`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              {modal.type === "payment" ? (
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
                    name="payment"
                    type="number"
                    min={1}
                    placeholder="$100.00"
                    value={paymentData.amount}
                    onChange={(e) =>
                      setPaymentData((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    className="text-center rounded-md text-sm peer w-full px-4 py-2 border outline-none focus:ring-2 focus:ring-blue-500 bg-input"
                  />

                  <h3 className="text-xs">Referencia</h3>
                  <input
                    name="reference"
                    type="text"
                    placeholder="546576546574"
                    value={paymentData.reference}
                    onChange={(e) =>
                      setPaymentData((prev) => ({
                        ...prev,
                        reference: e.target.value,
                      }))
                    }
                    className="text-center rounded-md text-sm peer w-full px-4 py-2 border outline-none focus:ring-2 focus:ring-blue-500 bg-input"
                  />

                  <h3 className="text-xs">Método</h3>
                  <input
                    name="method"
                    type="text"
                    placeholder="EFECTIVO"
                    value={paymentData.method}
                    onChange={(e) =>
                      setPaymentData((prev) => ({
                        ...prev,
                        method: e.target.value,
                      }))
                    }
                    className="text-center rounded-md text-sm peer w-full px-4 py-2 border outline-none focus:ring-2 focus:ring-blue-500 bg-input"
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

                  <div>
                    <input
                      type="text"
                      name="username"
                      autoComplete="off"
                      style={{ display: "none" }}
                    />
                    <input
                      type="password"
                      name="password"
                      autoComplete="off"
                      style={{ display: "none" }}
                    />

                    <input
                      ref={supervisorCodeInputRef}
                      name="supervisorCode"
                      type="password"
                      placeholder="Código de Supervisor"
                      value={paymentData.code}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                      tabIndex={0}
                      className="text-center rounded-md text-sm peer w-full px-4 py-2 border outline-none focus:ring-2 focus:ring-blue-500 bg-input"
                    />
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
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export const useModal = () => useContext(ModalContext);
