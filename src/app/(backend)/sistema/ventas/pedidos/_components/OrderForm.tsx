"use client";

import React, { useEffect } from "react";
import { useFormState } from "react-dom";
import { createNewOrder } from "../_actions/orderActions";
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
import Image from "next/image";
import coImage from "../../../../../../../public/images/avatar_placeholder.jpg";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import TextAreaInput from "@/components/TextAreaInput";

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

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.1;
  const grandTotal = subtotal + tax;

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
    <div>
      {/* Company Header */}
      <div className="flex justify-between items-start mb-8 border-b pb-8">
        <div className="flex items-center gap-4">
          <div className="bg-gray-100 p-2 rounded-lg">
            <Image
              src={coImage}
              alt="Company Logo"
              className="h-16 w-16"
              height={250}
              width={250}
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Yunuen Company.
            </h2>
            <p className="text-sm text-gray-600">123 Blvd. Lazaro Cardenas</p>
            <p className="text-sm text-gray-600">Sahuayo, Michoacan 59000</p>
            <p className="text-sm text-gray-600">Tel: (555) 123-4567</p>
          </div>
        </div>

        <div className="text-right">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">RECIBO</h2>
          <p className="text-sm text-gray-600">
            Date: {new Date().toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600">Pedido #: P-{"000045"}</p>
        </div>
      </div>
      <form action={formAction} className="p-8 bg-white rounded-lg shadow-md">
        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <SearchSelectInput
              label="Seleccionar Cliente:"
              name="client"
              state={state}
              className="flex-1"
              options={clients.map((item) => ({
                value: item.id,
                name: item.name,
              }))}
              onChange={(value) => {
                const client = clients.find((c) => c.id === value);
                setSelectedClient(client || null);
              }}
            />
          </div>
          <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
            {selectedClient && (
              <>
                <h3 className="font-semibold text-lg">{selectedClient.name}</h3>
                <p className="text-sm text-gray-600">
                  {selectedClient.address}
                </p>
                <p className="text-sm text-gray-600">
                  Tel: {selectedClient.phone}
                </p>
                {selectedClient.email && (
                  <p className="text-sm text-gray-600">
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
            className="w-24"
            placeholder="Qty"
          />
          <Button type="button" onClick={handleAddItem}>
            +
          </Button>
        </div>

        {/* Items Table */}
        <Table className="mb-8 border rounded-lg">
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[300px]">Articulo</TableHead>
              <TableHead>Cantd.</TableHead>
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
                <TableCell>${item.price.toFixed(2)}</TableCell>
                <TableCell>
                  ${(item.price * item.quantity).toFixed(2)}
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
        <TextAreaInput name="notes" label="Notas" state={state} />

        {/* Totals */}
        <div className="ml-auto w-80 space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {/* <div className="flex justify-between">
            <span className="font-medium">Tax (10%):</span>
            <span>${tax.toFixed(2)}</span>
          </div> */}
          <div className="flex justify-between border-t pt-2 font-bold text-2xl">
            <span>Grand Total:</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Hidden Form Data */}
        {/* Hidden Form Data */}
        <input
          type="hidden"
          name="client"
          value={JSON.stringify(selectedClient)}
        />
        <input
          type="hidden"
          name="items"
          value={JSON.stringify(selectedItems)}
        />

        {/* Submit Section */}
        <div className="mt-8 flex justify-end gap-4 border-t pt-8">
          <Button type="submit" size="lg" className="px-8">
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
    </div>
  );
}
