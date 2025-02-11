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
import { ArrowUpDown, MoreHorizontal, Eye, X } from "lucide-react";
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
import { useRouter } from "next/navigation";
import { TruckType } from "@/types/truck";
import { useModal } from "@/app/context/ ModalContext";
import { deleteTruckAction } from "../_actions";

export function TruckList({ trucks }: { trucks: TruckType[] }) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const columns = React.useMemo<ColumnDef<TruckType>[]>(
    () => [
      {
        accessorKey: "licensePlate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs"
          >
            Placa
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-xs">{row.original.licensePlate}</div>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-xs">Estado</div>,
        cell: ({ row }) => <div className="text-xs">{row.original.status}</div>,
      },
      {
        accessorKey: "createdAt",
        header: () => <div className="text-xs">Creado el</div>,
        cell: ({ row }) => (
          <div className="text-xs">
            {row.original.createdAt
              ? new Date(row.original.createdAt).toLocaleDateString()
              : "N/A"}
          </div>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: () => <div className="text-xs">Actualizado</div>,
        cell: ({ row }) => (
          <div className="text-xs">
            {row.original.updatedAt
              ? new Date(row.original.updatedAt).toLocaleDateString()
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

            const deleteTruck = React.useCallback(async () => {
              const confirmed = await showModal({
                title: "Are you sure?",
                type: "delete",
                text: "You won't be able to revert this!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, delete it!",
                cancelButtonText: "Cancel",
              });

              if (confirmed) {
                try {
                  const formData = new FormData();
                  formData.set("id", row.original.id);

                  const response = await deleteTruckAction(formData);

                  if (!response.success)
                    throw new Error("Failed to delete truck");
                  await showModal({
                    title: "Deleted!",
                    type: "info",
                    text: "The truck has been deleted.",
                    icon: "success",
                  });
                } catch (error) {
                  console.error("Error deleting truck:", error);
                  await showModal({
                    title: "Error",
                    type: "info",
                    text: "There was an error deleting the truck.",
                    icon: "error",
                  });
                }
              }
              // eslint-disable-next-line
            }, [showModal, row.original.id]);

            const viewTruck = React.useCallback(() => {
              router.push(`/sistema/shipping/trucks/edit/${row.original.id}`);
              // eslint-disable-next-line
            }, [router, row.original.id]);

            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="text-xs">
                    Actions
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={viewTruck}
                    className="text-xs cursor-pointer"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={deleteTruck}
                    className="bg-red-600 text-white focus:bg-red-700 focus:text-white cursor-pointer text-xs"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Delete
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

  const table = useReactTable<TruckType>({
    data: trucks,
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
          placeholder="Filtro by License Plate..."
          value={
            (table.getColumn("licensePlate")?.getFilterValue() as string) ?? ""
          }
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            table.getColumn("licensePlate")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto text-xs">
              Columns <ArrowUpDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize text-xs"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value: CheckedState) =>
                    column.toggleVisibility(!!value)
                  }
                >
                  {column.id.replace(/([A-Z])/g, " $1").trim()}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
          {table.getFilteredRowModel().rows.length} truck(s) selected.
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
