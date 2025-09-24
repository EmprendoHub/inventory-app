"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Edit, MoreHorizontal, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StockModal } from "./StockModal";
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
import { ArrowUpDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useModal } from "@/app/context/ModalContext";
import { deleteItemAction, toggleItemStatusAction } from "../_actions";
import { useSession } from "next-auth/react";
import { UserType } from "@/types/users";
import { verifySupervisorCode } from "@/app/_actions";

interface Stock {
  id: string;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  location?: string | null;
  warehouseId: string;
  warehouse?: {
    id: string;
    title: string;
    code: string;
    type: string;
    status: string;
  } | null;
}

interface Item {
  id: string;
  name: string;
  description: string;
  sku: string;
  barcode: string | null;
  dimensions: string | null;
  weight: number | null;
  price: number;
  cost: number;
  minStock: number;
  maxStock: number | null;
  tax: number;
  notes: string | null;
  images: string[];
  mainImage: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  supplierId: string;
  categoryId: string;
  brandId: string;
  unitId: string;
  isDigital: boolean;
  reorderPoint: number | null;
  stocks: Stock[];
  totalAvailableStock: number;
  totalReservedStock: number;
  totalStock: number;
}

interface ProductListProps {
  items: Item[];
}

export function ProductList({ items: initialItems }: ProductListProps) {
  const { data: session } = useSession();
  const user = session?.user as UserType;

  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [items, setItems] = useState<Item[]>(initialItems);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to refresh stock data
  const refreshStockData = async () => {
    if (!selectedItem) return;

    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/items/${selectedItem.id}/stocks`);
      if (response.ok) {
        const updatedStocks = await response.json();

        // Update the selected item with new stock data
        setSelectedItem((prev) =>
          prev ? { ...prev, stocks: updatedStocks } : null
        );

        // Update the items list
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === selectedItem.id
              ? {
                  ...item,
                  stocks: updatedStocks,
                  totalAvailableStock: updatedStocks.reduce(
                    (sum: number, stock: Stock) => sum + stock.availableQty,
                    0
                  ),
                  totalReservedStock: updatedStocks.reduce(
                    (sum: number, stock: Stock) => sum + stock.reservedQty,
                    0
                  ),
                  totalStock: updatedStocks.reduce(
                    (sum: number, stock: Stock) => sum + stock.quantity,
                    0
                  ),
                }
              : item
          )
        );
      }
    } catch (error) {
      console.error("Error refreshing stock data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStockClick = React.useCallback((item: Item) => {
    setSelectedItem(item);
    setIsStockModalOpen(true);
  }, []);

  const closeStockModal = () => {
    setIsStockModalOpen(false);
    setSelectedItem(null);
  };

  // Listen for storage events to detect when stock is updated
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "stockUpdated") {
        refreshStockData();
        localStorage.removeItem("stockUpdated"); // Clean up
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem]);

  const columns = React.useMemo<ColumnDef<Item>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs w-40"
          >
            Nombre
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <div className="font-semibold text-sm">{row.getValue("name")}</div>
            <div className="text-xs text-gray-500 truncate max-w-[200px]">
              {row.original.description}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "mainImage",
        header: "Img",
        cell: ({ row }) => (
          <div className="relative w-12 h-12 overflow-hidden rounded-lg bg-gray-100">
            {row.getValue("mainImage") ? (
              <Image
                src={row.getValue("mainImage")}
                alt="img"
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="text-xs">No img</span>
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => (
          <code className="text-sm bg-card px-2 py-1 rounded">
            {row.getValue("sku")}
          </code>
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
            maximumFractionDigits: 0,
            minimumFractionDigits: 0,
          }).format(amount);
          return (
            <div className="text-left text-sm font-semibold">{formatted}</div>
          );
        },
      },
      {
        accessorKey: "totalAvailableStock",
        header: () => <div className="text-center text-xs">Inventario</div>,
        cell: ({ row }) => {
          const item = row.original;
          const stockStatus =
            item.totalAvailableStock === 0
              ? "text-red-600"
              : item.totalAvailableStock <= item.minStock
              ? "text-yellow-600"
              : "text-green-600";

          return (
            <button
              onClick={() => handleStockClick(item)}
              className="hover:bg-gray-100 px-2 py-1 rounded transition-colors"
            >
              <div className="flex flex-col items-center">
                <span className={`font-semibold text-sm ${stockStatus}`}>
                  {item.totalAvailableStock}
                </span>
                <span className="text-xs text-gray-500">disponible</span>
                {item.totalReservedStock > 0 && (
                  <span className="text-xs text-orange-600">
                    {item.totalReservedStock} reservado
                  </span>
                )}
              </div>
            </button>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          const statusConfig = {
            ACTIVE: {
              label: "Activo",
              className: "bg-green-100 text-green-800",
            },
            INACTIVE: {
              label: "Inactivo",
              className: "bg-gray-100 text-gray-800",
            },
            DISCONTINUED: {
              label: "Descontinuado",
              className: "bg-red-100 text-red-800",
            },
            OUT_OF_STOCK: {
              label: "Sin Stock",
              className: "bg-red-100 text-red-800",
            },
            LOW_STOCK: {
              label: "Stock Bajo",
              className: "bg-yellow-100 text-yellow-800",
            },
          };

          const config = statusConfig[status as keyof typeof statusConfig] || {
            label: status,
            className: "bg-gray-100 text-gray-800",
          };

          return <Badge className={config.className}>{config.label}</Badge>;
        },
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

                if (isAuthorized.success) {
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

                      if (!response.success)
                        throw new Error("Error al eliminar");
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

            const toggleItemStatus = React.useCallback(async () => {
              const result = await showModal({
                title: "¿Estás seguro?",
                type: "delete",
                text: `¿Quieres ${
                  row.original.status === "ACTIVE" ? "desactivar" : "activar"
                } este artículo?`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: `Sí, ${
                  row.original.status === "ACTIVE" ? "Desactivar" : "Activar"
                }`,
                cancelButtonText: "Cancelar",
              });

              if (result.confirmed) {
                try {
                  const formData = new FormData();
                  formData.set("id", row.original.id);

                  const response = await toggleItemStatusAction(formData);

                  if (!response.success)
                    throw new Error("Error al cambiar el estado");
                  await showModal({
                    title: "¡Éxito!",
                    type: "delete",
                    text: `El artículo ha sido ${
                      row.original.status === "ACTIVE"
                        ? "desactivado"
                        : "activado"
                    }.`,
                    icon: "success",
                  });

                  // Refresh the page or re-fetch data
                  router.refresh(); // or use a state update to re-fetch data
                } catch (error) {
                  console.log("error from modal", error);

                  await showModal({
                    title: "Error",
                    type: "delete",
                    text: "No se pudo cambiar el estado del artículo",
                    icon: "error",
                  });
                }
              }
            }, [showModal]);

            const viewItem = React.useCallback(async () => {
              router.push(
                `/sistema/negocio/articulos/editar/${row.original.id}`
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
                    onClick={() => handleStockClick(row.original)}
                    className="text-xs cursor-pointer"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Inventario
                  </DropdownMenuItem>

                  {["SUPER_ADMIN", "ADMIN", "GERENTE"].includes(
                    user?.role || ""
                  ) && (
                    <div>
                      <DropdownMenuItem
                        onClick={viewItem}
                        className="text-xs cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                    </div>
                  )}
                  <DropdownMenuItem
                    onClick={toggleItemStatus}
                    className="bg-slate-400 text-white focus:bg-slate-700 focus:text-white cursor-pointer text-xs"
                  >
                    <X className="mr-2 h-4 w-4" />
                    {row.original.status === "ACTIVE"
                      ? "Desactivar"
                      : "Activar"}
                  </DropdownMenuItem>
                  {["SUPER_ADMIN"].includes(user?.role || "") && (
                    <DropdownMenuItem
                      onClick={deleteItem}
                      className="bg-red-600 text-white focus:bg-red-700 focus:text-white cursor-pointer text-xs"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
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
    [handleStockClick, user?.role, router]
  );

  const table = useReactTable<Item>({
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
    <>
      <div className="w-full">
        <div className="flex items-center py-4">
          <Input
            placeholder="Filtrar por nombre..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
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
                    className={`${
                      row.original.status === "INACTIVE" ? "bg-muted" : ""
                    }`}
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
                    Sin resultados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} artículo(s)
            seleccionado(s).
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

      {/* Stock Modal */}
      {selectedItem && (
        <StockModal
          isOpen={isStockModalOpen}
          onClose={closeStockModal}
          itemName={selectedItem.name}
          stocks={selectedItem.stocks}
          onRefresh={refreshStockData}
          isRefreshing={isRefreshing}
        />
      )}
    </>
  );
}
