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
import { Edit2, Eye, MoreHorizontal, X } from "lucide-react";

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
import { paymentType } from "@/types/sales";
import { useRouter } from "next/navigation";
import { useModal } from "@/app/context/ModalContext";
import { verifySupervisorCode } from "@/app/_actions";
import { deletePaymentAction } from "../../pedidos/_actions";
import { UserType } from "@/types/users";
import { useSession } from "next-auth/react";
import { getMexicoGlobalUtcSelectedDate } from "@/lib/utils";

export function PaymentList({ payments }: { payments: paymentType[] }) {
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

  const columns = React.useMemo<ColumnDef<paymentType>[]>(
    () => [
      {
        accessorKey: "orderNo",
        header: ({ column }) => {
          return (
            <div
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="text-xs cursor-pointer"
            >
              Pedido
            </div>
          );
        },
        cell: ({ row }) => (
          <div className="uppercase text-xs">{row.getValue("orderNo")}</div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: () => <div className="text-left text-xs">Fecha</div>,
        cell: ({ row }) => {
          const date = getMexicoGlobalUtcSelectedDate(
            row.getValue("createdAt")
          );
          return <div className="text-left text-xs font-medium">{date}</div>;
        },
      },
      {
        accessorKey: "method",
        header: () => (
          <div className="text-left text-xs maxmd:hidden">Método</div>
        ),
        cell: ({ row }) => (
          <div className="uppercase text-xs maxmd:hidden">
            {row.getValue("method")}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-left text-xs ">Estado</div>,
        cell: ({ row }) => (
          <div
            className={`uppercase text-[12px] text-center text-white rounded-md w-24 px-2 ${
              row.original.status === "CANCELADO"
                ? "bg-red-900"
                : row.original.status === "PENDIENTE"
                ? "bg-yellow-700"
                : row.original.status === "PAGADO"
                ? "bg-emerald-900"
                : "bg-emerald-900"
            }`}
          >
            {row.getValue("status")}
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-left text-xs">Cantidad</div>,
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue("amount"));

          // Format the amount as a dollar amount

          return <div className="text-left text-xs font-medium">${amount}</div>;
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const ActionCell = () => {
            const { showModal } = useModal();

            const deletePayment = React.useCallback(async () => {
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
                      const response = await deletePaymentAction(formData);
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

            const viewOrder = React.useCallback(async () => {
              router.push(
                `/sistema/ventas/pedidos/ver/${row.original.orderId}`
              );
            }, []);

            const editPayment = React.useCallback(async () => {
              router.push(`/sistema/ventas/pagos/editar/${row.original.id}`);
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
                    Ver pedido
                  </DropdownMenuItem>
                  {["SUPER_ADMIN", "ADMIN"].includes(user?.role || "") &&
                    row.original.status !== "CANCELADO" && (
                      <>
                        <DropdownMenuItem
                          onClick={editPayment}
                          className="bg-blue-600 text-white focus:bg-blue-700 focus:text-white cursor-pointer text-xs"
                        >
                          <Edit2 />
                          Editar
                        </DropdownMenuItem>
                      </>
                    )}
                  {["SUPER_ADMIN", "ADMIN"].includes(user?.role || "") &&
                    row.original.status !== "CANCELADO" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={deletePayment}
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
    // eslint-disable-next-line
    []
  );
  const table = useReactTable<paymentType>({
    data: payments,
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
        {/* <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} categoría(s)
          seleccionada(s).
        </div> */}
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
