import React from "react";
import prisma from "@/lib/db";
import Link from "next/link";
import PaymentEdit from "../../_components/PaymentEdit";
import SuperHeader from "@/app/(backend)/sistema/_components/SuperHeader";

export default async function EditPayment({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;

  if (id.length !== 24) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró el pago.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/ventas/clientes"}
        >
          Ver pago
        </Link>
      </div>
    );
  }

  const payment = await prisma.payment.findUnique({
    where: {
      id: id,
    },
  });

  if (!payment) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h2>No se encontró el pago.</h2>
        <Link
          className="bg-blue-600 text-white px-8 py-1.5 rounded-md text-sm mt-5"
          href={"/sistema/ventas/pagos"}
        >
          Ver Pagos
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <SuperHeader title={"Editar Pago"} />

      {/* Form */}
      <PaymentEdit payment={payment} />
    </div>
  );
}
