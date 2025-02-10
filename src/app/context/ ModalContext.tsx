// context/ModalContext.tsx
"use client";

import { createContext, useContext, useState, useEffect } from "react";
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
    code?: string; // Add this line
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
    code: "", // Add this line
  });

  // Reset payment data when payment modal opens
  useEffect(() => {
    if (modal?.type === "payment") {
      setPaymentData({ amount: "", reference: "", method: "", code: "" });
    }
  }, [modal]);

  useEffect(() => {
    if (!modal) {
      // Reset paymentData when the modal is closed
      setPaymentData({
        amount: "",
        reference: "",
        method: "",
        code: "", // Reset the supervisor code
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

    // Reset paymentData (including supervisor code) when the modal is closed
    setPaymentData({
      amount: "",
      reference: "",
      method: "",
      code: "", // Reset the supervisor code
    });
  };

  return (
    <ModalContext.Provider value={{ showModal }}>
      {children}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center min-w-full min-h-screen z-50">
          <div
            className={`${
              modal.icon === "warning" ? "bg-red-800" : "bg-card"
            } rounded-lg p-6 py-12 max-w-md w-96`}
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
                    className="text-center rounded-md text-sm peer w-full px-4 py-2 border outline-none focus:ring-2 focus:ring-blue-500  bg-input"
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
                    className="text-center rounded-md text-sm peer w-full px-4 py-2 border outline-none focus:ring-2 focus:ring-blue-500  bg-input"
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

                  <input
                    name="supervisorCode"
                    type="password"
                    placeholder="Código de Supervisor"
                    value={paymentData.code} // Use paymentData.code
                    onChange={(e) =>
                      setPaymentData((prev) => ({
                        ...prev,
                        code: e.target.value, // Update the code property
                      }))
                    }
                    className="text-center rounded-md text-sm peer w-full px-4 py-2 border outline-none focus:ring-2 focus:ring-blue-500  bg-input"
                  />
                </div>
              ) : (
                // ... existing delete modal JSX
                <div className=" flex flex-col justify-center items-center gap-1">
                  <p className="text-4xl">
                    {modal.icon === "warning" && "⚠️"}
                    {modal.icon === "success" && "✅"}
                    {modal.icon === "error" && "❌"}
                  </p>
                  <h3
                    className={`text-2xl font-bold mt-2  ${
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
                  onClick={() => handleClose({ confirmed: false })}
                  className="px-8 text-sm py-2 bg-slate-800 hover:bg-black text-white rounded duration-300 ease-in-out"
                >
                  {modal.cancelButtonText || "Cancel"}
                </button>
              )}
              <button
                onClick={() => {
                  if (modal.type === "payment") {
                    handleClose({ confirmed: true, data: paymentData });
                  } else if (modal.type === "supervisorCode") {
                    handleClose({
                      confirmed: true,
                      data: { code: paymentData.code },
                    });
                  } else {
                    handleClose({ confirmed: true });
                  }
                }}
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
