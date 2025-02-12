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
import { ArrowUpDown, MoreHorizontal, X, Eye } from "lucide-react";
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
import { DeliveryType } from "@/types/delivery";
import { useRouter } from "next/navigation";
import { useModal } from "@/app/context/ ModalContext";
import { deleteDeliveryAction } from "../_actions";
import { verifySupervisorCode } from "@/lib/utils";

export function DeliveryList({ deliveries }: { deliveries: DeliveryType[] }) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const columns = React.useMemo<ColumnDef<DeliveryType>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs"
          >
            Fecha
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-xs font-medium">
            {row.original.createdAt
              ? new Date(row.original.createdAt).toLocaleDateString()
              : "N/A"}
          </div>
        ),
      },
      {
        accessorKey: "method",
        header: "Método",
        cell: ({ row }) => <div className="text-xs">{row.original.method}</div>,
      },
      {
        accessorKey: "carrier",
        header: () => <div className="text-xs">Paquetería</div>,
        cell: ({ row }) => (
          <div className="text-xs font-medium">{row.original.carrier}</div>
        ),
      },
      {
        accessorKey: "trackingNumber",
        header: () => <div className="text-xs">No. de rastreo</div>,
        cell: ({ row }) => (
          <div className="text-xs font-medium">
            {row.original.trackingNumber}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-xs">Estado</div>,
        cell: ({ row }) => (
          <div className="text-xs font-medium">{row.original.status}</div>
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

            const deleteItem = React.useCallback(async () => {
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
                    text: "Eliminar este categoría?",
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
                        title: "¡Eliminado!",
                        type: "delete",
                        text: "La categoría ha sido eliminado.",
                        icon: "success",
                      });
                    } catch (error) {
                      console.log("error from modal", error);

                      await showModal({
                        title: "Error",
                        type: "delete",
                        text: "No se pudo eliminar la categoría",
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

                  <DropdownMenuItem
                    onClick={viewItem}
                    className="text-xs cursor-pointer"
                  >
                    <Eye />
                    Editar
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={deleteItem}
                    className="bg-red-600 text-white focus:bg-red-700 focus:text-white cursor-pointer text-xs"
                  >
                    <X />
                    Eliminar
                  </DropdownMenuItem>
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

  const table = useReactTable<DeliveryType>({
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
      <div className="flex items-center py-4">
        <Input
          placeholder="Filtro..."
          value={
            (table.getColumn("createdAt")?.getFilterValue() as string) ?? ""
          }
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            table.getColumn("createdAt")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
          {table.getFilteredRowModel().rows.length} delivery record(s) selected.
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
