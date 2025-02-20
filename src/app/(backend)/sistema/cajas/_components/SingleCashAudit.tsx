"use client";

import { useFormState } from "react-dom";
import { createCashAuditAction, createCashHandoffAction } from "../_actions";
import NumericInput from "@/components/NumericInput";
import { CashRegisterResponse } from "@/types/accounting";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/app/context/ModalContext";
import { verifySupervisorCode } from "@/app/_actions";
import { useSession } from "next-auth/react";
import { UserType } from "@/types/users";
import { BanknoteIcon } from "lucide-react";
import dayjs from "dayjs";

export default function SingleCashAuditForm({
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

  const [selectedRegister, setSelectedRegister] =
    useState<CashRegisterResponse | null>(cashRegister);

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

      if (isAuthorized.success && user.role === "MANAGER") {
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
            "single-audit-register-form"
          ) as HTMLFormElement;
          formElement.reset();
          setSelectedRegister(cashRegister);
          router.push(`/sistema/cajas/personal/${user?.id || ""}`);
        }
      }

      if (isAuthorized.success && user.role === "CHOFER") {
        formData.set("managerId", isAuthorized.authUserId.toString());
        formData.set("register", JSON.stringify(selectedRegister));
        formData.set(
          "startBalance",
          selectedRegister?.balance?.toString() || ""
        );
        const result = await createCashHandoffAction(state, formData);

        if (result.success) {
          await showModal({
            title: "Corte de Caja completado!",
            type: "delete",
            text: "El corte de caja ha sido completado exitosamente.",
            icon: "success",
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
    <>
      {!hidden && (
        <form
          id="single-audit-register-form"
          onSubmit={handleAuditSubmit}
          className="flex-1 p-3 bg-card rounded-lg shadow-md"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // Prevent form submission
            }
          }}
        >
          <NumericInput label="Se recibe" name="endBalance" state={state} />

          <input type="hidden" name="auditDate" value={formattedDate} />

          <button
            type="submit"
            disabled={sending}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-900 mt-5`}
          >
            {sending && <span className="loader"></span>}
            Crear Corte de Caja
          </button>
          {state.message && (
            <p className="text-sm text-gray-600">{state.message}</p>
          )}
        </form>
      )}

      <button
        onClick={() => setHidden((prev) => !prev)}
        className={`flex items-center gap-2 bg-purple-800 text-white text-xs px-6 py-1 rounded-md mt-2`}
      >
        <BanknoteIcon size={16} />
        <span className={`text-xs `}>CORTE DE CAJA</span>
      </button>
    </>
  );
}
