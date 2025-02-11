import React from "react";

import prisma from "@/lib/db";
import AccountForm from "../_components/AccountForm";
import FormHeader from "@/app/(backend)/sistema/negocio/_components/FormHeader";

export default async function NewAccount() {
  const accounts = await prisma.account.findMany();

  return (
    <div>
      {/* Header */}
      <FormHeader title={"Cuenta"} />
      {/* Form */}
      <AccountForm accounts={accounts} />
    </div>
  );
}
