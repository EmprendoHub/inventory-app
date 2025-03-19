"use client";

import { useFormState } from "react-dom";
import { createCashAuditAction } from "../_actions";
import NumericInput from "@/components/NumericInput";
import DateInput from "@/components/DateInput";
import { CashRegisterResponse } from "@/types/accounting";
import { SearchSelectInput } from "@/components/SearchSelectInput";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/app/context/ModalContext";
import { verifySupervisorCode } from "@/app/_actions";
import { useSession } from "next-auth/react";
import { UserType } from "@/types/users";

export default function CashAuditForm({
  cashRegisters,
}: {
  cashRegisters: CashRegisterResponse[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as UserType;
  const { showModal } = useModal();
  // eslint-disable-next-line
  const [state, formAction] = useFormState(createCashAuditAction, {
    success: false,
    message: "",
    errors: {},
  });
  const [sending, setSending] = useState(false);

  const [selectedRegister, setSelectedRegister] =
    useState<CashRegisterResponse | null>(null);

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

      if (isAuthorized.success) {
        formData.set("managerId", isAuthorized.authUserId.toString());
        formData.set("register", JSON.stringify(selectedRegister));
        formData.set(
          "startBalance",
          selectedRegister?.balance?.toString() || ""
        );
        const result = await createCashAuditAction(state, formData);

        if (result.success) {
          await showModal({
            title: "Corte de Caja completado!",
            type: "delete",
            text: "El corte de caja ha sido completado exitosamente.",
            icon: "success",
          });
          const formElement = document.getElementById(
            "audit-register-form"
          ) as HTMLFormElement;
          formElement.reset();
          setSelectedRegister(null);
          router.push(`/sistema/cajas/personal/${user?.id || ""}`);
        }
      }
      setSending(false);
    }
    setSending(false);
  };

  const handleDeliveryCashSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
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

      if (isAuthorized.success) {
        formData.set("managerId", isAuthorized.authUserId.toString());
        formData.set("register", JSON.stringify(selectedRegister));
        formData.set(
          "startBalance",
          selectedRegister?.balance?.toString() || ""
        );
        const result = await createCashAuditAction(state, formData);

        if (result.success) {
          await showModal({
            title: "Corte de Caja completado!",
            type: "delete",
            text: "El corte de caja ha sido completado exitosamente.",
            icon: "success",
          });
          const formElement = document.getElementById(
            "audit-register-form"
          ) as HTMLFormElement;
          formElement.reset();
          setSelectedRegister(null);
          router.push(`/sistema/cajas/personal/${user?.id || ""}`);
        }
      }
      setSending(false);
    }
    setSending(false);
  };

  return (
    <>
      {user && user.role === "CHOFER" ? (
        <form
          id="audit-register-form"
          onSubmit={handleDeliveryCashSubmit}
          className="flex-1 p-8 maxmd:p-4 bg-card rounded-lg shadow-md"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // Prevent form submission
            }
          }}
        >
          <div>
            <SearchSelectInput
              label="Seleccionar Caja:"
              name="cashRegister"
              state={state}
              className="flex-1 mb-4"
              options={cashRegisters.map((item) => ({
                value: item.id,
                name: item.name,
              }))}
              onChange={(value) => {
                const register = cashRegisters.find((r) => r.id === value);
                setSelectedRegister(register || null);
              }}
            />

            <div className="flex flex-col">
              <span className="text-xs">Actual en Caja</span>
              <p>${selectedRegister?.balance.toLocaleString()}</p>
            </div>
            <NumericInput label="Se recibe" name="endBalance" state={state} />
            <DateInput
              label="Fecha"
              name="auditDate"
              state={state}
              defaultValue={new Date()}
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-900 mt-10`}
          >
            {sending && <span className="loader"></span>}
            Crear Corte de Caja
          </button>
          {state.message && (
            <p className="text-sm text-gray-600">{state.message}</p>
          )}
        </form>
      ) : (
        <form
          id="audit-register-form"
          onSubmit={handleAuditSubmit}
          className="flex-1 p-8 maxmd:p-4 bg-card rounded-lg shadow-md"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // Prevent form submission
            }
          }}
        >
          <div>
            <SearchSelectInput
              label="Seleccionar Caja:"
              name="cashRegister"
              state={state}
              className="flex-1 mb-4"
              options={cashRegisters.map((item) => ({
                value: item.id,
                name: item.name,
              }))}
              onChange={(value) => {
                const register = cashRegisters.find((r) => r.id === value);
                setSelectedRegister(register || null);
              }}
            />

            <div className="flex flex-col">
              <span className="text-xs">Actual en Caja</span>
              <p>${selectedRegister?.balance.toLocaleString()}</p>
            </div>
            <NumericInput label="Se recibe" name="endBalance" state={state} />
            <DateInput
              label="Fecha"
              name="auditDate"
              state={state}
              defaultValue={new Date()}
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-900 mt-10`}
          >
            {sending && <span className="loader"></span>}
            Crear Corte de Caja
          </button>
          {state.message && (
            <p className="text-sm text-gray-600">{state.message}</p>
          )}
        </form>
      )}
    </>
  );
}
