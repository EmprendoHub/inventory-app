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
} from "lucide-react";
import { StockMovement } from "@/types/accounting";
import { Button } from "@/components/ui/button";

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
    image?: string;
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
  const formRef = useRef<HTMLFormElement>(null);

  // Clear form when successful
  React.useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      // Reset the page to refresh data
      window.location.reload();
    }
  }, [state.success]);

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

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <ul className="flex flex-wrap mb-2 text-sm font-medium text-center text-gray-500 dark:text-gray-400">
        <li className="me-2">
          <button
            onClick={() => setFormType("add")}
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
            onClick={() => setFormType("transfer")}
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
      </ul>

      {formType === "add" ? (
        <form ref={formRef} action={formAction} className="space-y-4">
          <input value={formType} type="hidden" name="formType" id="formType" />
          <div className="flex maxmd:flex-col gap-3 items-start">
            <div className="flex flex-col gap-3 w-full">
              <SelectInput
                className="w-full"
                name="articulo"
                label="Articulo"
                options={items.map(
                  (item: {
                    id: string;
                    name: string;
                    description: string;
                  }) => ({
                    value: item.id,
                    name: item.name,
                    description: item.description,
                  })
                )}
                state={state}
              />
              <NumericInput name="transAmount" label="Cantidad" state={state} />
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

          <TextAreaInput state={state} name="notes" label="Notas de Ajuste" />

          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Agregar Inventario
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
        <form ref={formRef} action={formAction} className="space-y-4">
          <input value={formType} type="hidden" name="formType" id="formType" />
          <div className="flex gap-3 items-center">
            <div className="flex flex-col gap-3 w-full">
              <SelectInput
                className="w-full"
                name="articulo"
                label="Articulo"
                options={items.map(
                  (item: {
                    id: string;
                    name: string;
                    description: string;
                  }) => ({
                    value: item.id,
                    name: item.name,
                    description: item.description,
                  })
                )}
                state={state}
              />
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
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Ajustar Inventario
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
                                ? "bg-green-600"
                                : stock.type === "SALE"
                                ? "bg-blue-600"
                                : stock.type === "TRANSFER"
                                ? "bg-purple-600"
                                : stock.type === "ADJUSTMENT"
                                ? "bg-orange-600"
                                : stock.type === "RETURN"
                                ? "bg-yellow-600"
                                : stock.type === "DAMAGED"
                                ? "bg-red-600"
                                : stock.type === "EXPIRED"
                                ? "bg-gray-600"
                                : "bg-gray-500"
                            }`}
                          >
                            {getTypeTranslation(stock.type)}
                          </span>
                        </td>
                        <td className="text-xs font-medium p-3">
                          <span
                            className={
                              stock.quantity >= 0
                                ? "text-green-600"
                                : "text-red-600"
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
                                ? "bg-green-600"
                                : stock.status === "PENDING"
                                ? "bg-yellow-600"
                                : stock.status === "CANCELLED"
                                ? "bg-red-600"
                                : stock.status === "REJECTED"
                                ? "bg-red-700"
                                : "bg-gray-500"
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
