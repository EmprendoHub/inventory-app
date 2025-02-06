import React from "react";
import FormHeader from "../../_components/FormHeader";
import ProductForm from "../_components/ProductForm";
import prisma from "@/lib/db";

export default async function NewItem() {
  const brands = await prisma.brand.findMany();
  const units = await prisma.unit.findMany();
  const categories = await prisma.category.findMany();
  const warehouses = await prisma.warehouse.findMany();
  const suppliers = await prisma.supplier.findMany();

  return (
    <div>
      {/* Header */}
      <FormHeader title={"Articulo"} />
      {/* Form */}
      <ProductForm
        categories={categories}
        brands={brands}
        units={units}
        warehouses={warehouses}
        suppliers={suppliers}
      />
    </div>
  );
}
