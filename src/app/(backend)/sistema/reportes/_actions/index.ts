"use server";

import prisma from "@/lib/db";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Register the autoTable plugin with jsPDF
declare module "jspdf" {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Helper for getting month name from date
const getMonthName = (date: Date) => {
  return format(date, "MMMM yyyy", { locale: es });
};

// Helper for formatting currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
};

// Helper for grouping data
const groupData = (data: any[], groupBy: string): Record<string, any[]> => {
  if (groupBy === "none" || !groupBy) {
    return { ungrouped: data };
  }

  return data.reduce((groups, item) => {
    let key;

    // Determine the grouping key based on the groupBy parameter
    switch (groupBy) {
      case "status":
        key = item.status;
        break;
      case "client":
        key = item.client?.name || "Sin cliente";
        break;
      case "date":
        key = format(new Date(item.createdAt || item.date), "yyyy-MM-dd");
        break;
      case "month":
        key = getMonthName(new Date(item.createdAt || item.date));
        break;
      case "warehouse":
        key = item.warehouse?.title || "Sin almacén";
        break;
      case "type":
        key = item.type;
        break;
      case "account":
        key = item.account?.name || "Sin cuenta";
        break;
      case "method":
        key = item.method;
        break;
      default:
        key = "other";
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
};

// Function to add charts to PDF
const addChart = (
  doc: jsPDF,
  data: any,
  reportType: string,
  groupBy: string
) => {
  // Add title for chart section
  doc.setFontSize(14);
  doc.text("Gráfico de Resumen", 14, (doc as any).lastAutoTable.finalY + 20);

  const groups = groupData(
    data,
    groupBy === "none" ? (reportType === "sales" ? "status" : "month") : groupBy
  );

  // Simple bar chart using rectangles
  const barWidth = 20; // Width of each bar
  const barGap = 10; // Gap between bars
  const maxBarHeight = 100; // Maximum bar height
  const startX = 20; // Starting X position
  let startY = (doc as any).lastAutoTable.finalY + 60; // Starting Y position

  let x = startX;

  // Find the maximum value for scaling
  let maxValue = 0;

  Object.entries(groups).forEach(([, items]: [string, any[]]) => {
    let value = 0;

    switch (reportType) {
      case "sales":
        value = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
        break;
      case "inventory":
        value = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        break;
      case "accounting":
        value = items.reduce((sum, item) => sum + (item.amount || 0), 0);
        break;
      case "payments":
        value = items.reduce((sum, item) => sum + (item.amount || 0), 0);
        break;
    }

    if (value > maxValue) maxValue = value;
  });

  // Draw bars and labels
  Object.entries(groups).forEach(([key, items]: [string, any[]]) => {
    let value = 0;

    switch (reportType) {
      case "sales":
        value = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
        break;
      case "inventory":
        value = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        break;
      case "accounting":
        value = items.reduce((sum, item) => sum + (item.amount || 0), 0);
        break;
      case "payments":
        value = items.reduce((sum, item) => sum + (item.amount || 0), 0);
        break;
    }

    // Calculate bar height proportional to value
    const barHeight = (value / maxValue) * maxBarHeight;

    // Draw bar
    doc.setFillColor(41, 98, 255); // Blue
    doc.rect(x, startY - barHeight, barWidth, barHeight, "F");

    // Draw value on top of bar
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const displayValue =
      reportType === "inventory" ? value.toString() : formatCurrency(value);
    doc.text(displayValue, x, startY - barHeight - 5, { align: "center" });

    // Draw key label below bar
    const displayKey = key.length > 10 ? key.substring(0, 10) + "..." : key;
    doc.text(displayKey, x + barWidth / 2, startY + 10, { align: "center" });

    // Move to next bar position
    x += barWidth + barGap;

    // If we're about to go off page, start a new row
    if (x > 180) {
      x = startX;
      startY += maxBarHeight + 50;
    }
  });

  // Return the Y position after the chart
  return startY + 30;
};

// Main report generation function
export const generateReportAction = async (formData: FormData) => {
  const reportType = formData.get("reportType") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const groupBy = (formData.get("groupBy") as string) || "none";
  const sortBy = (formData.get("sortBy") as string) || "";
  const includeChart = formData.get("includeChart") === "true";
  const showTotals = formData.get("showTotals") === "true";
  const selectedStatusJson = formData.get("selectedStatus") as string;
  const selectedFieldsJson = formData.get("selectedFields") as string;

  const selectedStatus = selectedStatusJson
    ? JSON.parse(selectedStatusJson)
    : [];
  const selectedFields = selectedFieldsJson
    ? JSON.parse(selectedFieldsJson)
    : [];

  // Ensure end date includes the entire day
  const adjustedEndDate = new Date(endDate);
  adjustedEndDate.setHours(23, 59, 59, 999);

  try {
    // Create a new PDF document
    const doc = new jsPDF();
    let finalY = 0;

    // Add header with company info
    doc.setFontSize(20);
    doc.text("Sistema de Gestión", 105, 15, { align: "center" });
    doc.setFontSize(14);

    let reportTitle = "";
    switch (reportType) {
      case "sales":
        reportTitle = "Reporte de Ventas";
        break;
      case "inventory":
        reportTitle = "Reporte de Inventario";
        break;
      case "accounting":
        reportTitle = "Reporte de Contabilidad";
        break;
      case "payments":
        reportTitle = "Reporte de Pagos";
        break;
    }

    doc.text(reportTitle, 105, 25, { align: "center" });
    doc.setFontSize(10);
    doc.text(
      `Período: ${format(new Date(startDate), "dd/MM/yyyy")} - ${format(
        new Date(endDate),
        "dd/MM/yyyy"
      )}`,
      105,
      35,
      { align: "center" }
    );
    doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 105, 40, {
      align: "center",
    });

    switch (reportType) {
      case "sales": {
        // Build query based on filters
        const whereCondition: any = {
          createdAt: {
            gte: new Date(startDate),
            lte: adjustedEndDate,
          },
        };

        // Apply status filter if provided
        if (selectedStatus.length > 0) {
          whereCondition.status = {
            in: selectedStatus,
          };
        }

        const data = await prisma.order.findMany({
          where: whereCondition,
          include: {
            client: true,
            orderItems: true,
            payments: true,
          },
          orderBy:
            sortBy === "date"
              ? { createdAt: "desc" }
              : sortBy === "amount"
              ? { totalAmount: "desc" }
              : { orderNo: "asc" },
        });

        if (data.length === 0) {
          return {
            success: false,
            message:
              "No se encontraron datos de ventas para el rango seleccionado",
          };
        }

        // Calculate overall totals
        const totalAmount = data.reduce(
          (sum, order) => sum + order.totalAmount,
          0
        );
        const averageOrderValue = totalAmount / data.length;
        const totalItems = data.reduce(
          (sum, order) => sum + order.orderItems.length,
          0
        );

        // Add summary section
        doc.setFontSize(12);
        doc.text("Resumen", 14, 50);
        doc.setFontSize(10);
        doc.text(`Total de Ventas: ${formatCurrency(totalAmount)}`, 14, 60);
        doc.text(`Número de Pedidos: ${data.length}`, 14, 65);
        doc.text(
          `Valor Promedio de Pedido: ${formatCurrency(averageOrderValue)}`,
          14,
          70
        );
        doc.text(`Total de Artículos Vendidos: ${totalItems}`, 14, 75);

        // Group data if needed
        const groupedData = groupData(data, groupBy);

        let yPosition = 85;

        // Process each group separately
        for (const [groupName, groupItems] of Object.entries(groupedData)) {
          if (groupBy !== "none") {
            // Add group header
            doc.setFontSize(12);
            doc.text(`Grupo: ${groupName}`, 14, yPosition);
            yPosition += 10;
          }

          // Define headers based on selected fields
          let headers: string[] = [];
          let dataFields: string[] = [];

          if (selectedFields.length === 0) {
            headers = ["No. Pedido", "Fecha", "Cliente", "Total", "Estado"];
            dataFields = [
              "orderNo",
              "createdAt",
              "client.name",
              "totalAmount",
              "status",
            ];
          } else {
            if (selectedFields.includes("id")) {
              headers.push("No. Pedido");
              dataFields.push("orderNo");
            }
            if (selectedFields.includes("createdAt")) {
              headers.push("Fecha");
              dataFields.push("createdAt");
            }
            if (selectedFields.includes("client")) {
              headers.push("Cliente");
              dataFields.push("client.name");
            }
            if (selectedFields.includes("totalAmount")) {
              headers.push("Total");
              dataFields.push("totalAmount");
            }
            if (selectedFields.includes("status")) {
              headers.push("Estado");
              dataFields.push("status");
            }
            if (selectedFields.includes("paymentStatus")) {
              headers.push("Estado de Pago");
              dataFields.push("paymentStatus");
            }
            if (selectedFields.includes("items")) {
              headers.push("Artículos");
              dataFields.push("orderItems.length");
            }
            if (selectedFields.includes("paymentMethod")) {
              headers.push("Método de Pago");
              dataFields.push("paymentMethod");
            }
            if (selectedFields.includes("notes")) {
              headers.push("Notas");
              dataFields.push("notes");
            }
            if (selectedFields.includes("itemDetails")) {
              headers.push("Detalle de Artículos");
              dataFields.push("itemDetails");
            }
          }

          // Transform data for table
          const tableData = groupItems.map((item) => {
            const rowData: any[] = [];
            for (const field of dataFields) {
              if (field === "createdAt") {
                rowData.push(format(new Date(item.createdAt), "dd/MM/yyyy"));
              } else if (field === "totalAmount") {
                rowData.push(formatCurrency(item.totalAmount));
              } else if (field === "client.name") {
                rowData.push(item.client?.name || "Sin cliente");
              } else if (field === "orderItems.length") {
                rowData.push(item.orderItems?.length || 0);
              } else if (field === "paymentStatus") {
                const totalPaid = (item.payments || []).reduce(
                  (sum: number, payment: any) => sum + payment.amount,
                  0
                );
                const isPaid = totalPaid >= item.totalAmount;
                rowData.push(isPaid ? "Pagado" : "Pendiente");
              } else if (field === "paymentMethod") {
                const methods = item.payments
                  ?.map((p: any) => p.method)
                  .filter(Boolean);
                rowData.push(
                  methods?.length
                    ? Array.from(new Set(methods)).join(", ")
                    : "N/A"
                );
              } else if (field === "notes") {
                rowData.push(item.notes || "");
              } else if (field === "itemDetails") {
                const itemDetails = (item.orderItems || [])
                  .map(
                    (oi: any) =>
                      `${oi.quantity}x ${
                        oi.product?.name || "Producto"
                      } (${formatCurrency(oi.price)})`
                  )
                  .join(", ");
                rowData.push(itemDetails);
              } else {
                // Handle nested properties using a helper function
                const getValue = (obj: any, path: string) => {
                  const parts = path.split(".");
                  let value = obj;
                  for (const part of parts) {
                    if (value == null) return "";
                    value = value[part];
                  }
                  return value;
                };
                rowData.push(getValue(item, field));
              }
            }
            return rowData;
          });

          // Add group subtotal
          const groupTotal = (groupItems as any[]).reduce(
            (sum, order) => sum + order.totalAmount,
            0
          );

          // Add table for this group
          autoTable(doc, {
            startY: yPosition,
            head: [headers],
            body: tableData,
            theme: "grid",
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 98, 255] },
            columnStyles: {
              // Set wider column for item details if present
              [headers.indexOf("Detalle de Artículos")]: { cellWidth: 60 },
            },
            // Handle very long content in cells
            didDrawCell: (data) => {
              // Adjust column width dynamically if needed
              if (
                data.column.index === headers.indexOf("Detalle de Artículos") &&
                data.cell.height > 10
              ) {
                doc.setFontSize(7); // Smaller font for detailed content
              }
            },
          });

          yPosition = (doc as any).lastAutoTable.finalY + 5;

          // Add group subtotal if showing totals
          if (showTotals && groupBy !== "none") {
            doc.setFontSize(10);
            doc.text(
              `Subtotal ${groupName}: ${formatCurrency(groupTotal)}`,
              14,
              yPosition
            );
            yPosition += 10;
          }

          // Add space between groups
          if (groupBy !== "none") {
            yPosition += 5;
          }

          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
        }

        // Add grand total
        if (showTotals) {
          doc.setFontSize(12);
          doc.text(
            `Total General: ${formatCurrency(totalAmount)}`,
            14,
            yPosition
          );
          yPosition += 15;
        }

        // Add chart if requested
        if (includeChart) {
          finalY = addChart(doc, data, reportType, groupBy);
        } else {
          finalY = yPosition;
        }

        break;
      }

      case "inventory": {
        // Build query based on filters
        const whereCondition: any = {
          updatedAt: {
            gte: new Date(startDate),
            lte: adjustedEndDate,
          },
        };

        // Apply filters if provided
        if (selectedStatus.length > 0) {
          whereCondition.status = {
            in: selectedStatus,
          };
        }

        const data = await prisma.stock.findMany({
          where: whereCondition,
          include: {
            item: true,
            warehouse: true,
          },
          orderBy:
            sortBy === "quantity"
              ? { quantity: "desc" }
              : sortBy === "name"
              ? { item: { name: "asc" } }
              : { id: "asc" },
        });

        if (data.length === 0) {
          return {
            success: false,
            message:
              "No se encontraron datos de inventario para el rango seleccionado",
          };
        }

        // Calculate totals
        const totalQuantity = data.reduce(
          (sum, stock) => sum + (stock.quantity || 0),
          0
        );
        const totalAvailable = data.reduce(
          (sum, stock) => sum + (stock.availableQty || 0),
          0
        );
        const totalReserved = data.reduce(
          (sum, stock) => sum + (stock.reservedQty || 0),
          0
        );

        // Add summary section
        doc.setFontSize(12);
        doc.text("Resumen de Inventario", 14, 50);
        doc.setFontSize(10);
        doc.text(`Total de Unidades: ${totalQuantity}`, 14, 60);
        doc.text(`Unidades Disponibles: ${totalAvailable}`, 14, 65);
        doc.text(`Unidades Reservadas: ${totalReserved}`, 14, 70);

        // Group data if needed
        const groupedData = groupData(data, groupBy);

        let yPosition = 85;

        // Process each group
        for (const [groupName, groupItems] of Object.entries(groupedData)) {
          if (groupBy !== "none") {
            // Add group header
            doc.setFontSize(12);
            doc.text(`Grupo: ${groupName}`, 14, yPosition);
            yPosition += 10;
          }

          // Define headers based on selected fields
          let headers: string[] = [];
          let dataFields: string[] = [];

          if (selectedFields.length === 0) {
            headers = [
              "Producto",
              "Almacén",
              "Cantidad",
              "Disponible",
              "Reservado",
            ];
            dataFields = [
              "product.name",
              "warehouse.title",
              "quantity",
              "availableQty",
              "reservedQty",
            ];
          } else {
            if (selectedFields.includes("product")) {
              headers.push("Producto");
              dataFields.push("product.name");
            }
            if (selectedFields.includes("sku")) {
              headers.push("SKU");
              dataFields.push("product.sku");
            }
            if (selectedFields.includes("warehouse")) {
              headers.push("Almacén");
              dataFields.push("warehouse.title");
            }
            if (selectedFields.includes("quantity")) {
              headers.push("Cantidad");
              dataFields.push("quantity");
            }
            if (selectedFields.includes("available")) {
              headers.push("Disponible");
              dataFields.push("availableQty");
            }
            if (selectedFields.includes("reserved")) {
              headers.push("Reservado");
              dataFields.push("reservedQty");
            }
            if (selectedFields.includes("location")) {
              headers.push("Ubicación");
              dataFields.push("location");
            }
            if (selectedFields.includes("lastUpdate")) {
              headers.push("Última Actualización");
              dataFields.push("updatedAt");
            }
          }

          // Transform data for table
          const tableData = groupItems.map((item) => {
            const rowData: any[] = [];
            for (const field of dataFields) {
              if (field === "updatedAt") {
                rowData.push(format(new Date(item.updatedAt), "dd/MM/yyyy"));
              } else if (field === "product.name") {
                rowData.push(item.product?.name || "Producto desconocido");
              } else if (field === "product.sku") {
                rowData.push(item.product?.sku || "Sin SKU");
              } else if (field === "warehouse.title") {
                rowData.push(item.warehouse?.title || "Sin almacén");
              } else if (field === "location") {
                rowData.push(item.location || "No especificado");
              } else {
                // Handle nested properties
                const getValue = (obj: any, path: string) => {
                  const parts = path.split(".");
                  let value = obj;
                  for (const part of parts) {
                    if (value == null) return "";
                    value = value[part];
                  }
                  return value;
                };
                rowData.push(getValue(item, field));
              }
            }
            return rowData;
          });

          // Add group subtotal for quantity
          const groupTotalQty = groupItems.reduce(
            (sum, stock) => sum + (stock.quantity || 0),
            0
          );

          // Add table for this group
          autoTable(doc, {
            startY: yPosition,
            head: [headers],
            body: tableData,
            theme: "grid",
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 98, 255] },
          });

          yPosition = (doc as any).lastAutoTable.finalY + 5;

          // Add group subtotal if showing totals
          if (showTotals && groupBy !== "none") {
            doc.setFontSize(10);
            doc.text(
              `Subtotal ${groupName}: ${groupTotalQty} unidades`,
              14,
              yPosition
            );
            yPosition += 10;
          }

          // Add space between groups
          if (groupBy !== "none") {
            yPosition += 5;
          }

          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
        }

        // Add grand total
        if (showTotals) {
          doc.setFontSize(12);
          doc.text(`Total General: ${totalQuantity} unidades`, 14, yPosition);
          yPosition += 15;
        }

        // Add chart if requested
        if (includeChart) {
          finalY = addChart(doc, data, reportType, groupBy);
        } else {
          finalY = yPosition;
        }

        break;
      }

      case "accounting": {
        // Build query based on filters
        const whereCondition: any = {
          date: {
            gte: new Date(startDate),
            lte: adjustedEndDate,
          },
        };

        // Apply type filter if provided
        if (selectedStatus.length > 0) {
          whereCondition.type = {
            in: selectedStatus,
          };
        }

        const data = await prisma.transaction.findMany({
          where: whereCondition,
          include: {
            account: true,
          },
          orderBy:
            sortBy === "date"
              ? { date: "desc" }
              : sortBy === "amount"
              ? { amount: "desc" }
              : { id: "asc" },
        });

        if (data.length === 0) {
          return {
            success: false,
            message:
              "No se encontraron datos de contabilidad para el rango seleccionado",
          };
        }

        // Calculate totals
        const deposits = data.filter((t) => t.type === "DEPOSITO");
        const withdrawals = data.filter((t) => t.type === "RETIRO");
        const totalDeposits = deposits.reduce(
          (sum, t) => sum + (t.amount || 0),
          0
        );
        const totalWithdrawals = withdrawals.reduce(
          (sum, t) => sum + (t.amount || 0),
          0
        );
        const balance = totalDeposits - totalWithdrawals;

        // Add summary section
        doc.setFontSize(12);
        doc.text("Resumen de Contabilidad", 14, 50);
        doc.setFontSize(10);
        doc.text(
          `Total de Depósitos: ${formatCurrency(totalDeposits)}`,
          14,
          60
        );
        doc.text(
          `Total de Retiros: ${formatCurrency(totalWithdrawals)}`,
          14,
          65
        );
        doc.text(`Balance: ${formatCurrency(balance)}`, 14, 70);
        doc.text(`Número de Transacciones: ${data.length}`, 14, 75);

        // Group data if needed
        const groupedData = groupData(data, groupBy);

        let yPosition = 85;

        // Process each group
        for (const [groupName, groupItems] of Object.entries(groupedData)) {
          if (groupBy !== "none") {
            // Add group header
            doc.setFontSize(12);
            doc.text(`Grupo: ${groupName}`, 14, yPosition);
            yPosition += 10;
          }

          // Define headers based on selected fields
          let headers: string[] = [];
          let dataFields: string[] = [];

          if (selectedFields.length === 0) {
            headers = ["Fecha", "Tipo", "Concepto", "Cuenta", "Monto"];
            dataFields = ["date", "type", "concept", "account.name", "amount"];
          } else {
            if (selectedFields.includes("date")) {
              headers.push("Fecha");
              dataFields.push("date");
            }
            if (selectedFields.includes("type")) {
              headers.push("Tipo");
              dataFields.push("type");
            }
            if (selectedFields.includes("concept")) {
              headers.push("Concepto");
              dataFields.push("concept");
            }
            if (selectedFields.includes("account")) {
              headers.push("Cuenta");
              dataFields.push("account.name");
            }
            if (selectedFields.includes("amount")) {
              headers.push("Monto");
              dataFields.push("amount");
            }
            if (selectedFields.includes("reference")) {
              headers.push("Referencia");
              dataFields.push("reference");
            }
            if (selectedFields.includes("method")) {
              headers.push("Método");
              dataFields.push("method");
            }
          }

          // Transform data for table
          const tableData = groupItems.map((item) => {
            const rowData: any[] = [];
            for (const field of dataFields) {
              if (field === "date") {
                rowData.push(format(new Date(item.date), "dd/MM/yyyy"));
              } else if (field === "amount") {
                rowData.push(formatCurrency(item.amount));
              } else if (field === "type") {
                rowData.push(item.type === "DEPOSITO" ? "Depósito" : "Retiro");
              } else if (field === "account.name") {
                rowData.push(item.account?.name || "Sin cuenta");
              } else {
                // Handle nested properties
                const getValue = (obj: any, path: string) => {
                  const parts = path.split(".");
                  let value = obj;
                  for (const part of parts) {
                    if (value == null) return "";
                    value = value[part];
                  }
                  return value;
                };
                rowData.push(getValue(item, field));
              }
            }
            return rowData;
          });

          // Calculate group subtotals
          const groupDeposits = groupItems.filter((t) => t.type === "DEPOSITO");
          const groupWithdrawals = groupItems.filter(
            (t) => t.type === "RETIRO"
          );
          const groupTotalDeposits = groupDeposits.reduce(
            (sum, t) => sum + (t.amount || 0),
            0
          );
          const groupTotalWithdrawals = groupWithdrawals.reduce(
            (sum, t) => sum + (t.amount || 0),
            0
          );
          const groupBalance = groupTotalDeposits - groupTotalWithdrawals;

          // Add table for this group
          autoTable(doc, {
            startY: yPosition,
            head: [headers],
            body: tableData,
            theme: "grid",
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 98, 255] },
          });

          yPosition = (doc as any).lastAutoTable.finalY + 5;

          // Add group subtotal if showing totals
          if (showTotals && groupBy !== "none") {
            doc.setFontSize(10);
            doc.text(
              `Depósitos ${groupName}: ${formatCurrency(groupTotalDeposits)}`,
              14,
              yPosition
            );
            yPosition += 5;
            doc.text(
              `Retiros ${groupName}: ${formatCurrency(groupTotalWithdrawals)}`,
              14,
              yPosition
            );
            yPosition += 5;
            doc.text(
              `Balance ${groupName}: ${formatCurrency(groupBalance)}`,
              14,
              yPosition
            );
            yPosition += 10;
          }

          // Add space between groups
          if (groupBy !== "none") {
            yPosition += 5;
          }

          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
        }

        // Add grand total
        if (showTotals) {
          doc.setFontSize(12);
          doc.text(`Balance Total: ${formatCurrency(balance)}`, 14, yPosition);
          yPosition += 15;
        }

        // Add chart if requested
        if (includeChart) {
          finalY = addChart(doc, data, reportType, groupBy);
        } else {
          finalY = yPosition;
        }

        break;
      }

      case "payments": {
        // Build query based on filters
        const whereCondition: any = {
          createdAt: {
            gte: new Date(startDate),
            lte: adjustedEndDate,
          },
        };

        // Apply status filter if provided
        if (selectedStatus.length > 0) {
          whereCondition.status = {
            in: selectedStatus,
          };
        }

        const data = await prisma.payment.findMany({
          where: whereCondition,
          include: {
            order: {
              include: {
                client: true,
              },
            },
          },
          orderBy:
            sortBy === "date"
              ? { createdAt: "desc" }
              : sortBy === "amount"
              ? { amount: "desc" }
              : { id: "asc" },
        });

        if (data.length === 0) {
          return {
            success: false,
            message:
              "No se encontraron datos de pagos para el rango seleccionado",
          };
        }

        // Calculate totals
        const totalAmount = data.reduce(
          (sum, payment) => sum + payment.amount,
          0
        );
        const completedPayments = data.filter(
          (p) => p.status === "COMPLETED" || p.status === "Completed"
        );
        const pendingPayments = data.filter(
          (p) => p.status === "PENDING" || p.status === "Pending"
        );
        const completedAmount = completedPayments.reduce(
          (sum, p) => sum + p.amount,
          0
        );
        const pendingAmount = pendingPayments.reduce(
          (sum, p) => sum + p.amount,
          0
        );

        // Add summary section
        doc.setFontSize(12);
        doc.text("Resumen de Pagos", 14, 50);
        doc.setFontSize(10);
        doc.text(`Total de Pagos: ${formatCurrency(totalAmount)}`, 14, 60);
        doc.text(
          `Pagos Completados: ${formatCurrency(completedAmount)}`,
          14,
          65
        );
        doc.text(`Pagos Pendientes: ${formatCurrency(pendingAmount)}`, 14, 70);
        doc.text(`Número de Pagos: ${data.length}`, 14, 75);

        // Group data if needed
        const groupedData = groupData(data, groupBy);

        let yPosition = 85;

        // Process each group
        for (const [groupName, groupItems] of Object.entries(groupedData)) {
          if (groupBy !== "none") {
            // Add group header
            doc.setFontSize(12);
            doc.text(`Grupo: ${groupName}`, 14, yPosition);
            yPosition += 10;
          }

          // Define headers based on selected fields
          let headers: string[] = [];
          let dataFields: string[] = [];

          if (selectedFields.length === 0) {
            headers = [
              "Fecha",
              "No. Pedido",
              "Cliente",
              "Método",
              "Monto",
              "Estado",
            ];
            dataFields = [
              "createdAt",
              "order.orderNo",
              "order.client.name",
              "method",
              "amount",
              "status",
            ];
          } else {
            if (selectedFields.includes("date")) {
              headers.push("Fecha");
              dataFields.push("createdAt");
            }
            if (selectedFields.includes("orderNo")) {
              headers.push("No. Pedido");
              dataFields.push("order.orderNo");
            }
            if (selectedFields.includes("client")) {
              headers.push("Cliente");
              dataFields.push("order.client.name");
            }
            if (selectedFields.includes("method")) {
              headers.push("Método");
              dataFields.push("method");
            }
            if (selectedFields.includes("amount")) {
              headers.push("Monto");
              dataFields.push("amount");
            }
            if (selectedFields.includes("status")) {
              headers.push("Estado");
              dataFields.push("status");
            }
            if (selectedFields.includes("reference")) {
              headers.push("Referencia");
              dataFields.push("reference");
            }
          }

          // Transform data for table
          const tableData = groupItems.map((item) => {
            const rowData: any[] = [];
            for (const field of dataFields) {
              if (field === "createdAt") {
                rowData.push(format(new Date(item.createdAt), "dd/MM/yyyy"));
              } else if (field === "amount") {
                rowData.push(formatCurrency(item.amount));
              } else if (field === "order.client.name") {
                rowData.push(item.order?.client?.name || "Sin cliente");
              } else if (field === "order.orderNo") {
                rowData.push(item.order?.orderNo || "");
              } else if (field === "status") {
                rowData.push(
                  item.status === "COMPLETED" || item.status === "Completed"
                    ? "Completado"
                    : "Pendiente"
                );
              } else {
                // Handle nested properties
                const getValue = (obj: any, path: string) => {
                  const parts = path.split(".");
                  let value = obj;
                  for (const part of parts) {
                    if (value == null) return "";
                    value = value[part];
                  }
                  return value;
                };
                rowData.push(getValue(item, field));
              }
            }
            return rowData;
          });

          // Calculate group totals
          const groupTotal = groupItems.reduce(
            (sum, payment) => sum + payment.amount,
            0
          );

          // Add table for this group
          autoTable(doc, {
            startY: yPosition,
            head: [headers],
            body: tableData,
            theme: "grid",
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 98, 255] },
          });

          yPosition = (doc as any).lastAutoTable.finalY + 5;

          // Add group subtotal if showing totals
          if (showTotals && groupBy !== "none") {
            doc.setFontSize(10);
            doc.text(
              `Subtotal ${groupName}: ${formatCurrency(groupTotal)}`,
              14,
              yPosition
            );
            yPosition += 10;
          }

          // Add space between groups
          if (groupBy !== "none") {
            yPosition += 5;
          }

          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
        }

        // Add grand total
        if (showTotals) {
          doc.setFontSize(12);
          doc.text(
            `Total de Pagos: ${formatCurrency(totalAmount)}`,
            14,
            yPosition
          );
          yPosition += 15;
        }

        // Add chart if requested
        if (includeChart) {
          finalY = addChart(doc, data, reportType, groupBy);
        } else {
          finalY = yPosition;
          console.log("finalY", finalY);
        }

        break;
      }
    }

    // Save the PDF
    const pdfData = doc.output("arraybuffer");
    const buffer = Buffer.from(pdfData);
    const pdfBase64 = doc.output("datauristring");

    return {
      success: true,
      message: "Reporte generado exitosamente",
      data: buffer.toString("base64"),
      pdf: pdfBase64,
      reportType,
    };
  } catch (error) {
    console.error("Error generating report:", error);
    return {
      success: false,
      message: "Error al generar el reporte",
    };
  }
};
