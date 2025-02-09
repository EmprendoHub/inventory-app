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

export default function ReportsPage() {
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async (formData: FormData) => {
    const result = await generateReportAction(formData);

    if (result.success && result.pdf) {
      // Create a link element
      const link = document.createElement("a");
      link.href = result.pdf;
      link.download = `report-${new Date().toISOString()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Handle error
      console.error(result.message);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Generar Reportes</h1>
      <form
        action={handleGenerateReport}
        className="space-y-4 bg-card p-6 rounded-lg shadow-md"
      >
        <div>
          <Label htmlFor="reportType">Tipo de Reporte</Label>
          <Select name="reportType" required>
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
        <div className="flex gap-8">
          <div>
            <Label htmlFor="startDate">Fecha de Inicio</Label>
            <Input type="date" name="startDate" required />
          </div>
          <div>
            <Label htmlFor="endDate">Fecha de Fin</Label>
            <Input type="date" name="endDate" required />
          </div>
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Generando..." : "Generar Reporte"}
        </Button>
      </form>

      {reportUrl && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Reporte Generado</h2>
          <a
            href={reportUrl}
            download="reporte.pdf"
            className="text-blue-600 hover:underline"
          >
            Descargar Reporte
          </a>
        </div>
      )}

      {error && (
        <div className="mt-6 text-red-600">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
