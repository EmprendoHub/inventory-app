"use client";

import { useFormState } from "react-dom";
import { createPettyCashAction } from "../_actions";
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
        formData.set("managerId", isAuthorized.authUserId.toString());
        formData.set("register", JSON.stringify(selectedRegister));
        formData.set(
          "startBalance",
          selectedRegister?.balance?.toString() || ""
        );
        const result = await createPettyCashAction(state, formData);

        if (result.success) {
          await showModal({
            title: "Agregar fondo completado!",
            type: "delete",
            text: "Se agrego el fondo a la caja exitosamente.",
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
    <div className="flex flex-col items-end ">
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
          <NumericInput label="" name="endBalance" state={state} />

          <input type="hidden" name="auditDate" value={formattedDate} />

          <button
            type="submit"
            disabled={sending}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-[12px] font-medium rounded-md text-white bg-emerald-700 hover:bg-emerald-900 mt-5 w-full`}
          >
            {sending && <span className="loader"></span>}
            AGREGAR
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
