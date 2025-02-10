"use client";

import React, { useState } from "react";

interface SupervisorVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (code: string) => Promise<boolean>;
}

export default function SupervisorVerificationModal({
  isOpen,
  onClose,
  onVerify,
}: SupervisorVerificationModalProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleVerify = async () => {
    const isValid = await onVerify(code);
    if (isValid) {
      onClose();
    } else {
      setError("Código de supervisor equivocado!");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-red-800 p-10 rounded-lg shadow-lg">
        <p className="text-center text-4xl mb-4">{"⚠️"}</p>
        <h2 className="text-lg font-bold mb-4 text-white">
          Se require código de supervisor!
        </h2>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="border p-2 w-full mb-4 rounded-md text-foreground bg-input text-center text-xl"
          placeholder="CÓDIGO DE SUPERVISOR"
        />
        {error && (
          <div className="px-4 py-1 bg-white rounded-lg mb-4">
            <p className="text-red-700 text-sm text-center">{error}</p>
          </div>
        )}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-black text-white px-4 py-2 rounded mr-2 w-full"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            className="bg-emerald-700 text-white px-4 py-2 rounded w-full"
          >
            Autorizar
          </button>
        </div>
      </div>
    </div>
  );
}
