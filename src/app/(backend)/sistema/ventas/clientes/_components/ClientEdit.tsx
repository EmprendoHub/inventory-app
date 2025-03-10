"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import TextInput from "@/components/TextInput";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import TextAreaInput from "@/components/TextAreaInput";
import { CloudUpload } from "lucide-react";
import { clientType } from "@/types/sales";
import { useModal } from "@/app/context/ModalContext";
import { useRouter } from "next/navigation";
import { updateClient } from "../_actions/clientActions";

export default function ClientEdit({ client }: { client: clientType }) {
  const router = useRouter();
  // eslint-disable-next-line
  const [state, formAction] = useFormState(updateClient, {
    errors: {},
    success: false,
    message: "",
  });
  const { showModal } = useModal();

  // Add state for form fields
  const [formData, setFormData] = useState({
    id: client.id,
    name: client.name,
    phone: client.phone,
    email: client.email,
    address: client.address,
  });

  const [productImage, setProductImage] = useState<string>(client.image);
  const [fileData, setFileData] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  // Handle input changes
  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Custom submit handler to handle the file upload
  const handleSubmit = async (formSubmitData: FormData) => {
    setSending((prev) => !prev);
    // Add all form data to the FormData object
    Object.entries(formData).forEach(([key, value]) => {
      formSubmitData.set(key, value);
    });

    if (fileData) {
      formSubmitData.set("image", fileData);
    }
    const result = await updateClient(state, formSubmitData);
    setSending((prev) => !prev);

    // Check if the product was created successfully
    if (result.success) {
      // Reset the form fields
      await showModal({
        title: "Cliente Actualizado!",
        type: "delete",
        text: "El Cliente ha sido actualizado exitosamente.",
        icon: "success",
      });

      router.push("/sistema/ventas/clientes");
    }
  };

  const {
    getRootProps: getProductRootProps,
    getInputProps: getProductInputProps,
    isDragActive: isProductDragActive,
  } = useDropzone({
    accept: { "image/*": [] },
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setFileData(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
  });

  return (
    <section>
      {sending && (
        <div
          className={`fixed top-0 left-0 z-50 flex flex-col items-center justify-center w-screen h-screen bg-black/50`}
        >
          <h3>Actualizando cliente...</h3>
          <span className="loader" />
        </div>
      )}
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
                <p>Deja caer imagen aquí...</p>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3">
                  <CloudUpload size={40} className="text-xs text-white" />
                  <p className="text-black mb-5"></p>
                </div>
              )}
              <Image
                className="absolute object-cover -z-10 top-0 left-0 w-[200px] h-auto"
                src={productImage}
                alt="imagen"
                width={500}
                height={500}
              />
            </div>
            {fileData && (
              <p className="mt-2 text-xs text-muted">
                Archivo seleccionado: {fileData.name} (
                {Math.round(fileData.size / 1024)} KB)
              </p>
            )}
            {state.errors?.image && (
              <p className="text-sm text-red-500">
                {state.errors?.image.join(", ")}
              </p>
            )}
          </div>
          <div className="w-full flex items-center flex-col gap-3 mt-5">
            <TextInput
              value={formData.name}
              name="name"
              label="Nombre"
              state={state}
              onChange={handleInputChange}
            />
            <TextInput
              value={formData.phone}
              name="phone"
              label="Teléfono 333 444 8585"
              state={state}
              onChange={handleInputChange}
            />
            <div className="flex-col gap-3 w-full">
              <TextInput
                value={formData.email}
                name="email"
                label="Email"
                state={state}
                onChange={handleInputChange}
              />
              <TextAreaInput
                value={formData.address}
                name="address"
                label="Dirección"
                state={state}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Actualizar
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
    </section>
  );
}
