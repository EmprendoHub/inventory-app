"use client";

import React, { useEffect } from "react";
import { useFormState } from "react-dom";
import { createNewOrder } from "../_actions";
import { ItemType } from "@/types/items";
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

export default function OrderForm({
  clients,
  items,
}: {
  clients: clientType[];
  items: ItemType[];
}) {
  const router = useRouter();
  const [state, formAction] = useFormState(createNewOrder, {
    errors: {},
    success: false,
    message: "",
  });
  const [selectedClient, setSelectedClient] = React.useState<clientType | null>(
    null
  );
  const [selectedItems, setSelectedItems] = React.useState<
    Array<ItemType & { quantity: number }>
  >([]);
  const [selectedItemId, setSelectedItemId] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [deliveryCost, setDeliveryCost] = React.useState(0);

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  //const tax = subtotal * 0.1;
  const grandTotal = subtotal + deliveryCost;

  const handleAddItem = () => {
    const selectedItem = items.find((item) => item.id === selectedItemId);
    if (selectedItem) {
      setSelectedItems((prev) => [
        ...prev,
        {
          ...selectedItem,
          quantity: quantity,
        },
      ]);
      setSelectedItemId("");
      setQuantity(1);
    }
  };

  useEffect(() => {
    if (state.success) {
      router.push("/sistema/ventas/pedidos");
    }
    // eslint-disable-next-line
  }, [state]);

  return (
    <form
      action={formAction}
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
          {/* DElivery info */}
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
          options={items.map((item) => ({
            value: item.id,
            name: item.name,
          }))}
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
        <Button type="submit" size="lg" className="px-8 text-white">
          Crear Pedido
        </Button>
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
