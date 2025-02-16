import React from "react";
import prisma from "@/lib/db";
import ItemGroupForm from "../../_components/ItemGroupForm";
import FormBusinessHeader from "../../../_components/FormBusinessHeader";

export default async function NewItem() {
  const items = await prisma.item.findMany();

  return (
    <div>
      {/* Header */}
      <FormBusinessHeader title={"Articulo Compuestos"} />
      {/* Form */}
      <ItemGroupForm items={items} />
    </div>
  );
}
