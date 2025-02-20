// components/DeliveryConfirmationModal.tsx
"use client";

import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { useModal } from "@/app/context/ModalContext";
import { Save } from "lucide-react";
import { GiCancel } from "react-icons/gi";

interface DeliveryConfirmationModalProps {
  onConfirm: (signature: string) => void;
  onCancel: () => void;
}

export const DeliveryConfirmationModal: React.FC<
  DeliveryConfirmationModalProps
> = ({ onConfirm, onCancel }) => {
  const [signature, setSignature] = useState<string | null>(null);
  // eslint-disable-next-line
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

  // const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   if (event.target.files && event.target.files[0]) {
  //     setImage(event.target.files[0]);
  //   }
  // };

  const handleConfirm = async () => {
    if (!signature) {
      await showModal({
        title: "¡Agrega imagen y firma!",
        type: "delete",
        text: "La entrega require una firma y foto.",
        icon: "error",
      });
      return;
    }
    onConfirm(signature);
  };

  return (
    <div className="p-4 ">
      <h2 className="text-lg font-bold mb-4">Confirmar Entrega</h2>
      <div className="mb-4">
        <label className="block mb-2">Firma:</label>
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: "border border-gray-300 w-full h-60 bg-white",
          }}
        />
        <div className="mt-2 flex items-center gap-4">
          {/* <Button onClick={handleSaveSignature}>Guardar Firma</Button> */}

          {!signature ? (
            <button
              onClick={handleSaveSignature}
              disabled={signature ? true : false}
              className="flex w-full items-center gap-2 justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Save size={16} />
              Guardar Firma
            </button>
          ) : (
            <Button
              onClick={handleClearSignature}
              className="mr-2 bg-purple-800 text-white w-full"
            >
              <GiCancel size={16} /> Despejar Firma
            </Button>
          )}
        </div>
      </div>
      {/* <div className="mb-4">
        <label className="block mb-2">
          Cargar Imagen de Entrega en domicilio:
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
        />
      </div> */}
      <div className="flex items-center justify-between gap-3 mt-20">
        <Button onClick={onCancel} className="bg-red-900 text-white">
          Cancelar
        </Button>
        <Button className="bg-emerald-800 text-white" onClick={handleConfirm}>
          Confirmar Entrega
        </Button>
      </div>
    </div>
  );
};
