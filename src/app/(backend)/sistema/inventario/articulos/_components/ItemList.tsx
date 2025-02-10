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
import { ArrowUpDown, ChevronDown, Eye, MoreHorizontal, X } from "lucide-react";
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
import { ItemType } from "@/types/items";
import { CheckedState } from "@radix-ui/react-checkbox";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useModal } from "@/app/context/ ModalContext";
import { deactivateItemAction, deleteItemAction } from "../_actions";
import { useSession } from "next-auth/react";
import { UserType } from "@/types/users";

export function ProductList({ items }: { items: ItemType[] }) {
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

  const columns = React.useMemo<ColumnDef<ItemType>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs w-20"
          >
            ID
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="lowercase text-xs w-20">{row.getValue("name")}</div>
        ),
      },

      {
        accessorKey: "mainImage",
        header: "Img",
        cell: ({ row }) => (
          <div className="relative w-12 h-12 overflow-hidden rounded-lg">
            <Image
              src={row.getValue("mainImage")}
              alt="img"
              width={100}
              height={100}
              className="capitalize text-xs min-w-10 h-auto object-cover"
            />
          </div>
        ),
      },

      {
        accessorKey: "price",
        header: () => <div className="text-left text-xs">Precio</div>,
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue("price"));
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
        accessorKey: "totalStock",
        header: () => (
          <div className="text-left text-xs  maxsm:hidden">Inventario</div>
        ),
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue("totalStock"));

          // Format the amount as a dollar amount

          return (
            <div className="text-left text-xs font-medium maxsm:hidden">
              {amount}
            </div>
          );
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const ActionCell = () => {
            const { showModal } = useModal();

            const deleteItem = React.useCallback(async () => {
              const result = await showModal({
                title: "¿Estás seguro?, ¡No podrás revertir esto!",
                type: "delete",
                text: "Eliminar este articulo?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, eliminar",
                cancelButtonText: "Cancelar",
              });

              if (result.confirmed) {
                try {
                  const formData = new FormData();
                  formData.set("id", row.original.id);

                  const response = await deleteItemAction(formData);

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
            }, [showModal]);

            const deactivateItem = React.useCallback(async () => {
              const result = await showModal({
                title: "¿Estás seguro?",
                type: "delete",
                text: "Desactivar este articulo?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, Desactivar",
                cancelButtonText: "Cancelar",
              });

              if (result.confirmed) {
                try {
                  const formData = new FormData();
                  formData.set("id", row.original.id);

                  const response = await deactivateItemAction(formData);

                  if (!response.success) throw new Error("Error al eliminar");
                  await showModal({
                    title: "¡Desactivado!",
                    type: "delete",
                    text: "El articulo ha sido Desactivado.",
                    icon: "success",
                  });
                } catch (error) {
                  console.log("error from modal", error);

                  await showModal({
                    title: "Error",
                    type: "delete",
                    text: "No se pudo Desactivar el articulo",
                    icon: "error",
                  });
                }
              }
            }, [showModal]);

            const viewItem = React.useCallback(async () => {
              router.push(
                `/sistema/inventario/articulos/editar/${row.original.id}`
              );
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
                    onClick={viewItem}
                    className="text-xs cursor-pointer"
                  >
                    <Eye />
                    Editar
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  {user && user.role === "SUPER_ADMIN" ? (
                    <div>
                      <DropdownMenuItem
                        onClick={deleteItem}
                        className="bg-red-600 text-white focus:bg-red-700 focus:text-white cursor-pointer text-xs"
                      >
                        <X />
                        Eliminar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={deactivateItem}
                        className="bg-slate-400 text-white focus:bg-slate-700 focus:text-white cursor-pointer text-xs"
                      >
                        <X />
                        Desactivar
                      </DropdownMenuItem>
                    </div>
                  ) : (
                    <DropdownMenuItem
                      onClick={deactivateItem}
                      className="bg-slate-400 text-white focus:bg-slate-700 focus:text-white cursor-pointer text-xs"
                    >
                      <X />
                      Desactivar
                    </DropdownMenuItem>
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

  const table = useReactTable<ItemType>({
    data: items,
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
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
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
          {table.getFilteredRowModel().rows.length} articulo(s) seleccionado(s).
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
