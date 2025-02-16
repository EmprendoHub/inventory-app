"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import TextInput from "@/components/TextInput";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import TextAreaInput from "@/components/TextAreaInput";
import { CloudUpload } from "lucide-react";
import { createSupplier } from "../_actions";
import { useModal } from "@/app/context/ModalContext";

export default function SupplierForm() {
  // eslint-disable-next-line
  const [state, formAction] = useFormState(createSupplier, {
    errors: {},
    success: false,
    message: "",
  });

  const [sending, setSending] = useState(false);

  const { showModal } = useModal();

  const [SupplierImage, setSupplierImage] = useState<string>(
    "/images/product-placeholder.jpg"
  );
  const [fileData, setFileData] = useState<File | null>(null);

  // Custom submit handler to handle the file upload
  const handleSubmit = async (formData: FormData) => {
    setSending((prev) => !prev);
    if (fileData) {
      formData.set("image", fileData); // Replace the empty file input with our stored file
    }

    const result = await createSupplier(state, formData);

    // Check if the product was created successfully
    if (result.success) {
      // Reset the form fields
      await showModal({
        title: "Proveedor Creado!",
        type: "delete",
        text: "El Proveedor ha sido creado exitosamente.",
        icon: "success",
      });
      const formElement = document.getElementById(
        "supplier-form"
      ) as HTMLFormElement;
      formElement.reset();

      setSending((prev) => !prev);
    }
  };

  const {
    getRootProps: getSupplierRootProps,
    getInputProps: getSupplierInputProps,
    isDragActive: isSupplierDragActive,
  } = useDropzone({
    accept: { "image/*": [] },
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setFileData(file); // Store the file for later use

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setSupplierImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
  });

  return (
    <form
      id="supplier-form"
      action={handleSubmit}
      className="space-y-4 flex flex-col gap-4"
    >
      <div className="flex maxmd:flex-col gap-3 w-full">
        {/* Image Upload Section */}
        <div className="flex flex-col ">
          <div
            {...getSupplierRootProps()}
            className={`relative flex items-center justify-center text-white text-sm z-10 border-2 border-dashed rounded-lg p-6 text-center cursor-grab h-60 w-96 mb-5 overflow-hidden ${
              isSupplierDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <input {...getSupplierInputProps()} />
            {isSupplierDragActive ? (
              <div className="flex flex-col items-center justify-center gap-3 w-full">
                <CloudUpload size={40} className="text-white" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 w-full">
                <CloudUpload size={40} className="text-white" />
              </div>
            )}
            <Image
              className="absolute w-fit -z-10 "
              src={SupplierImage}
              alt="imagen"
              width={500}
              height={500}
            />
          </div>
          {fileData && (
            <p className="mt-2 text-xs text-muted">
              Selected file: {fileData.name} ({Math.round(fileData.size / 1024)}{" "}
              KB)
            </p>
          )}
          {state.errors?.image && (
            <p className="text-sm text-red-500">
              {state.errors?.image.join(", ")}
            </p>
          )}
        </div>
        <div className="w-full flex items-center flex-col gap-3 mt-5">
          <TextInput name="name" label="Nombre" state={state} />
          <TextInput name="phone" label="Teléfono 333 444 8585" state={state} />
          <div className="flex-col gap-3 w-full">
            <TextInput name="email" label="Email" state={state} />
            <TextAreaInput name="address" label="Dirección" state={state} />
          </div>
        </div>
      </div>

      {/* Numeric inputs */}

      <div className="flex maxsm:flex-col gap-3">
        <TextInput
          name="contactPerson"
          label="Persona de contacto"
          state={state}
        />

        <TextInput
          name="supplierCode"
          label="Código de Proveedor"
          state={state}
        />
      </div>
      <div className="flex maxsm:flex-col gap-3">
        <TextInput name="paymentTerms" label="Términos de pago" state={state} />
        <TextInput name="taxId" label="RFC" state={state} />
      </div>

      <TextAreaInput name="notes" label="Notas" state={state} />

      <button
        type="submit"
        disabled={sending}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault(); // Prevent form submission
          }
        }}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
        Crear Proveedor
      </button>

      {state.message && (
        <p
          className={`text-sm ${
            state.success ? "text-green-700" : "text-red-500"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
