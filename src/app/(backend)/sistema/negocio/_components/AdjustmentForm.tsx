"use client";
import React, { useState, useMemo, useRef } from "react";
import { useFormState } from "react-dom";
import { createAdjustment } from "../_actions";
import SelectInput from "@/components/SelectInput";
import TextAreaInput from "@/components/TextAreaInput";
import NumericInput from "@/components/NumericInput";
import {
  MinusCircle,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { StockMovement } from "@/types/accounting";
import { Button } from "@/components/ui/button";
import { SearchSelectInput } from "@/components/SearchSelectInput";

type AdjustType = {
  items: {
    id: string;
    name: string;
    description: string;
    sku: string;
    barcode: string | null;
    dimensions: string | null;
    price: number;
    cost: number;
    minStock: number;
    tax: number;
    supplierId: string;
    notes: string | null;
    mainImage?: string;
  }[];
  warehouses: { id: string; title: string; description?: string }[];
  stockMovements: StockMovement[];
};

export default function AdjustmentForm({
  items,
  warehouses,
  stockMovements,
}: AdjustType) {
  const [state, formAction] = useFormState(createAdjustment, {
    errors: {},
    success: false,
    message: "",
  });

  const [formType, setFormType] = useState("add");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // State for selected item and key for SearchSelectInput reset
  const [selectedItem, setSelectedItem] = useState<
    { id: string; name: string; description: string; price: number } | undefined
  >(undefined);
  const [selectedItemKey, setSelectedItemKey] = useState("");

  // Clear form when successful
  React.useEffect(() => {
    if (state.success) {
      setIsSubmitting(false);
      formRef.current?.reset();
      // Reset selected item and generate new key
      setSelectedItem(undefined);
      setSelectedItemKey(Math.random().toString(36).substring(7));
      // Reset the page to refresh data
      window.location.reload();
    }
  }, [state.success]);

  // Reset loading state when there are errors or messages
  React.useEffect(() => {
    if (state.errors && Object.keys(state.errors).length > 0) {
      setIsSubmitting(false);
    }
    if (state.message && !state.success) {
      setIsSubmitting(false);
    }
  }, [state.errors, state.message, state.success]);

  // Handle form submission with loading state
  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await formAction(formData);
    } catch {
      setIsSubmitting(false);
    }
  };

  // Translation functions
  const getTypeTranslation = (type: string) => {
    const translations: { [key: string]: string } = {
      PURCHASE: "Compra",
      SALE: "Venta",
      TRANSFER: "Transferencia",
      ADJUSTMENT: "Ajuste",
      RETURN: "Devolución",
      DAMAGED: "Dañado",
      EXPIRED: "Vencido",
    };
    return translations[type] || type;
  };

  const getStatusTranslation = (status: string) => {
    const translations: { [key: string]: string } = {
      PENDING: "Pendiente",
      COMPLETED: "Completado",
      CANCELLED: "Cancelado",
      REJECTED: "Rechazado",
    };
    return translations[status] || status;
  };

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Sort stock movements by date (most recent first)
  const sortedStockMovements = useMemo(() => {
    return [...stockMovements].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  }, [stockMovements]);

  const totalPages = Math.ceil(sortedStockMovements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMovements = sortedStockMovements.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Handle form type change - reset selected item
  const handleFormTypeChange = (newFormType: string) => {
    setFormType(newFormType);
    setSelectedItem(undefined);
    setSelectedItemKey(Math.random().toString(36).substring(7));
  };

  // Handle item selection (similar to OrderForm)
  const handleSelectItem = (selectedId: string) => {
    const item = items.find((i) => i.id === selectedId);
    if (item) {
      setSelectedItem({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
      });
    }
    // Force internal state reset in SearchSelectInput
    setSelectedItemKey(Math.random().toString(36).substring(7));
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <ul className="flex flex-wrap mb-2 text-sm font-medium text-center text-gray-500 dark:text-gray-400">
        <li className="me-2">
          <button
            onClick={() => handleFormTypeChange("add")}
            className={`inline-flex items-center justify-center p-4  ${
              formType === "add"
                ? "text-blue-600 border-b-2 border-blue-600dark:text-blue-500 dark:border-blue-500"
                : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
            }  rounded-t-lg active  group`}
          >
            <PlusCircle />
            Agregar inventario
          </button>
        </li>
        <li className="me-2">
          <button
            onClick={() => handleFormTypeChange("transfer")}
            className={`inline-flex items-center justify-center p-4 ${
              formType === "transfer"
                ? "text-blue-600 border-b-2 border-blue-600dark:text-blue-500 dark:border-blue-500"
                : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
            }  rounded-t-lg active  group`}
            aria-current="page"
          >
            <MinusCircle />
            Transferir inventario
          </button>
        </li>
        <li className="me-2">
          <button
            onClick={() => handleFormTypeChange("remove")}
            className={`inline-flex items-center justify-center p-4 ${
              formType === "remove"
                ? "text-blue-600 border-b-2 border-blue-600dark:text-blue-500 dark:border-blue-500"
                : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
            }  rounded-t-lg active  group`}
          >
            <Trash2 />
            Remover inventario
          </button>
        </li>
      </ul>

      {formType === "add" ? (
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <input value={formType} type="hidden" name="formType" id="formType" />
          <div className="flex maxmd:flex-col gap-3 items-start">
            <div className="flex flex-col gap-3 w-full">
              <SearchSelectInput
                key={selectedItemKey}
                label="Articulo"
                name="articulo"
                state={state}
                className="w-full"
                placeholder="Buscar articulo..."
                value={selectedItem?.id || ""}
                options={items.map((item) => ({
                  value: item.id,
                  name: item.name,
                  description: `$${item.price.toFixed(2)} - SKU: ${
                    item.sku
                  } - ${item.description}`,
                  price: item.price,
                  image: item.mainImage, // Use the correct property name for the image URL
                }))}
                onChange={(value) => {
                  handleSelectItem(value);
                }}
              />

              {/* Show selected item info */}
              {selectedItem && (
                <div className="flex gap-2 items-center p-2 bg-card rounded-md">
                  <div className="flex flex-col">
                    <h4 className="font-semibold text-sm">
                      {selectedItem.name}
                    </h4>
                    <p className="text-xs text-gray-600">
                      ${selectedItem.price.toFixed(2)} -{" "}
                      {selectedItem.description}
                    </p>
                  </div>
                </div>
              )}

              <NumericInput name="transAmount" label="Cantidad" state={state} />
            </div>

            <SelectInput
              className="w-full"
              name="sendingWarehouse"
              label=""
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
          </div>

          <TextAreaInput state={state} name="notes" label="Notas de Ajuste" />

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center items-center gap-2 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && (
              <svg
                className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {isSubmitting ? "Procesando..." : "Agregar Inventario"}
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
      ) : formType === "transfer" ? (
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <input value={formType} type="hidden" name="formType" id="formType" />
          <div className="flex gap-3 items-center">
            <div className="flex flex-col gap-3 w-full">
              {/* Item Selection with SearchSelectInput */}
              <SearchSelectInput
                key={selectedItemKey} // This will force re-render and reset internal state
                label="Articulo"
                name="articulo"
                state={state}
                className="w-full"
                placeholder="Buscar articulo..."
                value={selectedItem?.id || ""}
                options={items.map((item) => ({
                  value: item.id,
                  name: item.name,
                  description: `$${item.price.toFixed(2)} - SKU: ${
                    item.sku
                  } - ${item.description}`,
                  price: item.price,
                }))}
                onChange={(value) => {
                  handleSelectItem(value);
                }}
              />

              {/* Show selected item info */}
              {selectedItem && (
                <div className="flex gap-2 items-center p-2 bg-card rounded-md">
                  <div className="flex flex-col">
                    <h4 className="font-semibold text-sm">
                      {selectedItem.name}
                    </h4>
                    <p className="text-xs text-gray-600">
                      ${selectedItem.price.toFixed(2)} -{" "}
                      {selectedItem.description}
                    </p>
                  </div>
                </div>
              )}

              <NumericInput
                name="transAmount"
                label="Cantidad a transferir"
                state={state}
              />
            </div>

            <div className="w-full flex flex-col gap-3 items-center">
              <SelectInput
                className="w-full"
                name="sendingWarehouse"
                label="Bodega de Envío"
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
              <SelectInput
                className="w-full"
                name="receivingWarehouse"
                label="Bodega Receptora"
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
            </div>
          </div>

          <TextAreaInput state={state} name="notes" label="Notas de Ajuste" />

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center items-center gap-2 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && (
              <svg
                className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {isSubmitting ? "Procesando..." : "Ajustar Inventario"}
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
      ) : (
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <input value={formType} type="hidden" name="formType" id="formType" />
          <div className="flex maxmd:flex-col gap-3 items-start">
            <div className="flex flex-col gap-3 w-full">
              <SearchSelectInput
                key={selectedItemKey}
                label="Articulo"
                name="articulo"
                state={state}
                className="w-full"
                placeholder="Buscar articulo..."
                value={selectedItem?.id || ""}
                options={items.map((item) => ({
                  value: item.id,
                  name: item.name,
                  description: `$${item.price.toFixed(2)} - SKU: ${
                    item.sku
                  } - ${item.description}`,
                  price: item.price,
                  image: item.mainImage,
                }))}
                onChange={(value) => {
                  handleSelectItem(value);
                }}
              />

              {/* Show selected item info */}
              {selectedItem && (
                <div className="flex gap-2 items-center p-2 bg-card rounded-md">
                  <div className="flex flex-col">
                    <h4 className="font-semibold text-sm">
                      {selectedItem.name}
                    </h4>
                    <p className="text-xs text-gray-600">
                      ${selectedItem.price.toFixed(2)} -{" "}
                      {selectedItem.description}
                    </p>
                  </div>
                </div>
              )}

              <NumericInput
                name="transAmount"
                label="Cantidad a remover"
                state={state}
              />
            </div>

            <SelectInput
              className="w-full"
              name="sendingWarehouse"
              label="Bodega"
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
          </div>

          <TextAreaInput
            state={state}
            name="notes"
            label="Notas de Remoción (razón del ajuste)"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center items-center gap-2 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && (
              <svg
                className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {isSubmitting ? "Procesando..." : "Remover Inventario"}
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
      )}

      {stockMovements && stockMovements.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Movimientos de Inventario ({stockMovements.length})
            </h3>
            <div className="text-sm text-gray-500">
              Página {currentPage} de {totalPages}
            </div>
          </div>

          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left text-xs font-medium p-3">Fecha</th>
                    <th className="text-left text-xs font-medium p-3">
                      Artículo
                    </th>
                    <th className="text-left text-xs font-medium p-3">Tipo</th>
                    <th className="text-left text-xs font-medium p-3">
                      Cantidad
                    </th>
                    <th className="text-left text-xs font-medium p-3">
                      Origen
                    </th>
                    <th className="text-left text-xs font-medium p-3">
                      Destino
                    </th>
                    <th className="text-left text-xs font-medium p-3">
                      Estado
                    </th>
                    <th className="text-left text-xs font-medium p-3">
                      Referencia
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentMovements.map((stock) => {
                    // Find the item name
                    const item = items.find((item) => item.id === stock.itemId);
                    const fromWarehouse = warehouses.find(
                      (w) => w.id === stock.fromWarehouseId
                    );
                    const toWarehouse = warehouses.find(
                      (w) => w.id === stock.toWarehouseId
                    );

                    return (
                      <tr key={stock.id} className="border-b hover:bg-muted/25">
                        <td className="text-xs font-medium p-3">
                          {formatDate(stock.createdAt)}
                        </td>
                        <td className="text-xs p-3">{item?.name || "N/A"}</td>
                        <td className="text-xs p-3">
                          <span
                            className={`inline-block px-2 py-1 rounded text-white text-xs ${
                              stock.type === "PURCHASE"
                                ? "bg-emerald-700"
                                : stock.type === "SALE"
                                ? "bg-blue-700"
                                : stock.type === "TRANSFER"
                                ? "bg-purple-700"
                                : stock.type === "ADJUSTMENT"
                                ? "bg-orange-700"
                                : stock.type === "RETURN"
                                ? "bg-yellow-700"
                                : stock.type === "DAMAGED"
                                ? "bg-red-700"
                                : stock.type === "EXPIRED"
                                ? "bg-gray-700"
                                : "bg-gray-700"
                            }`}
                          >
                            {getTypeTranslation(stock.type)}
                          </span>
                        </td>
                        <td className="text-xs font-medium p-3">
                          <span
                            className={
                              stock.quantity >= 0
                                ? "text-emerald-700"
                                : "text-red-700"
                            }
                          >
                            {stock.quantity >= 0 ? "+" : ""}
                            {stock.quantity}
                          </span>
                        </td>
                        <td className="text-xs p-3">
                          {fromWarehouse?.title || "-"}
                        </td>
                        <td className="text-xs p-3">
                          {toWarehouse?.title || "-"}
                        </td>
                        <td className="text-xs p-3">
                          <span
                            className={`inline-block px-2 py-1 rounded text-white text-xs ${
                              stock.status === "COMPLETED"
                                ? "bg-emerald-700"
                                : stock.status === "PENDING"
                                ? "bg-yellow-700"
                                : stock.status === "CANCELLED"
                                ? "bg-red-700"
                                : stock.status === "REJECTED"
                                ? "bg-red-700"
                                : "bg-gray-700"
                            }`}
                          >
                            {getStatusTranslation(stock.status)}
                          </span>
                        </td>
                        <td className="text-xs p-3">
                          {stock.reference || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {currentMovements.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">
                  No hay movimientos de inventario registrados
                </p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="text-xs"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="text-xs"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="text-xs text-gray-500">
                Mostrando {startIndex + 1} a{" "}
                {Math.min(endIndex, stockMovements.length)} de{" "}
                {stockMovements.length} registros
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
