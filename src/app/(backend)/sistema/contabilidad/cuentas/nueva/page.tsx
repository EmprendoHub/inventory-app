import React from "react";

import prisma from "@/lib/db";
import AccountForm from "../_components/AccountForm";
import FormBusinessHeader from "@/app/(backend)/sistema/negocio/_components/FormBusinessHeader";

export default async function NewAccount() {
  const accounts = await prisma.account.findMany();

  return (
    <div>
      {/* Header */}
      <FormBusinessHeader title={"Cuenta"} />
      {/* Form */}
      <AccountForm accounts={accounts} />
    </div>
  );
}
