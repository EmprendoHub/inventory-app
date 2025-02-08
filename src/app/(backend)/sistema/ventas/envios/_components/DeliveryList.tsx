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
import { DeliveryType } from "@/types/delivery";
import { CheckedState } from "@radix-ui/react-checkbox";
import { useRouter } from "next/navigation";
import { useModal } from "@/app/context/ ModalContext";
import { deleteDeliveryAction } from "../_actions";

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
        accessorKey: "orderId",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs"
          >
            Order ID
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-xs">{row.original.orderId}</div>
        ),
      },
      {
        accessorKey: "method",
        header: "Method",
        cell: ({ row }) => <div className="text-xs">{row.original.method}</div>,
      },
      {
        accessorKey: "carrier",
        header: () => <div className="text-xs">Carrier</div>,
        cell: ({ row }) => (
          <div className="text-xs font-medium">{row.original.carrier}</div>
        ),
      },
      {
        accessorKey: "trackingNumber",
        header: () => <div className="text-xs">Tracking Number</div>,
        cell: ({ row }) => (
          <div className="text-xs font-medium">
            {row.original.trackingNumber}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-xs">Status</div>,
        cell: ({ row }) => (
          <div className="text-xs font-medium">{row.original.status}</div>
        ),
      },
      {
        accessorKey: "deliveryDate",
        header: () => <div className="text-xs">Delivery Date</div>,
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

            const deleteDelivery = React.useCallback(async () => {
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

                  const response = await deleteDeliveryAction(formData);

                  if (!response.success)
                    throw new Error("Failed to delete delivery");
                  await showModal({
                    title: "Deleted!",
                    type: "info",
                    text: "The delivery has been deleted.",
                    icon: "success",
                  });
                } catch (error) {
                  console.error("Error deleting delivery:", error);
                  await showModal({
                    title: "Error",
                    type: "info",
                    text: "There was an error deleting the delivery.",
                    icon: "error",
                  });
                }
              }
              // eslint-disable-next-line
            }, [showModal, row.original.id]);

            const viewDelivery = React.useCallback(() => {
              router.push(`/sistema/ventas/envios/editar/${row.original.id}`);
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
                    onClick={viewDelivery}
                    className="text-xs cursor-pointer"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={deleteDelivery}
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
          placeholder="Filter..."
          value={(table.getColumn("orderId")?.getFilterValue() as string) ?? ""}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            table.getColumn("orderId")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <MoreHorizontal className="h-4 w-4" />
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
                  {column.id}
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
                  No results.
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
