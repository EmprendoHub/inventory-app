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
import { Eye, MoreHorizontal, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
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
import { CheckedState } from "@radix-ui/react-checkbox";
import { clientType, ordersAndItem, paymentType } from "@/types/sales";
import { useModal } from "@/app/context/ModalContext";
import {
  deleteOrderAction,
  markCompletedOrderAction,
  payOrderAction,
} from "../_actions";
import { MdCurrencyExchange } from "react-icons/md";
import { useRouter } from "next/navigation";
import { verifySupervisorCode } from "@/app/_actions";
import { useSession } from "next-auth/react";
import { UserType } from "@/types/users";
// import { DeliveryType } from "@/types/delivery";
import { GiCheckMark } from "react-icons/gi";
import { getMexicoGlobalUtcSelectedDate } from "@/lib/utils";
// import { FaTruckFast } from "react-icons/fa6";

function calculatePaymentsTotal(payments: paymentType[]) {
  const total = payments.reduce((sum, item) => sum + item.amount, 0);
  return total;
}

export function OrderList({ orders }: { orders: ordersAndItem[] }) {
  const { data: session, status: sessionStatus } = useSession();
  const user = session?.user as UserType;
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sending, setSending] = React.useState(false);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [mounted, setMounted] = React.useState(false);

  // Add useEffect to handle the component mounting state
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const columns = React.useMemo<ColumnDef<ordersAndItem>[]>(
    () => [
      {
        accessorKey: "orderNo",
        header: ({ column }) => (
          <div
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs w-auto px-2 cursor-pointer"
          >
            Pedido
          </div>
        ),
        cell: ({ row }) => (
          <div className="uppercase text-xs w-auto">
            {row.getValue("orderNo")}
          </div>
        ),
      },
      {
        accessorKey: "client",
        header: () => (
          <div className="text-center text-xs w-32 flex">Cliente</div>
        ),
        cell: ({ row }) => {
          const client: clientType = row.getValue("client");
          return (
            <div
              className={`uppercase py-1 flex justify-center items-center text-[12px] text-center text-white rounded-md w-32 px-2 bg-sky-900 leading-none`}
            >
              {client.name}
            </div>
          );
        },
      },
      {
        accessorKey: "user",
        header: () => (
          <div className="text-center text-xs w-24 flex">Bodega</div>
        ),
        cell: ({ row }) => {
          const user = row.getValue("user") as ordersAndItem["user"];
          const warehouseName =
            user?.warehouse?.title || user?.warehouse?.code || "N/A";
          return (
            <div
              className={`uppercase py-1 flex justify-center items-center text-[10px] text-center text-white rounded-md w-24 px-1 bg-purple-700 leading-none`}
            >
              {warehouseName}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: () => (
          <div className="text-left text-[10px]  w-auto">Estado</div>
        ),
        cell: ({ row }) => (
          <div
            className={`uppercase text-[12px] text-center text-white   rounded-md w-auto px-1 ${
              row.original.status === "CANCELADO"
                ? "bg-red-900"
                : row.original.status === "PENDIENTE"
                ? "bg-yellow-700"
                : row.original.status === "PROCESANDO"
                ? "bg-blue-900"
                : "bg-emerald-900"
            }`}
          >
            {row.getValue("status")}
          </div>
        ),
      },
      {
        accessorKey: "payments",
        header: () => <div className="text-left text-xs">Pagado</div>,
        cell: ({ row }) => {
          const amount = calculatePaymentsTotal(row.getValue("payments"));
          const formatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
            minimumFractionDigits: 0,
          }).format(amount);
          return (
            <div className="text-left text-xs font-medium">{formatted}</div>
          );
        },
      },
      // {
      //   accessorKey: "delivery",
      //   header: () => (
      //     <div className="text-left text-xs w-auto">
      //       <FaTruckFast size={16} />
      //     </div>
      //   ),
      //   cell: ({ row }) => {
      //     const delivery = row.getValue("delivery") as DeliveryType;
      //     const amount = delivery?.price || 0;
      //     // const formatted = new Intl.NumberFormat("en-US", {
      //     //   style: "currency",
      //     //   currency: "USD",
      //     // }).format(amount);
      //     return (
      //       <div
      //         className={`flex items-center py-1.5 justify-center text-left text-xs font-medium rounded-full w-auto ${
      //           amount > 0 ? "bg-emerald-700" : "bg-gray-500"
      //         }`}
      //       >
      //         {amount > 0 ? (
      //           <CheckIcon size={14} className="text-white text-xs" />
      //         ) : (
      //           <X size={14} className="text-white text-xs" />
      //         )}
      //       </div>
      //     );
      //   },
      // },
      // {
      //   accessorKey: "totalAmount",
      //   header: () => <div className="text-left text-xs">Total</div>,
      //   cell: ({ row }) => {
      //     const amount = parseFloat(row.getValue("totalAmount"));
      //     const order = row.getAllCells()[0].row.original;
      //     const totalAmount =
      //       amount + (order.delivery?.price || 0) - (order.discount || 0);
      //     const formatted = new Intl.NumberFormat("en-US", {
      //       style: "currency",
      //       currency: "USD",
      //       maximumFractionDigits: 0,
      //       minimumFractionDigits: 0,
      //     }).format(totalAmount);
      //     return (
      //       <div className="text-left text-xs font-medium">{formatted}</div>
      //     );
      //   },
      // },
      {
        accessorKey: "createdAt",
        header: () => <div className="text-left text-xs">Fecha</div>,
        cell: ({ row }) => {
          const date = getMexicoGlobalUtcSelectedDate(
            row.getValue("createdAt")
          );
          return <div className="text-left text-xs  font-medium">{date}</div>;
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const ActionCell = () => {
            const { showModal } = useModal();
            const discount = row.original.discount || 0;
            const subtotal = row.original.orderItems?.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            );
            const previousPayments = (row.original.payments ?? []).reduce(
              (sum, item) => sum + item.amount,
              0
            );
            const grandTotal =
              (subtotal || 0) + (row.original.delivery?.price || 0) - discount;
            const isOrderPaid = previousPayments >= grandTotal; // Using >= to handle floating point issues

            // Only check role if session is available and component is mounted
            const isAuthorizedRole =
              mounted &&
              sessionStatus === "authenticated" &&
              ["SUPER_ADMIN", "GERENTE"].includes(user?.role || "");

            const deleteOrder = React.useCallback(async () => {
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
                const isAuthorized = await verifySupervisorCode(
                  supervisorCodeResult.data?.code
                );

                if (isAuthorized.success) {
                  // Check if there are cash payments
                  const cashPayments =
                    row.original.payments?.filter(
                      (payment) => payment.method === "EFECTIVO"
                    ) || [];
                  const cashAmount = cashPayments.reduce(
                    (sum, payment) => sum + payment.amount,
                    0
                  );

                  let confirmationText =
                    "Al cancelar este pedido se cancelará cualquier pago asociado.";

                  if (cashPayments.length > 0 && cashAmount > 0) {
                    confirmationText += `\n\n💰 Pagos en efectivo: $${cashAmount.toFixed(
                      2
                    )}\n📝 Las denominaciones específicas a retirar se calcularán automáticamente y se mostrarán en la transacción de caja.`;
                  }

                  const result = await showModal({
                    title: "¿Estás seguro?, ¡No podrás revertir esto!",
                    type: "delete",
                    text: confirmationText,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Sí, cancelar",
                    cancelButtonText: "Cancelar",
                  });

                  if (result.confirmed) {
                    try {
                      const formData = new FormData();
                      formData.set("id", row.original.id);
                      formData.set("userId", user.id);
                      const response = (await deleteOrderAction(formData)) as {
                        success: boolean;
                        message: string;
                        errors: any;
                        denominationsRemoved?: string | null;
                      };
                      if (!response.success)
                        throw new Error("Error al cancelado");

                      let successMessage = "El pedido ha sido cancelado.";
                      if (cashPayments.length > 0 && cashAmount > 0) {
                        if (response.denominationsRemoved) {
                          successMessage += `\n\n💰 Denominaciones a retirar:\n${response.denominationsRemoved}`;
                        } else {
                          successMessage += `\n\n📋 Revisa las transacciones de caja para ver las denominaciones específicas que fueron retiradas automáticamente.`;
                        }
                      }

                      await showModal({
                        title: "¡Cancelado!",
                        type: "delete",
                        text: successMessage,
                        icon: "success",
                      });
                      router.refresh();
                    } catch (error) {
                      console.log("error from modal", error);

                      await showModal({
                        title: "Error",
                        type: "delete",
                        text: "No se pudo cancelado el pedido",
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

            const receivePayment = React.useCallback(async () => {
              setSending(true);

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
                  formData.set("id", row.original.id);
                  formData.set("amount", result.data?.amount || "0");
                  formData.set("reference", result.data?.reference || "");
                  formData.set("method", result.data?.method || "");

                  const response = await payOrderAction(formData);

                  setSending(false);

                  if (response.success) {
                    await showModal({
                      title: "¡Pago Aplicado!",
                      type: "delete",
                      text: response.message,
                      icon: "success",
                    });
                    router.refresh();
                  } else {
                    await showModal({
                      title: "¡Pago No Aplicado!",
                      type: "delete",
                      text: response.message,
                      icon: "error",
                    });
                  }
                } catch (error) {
                  setSending(false);
                  console.log("Error processing payment:", error);
                  await showModal({
                    title: "Error",
                    type: "delete",
                    text: "No se pudo aplicar el pago",
                    icon: "error",
                  });
                }
              } else {
                setSending(false);
              }
              //eslint-disable-next-line
            }, [showModal, row.original.id]);

            const markCompleted = React.useCallback(async () => {
              setSending(true);

              try {
                const formData = new FormData();
                formData.set("id", row.original.id);
                formData.set("status", "ENTREGADO");

                const response = await markCompletedOrderAction(formData);

                setSending(false);

                if (response.success) {
                  await showModal({
                    title: "¡Entregado!",
                    type: "delete",
                    text: response.message,
                    icon: "success",
                  });
                  router.refresh();
                } else {
                  await showModal({
                    title: "¡No ¡Entregado!",
                    type: "delete",
                    text: response.message,
                    icon: "error",
                  });
                }
              } catch (error) {
                setSending(false);
                console.log("Error processing payment:", error);
                await showModal({
                  title: "Error",
                  type: "delete",
                  text: "No se pudo aplicar el pago",
                  icon: "error",
                });
              }
              //eslint-disable-next-line
            }, [showModal, row.original.id]);

            const viewOrder = React.useCallback(async () => {
              router.push(`/sistema/ventas/pedidos/ver/${row.original.id}`);
            }, []);

            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Abrir menú</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="text-xs">
                    Acciones
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={viewOrder}
                    className="text-xs cursor-pointer"
                  >
                    <Eye />
                    Ver detalles
                  </DropdownMenuItem>
                  {row.original.status !== "CANCELADO" && mounted && (
                    <>
                      {isAuthorizedRole && !isOrderPaid && (
                        <DropdownMenuItem
                          onClick={receivePayment}
                          className="text-xs cursor-pointer"
                        >
                          <MdCurrencyExchange /> Recibir pago
                        </DropdownMenuItem>
                      )}
                      {isAuthorizedRole &&
                        isOrderPaid &&
                        row.original.status !== "ENTREGADO" && (
                          <DropdownMenuItem
                            onClick={markCompleted}
                            className="text-xs cursor-pointer"
                          >
                            <GiCheckMark /> Entregar
                          </DropdownMenuItem>
                        )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={deleteOrder}
                        className="bg-red-600 text-white focus:bg-red-700 focus:text-white cursor-pointer text-xs"
                      >
                        <X />
                        Cancelar
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          };

          return <ActionCell />;
        },
      },
    ],
    //eslint-disable-next-line
    [mounted, sessionStatus]
  );

  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data: orders,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      // Custom global filter that checks both orderNo and client.name
      const orderNo = String(row.getValue("orderNo")).toLowerCase();
      const client = row.getValue("client") as clientType;
      const clientName = client?.name?.toLowerCase() || "";
      const searchValue = filterValue.toLowerCase();

      return orderNo.includes(searchValue) || clientName.includes(searchValue);
    },
    initialState: {
      pagination: {
        pageSize: 10, // Set the default page size to 5
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  const handleRefresh = () => {
    // Force a full page reload to get fresh data from the database
    window.location.reload();
  };

  return (
    <section>
      {sending && (
        <div
          className={`fixed top-0 left-0 z-50 flex flex-col items-center justify-center w-screen h-screen bg-black/50`}
        >
          <h3>procesando...</h3>
          <span className="loader" />
        </div>
      )}
      <div className="w-full">
        <div className="flex items-center py-4">
          <div className="flex items-center justify-between w-full">
            <Input
              placeholder="Buscar por # pedido o cliente..."
              value={globalFilter ?? ""}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                const value = event.target.value;
                // Set a global filter that will be handled in our custom filter function
                table.setGlobalFilter(value);
              }}
              className="max-w-sm"
            />
            {/* Add the refresh button */}
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refrescar
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value: CheckedState) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
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
                    Sin resultafos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
