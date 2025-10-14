"use client";
import React, { useState, useEffect } from "react";
import { useFormState } from "react-dom";
import SelectInput from "@/components/SelectInput";
import TextInput from "@/components/TextInput";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { CloudUpload } from "lucide-react";
import { UserFormState, UserGroupType } from "@/types/users";
import { useModal } from "@/app/context/ModalContext";
import { createUserAction } from "../_actions";
import PasswordInput from "@/components/PasswordInput";
import ToggleSwitch from "../../_components/ToggleSwitch";
import { useRouter } from "next/navigation";

export default function UserForm({ roles }: UserGroupType) {
  const router = useRouter();
  // eslint-disable-next-line
  const [state, formAction] = useFormState<UserFormState, FormData>(
    createUserAction,
    {
      errors: {},
      success: false,
      message: "",
    }
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    authCode: "",
    password: "",
    role: "",
    warehouseId: "",
    avatar: "",
    active: false, // Add a new field for the toggle
    updatedAt: new Date(),
  });

  const [sending, setSending] = useState(false);
  const [warehouses, setWarehouses] = useState<{name: string; value: string; label: string}[]>([]);
  const { showModal } = useModal();

  const [userImage, setUserImage] = useState<string>(
    "/images/avatar_placeholder.jpg"
  );
  const [fileData, setFileData] = useState<File | null>(null);

  // Fetch warehouses on component mount
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await fetch('/api/warehouses');
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            const warehouseOptions = data.data.map((warehouse: any) => ({
              name: warehouse.title,
              value: warehouse.id,
              label: `${warehouse.title} (${warehouse.code})`,
            }));
            setWarehouses(warehouseOptions);
          }
        }
      } catch (error) {
        console.error('Error fetching warehouses:', error);
      }
    };

    fetchWarehouses();
  }, []);

  const handleToggle = () => {
    setFormData((prev) => ({
      ...prev,
      active: !prev.active,
    }));
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (formSubmitData: FormData) => {
    setSending((prev) => !prev);
    if (fileData) {
      formSubmitData.set("avatar", fileData);
    }

    const result = await createUserAction(state, formSubmitData);

    if (result.success) {
      await showModal({
        title: "Usuario Creado!",
        type: "delete",
        text: "El usuario ha sido creado exitosamente.",
        icon: "success",
      });
      router.push("/sistema/negocio/usuarios");
      const formElement = document.getElementById(
        "user-form"
      ) as HTMLFormElement;
      formElement.reset();
      setUserImage("/images/avatar_placeholder.jpg");
      setFileData(null);
    }
  };

  const {
    getRootProps: getUserRootProps,
    getInputProps: getUserInputProps,
    isDragActive: isUserDragActive,
  } = useDropzone({
    accept: { "image/*": [] },
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setFileData(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setUserImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
  });

  return (
    <form
      id="user-form"
      action={handleSubmit}
      className="space-y-4 flex flex-col gap-4"
    >
      <div className="flex maxmd:flex-col gap-3 w-full">
        <div className="flex flex-col ">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-semibold">Agrega imagen</h3>
          </div>
          <div
            {...getUserRootProps()}
            className={`relative overflow-hidden flex items-center text-white text-sm z-10 border-2 border-dashed rounded-lg p-6 text-center cursor-grab h-60 w-auto mb-5 ${
              isUserDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <input {...getUserInputProps()} />
            {isUserDragActive ? (
              <p>Drop the image here...</p>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 w-full">
                <CloudUpload size={40} className="text-white" />
                <p>Drag & drop a user image here, or click to select one.</p>
              </div>
            )}
            <Image
              className="absolute object-cover -z-10 flex  items-center justify-center"
              src={userImage}
              alt="imagen"
              width={250}
              height={250}
            />
          </div>
          {fileData && (
            <p className="mt-2 text-xs text-muted">
              Selected file: {fileData.name} ({Math.round(fileData.size / 1024)}{" "}
              KB)
            </p>
          )}
          {state.errors?.avatar && (
            <p className="text-sm text-red-500">
              {state.errors?.avatar.join(", ")}
            </p>
          )}
        </div>
        <div className="w-full flex items-center flex-col gap-3">
          <TextInput
            value={formData.name}
            onChange={handleInputChange}
            name="name"
            label="Nombre"
            state={state}
          />
          <TextInput
            value={formData.email}
            onChange={handleInputChange}
            name="email"
            label="Email"
            state={state}
          />
          <TextInput
            value={formData.phone ?? ""}
            onChange={handleInputChange}
            name="phone"
            label="Teléfono"
            state={state}
          />
          <TextInput
            value={formData.authCode ?? ""}
            onChange={handleInputChange}
            name="authCode"
            label="Código de supervisor"
            state={state}
          />
          <PasswordInput
            value={formData.password ?? ""}
            onChange={handleInputChange}
            name="password"
            label="Contraseña"
            state={state}
          />
          <SelectInput
            isSelected={formData.role}
            label="Rol"
            name="role"
            options={roles}
            state={state}
          />
          <SelectInput
            isSelected={formData.warehouseId}
            label="Almacén"
            name="warehouseId"
            options={warehouses}
            state={state}
          />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">
              {formData.active ? "Activo" : "Inactivo"}
            </label>
            <ToggleSwitch isOn={formData.active} handleToggle={handleToggle} />
          </div>
        </div>
      </div>
      <button
        type="submit"
        // disabled={sending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
        Crear Usuario
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
