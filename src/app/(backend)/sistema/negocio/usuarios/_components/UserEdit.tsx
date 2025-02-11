"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import SelectInput from "@/components/SelectInput";
import TextInput from "@/components/TextInput";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { CloudUpload } from "lucide-react";
import { UserGroupType } from "@/types/users";
import { useModal } from "@/app/context/ ModalContext";
import { useRouter } from "next/navigation";
import { updateUserAction } from "../_actions";
import PasswordInput from "@/components/PasswordInput";
import ToggleSwitch from "../../_components/ToggleSwitch";

export default function UserEdit({ roles, user }: UserGroupType) {
  const router = useRouter();
  // eslint-disable-next-line
  const [state, formAction] = useFormState(updateUserAction, {
    errors: {},
    success: false,
    message: "",
  });
  const [sending, setSending] = useState(false);
  const { showModal } = useModal();

  const [formData, setFormData] = useState({
    id: user?.id,
    name: user?.name,
    email: user?.email,
    phone: user?.phone,
    password: user?.password,
    role: user?.role,
    avatar: user?.avatar,
    active: user?.active || false, // Add a new field for the toggle
    updatedAt: new Date(),
  });

  const [userImage, setUserImage] = useState<string>(
    user?.avatar || "/images/avatar_placeholder.jpg"
  );
  const [fileData, setFileData] = useState<File | null>(null);

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggle = () => {
    setFormData((prev) => ({
      ...prev,
      active: !prev.active,
    }));
  };

  const handleSubmit = async (formSubmitData: FormData) => {
    setSending((prev) => !prev);

    formSubmitData.set("id", user?.id || "");
    if (fileData) {
      formSubmitData.set("avatar", fileData);
    }

    const result = await updateUserAction(state, formSubmitData);

    if (result.success) {
      await showModal({
        title: "Usuario Actualizado!",
        type: "delete",
        text: "El usuario ha sido actualizado exitosamente.",
        icon: "success",
      });
      router.push("/sistema/admin/usuarios");
      setSending((prev) => !prev);
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
    <form action={handleSubmit} className="space-y-4 flex flex-col gap-4">
      <div className="flex maxmd:flex-col gap-3 w-full">
        <div className="flex flex-col ">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-semibold">Agrega imagen</h3>
          </div>
          <div
            {...getUserRootProps()}
            className={`relative overflow-hidden flex items-center text-white text-sm z-10 border-2 border-dashed rounded-lg p-6 text-center cursor-grab h-60 w-96 mb-5 ${
              isUserDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <input {...getUserInputProps()} />
            {isUserDragActive ? (
              <p>Drop the image here...</p>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3">
                <CloudUpload size={40} className="text-white" />
                <p>Drag & drop a user image here, or click to select one.</p>
              </div>
            )}
            <Image
              className="absolute object-cover -z-10 top-0 left-0"
              src={userImage}
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
          <PasswordInput
            onChange={handleInputChange}
            name="password"
            label="Contraseña"
            state={state}
          />
          <SelectInput
            label="Rol"
            name="role"
            options={roles}
            state={state}
            isSelected={formData.role}
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
        disabled={sending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
        Actualizar Usuario
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
