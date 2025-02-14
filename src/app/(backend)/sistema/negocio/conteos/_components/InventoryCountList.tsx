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
import { ArrowUpDown, Eye, MoreHorizontal, X } from "lucide-react";
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
import { InventoryCountType } from "@/types/inventoryCounts";
import { CheckedState } from "@radix-ui/react-checkbox";
import { useRouter } from "next/navigation";
import { deleteInventoryCountAction } from "../_actions";
import { useModal } from "@/app/context/ ModalContext";

export function InventoryCountList({
  inventoryCounts,
}: {
  inventoryCounts: InventoryCountType[];
}) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const columns = React.useMemo<ColumnDef<InventoryCountType>[]>(
    () => [
      {
        accessorKey: "warehouseId",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs w-20"
          >
            Bodega
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="uppercase text-xs w-20">
            {row.original.warehouseId}
          </div>
        ),
      },
      {
        accessorKey: "countDate",
        header: () => <div className="text-left text-xs">Fecha de Conteo</div>,
        cell: ({ row }) => (
          <div className="text-left text-xs font-medium">
            {new Date(row.getValue("countDate")).toLocaleDateString()}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-left text-xs">Estado</div>,
        cell: ({ row }) => (
          <div className="text-left text-xs font-medium">
            {row.getValue("status")}
          </div>
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const ActionCell = () => {
            const { showModal } = useModal();

            const deleteInventoryCount = React.useCallback(async () => {
              const result = await showModal({
                title: "¿Estás seguro?, ¡No podrás revertir esto!",
                type: "delete",
                text: "Eliminar este conteo de inventario?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, eliminar",
                cancelButtonText: "Cancelar",
              });

              if (result.confirmed) {
                try {
                  const formData = new FormData();
                  formData.set("id", row.original.id);

                  const response = await deleteInventoryCountAction(formData);

                  if (!response.success) throw new Error("Error al eliminar");
                  await showModal({
                    title: "¡Eliminado!",
                    type: "delete",
                    text: "El conteo de inventario ha sido eliminado.",
                    icon: "success",
                  });
                } catch (error) {
                  console.log("error from modal", error);

                  await showModal({
                    title: "Error",
                    type: "delete",
                    text: "No se pudo eliminar el conteo de inventario",
                    icon: "error",
                  });
                }
              }
            }, [showModal]);

            const viewInventoryCount = React.useCallback(async () => {
              router.push(`/sistema/negocio/conteos/editar/${row.original.id}`);
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
                    onClick={viewInventoryCount}
                    className="text-xs cursor-pointer"
                  >
                    <Eye />
                    Editar
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={deleteInventoryCount}
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
    ], // eslint-disable-next-line
    []
  );

  const table = useReactTable<InventoryCountType>({
    data: inventoryCounts,
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
          value={
            (table.getColumn("warehouseId")?.getFilterValue() as string) ?? ""
          }
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            table.getColumn("warehouseId")?.setFilterValue(event.target.value)
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
          {table.getFilteredRowModel().rows.length} conteo(s) seleccionado(s).
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
