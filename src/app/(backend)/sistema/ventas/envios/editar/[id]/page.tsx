import React from "react";
import FormHeader from "@/app/(backend)/sistema/negocio/_components/FormHeader";
import Link from "next/link";
import prisma from "@/lib/db";
import DeliveryEdit from "../../_components/DeliveryEdit";

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

  const delivery = await prisma.delivery.findUnique({
    where: {
      id: id,
    },
  });
  const orders = await prisma.order.findMany({
    include: {
      client: true, // Include the related client data
    },
  });
  const drivers = await prisma.user.findMany({ where: { role: "CHOFER" } });
  const trucks = await prisma.truck.findMany();

  if (!delivery) {
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
      <FormHeader title={"Editar Usuario"} />
      {/* Form */}
      <DeliveryEdit
        delivery={delivery}
        orders={orders}
        drivers={drivers}
        trucks={trucks}
      />
    </div>
  );
}
