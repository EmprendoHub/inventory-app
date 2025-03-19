"use client";

import React, { useState } from "react";
import { useFormState } from "react-dom";
import { updatePurchaseOrderAction } from "../_actions";
import { PurchaseOrderGroupType } from "@/types/purchaseOrders";
import { Button } from "@/components/ui/button";
import TextAreaInput from "@/components/TextAreaInput";
import NumericInput from "@/components/NumericInput";
import DateInput from "@/components/DateInput";
import { useModal } from "@/app/context/ModalContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { X } from "lucide-react";
import { SearchSelectInput } from "@/components/SearchSelectInput";
import { useRouter } from "next/navigation";

export default function PurchaseOrderEdit({
  suppliers,
  items,
  purchaseOrder,
  purchaseOrderItems,
  formType,
}: PurchaseOrderGroupType) {
  const router = useRouter();
  // eslint-disable-next-line
  const [state, formAction] = useFormState(updatePurchaseOrderAction, {
    errors: {},
    success: false,
    message: "",
  });
  const [sending, setSending] = useState(false);
  const { showModal } = useModal();

  const [selectedItems, setSelectedItems] = useState<
    {
      itemId: string;
      name: string;
      quantity: number;
      unitPrice: number;
    }[]
  >(purchaseOrderItems || []);

  const [newItem, setNewItem] = useState({
    itemId: "",
    name: "",
    sku: "",
    quantity: 1,
    unitPrice: 0,
  });

  const [selectedSupplier, setSelectedSupplier] = useState<{
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  } | null>(
    purchaseOrder?.supplierId
      ? suppliers.find(
          (supplier) => supplier.id === purchaseOrder.supplierId
        ) || null
      : null
  );

  const [deliveryCost, setDeliveryCost] = useState(0);
  const [taxEnabled, setTaxEnabled] = useState(
    purchaseOrder?.taxAmount ? purchaseOrder.taxAmount > 0 : false
  );

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const taxTotal = taxEnabled ? subtotal * 0.16 : 0;
  const grandTotal = subtotal + taxTotal + deliveryCost;

  const handleAddItem = () => {
    if (newItem.itemId && newItem.quantity > 0 && newItem.unitPrice >= 0) {
      const selectedItem = items.find((item) => item.id === newItem.itemId);
      if (selectedItem) {
        setSelectedItems((prev) => [
          ...prev,
          {
            ...newItem,
            name: selectedItem.name,
            description: selectedItem.sku || "",
          },
        ]);
        setNewItem({
          itemId: "",
          name: "",
          sku: "",
          quantity: 1,
          unitPrice: 0,
        });
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);

    const formData = new FormData(event.currentTarget);

    formData.set("items", JSON.stringify(selectedItems));
    formData.set("id", purchaseOrder?.id?.toString() || "");
    formData.set("deliveryCost", deliveryCost.toString());
    formData.set("totalAmount", grandTotal.toString());
    formData.set("taxAmount", taxTotal.toString());
    formData.set("taxEnabled", taxEnabled.toString());
    formData.set("formType", formType?.toString() || "");
    formData.set("supplier", JSON.stringify(selectedSupplier));

    const result = await updatePurchaseOrderAction(state, formData);

    if (result.success) {
      await showModal({
        title: "Orden de Compra Actualizada!",
        type: "delete",
        text: "La orden de compra ha sido actualizada exitosamente.",
        icon: "success",
      });
      const formElement = document.getElementById(
        "purchase-order-form"
      ) as HTMLFormElement;
      formElement.reset();
      setSelectedItems([]);
      setSelectedSupplier(null);
      setDeliveryCost(0);
      setTaxEnabled(false);
    }
    router.push("/sistema/compras");

    setSending(false);
  };

  return (
    <form
      id="purchase-order-form"
      onSubmit={handleSubmit}
      className="flex-1 p-8 maxmd:p-4 bg-card rounded-lg shadow-md"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault(); // Prevent form submission
        }
      }}
    >
      {/* Supplier Info */}
      <div className="flex maxmd:flex-col-reverse gap-4 mb-8">
        <div className="flex flex-col gap-3 w-1/2 maxmd:w-full">
          <SearchSelectInput
            label="Proveedor:"
            name="supplierId"
            state={state}
            value={selectedSupplier?.id}
            className="flex-1 mb-4"
            options={suppliers.map((supplier) => ({
              value: supplier.id,
              name: supplier.name,
            }))}
            onChange={(value) => {
              const supplier = suppliers.find((s) => s.id === value);
              setSelectedSupplier(supplier || null);
            }}
          />
          {/* <NumericInput
            label="Costo de Envío"
            name="deliveryCost"
            state={state}
            defaultValue={deliveryCost}
            onChange={setDeliveryCost}
          /> */}
          <DateInput
            name="expectedDate"
            label="Fecha Esperada"
            state={state}
            defaultValue={new Date()}
          />
          {/* <SelectInput
            label="Estado"
            name="status"
            options={[
              { value: "BORRADOR", name: "Borrador" },
              { value: "PENDIENTE", name: "Pendiente" },
              { value: "APROBADO", name: "Aprobado" },
              { value: "ORDERED", name: "Ordenado" },
              { value: "PARCIALMENTE_RECIBIDO", name: "Parcialmente Recibido" },
              { value: "RECIBIDO", name: "Recibido" },
              { value: "CANCELADO", name: "Cancelado" },
            ]}
            state={state}
          /> */}
        </div>
        <div className="space-y-2 bg-card p-4 rounded-lg justify-between min-h-full flex-col flex">
          <div></div>
          {selectedSupplier && (
            <div className="flex-col flex">
              <h3 className="font-semibold text-lg">{selectedSupplier.name}</h3>
              {selectedSupplier.address && (
                <p className="text-sm text-muted leading-none">
                  {selectedSupplier.address}
                </p>
              )}
              {selectedSupplier.phone && (
                <p className="text-sm text-muted leading-none">
                  Tel: {selectedSupplier.phone}
                </p>
              )}
              {selectedSupplier.email && (
                <p className="text-sm text-muted leading-none">
                  Email: {selectedSupplier.email}
                </p>
              )}
            </div>
          )}
          {/* Tax Checkbox */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="taxEnabled"
              checked={taxEnabled}
              onChange={(e) => setTaxEnabled(e.target.checked)}
              className="w-4 h-4 rounded-full bg-input"
            />
            <label htmlFor="taxEnabled" className="text-sm">
              Aplicar 16% de IVA
            </label>
          </div>
        </div>
      </div>

      {/* Items Selection */}
      <div className="flex items-end gap-4 mb-4">
        <SearchSelectInput
          label="Seleccionar Producto:"
          name="newItemId"
          state={state}
          options={items.map((item) => ({
            value: item.id,
            name: item.name,
          }))}
          className="flex-1 min-w-60"
          value={newItem.itemId}
          onChange={(value) => setNewItem({ ...newItem, itemId: value })}
        />
        <NumericInput
          label="Cantidad"
          name="newQuantity"
          state={state}
          defaultValue={newItem.quantity}
          onChange={(value) => setNewItem({ ...newItem, quantity: value })}
        />
        <NumericInput
          label="Precio Unitario"
          name="newUnitPrice"
          state={state}
          defaultValue={newItem.unitPrice}
          onChange={(value) => setNewItem({ ...newItem, unitPrice: value })}
        />
        <Button type="button" onClick={handleAddItem}>
          +
        </Button>
      </div>

      {/* Items Table */}
      <Table className="mb-8 border rounded-lg">
        <TableHeader className="bg-card">
          <TableRow>
            <TableHead className="w-[300px]">Artículo</TableHead>
            <TableHead>Cant.</TableHead>
            <TableHead>Precio Unitario</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {selectedItems.map((item, index) => (
            <TableRow key={index} className="bg-black bg-opacity-20">
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => {
                    const newItems = [...selectedItems];
                    newItems[index].quantity = Number(e.target.value);
                    setSelectedItems(newItems);
                  }}
                  className="w-20 bg-input rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </TableCell>
              <TableCell>
                $
                {item.unitPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell>
                $
                {(item.unitPrice * item.quantity).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    setSelectedItems((prev) =>
                      prev.filter((_, i) => i !== index)
                    )
                  }
                >
                  <X />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Totals */}
      <div className="flex maxmd:flex-col-reverse items-center justify-between gap-8 space-y-2 mt-4">
        <TextAreaInput
          name="notes"
          label="Notas"
          state={state}
          className="w-full"
        />
        <div className="flex flex-col gap-4 w-full">
          <div className="flex justify-between">
            <span className="font-medium">Subtotal:</span>
            <span>
              $
              {subtotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          {taxEnabled && (
            <div className="flex justify-between">
              <span className="font-medium">Impuesto (16%):</span>
              <span>
                $
                {taxTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="font-medium">Costo de Envío:</span>
            <span>
              $
              {deliveryCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2 font-bold text-2xl">
            <span>Total:</span>
            <span>
              $
              {grandTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Hidden Form Data */}
      <input type="hidden" name="items" value={JSON.stringify(selectedItems)} />
      <input
        type="hidden"
        name="supplier"
        value={JSON.stringify(selectedSupplier)}
      />
      <input type="hidden" name="taxEnabled" value={taxEnabled.toString()} />

      {/* Submit Section */}
      <div className="mt-8 flex justify-end gap-4 border-t pt-8">
        <button
          type="submit"
          disabled={sending}
          className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
            formType === "Autorizar"
              ? "bg-emerald-700 hover:bg-emerald-900"
              : formType === "Recibir"
              ? "bg-purple-700 hover:bg-purple-900"
              : "bg-blue-600 hover:bg-blue-900"
          } `}
        >
          {sending && <span className="loader"></span>}
          {sending ? `Actualizando Orden...` : `${formType} Orden de Compra`}
        </button>
        {state.message && (
          <p
            className={`mt-4 text-sm ${
              state.success ? "text-green-700" : "text-red-500"
            }`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
