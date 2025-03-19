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
import TextAreaInput from "@/components/TextAreaInput";
import NumericInput from "@/components/NumericInput";
import DateInput from "@/components/DateInput";
import { useFormState } from "react-dom";
import Image from "next/image";
import { useModal } from "@/app/context/ModalContext";
import TextInput from "@/components/TextInput";
import { createClient } from "../../clientes/_actions/clientActions";
import { X } from "lucide-react";

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
  const [selectedItemKey, setSelectedItemKey] = useState("");
  // eslint-disable-next-line
  const [state, formAction] = useFormState(createNewOrder, {
    errors: {},
    success: false,
    message: "",
  });
  // eslint-disable-next-line
  const [clientState, clientFormAction] = useFormState(createClient, {
    errors: {},
    success: false,
    message: "",
  });

  const { showModal } = useModal();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const [selectedClient, setSelectedClient] = React.useState<clientType | null>(
    null
  );
  const [selectedItems, setSelectedItems] = useState<SelectedItemType[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [discount, setDiscount] = useState(0);

  const [showClientModal, setShowClientModal] = useState(false);

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
    // Force internal state reset in SearchSelectInput
    setSelectedItemKey(Math.random().toString(36).substring(7));
  };

  // Custom submit handler to handle the file upload
  const handleClientSubmit = async (formData: FormData) => {
    setSending((prev) => !prev);

    formData.append("email", email);
    formData.append("phone", phone);
    // Call the form action
    const result = await createClient(state, formData);
    setSending((prev) => !prev);

    // Check if the product was created successfully
    if (result.success) {
      // Reset the form fields
      await showModal({
        title: "Cliente Creado!",
        type: "delete",
        text: "El Cliente ha sido creado exitosamente.",
        icon: "success",
      });
      const formElement = document.getElementById(
        "client-form"
      ) as HTMLFormElement;
      formElement.reset();
      setShowClientModal(false);
    } else {
      console.log("result.errors[0]", result.errors.email[0]);

      setError(result.errors.email[0]);
    }
  };

  const handlePhoneChange = (e: any) => {
    const inputPhone = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters
    let formattedPhone = "";

    if (inputPhone.length <= 10) {
      formattedPhone = inputPhone.replace(
        /(\d{3})(\d{0,3})(\d{0,4})/,
        "$1$2$3"
      );
    } else {
      // If the phone number exceeds 10 digits, truncate it
      formattedPhone = inputPhone
        .slice(0, 10)
        .replace(/(\d{3})(\d{0,3})(\d{0,4})/, "$1$2$3");
    }

    setPhone(formattedPhone);
    setEmail(formattedPhone.toString() + "@mueblesyuny.com");
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

    if (!result.success) {
      await showModal({
        title: "¡Error!",
        type: "delete",
        text: `${result.message}`,
        icon: "error",
      });
      setSending(false); // Set sending to true
    }

    if (result.success) {
      router.push("/sistema/ventas/pedidos");
    }
  };

  return (
    <section className="relative">
      {sending && (
        <div
          className={`fixed top-0 left-0 z-50 flex flex-col items-center justify-center w-screen h-screen bg-black/50`}
        >
          <h3>Generado...</h3>
          <span className="loader" />
        </div>
      )}

      <form
        onSubmit={handleSubmit} // Use custom submit handler
        className="flex-1 p-8 maxmd:p-4 bg-card rounded-lg shadow-md"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault(); // Prevent form submission
          }
        }}
      >
        {/* Customer Info */}
        <div className="flex maxmd:flex-col-reverse gap-4 mb-8">
          <div className="flex flex-col gap-3 w-1/2 maxmd:w-full">
            <div className=" flex items-center justify-center gap-4">
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
              <div
                onClick={() => setShowClientModal(true)}
                className="p-4 bg-blue-500 text-white h-auto w-10 rounded-md cursor-pointer"
              >
                +
              </div>
            </div>
            {/* Delivery info */}
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
          <div className="flex maxmd:flex-col items-center gap-4 space-y-2 bg-card p-4 rounded-lg">
            <NumericInput
              label="Costo de Envió"
              name="price"
              defaultValue={deliveryCost}
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
        </div>

        {/* Items Selection */}
        <div className="flex items-end gap-4 mb-4">
          <SearchSelectInput
            key={selectedItemKey} // This will force re-render and reset internal state
            label="Seleccionar Producto:"
            name="productId"
            state={state}
            className="flex-1"
            options={[
              ...items.map((item) => ({
                value: item.id,
                name: item.name,
                description: item.description,
                price: item.price,
                image: item.mainImage, // Assuming `item.image` contains the image URL
              })),
              ...itemGroups.map((group) => ({
                value: group.id,
                name: `${group.name} (G)`,
                price: group.price,
                image: group.mainImage, // Assuming `group.image` contains the image URL
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
          <Button type="button" onClick={handleAddItem} className="text-white">
            +
          </Button>
        </div>

        {/* Items Table */}
        <Table className="mb-8 border rounded-lg">
          <TableHeader className="bg-card">
            <TableRow>
              <TableHead className="w-[150px]">Img.</TableHead>
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
                <TableCell className="font-medium overflow-hidden relative w-32 h-32 flex mb-1">
                  <Image
                    src={item.mainImage || "/images/item_placeholder.png"}
                    width={150}
                    height={150}
                    alt="img"
                    className="w-32 h-32 object-cover rounded-md"
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold">
                      {item.name}
                    </span>
                    <span className="text-[12px] text-muted leading-none">
                      {item.description}
                    </span>
                  </div>
                </TableCell>
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
            <div className="flex justify-between items-center">
              <span className="font-medium">Descuento:</span>
              <NumericInput
                label=""
                name="discount"
                state={state}
                defaultValue={discount}
                onChange={setDiscount}
                className="w-20"
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
              <span className="text-xl">Grand Total:</span>
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
        <input
          type="hidden"
          name="items"
          value={JSON.stringify(selectedItems)}
        />

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

      {/*  client modal */}
      {showClientModal && (
        <div className="fixed top-0 left-0 w-full h-full z-40 bg-black/50">
          <section className="relative h-auto w-auto flex flex-col items-center justify-center bg-card p-8">
            <div
              className="absolute z-50 top-0 right-0 p-4 cursor-pointer"
              onClick={() => setShowClientModal(false)}
            >
              <X size={24} />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Crear Cliente</h2>
            <form
              id="client-form"
              action={handleClientSubmit}
              className="space-y-4 flex flex-col gap-4 w-[80%] items-center justify-center"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // Prevent form submission
                }
              }}
            >
              <div className="flex maxmd:flex-col gap-3 w-full">
                <div className="w-full flex items-center flex-col gap-3 mt-5">
                  {error && <p className="text-red-500">{error}</p>}
                  <TextInput name="name" label="Nombre" state={state} />
                  <input
                    className="text-center py-2 rounded-md text-sm bg-input w-full"
                    type="text"
                    name="phone"
                    placeholder="Teléfono"
                    value={phone}
                    onChange={handlePhoneChange}
                  />
                  <div className="flex-col gap-3 w-full">
                    <input
                      className="text-center py-2 rounded-md text-sm bg-input w-full"
                      type="email"
                      value={email}
                      placeholder="Correo Electrónico..."
                      onChange={(e) => setEmail(e.target.value)}
                    />

                    <TextAreaInput
                      name="address"
                      label="Dirección"
                      state={state}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                {sending && <span className="loader"></span>}
                Crear Cliente
              </button>

              {clientState.message && (
                <p
                  className={`text-sm ${
                    clientState.success ? "text-green-700" : "text-red-500"
                  }`}
                >
                  {clientState.message}
                </p>
              )}
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
