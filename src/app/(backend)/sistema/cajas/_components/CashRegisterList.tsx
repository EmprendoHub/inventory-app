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
import {
  ArrowUpDown,
  DownloadCloud,
  Eye,
  MoreHorizontal,
  X,
} from "lucide-react";
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
import { useModal } from "@/app/context/ModalContext";
import { MdCurrencyExchange, MdSms } from "react-icons/md";
import { useRouter } from "next/navigation";
import { verifySupervisorCode } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { UserType } from "@/types/users";
import {
  deleteOrderAction,
  payOrderAction,
} from "../../ventas/pedidos/_actions";
import { CashRegisterResponse } from "@/types/accounting";

export function CashRegisterList({
  registers,
}: {
  registers: CashRegisterResponse[];
}) {
  const { data: session } = useSession();
  const user = session?.user as UserType;
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const { showModal } = useModal();

  const sendEmailReminder = async (id: string) => {
    try {
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

  const columns = React.useMemo<ColumnDef<CashRegisterResponse>[]>(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs w-16 px-2"
          >
            ID
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => {
          const id = row.getValue("id") as string;

          return (
            <div className="text-left text-xs font-medium">
              {id.substring(0, 10)}
            </div>
          );
        },
      },
      {
        accessorKey: "name",
        header: () => (
          <div className="text-left text-xs maxsm:hidden w-20">Caja</div>
        ),
        cell: ({ row }) => (
          <div
            className={`uppercase text-[12px] text-center text-white maxsm:hidden  rounded-md w-24 px-2 `}
          >
            {row.getValue("name")}
          </div>
        ),
      },

      {
        accessorKey: "balance",
        header: () => <div className="text-left text-xs">Balance</div>,
        cell: ({ row }) => {
          const amount = Number(row.getValue("balance"));
          const formatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(amount);
          return (
            <div className="text-left text-xs font-medium">{formatted}</div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: () => <div className="text-left text-xs">Fecha</div>,
        cell: ({ row }) => {
          const date = new Date(row.getValue("createdAt")).toLocaleDateString();
          return <div className="text-left text-xs font-medium">{date}</div>;
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const ActionCell = () => {
            const { showModal } = useModal();

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

                if (isAuthorized) {
                  const result = await showModal({
                    title: "¿Estás seguro?, ¡No podrás revertir esto!",
                    type: "delete",
                    text: "Al cancelara este pedido se cancelara cualquier pago asociado.",
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
                      const response = await deleteOrderAction(formData);
                      if (!response.success)
                        throw new Error("Error al cancelado");
                      await showModal({
                        title: "¡Cancelado!",
                        type: "delete",
                        text: "El pedido ha sido cancelado.",
                        icon: "success",
                      });
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

            // In your OrderList component
            const receivePayment = React.useCallback(async () => {
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

              // eslint-disable-next-line
            }, [showModal, row.original.id]);

            const viewOrder = React.useCallback(async () => {
              router.push(`/sistema/ventas/pedidos/${row.original.id}`);
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
                  <>
                    <DropdownMenuItem
                      onClick={receivePayment}
                      className="text-xs cursor-pointer"
                    >
                      <MdCurrencyExchange /> Recibir pago
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => sendEmailReminder(row.original.id)}
                      className="text-xs cursor-pointer"
                    >
                      <MdSms /> Enviar recordatorio
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/api/recibo/${row.original.id}`)
                      }
                      className="text-xs cursor-pointer"
                    >
                      <DownloadCloud /> Descargar PDF
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={deleteOrder}
                      className="bg-red-600 text-white focus:bg-red-700 focus:text-white cursor-pointer text-xs"
                    >
                      <X />
                      Cancelar
                    </DropdownMenuItem>
                  </>
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

  const table = useReactTable({
    data: registers,
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
      <div className="flex items-center py-4">
        <Input
          placeholder="Filtrar..."
          value={(table.getColumn("orderNo")?.getFilterValue() as string) ?? ""}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            table.getColumn("orderNo")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
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
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} pedido(s) seleccionada(s).
        </div>
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
  );
}
