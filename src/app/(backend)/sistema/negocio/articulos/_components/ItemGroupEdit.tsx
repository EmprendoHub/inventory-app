"use client";

import React, { useState, useEffect } from "react";
import { useFormState } from "react-dom";
import { ItemGroupType, ItemType } from "@/types/items";
import { SearchSelectInput } from "@/components/SearchSelectInput";
import TextInput from "@/components/TextInput";
import NumericInput from "@/components/NumericInput";
import Image from "next/image";
import placeholderImage from "../../../../../../../public/images/item_placeholder.png";
import { CloudUpload, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { updateItemGroupAction } from "../_actions";
import { useModal } from "@/app/context/ModalContext";

export default function ItemGroupEdit({
  items,
  itemGroup,
}: {
  items: ItemType[];
  itemGroup: ItemGroupType & { items: { itemId: string; quantity: number }[] }; // Include quantities
}) {
  // eslint-disable-next-line
  const [state, formAction] = useFormState(updateItemGroupAction, {
    errors: {},
    success: false,
    message: "",
  });

  const { showModal } = useModal();

  // Pre-fill selected items with quantities
  const [selectedItems, setSelectedItems] = React.useState<
    { item: ItemType; quantity: number }[]
  >([]);

  // Effect to map item IDs to their corresponding item objects with quantities
  useEffect(() => {
    if (itemGroup.items && items.length > 0) {
      const mappedItems = itemGroup.items
        .map(({ itemId, quantity }) => {
          const item = items.find((item) => item.id === itemId);
          return item ? { item, quantity } : null;
        })
        .filter(
          (item): item is { item: ItemType; quantity: number } => item !== null
        );
      setSelectedItems(mappedItems);
    }
  }, [itemGroup.items, items]);

  // Pre-fill the image
  const [productImage, setProductImage] = useState<string>(
    itemGroup.mainImage || "/images/item_placeholder.png"
  );
  const [fileData, setFileData] = useState<File | null>(null);

  // Function to add an item to the selected items list
  const handleAddItem = (itemId: string) => {
    const selectedItem = items.find((item) => item.id === itemId);
    if (selectedItem && !selectedItems.find((si) => si.item.id === itemId)) {
      setSelectedItems([...selectedItems, { item: selectedItem, quantity: 1 }]);
    }
  };

  // Function to remove an item from the selected items list
  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter((si) => si.item.id !== itemId));
  };

  // Function to update the quantity of a specific item
  const handleQuantityChange = (itemId: string, quantity: number) => {
    setSelectedItems(
      selectedItems.map((si) =>
        si.item.id === itemId ? { ...si, quantity } : si
      )
    );
  };

  // Function to calculate the total price of selected items
  const calculateTotalPrice = () => {
    return selectedItems.reduce(
      (total, si) => total + si.item.price * si.quantity,
      0
    );
  };

  // Custom submit handler to handle the file upload
  const handleSubmit = async (formData: FormData) => {
    if (fileData) {
      formData.set("image", fileData);
    }
    formData.set("id", itemGroup.id); // Include the item group ID for updating
    formData.set(
      "items",
      selectedItems.map((si) => `${si.item.id}:${si.quantity}`).join(",")
    );
    const result = await updateItemGroupAction(state, formData);

    // Check if the product was updated successfully
    if (result.success) {
      await showModal({
        title: "Articulo Compuesto Actualizado!",
        type: "delete",
        text: "El articulo Compuesto ha sido actualizado exitosamente.",
        icon: "success",
      });
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
    <form
      id="compound-product-form"
      action={handleSubmit}
      className="space-y-4 flex flex-col gap-4"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
        }
      }}
    >
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
              <p>Drag & drop a product image here, or click to select one.</p>
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
            Selected file: {fileData.name} ({Math.round(fileData.size / 1024)}{" "}
            KB)
          </p>
        )}
      </div>
      <div className="flex maxsm:flex-col items-center gap-4">
        <TextInput
          label="Nombre"
          name="name"
          state={state}
          value={itemGroup.name} // Pre-fill the name
        />
        <NumericInput
          label="Precio Sugerido"
          name="price"
          state={state}
          defaultValue={itemGroup.price || calculateTotalPrice()} // Pre-fill the price
        />
      </div>

      <div>
        <SearchSelectInput
          className="flex-col"
          label="Artículos"
          name="items"
          state={state}
          options={items.map((item) => ({
            value: item.id,
            name: item.name,
          }))}
          onChange={handleAddItem}
        />

        <input
          name="items"
          id="items"
          type="text"
          value={selectedItems
            .map((si) => `${si.item.id}:${si.quantity}`)
            .join(",")}
          className="hidden"
          readOnly
        />

        <div className="space-y-2 bg-card p-4 rounded-lg mt-10">
          {selectedItems.map(({ item, quantity }) => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="relative w-20 h-20 overflow-hidden">
                <Image
                  src={item.mainImage || placeholderImage}
                  alt="producto"
                  width={50}
                  height={50}
                  className="absolute object-cover w-full h-auto"
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <p className="text-sm text-muted leading-none">{item.name}</p>
                <p className="text-sm text-muted leading-none">
                  Precio: {item.price.toLocaleString()}
                </p>
                {item.notes && (
                  <p className="text-sm text-muted leading-none">
                    Descripción: {item.notes}
                  </p>
                )}
              </div>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) =>
                  handleQuantityChange(item.id, parseInt(e.target.value))
                }
                className="w-20 p-2 border rounded"
              />
              <button
                type="button"
                onClick={() => handleRemoveItem(item.id)}
                className="ml-auto rounded-full bg-red-700 hover:bg-red-900"
              >
                <X className="text-white" />
              </button>
            </div>
          ))}
        </div>

        {/* Display the total price of selected items */}
        <div className="mt-4">
          <p className="font-semibold text-lg">
            Total: {calculateTotalPrice().toLocaleString()}
          </p>
        </div>
      </div>

      <button
        type="submit"
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        Actualizar Articulo Compuesto
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
