"use client";

import React, { useState } from "react";
import {
  DollarSign,
  Calculator,
  TrendingUp,
  FileText,
  Banknote,
  ShoppingCart,
  Clock,
  CheckCircle,
  AlertTriangle,
  Printer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CashReconciliationProps {
  sessionData: {
    id: string;
    startTime: Date;
    endTime?: Date;
    openingCash: number;
    expectedCash: number;
    orders: Array<{
      id: string;
      total: number;
      paymentMethod: string;
      customerName?: string;
      createdAt: Date;
      items: Array<{
        name: string;
        quantity: number;
        price: number;
      }>;
    }>;
  };
  onCloseSession: (
    closingCash: number,
    notes?: string
  ) => Promise<{ success: boolean; cashDifference?: number; error?: string }>;
  onPrintReport: (reportData: any) => void;
}

export default function CashReconciliation({
  sessionData,
  onCloseSession,
  onPrintReport,
}: CashReconciliationProps) {
  const [closingCash, setClosingCash] = useState(0);
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate session statistics
  const totalSales = sessionData.orders.reduce(
    (sum, order) => sum + order.total,
    0
  );
  const totalOrders = sessionData.orders.length;
  const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Payment method breakdown
  const paymentBreakdown = sessionData.orders.reduce((acc, order) => {
    acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + order.total;
    return acc;
  }, {} as Record<string, number>);

  // Cash transactions only
  const cashSales = paymentBreakdown.CASH || 0;
  const expectedCashEnd = sessionData.openingCash + cashSales;
  const cashDifference = closingCash - expectedCashEnd;

  const handleCloseSession = async () => {
    setIsProcessing(true);
    try {
      const result = await onCloseSession(closingCash, notes);
      if (result.success) {
        // Session closed successfully
      } else {
        console.error("Error closing session:", result.error);
      }
    } catch (error) {
      console.error("Error closing session:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateReport = () => {
    const reportData = {
      session: sessionData,
      totals: {
        totalSales,
        totalOrders,
        averageOrder,
        cashDifference,
        expectedCash: expectedCashEnd,
        actualCash: closingCash,
      },
      paymentBreakdown,
    };
    onPrintReport(reportData);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Cierre de Sesión</h1>
          <p className="text-gray-600 mt-2">
            Reconciliación de efectivo y reporte del día
          </p>
        </div>

        {/* Session Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Información de Sesión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Sesión ID</p>
                <p className="font-bold">{sessionData.id.slice(-8)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Inicio</p>
                <p className="font-bold">
                  {sessionData.startTime.toLocaleTimeString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duración</p>
                <p className="font-bold">
                  {Math.floor(
                    (Date.now() - sessionData.startTime.getTime()) /
                      (1000 * 60 * 60)
                  )}
                  h
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <Badge variant="default">Activa</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Resumen de Ventas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">
                    ${totalSales.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">Ventas Totales</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <ShoppingCart className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">
                    {totalOrders}
                  </p>
                  <p className="text-sm text-gray-600">Órdenes</p>
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Calculator className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-xl font-bold text-purple-600">
                  ${averageOrder.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">Promedio por Orden</p>
              </div>
            </CardContent>
          </Card>

          {/* Cash Count */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Conteo de Efectivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Apertura</p>
                    <p className="text-lg font-bold text-green-600">
                      ${sessionData.openingCash.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Esperado</p>
                    <p className="text-lg font-bold text-blue-600">
                      ${expectedCashEnd.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Contado</p>
                    <p className="text-lg font-bold text-purple-600">
                      ${closingCash.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Efectivo Contado
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={closingCash}
                    onChange={(e) =>
                      setClosingCash(Number(e.target.value) || 0)
                    }
                    className="w-full p-3 border rounded-lg text-lg text-center"
                    placeholder="0.00"
                  />
                </div>

                {closingCash > 0 && (
                  <div
                    className={`p-3 rounded-lg text-center ${
                      Math.abs(cashDifference) < 0.01
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {Math.abs(cashDifference) < 0.01 ? (
                      <CheckCircle className="h-5 w-5 mx-auto mb-1" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 mx-auto mb-1" />
                    )}
                    <p className="font-semibold">
                      Diferencia: ${cashDifference.toFixed(2)}
                    </p>
                    {Math.abs(cashDifference) < 0.01 && (
                      <p className="text-sm">¡Cuadre perfecto!</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes and Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Notas y Acciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Notas adicionales (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones del turno..."
                className="w-full p-3 border rounded-lg"
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={generateReport}
                variant="outline"
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Ver Reporte
              </Button>
              <Button
                onClick={generateReport}
                variant="outline"
                className="flex-1"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button
                onClick={handleCloseSession}
                disabled={isProcessing || closingCash === 0}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Cerrar Sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
