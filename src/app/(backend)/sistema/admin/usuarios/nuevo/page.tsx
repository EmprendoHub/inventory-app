import React from "react";
import FormHeader from "@/app/(backend)/sistema/inventario/_components/FormHeader";
import UserForm from "../_components/UserForm";
import { roles } from "@/app/constants";

export default async function NewUser() {
  return (
    <div>
      {/* Header */}
      <FormHeader title={"Articulo"} />
      {/* Form */}
      <UserForm roles={roles} />
    </div>
  );
}
