import React from "react";
import FormBusinessHeader from "@/app/(backend)/sistema/negocio/_components/FormBusinessHeader";
import Link from "next/link";
import prisma from "@/lib/db";
import UserEdit from "../../_components/UserEdit";
import { roles } from "@/app/constants";

export default async function EditUser({ params }: { params: { id: string } }) {
  const id = params.id;

  if (id.length !== 24) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró el user.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/ventas/clientes"}
        >
          Ver users
        </Link>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró el user.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/ventas/pedidos"}
        >
          Ver users
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <FormBusinessHeader title={"Editar Usuario"} />
      {/* Form */}
      <UserEdit roles={roles} user={user} />
    </div>
  );
}
