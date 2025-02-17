"use client";

import { useFormState } from "react-dom";
import { createCashRegisterAction } from "../_actions";
import { UserType } from "@/types/users";
import { SearchSelectInput } from "@/components/SearchSelectInput";
import { useState } from "react";
import { verifySupervisorCode } from "@/app/_actions";
import { useRouter } from "next/navigation";
import { useModal } from "@/app/context/ModalContext";
import TextInput from "@/components/TextInput";
import NumericInput from "@/components/NumericInput";

export default function CashRegisterForm({ users }: { users: UserType[] }) {
  const router = useRouter();
  const { showModal } = useModal();
  const [sending, setSending] = useState(false);
  // eslint-disable-next-line
  const [state, formAction] = useFormState(createCashRegisterAction, {
    success: false,
    message: "",
    errors: {},
  });
  const [selectedRegisteredOwner, setSelectedRegisteredOwner] =
    useState<UserType | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
        formData.set("ownerId", selectedRegisteredOwner?.id.toString() || "");
        const result = await createCashRegisterAction(state, formData);

        if (result.success) {
          await showModal({
            title: "Caja creada exitosamente!",
            type: "delete",
            text: "La caja ha sido creada exitosamente.",
            icon: "success",
          });
          const formElement = document.getElementById(
            "register-form"
          ) as HTMLFormElement;
          formElement.reset();
          setSelectedRegisteredOwner(null);
          router.push("/sistema/cajas");
        }
      }
      setSending(false);
    }
    setSending(false);
  };

  return (
    <form
      id="register-form"
      onSubmit={handleSubmit}
      className="flex-1 p-8 maxsm:p-4 bg-card rounded-lg shadow-md"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault(); // Prevent form submission
        }
      }}
    >
      <div className="flex items-center gap-4">
        <TextInput
          state={state}
          label="Nombre de Caja"
          name="name"
          className="w-full"
        />
        <NumericInput name="fund" label="Fondo de Caja" state={state} />
      </div>
      <SearchSelectInput
        label="Seleccionar Dueño:"
        name="cashRegister"
        state={state}
        className="flex-1 my-4"
        options={users.map((item) => ({
          value: item.id,
          name: item.name,
        }))}
        onChange={(value) => {
          const user = users.find((r) => r.id === value);
          setSelectedRegisteredOwner(user || null);
        }}
      />

      <button
        type="submit"
        disabled={sending}
        className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-900 mt-10`}
      >
        {sending && <span className="loader"></span>}
        Crear Caja
      </button>
      {state.message && (
        <p className="text-sm text-gray-600">{state.message}</p>
      )}
    </form>
  );
}
