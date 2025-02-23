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
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { CashTransactionResponse } from "@/types/accounting";

export function CashTransactionList({
  transactions,
}: {
  transactions: CashTransactionResponse[];
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const columns = React.useMemo<ColumnDef<CashTransactionResponse>[]>(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs w-2 px-2 "
          >
            ID
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => {
          const id = row.getValue("id") as string;
          return (
            <div className="uppercase text-xs w-2">{id.substring(2, 7)}</div>
          );
        },
      },
      {
        accessorKey: "description",
        header: () => (
          <div className="text-left text-xs maxsm:hidden w-20">Ref</div>
        ),
        cell: ({ row }) => (
          <div
            className={`uppercase text-[12px] text-center text-white maxsm:hidden  rounded-md w-60 px-2 leading-none`}
          >
            {row.getValue("description")}
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-left text-xs">Cantidad</div>,
        cell: ({ row }) => {
          const amount = row.getValue("amount");
          const formatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(Number(amount));
          return (
            <div className="text-left text-xs font-medium">{formatted}</div>
          );
        },
      },
      {
        accessorKey: "type",
        header: () => <div className="text-left text-xs">Tipo</div>,
        cell: ({ row }) => (
          <div
            className={`uppercase text-[12px] text-center text-white  ${
              row.getValue("type") === "RETIRO"
                ? "bg-emerald-800"
                : "bg-blue-700"
            } rounded-md w-auto px-2 `}
          >
            {row.getValue("type")}
          </div>
        ),
      },
      // {
      //   accessorKey: "user",
      //   header: () => <div className="text-left text-xs">Pedido</div>,
      //   cell: ({ row }) => {
      //     const user = row.getValue("user") as UserType;

      //     return (
      //       <div
      //         className={`uppercase text-[12px] text-center text-white maxsm:hidden  rounded-md w-auto px-2 `}
      //       >
      //         {user.name}
      //       </div>
      //     );
      //   },
      // },
      {
        accessorKey: "createdAt",
        header: () => <div className="text-left text-xs w-5">Fecha</div>,
        cell: ({ row }) => {
          const date = new Date(row.getValue("createdAt")).toLocaleDateString();
          return (
            <div className="text-left text-xs font-medium w-5">{date}</div>
          );
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({}) => {
          const ActionCell = () => {
            // const { showModal } = useModal();

            // const deleteOrder = React.useCallback(async () => {
            //   // First, prompt for supervisor code
            //   const supervisorCodeResult = await showModal({
            //     title: "Verificación de Supervisor",
            //     type: "supervisorCode",
            //     text: "Por favor, ingrese el código de supervisor para continuar.",
            //     icon: "warning",
            //     showCancelButton: true,
            //     confirmButtonText: "Verificar",
            //     cancelButtonText: "Cancelar",
            //   });
            //   if (supervisorCodeResult.confirmed) {
            //     const isAuthorized = await verifySupervisorCode(
            //       supervisorCodeResult.data?.code
            //     );

            //     if (isAuthorized.success) {
            //       const result = await showModal({
            //         title: "¿Estás seguro?, ¡No podrás revertir esto!",
            //         type: "delete",
            //         text: "Al cancelara este pedido se cancelara cualquier pago asociado.",
            //         icon: "warning",
            //         showCancelButton: true,
            //         confirmButtonText: "Sí, cancelar",
            //         cancelButtonText: "Cancelar",
            //       });

            //       if (result.confirmed) {
            //         try {
            //           const formData = new FormData();
            //           formData.set("id", row.original.id);
            //           formData.set("userId", user.id);
            //           const response = await deleteOrderAction(formData);
            //           if (!response.success)
            //             throw new Error("Error al cancelado");
            //           await showModal({
            //             title: "¡Cancelado!",
            //             type: "delete",
            //             text: "El pedido ha sido cancelado.",
            //             icon: "success",
            //           });
            //         } catch (error) {
            //           console.log("error from modal", error);

            //           await showModal({
            //             title: "Error",
            //             type: "delete",
            //             text: "No se pudo cancelado el pedido",
            //             icon: "error",
            //           });
            //         }
            //       }
            //     } else {
            //       await showModal({
            //         title: "Código no autorizado",
            //         type: "delete",
            //         text: "El código de supervisor no es válido.",
            //         icon: "error",
            //       });
            //     }
            //   }
            // }, [showModal]);

            // const viewOrder = React.useCallback(async () => {
            //   router.push(`/sistema/ventas/pedidos/ver/${row.original.id}`);
            // }, []);
            return (
              <>
                {/* <DropdownMenu>
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
                </DropdownMenu> */}
              </>
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
    data: transactions,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    initialState: {
      pagination: {
        pageSize: 5, // Set the default page size to 5
      },
    },
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
          value={
            (table.getColumn("description")?.getFilterValue() as string) ?? ""
          }
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            table.getColumn("description")?.setFilterValue(event.target.value)
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
          {table.getFilteredRowModel().rows.length} pedido(s) seleccionada(s).
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
