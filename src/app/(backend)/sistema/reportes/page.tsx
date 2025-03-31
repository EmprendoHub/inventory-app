"use client";

import React, { useState } from "react";
import { generateReportAction } from "./_actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
// import { toast } from "@/components/ui/use-toast";

export default function ReportsPage() {
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [reportType, setReportType] = useState<string>("");
  const [groupBy, setGroupBy] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("");
  const [includeChart, setIncludeChart] = useState(false);
  const [showTotals, setShowTotals] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  // Dynamic field options based on report type
  const getFieldOptions = () => {
    switch (reportType) {
      case "sales":
        return [
          { id: "id", label: "ID" },
          { id: "createdAt", label: "Fecha" },
          { id: "client", label: "Cliente" },
          { id: "total", label: "Total" },
          { id: "status", label: "Estado" },
          { id: "discount", label: "Descuento" },
        ];
      case "inventory":
        return [
          { id: "id", label: "ID" },
          { id: "item", label: "Artículo" },
          { id: "warehouse", label: "Almacén" },
          { id: "quantity", label: "Cantidad" },
          { id: "reservedQty", label: "Cantidad Reservada" },
          { id: "availableQty", label: "Cantidad Disponible" },
          { id: "updatedAt", label: "Última Actualización" },
        ];
      case "accounting":
        return [
          { id: "id", label: "ID" },
          { id: "date", label: "Fecha" },
          { id: "account", label: "Cuenta" },
          { id: "amount", label: "Monto" },
          { id: "type", label: "Tipo" },
          { id: "reference", label: "Referencia" },
        ];
      case "payments":
        return [
          { id: "id", label: "ID" },
          { id: "createdAt", label: "Fecha" },
          { id: "method", label: "Método" },
          { id: "amount", label: "Monto" },
          { id: "status", label: "Estado" },
          { id: "reference", label: "Referencia" },
        ];
      default:
        return [];
    }
  };

  // Dynamic group by options based on report type
  const getGroupByOptions = () => {
    switch (reportType) {
      case "sales":
        return [
          { id: "none", label: "Ninguno" },
          { id: "status", label: "Por Estado" },
          { id: "client", label: "Por Cliente" },
          { id: "date", label: "Por Fecha (Día)" },
          { id: "month", label: "Por Mes" },
        ];
      case "inventory":
        return [
          { id: "none", label: "Ninguno" },
          { id: "warehouse", label: "Por Almacén" },
          { id: "status", label: "Por Estado de Stock" },
        ];
      case "accounting":
        return [
          { id: "none", label: "Ninguno" },
          { id: "type", label: "Por Tipo" },
          { id: "account", label: "Por Cuenta" },
          { id: "month", label: "Por Mes" },
        ];
      case "payments":
        return [
          { id: "none", label: "Ninguno" },
          { id: "status", label: "Por Estado" },
          { id: "method", label: "Por Método de Pago" },
          { id: "month", label: "Por Mes" },
        ];
      default:
        return [{ id: "none", label: "Ninguno" }];
    }
  };

  // Dynamic status options based on report type
  const getStatusOptions = () => {
    switch (reportType) {
      case "sales":
        return [
          { id: "PENDIENTE", label: "Pendiente" },
          { id: "PROCESANDO", label: "Procesando" },
          { id: "PAGADO", label: "Pagado" },
          { id: "ENVIADO", label: "Enviado" },
          { id: "ENTREGADO", label: "Entregado" },
          { id: "COMPLETADO", label: "Completado" },
          { id: "CANCELADO", label: "Cancelado" },
        ];
      case "inventory":
        return [
          { id: "ACTIVE", label: "Activo" },
          { id: "INACTIVE", label: "Inactivo" },
          { id: "DISCONTINUED", label: "Descontinuado" },
          { id: "OUT_OF_STOCK", label: "Sin Stock" },
          { id: "LOW_STOCK", label: "Stock Bajo" },
        ];
      case "accounting":
        return [
          { id: "DEPOSITO", label: "Depósito" },
          { id: "RETIRO", label: "Retiro" },
        ];
      case "payments":
        return [
          { id: "COMPLETED", label: "Completado" },
          { id: "PENDING", label: "Pendiente" },
          { id: "FAILED", label: "Fallido" },
        ];
      default:
        return [];
    }
  };

  // Handle field selection
  const handleFieldSelection = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  // Handle status selection
  const handleStatusSelection = (status: string) => {
    setSelectedStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  // Reset options when report type changes
  const handleReportTypeChange = (value: string) => {
    setReportType(value);
    setGroupBy("none");
    setSortBy("");
    setSelectedFields([]);
    setSelectedStatus([]);

    // Set default fields based on report type
    const defaultFields = getFieldOptions().map((field) => field.id);
    setSelectedFields(defaultFields);
  };

  const handleGenerateReport = async (formData: FormData) => {
    try {
      setSending(true);
      setIsLoading(true);
      setError(null);

      // Add additional options to formData
      formData.append("groupBy", groupBy);
      formData.append("sortBy", sortBy);
      formData.append("includeChart", String(includeChart));
      formData.append("showTotals", String(showTotals));
      formData.append("selectedStatus", JSON.stringify(selectedStatus));
      formData.append("selectedFields", JSON.stringify(selectedFields));

      const result = await generateReportAction(formData);

      if (result.success && result.pdf) {
        setReportUrl(result.pdf);

        // Create a link element to download the PDF
        const link = document.createElement("a");
        link.href = result.pdf;
        link.download = `${reportType}-${new Date().toISOString()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // toast({
        //   title: "Reporte generado con éxito",
        //   description: "El reporte ha sido descargado automáticamente",
        //   variant: "default",
        // });
      } else {
        setError(result.message || "Error al generar el reporte");
        // toast({
        //   title: "Error",
        //   description: result.message || "Error al generar el reporte",
        //   variant: "destructive",
        // });
      }
    } catch (err) {
      console.error("Error generating report:", err);
      setError("Error inesperado al generar el reporte");
      // toast({
      //   title: "Error",
      //   description: "Error inesperado al generar el reporte",
      //   variant: "destructive",
      // });
    } finally {
      setSending(false);
      setIsLoading(false);
    }
  };

  return (
    <section className="container mx-auto py-6">
      {sending && (
        <div className="fixed top-0 left-0 z-50 flex flex-col items-center justify-center w-screen h-screen bg-black/50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <h3 className="text-xl font-medium mb-4">Generando reporte...</h3>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Generar Reportes</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración del Reporte</CardTitle>
          <CardDescription>
            Personaliza los parámetros para generar tu reporte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleGenerateReport} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="reportType">Tipo de Reporte</Label>
                <Select
                  name="reportType"
                  value={reportType}
                  onValueChange={handleReportTypeChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo de reporte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Ventas</SelectItem>
                    <SelectItem value="inventory">Inventario</SelectItem>
                    <SelectItem value="accounting">Contabilidad</SelectItem>
                    <SelectItem value="payments">Pagos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reportType && (
                <div>
                  <Label htmlFor="groupBy">Agrupar por</Label>
                  <Select
                    name="groupBy"
                    value={groupBy}
                    onValueChange={setGroupBy}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                    <SelectContent>
                      {getGroupByOptions().map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex gap-6">
              <div className="w-1/2">
                <Label htmlFor="startDate">Fecha de Inicio</Label>
                <Input type="date" name="startDate" required />
              </div>
              <div className="w-1/2">
                <Label htmlFor="endDate">Fecha de Fin</Label>
                <Input type="date" name="endDate" required />
              </div>
            </div>

            {reportType && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="options">
                  <AccordionTrigger>Opciones Avanzadas</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <Label>Filtrar por Estado</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {getStatusOptions().map((status) => (
                            <div
                              key={status.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`status-${status.id}`}
                                checked={selectedStatus.includes(status.id)}
                                onCheckedChange={() =>
                                  handleStatusSelection(status.id)
                                }
                              />
                              <label
                                htmlFor={`status-${status.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {status.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label>Columnas a Incluir</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {getFieldOptions().map((field) => (
                            <div
                              key={field.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`field-${field.id}`}
                                checked={selectedFields.includes(field.id)}
                                onCheckedChange={() =>
                                  handleFieldSelection(field.id)
                                }
                              />
                              <label
                                htmlFor={`field-${field.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {field.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="include-chart"
                          checked={includeChart}
                          onCheckedChange={(checked) =>
                            setIncludeChart(checked as boolean)
                          }
                        />
                        <label
                          htmlFor="include-chart"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Incluir gráfico
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="show-totals"
                          checked={showTotals}
                          onCheckedChange={(checked) =>
                            setShowTotals(checked as boolean)
                          }
                        />
                        <label
                          htmlFor="show-totals"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Mostrar totales y subtotales
                        </label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !reportType}
            >
              {isLoading ? "Generando..." : "Generar Reporte"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
          <p>{error}</p>
        </div>
      )}

      {reportUrl && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Reporte Generado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Button asChild>
                <a
                  href={reportUrl}
                  download={`${reportType}-${new Date().toISOString()}.pdf`}
                  className="flex items-center gap-2"
                >
                  Descargar Reporte
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
