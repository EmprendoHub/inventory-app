"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import { createSupplier } from "../_actions";
import TextInput from "@/components/TextInput";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import TextAreaInput from "@/components/TextAreaInput";
import { CloudUpload } from "lucide-react";

export default function SupplierForm() {
  const [state, formAction] = useFormState(createSupplier, {
    errors: {},
    success: false,
    message: "",
  });

  const [SupplierImage, setSupplierImage] = useState<string>(
    "/images/product-placeholder.jpg"
  );
  const [fileData, setFileData] = useState<File | null>(null);

  // Custom submit handler to handle the file upload
  const handleSubmit = async (formData: FormData) => {
    if (fileData) {
      formData.set("image", fileData); // Replace the empty file input with our stored file
    }
    formAction(formData);
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
    <form action={handleSubmit} className="space-y-4 flex flex-col gap-4">
      <div className="flex maxmd:flex-col gap-3 w-full">
        {/* Image Upload Section */}
        <div className="flex flex-col ">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-semibold">
              Step 1: Upload Supplier o Service Image (Optional)
            </h3>
          </div>
          <div
            {...getSupplierRootProps()}
            className={`relative flex items-center text-white text-sm z-10 border-2 border-dashed rounded-lg p-6 text-center cursor-grab h-60 w-96 mb-5 ${
              isSupplierDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <input {...getSupplierInputProps()} />
            {isSupplierDragActive ? (
              <p>Drop the image here...</p>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3">
                <CloudUpload size={40} className="text-white" />
                <p>
                  Drag & drop a Supplier image here, or click to select one.
                </p>
              </div>
            )}
            <Image
              className="absolute object-cover -z-10 top-0 left-0"
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
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        Submit
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
