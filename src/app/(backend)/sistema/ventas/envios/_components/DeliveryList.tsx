"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, X, Eye, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeliveryAndDriverType } from "@/types/delivery";
import { useRouter } from "next/navigation";
import { useModal } from "@/app/context/ModalContext";
import {
  acceptDeliveryAction,
  checkDeliveryOrderBalance,
  deleteDeliveryAction,
  deliverDeliveryAction,
} from "../_actions";
import { verifySupervisorCode } from "@/app/_actions";
import { FaTruckLoading } from "react-icons/fa";
import { useSession } from "next-auth/react";
import { UserType } from "@/types/users";
import {
  payOrderActionOnDelivery,
  updateOrderOnDelivery,
} from "../../pedidos/_actions";
import { uploadImageAction } from "@/app/_actions";

export function DeliveryList({
  deliveries,
}: {
  deliveries: DeliveryAndDriverType[];
}) {
  const { data: session } = useSession();
  const user = session?.user as UserType;
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const handleRefresh = () => {
    // Refresh the page
    router.refresh();
  };

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const columns = React.useMemo<ColumnDef<DeliveryAndDriverType>[]>(
    () => [
      {
        accessorKey: "orderNo",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs w-10"
          >
            Pedido
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-xs font-medium max-w-10">
            {row.original.orderNo}
          </div>
        ),
      },
      {
        accessorKey: "driver",
        header: () => <div className="text-xs maxsm:hidden">Chofer</div>,
        cell: ({ row }) => {
          const driver = row.original?.driver?.name || "BODEGA";
          return (
            <div className="text-[12px] uppercase px-2 bg-slate-600 text-white rounded-md maxsm:hidden">
              {driver}
            </div>
          );
        },
      },
      {
        accessorKey: "price",
        header: () => <div className="text-xs max-w-10">Precio</div>,
        cell: ({ row }) => (
          <div className="text-xs font-medium w-10">
            ${row.original.price.toLocaleString()}
          </div>
        ),
      },
      {
        accessorKey: "trackingNumber",
        header: () => (
          <div className="text-xs maxsm:hidden maxsm:p-0">No. de rastreo</div>
        ),
        cell: ({ row }) => (
          <div className="text-[12px] maxsm:hidden maxsm:p-0">
            {row.original.trackingNumber}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-xs max-w-22">Estado</div>,
        cell: ({ row }) => (
          <div
            className={`text-[12px] maxsm:w-22 text-center font-medium px-2 rounded-md text-white ${
              row.original.status === "CANCELADO"
                ? "bg-red-900"
                : row.original.status === "ENTREGADO"
                ? "bg-emerald-900"
                : row.original.status === "EN CAMINO"
                ? "bg-purple-900"
                : row.original.status === "PROCESANDO"
                ? "bg-blue-700"
                : "bg-yellow-700"
            }`}
          >
            {row.original.status}
          </div>
        ),
      },
      {
        accessorKey: "deliveryDate",
        header: () => <div className="text-xs">Fecha Entrega</div>,
        cell: ({ row }) => (
          <div className="text-xs font-medium">
            {row.original.deliveryDate
              ? new Date(row.original.deliveryDate).toLocaleDateString()
              : "N/A"}
          </div>
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const ActionCell = () => {
            const { showModal } = useModal();

            const acceptDelivery = React.useCallback(async () => {
              const result = await showModal({
                title: "¿Estás seguro?, ¡No podrás revertir esto!",
                type: "info",
                text: "Aceptar envió?",
                icon: "success",
                showCancelButton: true,
                confirmButtonText: "Sí, aceptar",
                cancelButtonText: "Cancelar",
              });

              if (result.confirmed) {
                try {
                  const formData = new FormData();
                  formData.set("id", row.original.id);

                  const response = await acceptDeliveryAction(formData);

                  if (!response.success) throw new Error("Error al asignar");

                  await showModal({
                    title: "¡Asignado!",
                    type: "info",
                    text: "el envió ha sido asignado.",
                    icon: "success",
                  });
                } catch (error) {
                  console.log("error from modal", error);

                  await showModal({
                    title: "Error",
                    type: "delete",
                    text: "No se pudo asignar el envió",
                    icon: "error",
                  });
                }
              }
            }, [showModal]);

            const deliverDelivery = React.useCallback(async () => {
              const formData = new FormData();
              formData.set("id", row.original.id);
              formData.set("orderId", row.original.orderId);
              const res = await checkDeliveryOrderBalance(formData);

              if (res.pending === 0) {
                const result = await showModal({
                  title: "¿Listo para entregar pedido?",
                  type: "info",
                  text: "Entregar envió?",
                  icon: "success",
                  showCancelButton: true,
                  confirmButtonText: "Sí, aceptar",
                  cancelButtonText: "Cancelar",
                });

                if (result.confirmed) {
                  try {
                    const deliveryResult = await showModal({
                      title: "Confirm Delivery",
                      type: "deliveryConfirmation",
                      text: "Please confirm the delivery by providing a signature and uploading an image.",
                      icon: "success",
                      showCancelButton: true,
                      confirmButtonText: "Confirm",
                      cancelButtonText: "Cancel",
                    });

                    if (deliveryResult.confirmed) {
                      const deliveryResponse = await deliverDeliveryAction(
                        formData
                      );
                      if (!deliveryResponse.success) {
                        throw new Error("Error al asignar");
                      }

                      const { signature } = deliveryResult.data || {};

                      let signatureUrl = "";
                      // let imageUrl = "";

                      if (signature) {
                        const signatureUploadResponse = await uploadImageAction(
                          signature
                        );
                        if (signatureUploadResponse.success) {
                          signatureUrl = signatureUploadResponse.imageUrl ?? "";
                        } else {
                          throw new Error("Failed to upload signature");
                        }
                      }

                      // if (image) {
                      //   const base64Image = await new Promise<string>(
                      //     (resolve, reject) => {
                      //       const reader = new FileReader();
                      //       reader.readAsDataURL(image);
                      //       reader.onload = () =>
                      //         resolve(reader.result as string);
                      //       reader.onerror = (error) => reject(error);
                      //     }
                      //   );

                      //   const imageUploadResponse = await uploadImageAction(
                      //     base64Image
                      //   );
                      //   if (imageUploadResponse.success) {
                      //     imageUrl = imageUploadResponse.imageUrl ?? "";
                      //   } else {
                      //     throw new Error("Failed to upload image");
                      //   }
                      // }

                      const deliveryFormData = new FormData();
                      deliveryFormData.set("id", row.original.orderId);
                      if (signatureUrl) {
                        deliveryFormData.set("signature", signatureUrl);
                      }
                      // if (imageUrl) {
                      //   deliveryFormData.set("imageUrl", imageUrl);
                      // }

                      const updateResponse = await updateOrderOnDelivery(
                        deliveryFormData
                      );
                      if (updateResponse.success) {
                        await showModal({
                          title: "¡Entrega Confirmada!",
                          type: "delete",
                          text: "La entrega ha sido confirmada con éxito.",
                          icon: "success",
                        });
                      } else {
                        await showModal({
                          title: "Error",
                          type: "delete",
                          text: "No se pudo confirmar la entrega.",
                          icon: "error",
                        });
                      }
                    }
                  } catch (error) {
                    console.log("error from modal", error);
                    await showModal({
                      title: "Error",
                      type: "delete",
                      text: "No se pudo entregar el envió",
                      icon: "error",
                    });
                  }
                }
              } else {
                const paymentResult = await showModal({
                  title: `Cobrar pendiente: $${res.pending} antes de entrega!`,
                  type: "payment",
                  text: `Se debe pagar: $${res.pending}`,
                  icon: "success",
                  showCancelButton: true,
                  confirmButtonText: "Sí, pagar",
                  cancelButtonText: "Cancelar",
                });

                if (paymentResult.confirmed) {
                  try {
                    const formData = new FormData();
                    formData.set("id", row.original.orderId);
                    formData.set("amount", paymentResult.data?.amount || "0");
                    formData.set(
                      "reference",
                      paymentResult.data?.reference || ""
                    );
                    formData.set("method", paymentResult.data?.method || "");

                    const deliveryResult = await showModal({
                      title: "Confirm Delivery",
                      type: "deliveryConfirmation",
                      text: "Por favor, confirme la entrega proporcionando una firma y cargando una imagen.",
                      icon: "success",
                      showCancelButton: true,
                      confirmButtonText: "Confirm",
                      cancelButtonText: "Cancel",
                    });

                    if (deliveryResult.confirmed) {
                      const { signature, image } = deliveryResult.data || {};

                      let signatureUrl = "";
                      let imageUrl = "";

                      if (signature) {
                        const signatureUploadResponse = await uploadImageAction(
                          signature
                        );
                        if (signatureUploadResponse.success) {
                          signatureUrl = signatureUploadResponse.imageUrl ?? "";
                        } else {
                          throw new Error("Failed to upload signature");
                        }
                      }

                      if (image) {
                        const base64Image = await new Promise<string>(
                          (resolve, reject) => {
                            const reader = new FileReader();
                            reader.readAsDataURL(image);
                            reader.onload = () =>
                              resolve(reader.result as string);
                            reader.onerror = (error) => reject(error);
                          }
                        );

                        const imageUploadResponse = await uploadImageAction(
                          base64Image
                        );
                        if (imageUploadResponse.success) {
                          imageUrl = imageUploadResponse.imageUrl ?? "";
                        } else {
                          throw new Error("Failed to upload image");
                        }
                      }

                      const deliveryFormData = new FormData();
                      deliveryFormData.set("id", row.original.orderId);
                      if (signatureUrl) {
                        deliveryFormData.set("signature", signatureUrl);
                      }
                      if (imageUrl) {
                        deliveryFormData.set("imageUrl", imageUrl);
                      }

                      const updateResponse = await updateOrderOnDelivery(
                        deliveryFormData
                      );
                      if (updateResponse.success) {
                        const response = await payOrderActionOnDelivery(
                          formData
                        );

                        if (response.success) {
                          await showModal({
                            title: "¡Entrega Confirmada!",
                            type: "delete",
                            text: "La entrega ha sido confirmada con éxito.",
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
                      } else {
                        await showModal({
                          title: "Error",
                          type: "delete",
                          text: "No se pudo confirmar la entrega.",
                          icon: "error",
                        });
                      }
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
              }
            }, [showModal]);

            const deleteDelivery = React.useCallback(async () => {
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
                const isAuthorized = await verifySupervisorCode(
                  supervisorCodeResult.data?.code
                );

                if (isAuthorized.success) {
                  const result = await showModal({
                    title: "¿Estás seguro?, ¡No podrás revertir esto!",
                    type: "delete",
                    text: "Cancelar este envió?",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Sí, eliminar",
                    cancelButtonText: "Cancelar",
                  });

                  if (result.confirmed) {
                    try {
                      const formData = new FormData();
                      formData.set("id", row.original.id);

                      const response = await deleteDeliveryAction(formData);

                      if (!response.success)
                        throw new Error("Error al eliminar");
                      await showModal({
                        title: "CANCELAR!",
                        type: "delete",
                        text: "el envió ha sido cancelado.",
                        icon: "success",
                      });
                    } catch (error) {
                      console.log("error from modal", error);

                      await showModal({
                        title: "Error",
                        type: "delete",
                        text: "No se pudo eliminar el envió",
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
            }, [showModal]);

            const viewItem = React.useCallback(async () => {
              router.push(`/sistema/ventas/envios/editar/${row.original.id}`);
            }, []);

            const viewOrder = React.useCallback(async () => {
              router.push(`/sistema/ventas/pedidos/${row.original.orderId}`);
            }, []);

            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  {["SUPER_ADMIN", "CHOFER"].includes(user?.role || "") &&
                    !["CANCELADO", "ENTREGADO", "EN CAMINO"].includes(
                      row.original.status || ""
                    ) && (
                      <DropdownMenuItem
                        onClick={acceptDelivery}
                        className="text-xs cursor-pointer"
                      >
                        <FaTruckLoading />
                        Recibir
                      </DropdownMenuItem>
                    )}
                  {["CHOFER"].includes(user?.role || "") &&
                    ["EN CAMINO"].includes(row.original.status || "") && (
                      <DropdownMenuItem
                        onClick={deliverDelivery}
                        className="text-xs cursor-pointer"
                      >
                        <FaTruckLoading />
                        Entregar
                      </DropdownMenuItem>
                    )}

                  <DropdownMenuItem
                    onClick={viewOrder}
                    className="text-xs cursor-pointer"
                  >
                    <Eye />
                    Ver Pedido
                  </DropdownMenuItem>
                  {user?.role === "SUPER_ADMIN" ||
                    (user?.role === "ADMIN" && (
                      <DropdownMenuItem
                        onClick={viewItem}
                        className="text-xs cursor-pointer"
                      >
                        <Eye />
                        Editar Envió
                      </DropdownMenuItem>
                    ))}

                  <DropdownMenuSeparator />
                  {user?.role === "SUPER_ADMIN" ||
                    user?.role === "ADMIN" ||
                    (user?.role === "GERENTE" &&
                      row.original.status !== "CANCELADO" && (
                        <DropdownMenuItem
                          onClick={deleteDelivery}
                          className="bg-red-600 text-white focus:bg-red-700 focus:text-white cursor-pointer text-xs"
                        >
                          <X />
                          Cancelar
                        </DropdownMenuItem>
                      ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          };

          return <ActionCell />;
        },
      },
    ],
    // eslint-disable-next-line
    []
  );

  const table = useReactTable<DeliveryAndDriverType>({
    data: deliveries,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="flex  maxsm:flex-col maxsm:items-start gap-3 items-center justify-between py-4">
        <Input
          placeholder="No de Pedido..."
          value={(table.getColumn("orderNo")?.getFilterValue() as string) ?? ""}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            table.getColumn("orderNo")?.setFilterValue(event.target.value)
          }
          className="max-w-40"
        />
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refrescar
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="max-sm:hidden">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="max-sm:hidden">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} pedido(s).
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
