"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { clientType, FullOderType } from "@/types/sales";
import { whatsAppMessagesType } from "@/types/whatsapp";
import { Button } from "@/components/ui/button";
import { Camera, Paperclip, RefreshCw, Sticker, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import coImage from "../../../../../../../public/images/item_placeholder.png";
import { BiMicrophone } from "react-icons/bi";
import Link from "next/link";

export default function ContactClient({
  client,
  whatsAppMessages,
  orders,
}: {
  client: clientType;
  whatsAppMessages: whatsAppMessagesType[];
  orders: FullOderType[];
}) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");

  // Function to open the lightbox
  const openLightbox = (imageUrl: string) => {
    setLightboxImage(imageUrl);
    setLightboxOpen(true);
  };

  // Function to close the lightbox
  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxImage("");
  };

  const handleRefresh = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    // Refresh the page
    router.refresh();
  };

  // Scroll to bottom when component mounts or when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [whatsAppMessages]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [router]);

  return (
    <div className="flex gap-8 px-8">
      <div className="w-full flex flex-col gap-3">
        <div className="w-full bg-gray-800 px-4 py-1 rounded-md shadow-md shadow-black">
          <h2 className="text-base font-semibold">Tel: {client.phone}</h2>
        </div>
        <div className="w-full bg-card p-4 rounded-md shadow-md shadow-black">
          <h2 className="text-base font-semibold">Pedidos Recientes</h2>
          {/* Orders Table */}

          <Table className="my-2 border rounded-lg text-xs">
            <TableHeader className="bg-card">
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <Link
                        className="text-blue-500 text-sm"
                        href={`/sistema/ventas/pedidos/ver/${order.id}`}
                      >
                        {order.orderNo}
                      </Link>
                    </div>
                  </TableCell>

                  <TableCell className="maxmd:hidden">
                    $
                    {order.totalAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-white flex justify-center text-[10px] px-3 py-1.5 text-center rounded-md w-full ${
                        order.status === "PROCESANDO"
                          ? "bg-blue-700"
                          : order.status === "PENDIENTE"
                          ? "bg-yellow-700"
                          : order.status === "ENTREGADO"
                          ? "bg-emerald-700"
                          : ""
                      }`}
                    >
                      {order.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="w-full bg-card p-4 rounded-md shadow-md shadow-black">
          <h2 className="text-base font-semibold">Pagos Recientes</h2>
          {/* Payments Table */}

          <Table className="my-2 border rounded-lg text-xs">
            <TableHeader className="bg-card">
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            {orders?.map((order, index) => (
              <TableBody key={index}>
                {order.payments?.map((payment) => (
                  <TableRow key={payment.id} className="my-1">
                    <TableCell className="font-medium">
                      <Link
                        className="text-blue-500 text-sm"
                        href={`/sistema/ventas/pedidos/ver/${order.id}`}
                      >
                        {order.orderNo}
                      </Link>
                    </TableCell>

                    <TableCell className="maxmd:hidden">
                      $
                      {payment.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-white text-[10px] px-3 py-1.5 text-center my-1 rounded-md ${
                          payment.status === "PAGADO" ? "bg-emerald-700" : ""
                        }`}
                      >
                        {payment.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            ))}
          </Table>
        </div>
      </div>

      <div className="w-full flex flex-col">
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refrescar
        </Button>
        <section className="mt-2 relative bg-[url(/images/Wa_dark_background.jpg)] bg-cover w-full flex flex-col justify-start rounded-lg shadow-md shadow-black h-[580px] overflow-hidden overflow-y-scroll gap-3 pb-2">
          <div className="bg-card sticky w-full top-0 right-0 z-10 px-4 py-1.5 mb-2">
            <p className="text-base font-semibold">{client.name}</p>
          </div>
          {whatsAppMessages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[90%] mx-3 flex p-1.5 rounded-md text-xs ${
                message.sender === "SYSTEM"
                  ? "self-start bg-gray-900"
                  : "self-end bg-emerald-950 w-auto"
              }`}
            >
              {message.type === "audio" && message.mediaUrl && (
                <div className="flex flex-col w-auto">
                  <audio controls className="w-[90%] mb-2">
                    <source src={message.mediaUrl} type="audio/ogg" />
                    Your browser does not support the audio element.
                  </audio>
                  <p className="text-muted text-[12px]">Transcripción:</p>
                  <p> {message.message}</p>
                </div>
              )}
              {message.type === "image" && message.mediaUrl && (
                <div
                  onClick={() => openLightbox(message.mediaUrl || coImage.src)}
                  className="cursor-zoom-in"
                >
                  <Image
                    src={message.mediaUrl}
                    alt="img"
                    width={150}
                    height={150}
                  />
                </div>
              )}
              {message.type === "button" && message.sender === "CLIENT" && (
                <div>
                  <span>{message.message}</span>
                </div>
              )}
              {message.type === "text" && message.sender === "CLIENT" && (
                <div>
                  <span>{message.message}</span>
                </div>
              )}
              {message.template &&
                message.template === "pago_pendiente_2" &&
                message.sender === "SYSTEM" && (
                  <div className="p-2">
                    <p className="font-semibold text-sm">{message.header}</p>
                    <hr className="my-1" />
                    <div>
                      Hola {message.variables ? message.variables[0] : ""}, esto
                      es un recordatorio de pago para:{" "}
                      <p className="my-2">
                        PEDIDO:{" "}
                        <span className=" font-semibold">
                          #{message.variables ? message.variables[1] : ""}
                        </span>
                      </p>
                      <p>
                        Total: {message.variables ? message.variables[2] : ""}
                      </p>
                      <p>
                        Pagado: {message.variables ? message.variables[3] : ""}
                      </p>
                      <p>
                        Pendiente:{" "}
                        {message.variables ? message.variables[4] : ""}
                      </p>
                      <p className="my-2">
                        Por favor realiza tu pago antes del{" "}
                        {message.variables ? message.variables[5] : ""} para
                        evitar la cancelación de tu pedido.
                      </p>
                    </div>
                    <hr className="my-1" />
                    <p className="text-muted italic">{message.footer}</p>
                    <hr className="my-1" />
                    {message.button && (
                      <button
                        className="mt-2 bg-blue-800 px-3 py-1 rounded-md"
                        disabled
                      >
                        {message.button}
                      </button>
                    )}
                  </div>
                )}
              {!message.template &&
                message.type === "text" &&
                message.sender === "SYSTEM" && (
                  <div className="p-2">
                    <p className="font-semibold text-sm">{message.header}</p>
                    <hr className="my-1" />
                    <div>{message.message}</div>
                  </div>
                )}
            </div>
          ))}
          <div ref={messagesEndRef} />
          {/* This div is used to scroll to the bottom */}
        </section>
        <div className="bg-black rounded-b-md w-full bottom-0 right-0 z-10 px-2 py-1 shadow-md shadow-black flex gap-1 justify-between">
          <button>
            <Sticker size={18} className="text-muted" />
          </button>
          <input
            className="bg-input rounded-md w-full text-sm px-2 py-1"
            type="text"
            name="message"
            id="message"
            placeholder="Mensaje..."
          />
          <button>
            <Paperclip className="text-muted" size={15} />
          </button>
          <button>
            <Camera className="text-muted" size={18} />
          </button>
          <button className="bg-white text-blue-950 px-1.5 rounded-full">
            <BiMicrophone size={18} />
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={closeLightbox}
        >
          <div className="relative w-auto h-[90%] bg-white overflow-hidden">
            <Image
              src={lightboxImage || coImage}
              alt="Enlarged item image"
              width={800}
              height={800}
              className="object-fit w-auto h-full"
            />
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-200"
            >
              <X className="text-black" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
