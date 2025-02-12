import React from "react";
import FormBusinessHeader from "@/app/(backend)/sistema/negocio/_components/FormBusinessHeader";
import UserForm from "../_components/UserForm";
import { roles } from "@/app/constants";

export default async function NewUser() {
  return (
    <div>
      {/* Header */}
      <FormBusinessHeader title={"Articulo"} />
      {/* Form */}
      <UserForm roles={roles} />
    </div>
  );
}
