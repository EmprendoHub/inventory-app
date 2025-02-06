"use client";

import React from "react";
import { FullOderType } from "@/types/sales";
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
import { DownloadCloud, X } from "lucide-react";
import {
  deleteOrderItemsAction,
  deletePaymentAction,
} from "../_actions/orderActions";
import { useModal } from "@/app/context/ ModalContext";
import Link from "next/link";
import { getMexicoDate, getMexicoTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BsEnvelopeArrowUp } from "react-icons/bs";

export default function OrderView({ order }: { order: FullOderType }) {
  const subtotal = order.orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const tax = subtotal * 0.16;
  console.log(tax);
  const grandTotal = subtotal;
  const { showModal } = useModal();

  const sendEmailReminder = async (id: string) => {
    try {
      console.log("");

      const res = await fetch(`/api/email`, {
        headers: {
          "Content-Type": "application/json",
          Cookie: "ojñolasidfioasdfuñoasdikfh",
        },
        method: "POST",
        body: JSON.stringify({
          id,
        }),
      });

      if (res.ok) {
        await showModal({
          title: "Correo Enviado!",
          type: "delete",
          text: "El correo se envió exitosamente",
          icon: "success",
        });
      } else {
        await showModal({
          title: "¡Correo No Enviado!",
          type: "delete",
          text: "El correo no se envió correctamente",
          icon: "error",
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const deletePayment = async (id: string) => {
    const result = await showModal({
      title: "¿Estás seguro?, ¡No podrás revertir esto!",
      type: "delete",
      text: "Al eliminar este pago no se puede revertir esta acción.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.confirmed) {
      try {
        const formData = new FormData();
        formData.set("id", id);
        const response = await deletePaymentAction(formData);
        if (!response.success) throw new Error("Error al eliminar pago");
        await showModal({
          title: "¡Eliminado!",
          type: "delete",
          text: "El pago ha sido eliminado.",
          icon: "success",
        });
      } catch (error) {
        console.log("error from modal", error);

        await showModal({
          title: "Error",
          type: "delete",
          text: "No se pudo eliminar el pago",
          icon: "error",
        });
      }
    }
  };

  const deleteItem = async (id: string, orderId: string) => {
    const result = await showModal({
      title: "¿Estás seguro?, ¡No podrás revertir esto!",
      type: "delete",
      text: "Al eliminar este articulo no se puede revertir esta acción.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.confirmed) {
      try {
        const formData = new FormData();
        formData.set("id", id);
        formData.set("orderId", orderId);
        const response = await deleteOrderItemsAction(formData);
        if (!response.success) throw new Error("Error al eliminar");
        await showModal({
          title: "¡Eliminado!",
          type: "delete",
          text: "El articulo ha sido eliminado.",
          icon: "success",
        });
      } catch (error) {
        console.log("error from modal", error);

        await showModal({
          title: "Error",
          type: "delete",
          text: "No se pudo eliminar el articulo",
          icon: "error",
        });
      }
    }
  };

  return (
    <div>
      {/* Company Header */}
      <div className="flex justify-between gap-3 items-start border-b pt-0 pb-8 px-4 maxmd:pr-10 maxsm:pl-0">
        <div className="flex maxsm:flex-col maxsm:items-start items-center gap-4">
          <div className="bg-gray-100 p-2 rounded-lg">
            <Image
              src={coImage}
              alt="Company Logo"
              className="h-10 w-10"
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

        <div className="text-right w-1/2 flex flex-col gap-1">
          <div>
            <h2 className="text-2xl maxsm:text-lg font-bold text-gray-900 mb-2">
              RECIBO
            </h2>
            <p className="text-sm maxsm:text-xs text-gray-600">
              Fecha: {getMexicoDate(order.createdAt)}
            </p>
            <p className="text-sm maxsm:text-xs text-gray-600">
              Hora: {getMexicoTime(order.createdAt)}
            </p>
            <p className="text-sm maxsm:text-xs text-gray-600">
              Pedido #: {order.orderNo}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Link
              target="_blank"
              href={`/api/recibo/${order.id}`}
              className="px-4 py-2 text-center bg-blue-600 hover:bg-blue-800 text-white text-xs rounded-md flex items-center gap-2"
            >
              <DownloadCloud /> Generar PDF
            </Link>
            <Button
              onClick={() => sendEmailReminder(order.id)}
              className=" text-center bg-emerald-700 text-white text-xs rounded-md "
            >
              <BsEnvelopeArrowUp /> Enviar Email
            </Button>
          </div>
        </div>
      </div>
      <section className="px-8 pb-8 maxsm:pl-1 pt-2 bg-white rounded-lg shadow-md">
        {/* Customer Info */}
        <div className="grid grid-cols-2 maxsm:grid-cols-1 gap-8">
          <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
            {order.client && (
              <div className="flex flex-col">
                <h3 className="font-semibold text-lg">{order.client.name}</h3>
                <span className="text-sm text-gray-600 my-0">
                  {order.client.address}
                </span>
                <span className="text-sm text-gray-600 my-0">
                  Phone: {order.client.phone}
                </span>
                {order.client.email && (
                  <span className="text-sm text-gray-600 my-0">
                    Email: {order.client.email}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <Table className="mb-8 border rounded-lg">
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="">img</TableHead>
              <TableHead>Articulo</TableHead>
              <TableHead>Cntd.</TableHead>
              <TableHead className="maxsm:hidden">Precio unitario</TableHead>
              <TableHead>Total</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.orderItems.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  <Image
                    className="h-20 w-20 grayscale"
                    src={item.image}
                    width={150}
                    height={150}
                    alt="img"
                  />
                </TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell className="maxsm:hidden">
                  ${item.price.toFixed(2)}
                </TableCell>
                <TableCell>
                  ${(item.price * item.quantity).toFixed(2)}
                </TableCell>
                {item.id && (
                  <TableCell>
                    {" "}
                    <button
                      onClick={() => deleteItem(item.id, order.id)}
                      className="bg-red-600 text-white rounded-md"
                    >
                      <X />
                    </button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Totals */}
        <div className="ml-auto w-80 space-y-1">
          <div className="flex justify-between">
            <span className="font-medium">Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {/* <div className="flex justify-between">
            <span className="font-medium">IVA (16%):</span>
            <span>${tax.toFixed(2)}</span>
          </div> */}
          <div className="flex justify-between border-t pt-2 font-bold">
            <span>Gran Total:</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
          {order.payments.length > 0 && (
            <div className="flex justify-between">
              <span className="font-medium">Pagado:</span>
              <span>
                -$
                {order.payments
                  .reduce((sum, item) => sum + item.amount, 0)
                  .toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Payments */}
      {order.payments.length > 0 && (
        <section className="px-8 pb-8 maxsm:pl-1 mt-2 bg-white rounded-lg shadow-md">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg">Pagos</h3>
            </div>
          </div>

          {/* Items Table */}
          <Table className="mb-8 border rounded-lg">
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cant.</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className=" maxsm:hidden">Ref.</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.payments.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell>${item.amount.toFixed(2)}</TableCell>
                  <TableCell>{item.method}</TableCell>
                  <TableCell className=" maxsm:hidden">
                    {item.reference}
                  </TableCell>
                  {item.id && (
                    <TableCell>
                      {" "}
                      <button
                        onClick={() => deletePayment(item.id)}
                        className="bg-red-600 text-white rounded-md"
                      >
                        <X />
                      </button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}
    </div>
  );
}
