"use client";
import React, { useState, useEffect } from "react";
import { useFormState } from "react-dom";
import SelectInput from "@/components/SelectInput";
import TextInput from "@/components/TextInput";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import TextAreaInput from "@/components/TextAreaInput";
import NumericInput from "@/components/NumericInput";
import { SearchSelectInput } from "@/components/SearchSelectInput";
import { CloudUpload } from "lucide-react";
import { ItemFormState, ItemCompoundType } from "@/types/items";
import { useModal } from "@/app/context/ModalContext";
import { createItemAction } from "../_actions";
import { useSession } from "next-auth/react";
import { UserType } from "@/types/users";

export default function ProductForm({
  categories,
  brands,
  units,
  warehouses,
  suppliers,
}: ItemCompoundType) {
  const { data: session } = useSession();
  const user = session?.user as UserType;
  // eslint-disable-next-line
  const [state, formAction] = useFormState<ItemFormState, FormData>(
    createItemAction,
    {
      errors: {},
      success: false,
      message: "",
    }
  );

  const [sending, setSending] = useState(false);

  const { showModal } = useModal();

  const [productImage, setProductImage] = useState<string>(
    "/images/item_placeholder.png"
  );
  const [fileData, setFileData] = useState<File | null>(null);

  // State for controlled inputs
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dimensions: "1",
    cost: 50,
    price: 0,
    stock: 0,
    minStock: 10,
    tax: 0,
  });

  // State to track if description was manually edited
  const [isDescriptionManuallyEdited, setIsDescriptionManuallyEdited] =
    useState(false);
  const [categorySearchKey, setCategorySearchKey] = useState("");

  // Auto-sync description with name (title) unless manually edited
  useEffect(() => {
    if (!isDescriptionManuallyEdited && formData.name) {
      setFormData((prev) => ({
        ...prev,
        description: formData.name,
      }));
    }
  }, [formData.name, isDescriptionManuallyEdited]);

  // Handle input changes for all inputs
  const handleInputChange = (
    name: string,
    value:
      | string
      | number
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    // Extract the actual value - handle event objects, strings, and numbers
    let actualValue: string | number;

    if (typeof value === "string" || typeof value === "number") {
      actualValue = value;
    } else {
      actualValue = value.target.value;
    }

    if (name === "description") {
      setIsDescriptionManuallyEdited(true);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: actualValue,
    }));
  };

  // Handle text input changes (for TextInput and TextAreaInput components)
  const handleTextInputChange = (name: string, value: string) => {
    if (name === "description") {
      setIsDescriptionManuallyEdited(true);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Reset form function
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      dimensions: "1",
      cost: 50,
      price: 0,
      stock: 0,
      minStock: 10,
      tax: 0,
    });
    setIsDescriptionManuallyEdited(false);
    setProductImage("/images/item_placeholder.png");
    setFileData(null);
    setCategorySearchKey(Math.random().toString(36).substring(7));
  };

  // Custom submit handler to handle the file upload
  const handleSubmit = async (submitFormData: FormData) => {
    setSending((prev) => !prev);
    if (fileData) {
      submitFormData.set("image", fileData);
    }
    submitFormData.set("userId", user.id);

    // Set the controlled values to FormData, converting numbers to strings
    Object.entries(formData).forEach(([key, value]) => {
      submitFormData.set(key, value.toString());
    });

    // Call the form action
    const result = await createItemAction(state, submitFormData);
    setSending((prev) => !prev);

    // Check if the product was created successfully
    if (result.success) {
      await showModal({
        title: "Articulo Creado!",
        type: "delete",
        text: "El articulo ha sido creado exitosamente.",
        icon: "success",
      });

      // Reset the form
      const formElement = document.getElementById(
        "product-form"
      ) as HTMLFormElement;
      formElement?.reset();

      // Reset controlled state
      resetForm();
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
      setFileData(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
  });

  return (
    <section>
      {sending && (
        <div
          className={`fixed top-0 left-0 z-50 flex flex-col items-center justify-center w-screen h-screen bg-black/50`}
        >
          <h3>Generado producto...</h3>
          <span className="loader" />
        </div>
      )}
      <form
        id="product-form"
        action={handleSubmit}
        className="space-y-4 flex flex-col gap-4"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
          }
        }}
      >
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
                <p>Drop the image here...</p>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3">
                  <CloudUpload size={40} className="text-white" />
                  <p>
                    Drag & drop a product image here, or click to select one.
                  </p>
                </div>
              )}
              <Image
                className="absolute inset-0 object-cover w-full h-full -z-10"
                src={productImage}
                alt="imagen"
                width={500}
                height={500}
              />
            </div>
            {fileData && (
              <p className="mt-2 text-xs text-muted">
                Selected file: {fileData.name} (
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
              name="name"
              label="Nombre"
              state={state}
              value={formData.name}
              onChange={handleTextInputChange}
            />
            <TextAreaInput
              name="description"
              label="Description"
              state={state}
              value={formData.description}
              onChange={handleTextInputChange}
            />

            <div className="w-full flex maxmd:flex-col gap-3">
              <SelectInput
                label="Bodega"
                name="warehouse"
                options={warehouses.map(
                  (warehouse: {
                    id: string;
                    title: string;
                    description?: string;
                  }) => ({
                    value: warehouse.id,
                    name: warehouse.title,
                    description: warehouse.description || "",
                  })
                )}
                state={state}
              />

              {/* Changed to SearchSelectInput */}
              <SearchSelectInput
                key={categorySearchKey}
                label="Categoría"
                name="category"
                state={state}
                className="w-full"
                placeholder="Buscar categoría..."
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
                onChange={() => {
                  // This will be handled by the SearchSelectInput internally
                }}
              />
            </div>
          </div>
        </div>
        <div className="w-full flex items-center maxmd:flex-col gap-3">
          <div className="flex w-full gap-3 maxmd:flex-col">
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
                (unit: {
                  id: string;
                  title: string;
                  abbreviation: string;
                }) => ({
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
            label="Unidad de Medida (Ej: 1, 0.5, etc)"
            state={state}
            value={formData.dimensions}
            onChange={handleTextInputChange}
          />
        </div>

        {/* Numeric inputs with controllable values */}
        <div className="flex maxmd:flex-col gap-3">
          <NumericInput
            name="cost"
            label="Costo de Compra"
            state={state}
            value={formData.cost}
            onChange={(value) => handleInputChange("cost", value)}
          />
          <NumericInput
            name="price"
            label="Precio de Venta"
            state={state}
            value={formData.price}
            onChange={(value) => handleInputChange("price", value)}
          />
        </div>
        <div className="flex maxmd:flex-col gap-3">
          <NumericInput
            name="stock"
            label="Stock"
            state={state}
            value={formData.stock}
            onChange={(value) => handleInputChange("stock", value)}
          />
          <NumericInput
            name="minStock"
            label="Stock Mínimo"
            state={state}
            value={formData.minStock}
            onChange={(value) => handleInputChange("minStock", value)}
          />
        </div>
        <div className="flex maxmd:flex-col gap-3">
          <NumericInput
            name="tax"
            label="Impuesto"
            state={state}
            value={formData.tax}
            onChange={(value) => handleInputChange("tax", value)}
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
        <TextAreaInput name="notes" label="Notas" state={state} />

        <button
          type="submit"
          disabled={sending}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          {sending && <span className="loader"></span>}
          Crear Articulo
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
    </section>
  );
}
