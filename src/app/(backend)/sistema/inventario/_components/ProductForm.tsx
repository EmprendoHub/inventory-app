"use client";
import React from "react";
import { useFormState } from "react-dom";
import { createProduct } from "../_actions";
import SelectInput from "@/components/SelectInput";
import TextInput from "@/components/TextInput";

export default function ProductForm() {
  const [state, formAction] = useFormState(createProduct, {
    errors: {},
    success: false,
    message: "",
  });

  const brandOptions = [
    { name: "Sin marca", value: "none" },
    { name: "brand One", value: "brandone" },
  ];
  const categoryOptions = [
    { name: "Cat One", value: "one" },
    { name: "Cat Two", value: "two" },
  ];
  const unitOptions = [
    { name: "Kilometros", value: "km" },
    { name: "Millas", value: "ml" },
  ];

  const warehouseOptions = [
    { name: "Principal", value: "principal" },
    { name: "Sucursal", value: "sucursal" },
  ];

  return (
    <form action={formAction} className="space-y-4">
      {/* Name */}
      <TextInput name="name" label="Nombre" state={state} />

      {/* Description */}
      <TextInput name="description" label="Description" state={state} />
      {/* Warehouse */}
      <SelectInput
        label="Bodega"
        name="warehouse"
        options={warehouseOptions}
        state={state}
      />
      {/* Category */}
      <SelectInput
        label="Categoría"
        name="category"
        options={categoryOptions}
        state={state}
      />
      {/* Brand */}
      <SelectInput
        label="Marca"
        name="brand"
        options={brandOptions}
        state={state}
      />
      {/* Unit */}
      <SelectInput
        label="Unidad de Medida"
        name="unit"
        options={unitOptions}
        state={state}
      />
      {/* SKU */}
      <TextInput name="sku" label="SKU" state={state} />

      {/* barcode */}
      <TextInput name="barcode" label="Código de Barras" state={state} />

      {/* Precio */}

      <div>
        <label
          htmlFor="price"
          className="block text-sm font-medium text-gray-700"
        >
          Precio
        </label>
        <input
          name="price"
          id="price"
          type="number"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {state.errors?.price && (
          <p className="text-sm text-red-500">
            {state.errors.price.join(", ")}
          </p>
        )}
      </div>
      {/* Cost */}
      <div>
        <label
          htmlFor="cost"
          className="block text-sm font-medium text-gray-700"
        >
          Costo
        </label>
        <input
          name="cost"
          id="cost"
          type="number"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {state.errors?.cost && (
          <p className="text-sm text-red-500">{state.errors.cost.join(", ")}</p>
        )}
      </div>
      {/* Stock */}
      <div>
        <label
          htmlFor="stock"
          className="block text-sm font-medium text-gray-700"
        >
          Stock
        </label>
        <input
          name="stock"
          id="stock"
          type="number"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {state.errors?.stock && (
          <p className="text-sm text-red-500">
            {state.errors.stock.join(", ")}
          </p>
        )}
      </div>

      {/* Supplier */}
      <div>
        <label
          htmlFor="supplier"
          className="block text-sm font-medium text-gray-700"
        >
          Proveedor
        </label>
        <input
          name="supplier"
          id="supplier"
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {state.errors?.supplier && (
          <p className="text-sm text-red-500">
            {state.errors.supplier.join(", ")}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        Submit
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
