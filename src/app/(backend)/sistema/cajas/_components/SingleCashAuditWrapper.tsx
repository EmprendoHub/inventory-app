"use client";

import { CashRegisterResponse } from "@/types/accounting";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { UserType } from "@/types/users";
import { BanknoteIcon } from "lucide-react";
import SingleCashAuditModal from "./SingleCashAuditModal";

export default function SingleCashAudit({
  cashRegister,
}: {
  cashRegister: CashRegisterResponse;
}) {
  const { data: session } = useSession();
  const user = session?.user as UserType;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    // Optionally refresh the page or update state
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-end">
      <div className="flex gap-2">
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 bg-purple-800 text-white text-xs px-6 py-1 rounded-md mt-2 leading-none hover:bg-purple-700 transition-colors touch-manipulation"
        >
          <BanknoteIcon size={18} className="text-2xl" />
          <span className="text-[12px]">
            {user?.role === "CHOFER" ? "ENTREGAR" : "CORTE DE CAJA"}
          </span>
        </button>
      </div>

      <SingleCashAuditModal
        cashRegister={cashRegister}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
