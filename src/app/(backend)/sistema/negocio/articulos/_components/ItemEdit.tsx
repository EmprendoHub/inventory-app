"use client";
import React, { useState } from "react";
import { useFormState } from "react-dom";
import SelectInput from "@/components/SelectInput";
import TextInput from "@/components/TextInput";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import TextAreaInput from "@/components/TextAreaInput";
import NumericInput from "@/components/NumericInput";
import { CloudUpload } from "lucide-react";
import { ItemGroupType } from "@/types/items";
import { useModal } from "@/app/context/ ModalContext";
import { useRouter } from "next/navigation";
import { updateItemAction } from "../_actions";

export default function ProductEdit({
  categories,
  brands,
  units,
  warehouses,
  suppliers,
  item,
}: ItemGroupType) {
  const router = useRouter();
  // eslint-disable-next-line
  const [state, formAction] = useFormState(updateItemAction, {
    errors: {},
    success: false,
    message: "",
  });
  const [sending, setSending] = useState(false);

  const { showModal } = useModal();

  // Add state for form fields
  const [formData, setFormData] = useState({
    id: item?.id,
    name: item?.name,
    description: item?.description,
    sku: item?.sku,
    barcode: item?.barcode,
    dimensions: item?.dimensions,
    price: item?.price,
    cost: item?.cost,
    minStock: item?.minStock,
    tax: item?.tax,
    notes: item?.notes,
    mainImage: item?.mainImage,
    supplierId: item?.supplierId,
    categoryId: item?.categoryId,
    brandId: item?.brandId,
    unitId: item?.unitId,
    updatedAt: new Date(),
  });

  const [productImage, setProductImage] = useState<string>(
    item?.mainImage || "/images/item_placeholder.png"
  );
  const [fileData, setFileData] = useState<File | null>(null);

  // Handle input changes
  const handleInputChange = (name: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Custom submit handler to handle the file upload
  const handleSubmit = async (formSubmitData: FormData) => {
    setSending((prev) => !prev);

    formSubmitData.set("id", item?.id || "");
    if (fileData) {
      formSubmitData.set("image", fileData); // Replace the empty file input with our stored file
    }

    // Call the form action
    const result = await updateItemAction(state, formSubmitData);

    // Check if the product was created successfully
    if (result.success) {
      // Reset the form fields
      await showModal({
        title: "Articulo Actualizado!",
        type: "delete",
        text: "El articulo ha sido actualizado exitosamente.",
        icon: "success",
      });
      router.push("/sistema/negocio/articulos");
      setSending((prev) => !prev);
    }
  };

  const {
    getRootProps: getProductRootProps,
    getInputProps: getProductInputProps,
    isDragActive: isProductDragActive,
  } = useDropzone({
    accept: { "image/*": [] },
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setFileData(file); // Store the file for later use

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
  });

  return (
    <form action={handleSubmit} className="space-y-4 flex flex-col gap-4">
      <div className="flex maxmd:flex-col gap-3 w-full">
        {/* Image Upload Section */}
        <div className="flex flex-col ">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-semibold">Agrega imagen</h3>
          </div>
          <div
            {...getProductRootProps()}
            className={`relative overflow-hidden flex items-center text-white text-sm z-10 border-2 border-dashed rounded-lg p-6 text-center cursor-grab h-60 w-96 mb-5 ${
              isProductDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <input {...getProductInputProps()} />
            {isProductDragActive ? (
              <p>Deja caer imagen aquí...</p>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3">
                <CloudUpload size={40} className="text-white text-xs" />
                <p></p>
              </div>
            )}
            <Image
              className="absolute object-cover w-full"
              src={productImage}
              alt="imagen"
              width={500}
              height={500}
            />
          </div>
          {fileData && (
            <p className="mt-2 text-xs text-muted">
              Archivo seleccionado: {fileData.name} (
              {Math.round(fileData.size / 1024)} KB)
            </p>
          )}
          {state.errors?.image && (
            <p className="text-sm text-red-500">
              {state.errors?.image.join(", ")}
            </p>
          )}
        </div>
        <div className="w-full flex items-center flex-col gap-3">
          <TextInput
            value={formData.name}
            onChange={handleInputChange}
            name="name"
            label="Nombre"
            state={state}
          />
          <TextAreaInput
            value={formData.description}
            onChange={handleInputChange}
            name="description"
            label="Descripción"
            state={state}
          />
          <div className="w-full flex maxsm:flex-col gap-3">
            <SelectInput
              label="Bodega"
              name="warehouse"
              options={warehouses.map(
                (warehouse: { id: string; title: string }) => ({
                  value: warehouse.id,
                  name: warehouse.title,
                })
              )}
              state={state}
            />
            <SelectInput
              label="Categoría"
              name="category"
              options={categories.map(
                (category: {
                  id: string;
                  title: string;
                  description: string;
                }) => ({
                  value: category.id,
                  name: category.title,
                  description: category.description,
                })
              )}
              state={state}
            />
          </div>
        </div>
      </div>
      <div className="w-full flex items-center maxmd:flex-col gap-3">
        <div className="flex w-full gap-3 maxsm:flex-col">
          <SelectInput
            label="Marca"
            name="brand"
            options={brands.map(
              (brand: { id: string; name: string; description: string }) => ({
                value: brand.id,
                name: brand.name,
                description: brand.description,
              })
            )}
            state={state}
          />
          <SelectInput
            label="Unidad de Medida"
            name="unit"
            options={units.map(
              (unit: { id: string; title: string; abbreviation: string }) => ({
                value: unit.id,
                name: unit.title,
                abbreviation: unit.abbreviation,
              })
            )}
            state={state}
          />
        </div>
        <TextInput
          name="dimensions"
          label="Dimensiones (10 x 20 x 30)"
          state={state}
          value={formData.dimensions ?? ""}
          onChange={handleInputChange}
        />
      </div>

      <div className="flex maxsm:flex-col gap-3">
        <TextInput
          value={formData.sku}
          onChange={handleInputChange}
          name="sku"
          label="SKU"
          state={state}
        />
        <TextInput
          value={formData.barcode ?? ""}
          onChange={handleInputChange}
          name="barcode"
          label="Código de Barras"
          state={state}
        />
      </div>

      {/* Numeric inputs */}
      <div className="flex maxsm:flex-col gap-3">
        <NumericInput
          onChange={(value) => handleInputChange("cost", value)}
          name="cost"
          label="Costo de Compra"
          state={state}
        />
        <NumericInput
          onChange={(value) => handleInputChange("price", value)}
          name="price"
          label="Precio de Venta"
          state={state}
        />
      </div>
      <div className="flex maxsm:flex-col gap-3">
        <NumericInput
          onChange={(value) => handleInputChange("minStock", value)}
          name="minStock"
          label="Stock Minio"
          state={state}
        />
      </div>
      <div className="flex maxsm:flex-col gap-3">
        <NumericInput
          onChange={(value) => handleInputChange("tax", value)}
          name="tax"
          label="Impuesto"
          state={state}
        />
        <SelectInput
          label="Proveedor"
          name="supplier"
          options={suppliers.map(
            (supplier: { id: string; name: string; notes: string }) => ({
              value: supplier.id,
              name: supplier.name,
              description: supplier.notes,
            })
          )}
          state={state}
        />
      </div>
      <TextAreaInput
        value={formData.notes ?? ""}
        onChange={handleInputChange}
        name="notes"
        label="Notas"
        state={state}
      />
      <button
        type="submit"
        disabled={sending}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        {sending && <span className="loader"></span>}
        Actualizar Articulo
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
