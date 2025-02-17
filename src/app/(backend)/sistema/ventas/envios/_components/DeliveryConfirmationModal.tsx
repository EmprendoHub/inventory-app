// components/DeliveryConfirmationModal.tsx
"use client";

import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { useModal } from "@/app/context/ModalContext";

interface DeliveryConfirmationModalProps {
  onConfirm: (signature: string, image: File | null) => void;
  onCancel: () => void;
}

export const DeliveryConfirmationModal: React.FC<
  DeliveryConfirmationModalProps
> = ({ onConfirm, onCancel }) => {
  const [signature, setSignature] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const { showModal } = useModal();

  const handleClearSignature = () => {
    sigCanvas.current?.clear();
    setSignature(null);
  };

  const handleSaveSignature = () => {
    const signatureData = sigCanvas.current?.toDataURL();
    if (signatureData) {
      setSignature(signatureData);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImage(event.target.files[0]);
    }
  };

  const handleConfirm = async () => {
    if (!signature || !image) {
      await showModal({
        title: "¡Agrega imagen y firma!",
        type: "delete",
        text: "La entrega require una firma y foto.",
        icon: "error",
      });
      return;
    }
    onConfirm(signature, image);
  };

  return (
    <div className="p-4 ">
      <h2 className="text-lg font-bold mb-4">Confirmar Entrega</h2>
      <div className="mb-4">
        <label className="block mb-2">Firma:</label>
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: "border border-gray-300 w-full h-32 bg-white",
          }}
        />
        <div className="mt-2">
          <Button onClick={handleClearSignature} className="mr-2">
            Despejar Firma
          </Button>
          <Button onClick={handleSaveSignature}>Guardar Firma</Button>
        </div>
      </div>
      <div className="mb-4">
        <label className="block mb-2">
          Cargar Imagen de Entrega en domicilio:
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
        />
      </div>
      <div className=" justify-between gap-3">
        <Button onClick={onCancel} variant="outline">
          Cancelar
        </Button>
        <Button onClick={handleConfirm}>Confirmar Entrega</Button>
      </div>
    </div>
  );
};
