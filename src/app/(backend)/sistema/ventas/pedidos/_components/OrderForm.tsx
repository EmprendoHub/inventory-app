"use client";

import React, { useEffect, useState } from "react";
import { createNewOrder } from "../_actions";
import { ItemType, ProcessedItemGroup, SelectedItemType } from "@/types/items";
import { clientType } from "@/types/sales";
import { SearchSelectInput } from "@/components/SearchSelectInput";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import TextAreaInput from "@/components/TextAreaInput";
import NumericInput from "@/components/NumericInput";
import DateInput from "@/components/DateInput";
import { useFormState } from "react-dom";

export default function OrderForm({
  clients,
  items,
  itemGroups,
}: {
  clients: clientType[];
  items: ItemType[];
  itemGroups: ProcessedItemGroup[];
}) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  // eslint-disable-next-line
  const [state, formAction] = useFormState(createNewOrder, {
    errors: {},
    success: false,
    message: "",
  });
  const [selectedClient, setSelectedClient] = React.useState<clientType | null>(
    null
  );
  const [selectedItems, setSelectedItems] = React.useState<SelectedItemType[]>(
    []
  );
  const [selectedItemId, setSelectedItemId] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [deliveryCost, setDeliveryCost] = React.useState(0);
  const [discount, setDiscount] = React.useState(0);

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const grandTotal = subtotal - discount + deliveryCost;

  // Update the handleAddItem function
  const handleAddItem = () => {
    const selectedGroup = itemGroups.find(
      (group) => group.id === selectedItemId
    );

    if (selectedGroup) {
      const groupItem: SelectedItemType = {
        ...selectedGroup,
        quantity,
        isGroup: true,
        items: selectedGroup.items,
      };
      setSelectedItems((prev) => [...prev, groupItem]);
    } else {
      const selectedItem = items.find((item) => item.id === selectedItemId);
      if (selectedItem) {
        const singleItem: SelectedItemType = {
          ...selectedItem,
          quantity,
          isGroup: false,
        };
        setSelectedItems((prev) => [...prev, singleItem]);
      }
    }
    setSelectedItemId("");
    setQuantity(1);
  };

  useEffect(() => {
    if (state.success) {
      router.push("/sistema/ventas/pedidos");
    }
    // eslint-disable-next-line
  }, [state]);

  // Custom form submission handler
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission

    setSending(true); // Set sending to true

    const formData = new FormData(event.currentTarget);
    const result = await createNewOrder(state, formData);

    if (result.success) {
      router.push("/sistema/ventas/pedidos");
    }
  };

  return (
    <form
      onSubmit={handleSubmit} // Use custom submit handler
      className="flex-1 p-8 maxsm:p-4 bg-card rounded-lg shadow-md"
    >
      {/* Customer Info */}
      <div className="flex maxsm:flex-col-reverse gap-4 mb-8">
        <div className="flex flex-col gap-3 w-1/2 maxsm:w-full">
          <SearchSelectInput
            label="Seleccionar Cliente:"
            name="client"
            state={state}
            className="flex-1 mb-4"
            options={clients.map((item) => ({
              value: item.id,
              name: item.name,
            }))}
            onChange={(value) => {
              const client = clients.find((c) => c.id === value);
              setSelectedClient(client || null);
            }}
          />
          {/* Delivery info */}
          <NumericInput
            label="Costo de Envió"
            name="price"
            state={state}
            onChange={setDeliveryCost}
          />
          <DateInput
            defaultValue={new Date()}
            name="deliveryDate"
            label="Fecha Entrega"
            state={state}
          />
        </div>
        <div className="space-y-2 bg-card p-4 rounded-lg">
          {selectedClient && (
            <>
              <h3 className="font-semibold text-lg">{selectedClient.name}</h3>
              <p className="text-sm text-muted leading-none">
                {selectedClient.address}
              </p>
              <p className="text-sm text-muted leading-none">
                Tel: {selectedClient.phone}
              </p>
              {selectedClient.email && (
                <p className="text-sm text-muted leading-none">
                  Email: {selectedClient.email}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Items Selection */}
      <div className="flex items-end gap-4 mb-4">
        <SearchSelectInput
          label="Seleccionar Producto:"
          name="productId"
          state={state}
          className="flex-1"
          options={[
            ...items.map((item) => ({
              value: item.id,
              name: item.name,
            })),
            ...itemGroups.map((group) => ({
              value: group.id,
              name: `${group.name} (Agrupado)`,
            })),
          ]}
          onChange={setSelectedItemId}
        />
        <Input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="Qty"
        />
        <Button type="button" onClick={handleAddItem}>
          +
        </Button>
      </div>

      {/* Items Table */}
      <Table className="mb-8 border rounded-lg">
        <TableHeader className="bg-card">
          <TableRow>
            <TableHead className="w-[300px]">Articulo</TableHead>
            <TableHead>Cant.</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {selectedItems.map((item, index) => (
            <TableRow key={index} className="bg-black bg-opacity-20">
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => {
                    const newItems = [...selectedItems];
                    newItems[index].quantity = Number(e.target.value);
                    setSelectedItems(newItems);
                  }}
                  className="w-20"
                />
              </TableCell>
              <TableCell>
                $
                {item.price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell>
                $
                {(item.price * item.quantity).toLocaleString(undefined, {
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
      <div className="flex maxsm:flex-col-reverse items-center justify-between gap-8 space-y-2 mt-4">
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
          <div className="flex justify-between">
            <span className="font-medium">Descuento:</span>
            <NumericInput
              label=""
              name="discount"
              state={state}
              defaultValue={discount}
              onChange={setDiscount}
            />
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Envió:</span>
            <span>
              $
              {deliveryCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2 font-bold text-2xl">
            <span>Grand Total:</span>
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
      <input
        type="hidden"
        name="client"
        value={JSON.stringify(selectedClient)}
      />
      <input type="hidden" name="items" value={JSON.stringify(selectedItems)} />

      {/* Submit Section */}
      <div className="mt-8 flex justify-end gap-4 border-t pt-8">
        <button
          type="submit"
          disabled={sending}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          {sending && <span className="loader"></span>}
          {sending ? "Creando Pedido..." : "Crear Pedido"}
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
