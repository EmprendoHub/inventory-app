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
      <div className="bg-background p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-bold mb-4">Supervisor Verification</h2>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="border p-2 w-full mb-4 rounded-md text-foreground bg-input"
          placeholder="Enter supervisor code"
        />
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded mr-2 w-full"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}
