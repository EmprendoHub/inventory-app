"use client";

import React, { useState } from "react";
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
import coImage from "../../../../../../../public/images/item_placeholder.png";
import { DownloadCloud, X } from "lucide-react";
import {
  deleteOrderItemsAction,
  deletePaymentAction,
  payOrderAction,
} from "../_actions";
import Link from "next/link";
import { getMexicoDate, getMexicoTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BsEnvelopeArrowUp, BsWhatsapp } from "react-icons/bs";
import LogoIcon from "@/components/LogoIcon";
import { useSession } from "next-auth/react";
import { UserType } from "@/types/users";
import { useModal } from "@/app/context/ModalContext";
import {
  sendWATemplatePaymentPendingMessage,
  verifySupervisorCode,
} from "@/app/_actions";

export default function OrderView({ order }: { order: FullOderType }) {
  const { data: session } = useSession();
  const user = session?.user as UserType;
  const discount = order.discount || 0;
  const subtotal = order.orderItems?.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const previousPayments = (order.payments ?? []).reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const grandTotal = (subtotal || 0) + (order.delivery?.price || 0) - discount;
  const isOrderPaid = previousPayments === grandTotal;

  const { showModal } = useModal();
  const [sending, setSending] = useState(false);

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

  // const sendEmailReminder = async (id: string) => {
  //   setSending((prev) => !prev);

  //   try {
  //     const res = await fetch(`/api/email`, {
  //       headers: {
  //         "Content-Type": "application/json",
  //         Cookie: "ojñolasidfioasdfuñoasdikfh",
  //       },
  //       method: "POST",
  //       body: JSON.stringify({
  //         id,
  //       }),
  //     });

  //     if (res.ok) {
  //       await showModal({
  //         title: "Correo Enviado!",
  //         type: "delete",
  //         text: "El correo se envió exitosamente",
  //         icon: "success",
  //       });
  //     } else {
  //       await showModal({
  //         title: "¡Correo No Enviado!",
  //         type: "delete",
  //         text: "El correo no se envió correctamente",
  //         icon: "error",
  //       });
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  //   setSending((prev) => !prev);
  // };

  const sendWhatsAppReminder = async (orderId: string) => {
    setSending((prev) => !prev);

    try {
      const success = await sendWATemplatePaymentPendingMessage(orderId);
      if (success) {
        await showModal({
          title: "WhatsApp Enviado!",
          type: "delete",
          text: "El WhatsApp se envió exitosamente",
          icon: "success",
        });
      } else {
        await showModal({
          title: "WhatsApp No Enviado!",
          type: "delete",
          text: "El WhatsApp no se envió correctamente",
          icon: "error",
        });
      }
    } catch (error) {
      console.log(error);
    }
    setSending((prev) => !prev);
  };

  const deleteItem = async (id: string, orderId: string) => {
    setSending((prev) => !prev);

    // First, prompt for supervisor code
    const supervisorCodeResult = await showModal({
      title: "Verificación de Supervisor",
      type: "supervisorCode",
      text: "Por favor, ingrese el código de supervisor para continuar.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Verificar",
      cancelButtonText: "Cancelar",
    });

    if (supervisorCodeResult.confirmed) {
      // Check if the supervisor code is authorized

      const isAuthorized = await verifySupervisorCode(
        supervisorCodeResult.data?.code
      );

      if (isAuthorized.success) {
        // Proceed with the deletion
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
            formData.set("userId", user?.id);
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
      } else {
        await showModal({
          title: "Código no autorizado",
          type: "delete",
          text: "El código de supervisor no es válido.",
          icon: "error",
        });
      }
    }

    setSending((prev) => !prev);
  };

  const deletePayment = async (id: string) => {
    setSending((prev) => !prev);

    // First, prompt for supervisor code
    const supervisorCodeResult = await showModal({
      title: "Verificación de Supervisor",
      type: "supervisorCode",
      text: "Por favor, ingrese el código de supervisor para continuar.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Verificar",
      cancelButtonText: "Cancelar",
    });

    if (supervisorCodeResult.confirmed) {
      // Check if the supervisor code is authorized
      const isAuthorized = await verifySupervisorCode(
        supervisorCodeResult.data?.code
      );

      if (isAuthorized.success) {
        // Proceed with the deletion
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
            formData.set("userId", user.id);
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
      } else {
        await showModal({
          title: "Código no autorizado",
          type: "delete",
          text: "El código de supervisor no es válido.",
          icon: "error",
        });
      }
    }

    setSending((prev) => !prev);
  };

  // In your OrderList component
  const receivePayment = async (id: string) => {
    setSending((prev) => !prev);
    const result = await showModal({
      title: "¿Cuanto te gustaría pagar?",
      type: "payment",
      text: "Puedes realizar un pago parcial o completo.",
      icon: "success",
      showCancelButton: true,
      confirmButtonText: "Sí, pagar",
      cancelButtonText: "Cancelar",
    });

    if (result.confirmed) {
      try {
        const formData = new FormData();
        formData.set("id", id);
        formData.set("amount", result.data?.amount || "0"); // Handle empty input
        formData.set("reference", result.data?.reference || "");
        formData.set("method", result.data?.method || "");

        const response = await payOrderAction(formData);

        if (response.success) {
          await showModal({
            title: "¡Pago Aplicado!",
            type: "delete",
            text: response.message,
            icon: "success",
          });
        } else {
          await showModal({
            title: "¡Pago No Aplicado!",
            type: "delete",
            text: response.message,
            icon: "error",
          });
        }
      } catch (error) {
        console.log("Error processing payment:", error);
        await showModal({
          title: "Error",
          type: "delete",
          text: "No se pudo aplicar el pago",
          icon: "error",
        });
      }
    }

    setSending((prev) => !prev);
  };

  return (
    <div className="order-view relative">
      <div className="absolute flex maxsm:flex-col-reverse items-start gap-4 maxsm:gap-0 z-40 top-20 maxmd:top-20">
        <div className="flex flex-col leading-none">
          {order.status === "CANCELADO" ? (
            <h2 className="text-2xl maxmd:text-2xl text-red-900 font-black ">
              CANCELADO POR:
            </h2>
          ) : order.status === "PAGADO" ? (
            <h2 className="text-2xl maxmd:text-2xl text-emerald-900 font-black ">
              PAGADO Y ENTREGADO
            </h2>
          ) : order.status === "ENTREGADO" ? (
            <div>
              <h2 className="text-2xl maxmd:text-2xl text-emerald-700 font-black ">
                ENTREGADO A:
              </h2>
            </div>
          ) : (
            ""
          )}
          <span className="text-xs">{order.client?.name}</span>
          <span className="text-xs">{order.client?.address}</span>
        </div>
        {order.signature && (
          <div className="bg-white w-fit rounded-md">
            <div
              className="cursor-pointer"
              onClick={() => openLightbox(order.signature || coImage.src)}
            >
              <Image
                className="h-16 w-16"
                src={order.signature || coImage}
                width={250}
                height={250}
                alt="img"
              />
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={closeLightbox}
        >
          <div className="relative max-w-4xl max-h-full bg-white">
            <Image
              src={lightboxImage || coImage}
              alt="Enlarged item image"
              width={800}
              height={800}
              className="object-contain"
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

      {/* Company Header */}
      <div className="flex maxmd:flex-col justify-between gap-3 items-start maxsm:items-end border-b pt-0 pb-8 px-4 maxmd:pr-10 maxsm:pl-0">
        <div className="flex maxsm:items-start items-center gap-1">
          <div className=" p-2 rounded-lg">
            <LogoIcon className="h-12 w-14" />
          </div>
          <div className="leading-none">
            <p className="text-xs font-semibold text-muted leading-none">
              Yunuen Company Liquidación de Muebles Americanos
            </p>
            <span className="text-xs text-muted">
              Blvd. Lazaro Cardenas 380{" "}
            </span>
            <span className="text-xs text-muted">
              Sahuayo, Michoacan 59000{" "}
            </span>
            <p className="text-xs text-muted">Tel: (353) 153-0042</p>
          </div>
        </div>

        <div className="text-right w-1/2 maxmd:w-full flex flex-col gap-1">
          <div>
            <h2 className="text-2xl maxsm:text-lg font-bold text-muted mb-2">
              Pedido #: {order.orderNo}
            </h2>
            <p className="text-sm maxsm:text-xs text-muted">
              Fecha: {getMexicoDate(order.createdAt)}
            </p>
            <p className="text-sm maxsm:text-xs text-muted">
              Hora: {getMexicoTime(order.createdAt)}
            </p>
          </div>
          <div className="flex gap-2 justify-end ">
            <Link
              target="_blank"
              href={`/api/recibo/${order.id}`}
              className="px-2 py-2 text-center bg-blue-600 hover:bg-blue-800 text-white text-xs rounded-md flex items-center gap-1"
            >
              <DownloadCloud /> PDF
            </Link>
            {/* {["SUPER_ADMIN", "GERENTE", "ADMIN"].includes(user?.role || "") &&
              order.status !== "CANCELADO" && (
                <Button
                  disabled={sending}
                  onClick={() => sendEmailReminder(order.id)}
                  className=" text-center bg-emerald-700 text-white text-xs rounded-md "
                >
                  <BsEnvelopeArrowUp /> Enviar Email{" "}
                  {sending && <span className="loader"></span>}
                </Button>
              )} */}
            {["SUPER_ADMIN", "GERENTE", "ADMIN"].includes(user?.role || "") &&
              order.status !== "CANCELADO" && (
                <Button
                  disabled={sending}
                  onClick={() => sendWhatsAppReminder(order.id)}
                  className=" text-center bg-emerald-700 text-white text-xs rounded-md "
                >
                  <BsWhatsapp /> Enviar WhatsApp{" "}
                  {sending && <span className="loader"></span>}
                </Button>
              )}
            {["SUPER_ADMIN", "GERENTE"].includes(user?.role || "") &&
              !isOrderPaid && (
                <Button
                  disabled={sending}
                  onClick={() => receivePayment(order.id)}
                  className=" text-center bg-purple-700 text-white text-xs rounded-md "
                >
                  <BsEnvelopeArrowUp /> Recibir Pago{" "}
                  {sending && <span className="loader"></span>}
                </Button>
              )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <Table className="mb-8 border rounded-lg">
        <TableHeader className="bg-card">
          <TableRow>
            <TableHead className="">img</TableHead>
            <TableHead>Articulo</TableHead>
            <TableHead>Cnt.</TableHead>
            <TableHead className="maxsm:hidden">Precio unitario</TableHead>
            <TableHead>Total</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.orderItems?.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">
                <div
                  className="cursor-pointer"
                  onClick={() => openLightbox(item.image || coImage.src)}
                >
                  <Image
                    className="h-10 w-10 grayscale"
                    src={item.image || coImage}
                    width={150}
                    height={150}
                    alt="img"
                  />
                </div>
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex flex-col gap-1">
                  <span>{item.name}</span>
                  <span className="text-[12px]">{item.description}</span>
                </div>
              </TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell className="maxsm:hidden">
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
              {["SUPER_ADMIN", "ADMIN"].includes(user?.role || "") &&
                item.id &&
                order.status !== "CANCELADO" && (
                  <TableCell>
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
          <span>
            $
            {subtotal?.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Envió:</span>
          <span>
            $
            {(order.delivery?.price || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        {order.discount && (
          <div className="flex justify-between">
            <span className="font-medium">Descuento:</span>
            <span>
              -$
              {(order.discount || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        )}
        <div className="flex text-xl justify-between border-t pt-2 font-bold">
          <span>Gran Total:</span>
          <span>
            $
            {grandTotal?.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="flex flex-col">
          <div className="flex justify-between">
            <span className="font-medium">Pagado:</span>
            <span className="text-emerald-700">
              $
              {previousPayments.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Pendiente:</span>
            <span className="text-yellow-500">
              $
              {(grandTotal - previousPayments).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>
      {/* Payments */}
      {(order.payments?.length ?? 0) > 0 && (
        <section className="px-8 pb-8 maxsm:pl-1 mt-2 bg-card rounded-lg shadow-md">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2 bg-card p-4 rounded-lg">
              <h3 className="font-semibold text-lg">Pagos</h3>
            </div>
          </div>

          {/* Items Table */}
          <Table className="mb-8 border rounded-lg">
            <TableHeader className="bg-card">
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cant.</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className=" maxsm:hidden">Ref.</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.payments?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell>
                    $
                    {item.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="uppercase">{item.method}</TableCell>
                  <TableCell className=" maxsm:hidden">
                    {item.reference}
                  </TableCell>
                  <TableCell>{item.status}</TableCell>
                  {["SUPER_ADMIN", "ADMIN"].includes(user?.role || "") &&
                    item.id &&
                    order.status !== "CANCELADO" && (
                      <TableCell>
                        <div
                          onClick={() => deletePayment(item.id)}
                          className="bg-red-600 text-white rounded-md p-2 cursor-pointer"
                        >
                          <X />
                        </div>
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
