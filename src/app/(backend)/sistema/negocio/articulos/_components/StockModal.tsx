"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw } from "lucide-react";

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

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  stocks: Stock[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function StockModal({
  isOpen,
  onClose,
  itemName,
  stocks,
  onRefresh,
  isRefreshing = false,
}: StockModalProps) {
  const getTotalStock = () => {
    return stocks.reduce((sum, stock) => sum + stock.availableQty, 0);
  };

  const getWarehouseStatus = (status: string) => {
    const statusMap = {
      ACTIVE: { label: "Activo", color: "bg-green-100 text-green-800" },
      INACTIVE: { label: "Inactivo", color: "bg-gray-100 text-gray-800" },
      MAINTENANCE: {
        label: "Mantenimiento",
        color: "bg-yellow-100 text-yellow-800",
      },
      FULL: { label: "Lleno", color: "bg-red-100 text-red-800" },
    };
    return (
      statusMap[status as keyof typeof statusMap] || {
        label: status,
        color: "bg-gray-100 text-gray-800",
      }
    );
  };

  const getWarehouseType = (type: string) => {
    const typeMap = {
      PRINCIPAL: "Principal",
      SUCURSAL: "Sucursal",
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                Inventario por Almacén - {itemName}
              </DialogTitle>
              <div className="text-sm text-gray-600">
                Total disponible:{" "}
                <span className="font-semibold text-blue-600">
                  {getTotalStock()} unidades
                </span>
              </div>
            </div>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {isRefreshing ? "Actualizando..." : "Actualizar"}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="mt-4">
          {stocks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay stock registrado para este artículo</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Almacén</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead className="text-center">Stock Total</TableHead>
                  <TableHead className="text-center">Reservado</TableHead>
                  <TableHead className="text-center">Disponible</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((stock) => {
                  const warehouseStatus = getWarehouseStatus(
                    stock.warehouse?.status || "ACTIVE"
                  );
                  return (
                    <TableRow key={stock.id}>
                      <TableCell className="font-medium">
                        {stock.warehouse?.title || "Almacén no asignado"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {stock.warehouse?.code || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getWarehouseType(stock.warehouse?.type || "")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {stock.location || "Sin ubicación"}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {stock.quantity}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-orange-600 font-medium">
                          {stock.reservedQty}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-semibold ${
                            stock.availableQty > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {stock.availableQty}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${warehouseStatus.color}`}>
                          {warehouseStatus.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-gray-600">Total en Stock</p>
              <p className="text-lg font-semibold text-blue-600">
                {stocks.reduce((sum, stock) => sum + stock.quantity, 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Total Reservado</p>
              <p className="text-lg font-semibold text-orange-600">
                {stocks.reduce((sum, stock) => sum + stock.reservedQty, 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Total Disponible</p>
              <p className="text-lg font-semibold text-green-600">
                {getTotalStock()}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
