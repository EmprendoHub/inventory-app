"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import { createClient } from "../_actions";
import TextInput from "@/components/TextInput";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import TextAreaInput from "@/components/TextAreaInput";
import { CloudUpload } from "lucide-react";

export default function ClientForm() {
  const [state, formAction] = useFormState(createClient, {
    errors: {},
    success: false,
    message: "",
  });

  const [productImage, setProductImage] = useState<string>(
    "/images/avatar_placeholder.jpg"
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
    getRootProps: getProductRootProps,
    getInputProps: getProductInputProps,
    isDragActive: isProductDragActive,
  } = useDropzone({
    accept: { "image/*": [] },
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setFileData(file); // Store the file for later use

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
  });

  return (
    <form action={handleSubmit} className="space-y-4 flex flex-col gap-4">
      <div className="flex maxmd:flex-col gap-3 w-full">
        {/* Image Upload Section */}
        <div className="flex flex-col ">
          <div
            {...getProductRootProps()}
            className={`relative flex justify-center w-[200px] h-auto items-center text-white text-sm z-10 border-2 border-dashed rounded-lg p-6 text-center cursor-grab mb-5 ${
              isProductDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <input {...getProductInputProps()} />
            {isProductDragActive ? (
              <p>Drop the image here...</p>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3">
                <CloudUpload size={40} className="text-xs text-black" />
                <p className="text-black">Arrastre y suelte una imagen aquí.</p>
              </div>
            )}
            <Image
              className="absolute object-cover -z-10 top-0 left- w-[200px] h-auto"
              src={productImage}
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
