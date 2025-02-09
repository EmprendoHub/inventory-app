"use server";

import prisma from "@/lib/db";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateReportAction = async (formData: FormData) => {
  const reportType = formData.get("reportType") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  try {
    switch (reportType) {
      case "sales": {
        const data = await prisma.order.findMany({
          where: {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
          include: {
            client: true,
            orderItems: true,
          },
        });

        if (data.length === 0) {
          return {
            success: false,
            message: "No sales data found for the selected date range",
          };
        }

        const doc = new jsPDF();
        doc.text(`Reporte de Ventas`, 10, 10);

        const headers = ["ID", "Fecha", "Cliente", "Total", "Estado"];
        const formattedData = data.map((order) => [
          order.id,
          new Date(order.createdAt).toLocaleDateString(),
          order.client.name,
          order.orderItems.reduce((sum, item) => sum + item.price, 0),
          order.status,
        ]);

        autoTable(doc, {
          head: [headers],
          body: formattedData,
        });

        const pdfBase64 = doc.output("datauristring");

        return {
          success: true,
          message: "Sales report generated successfully",
          pdf: pdfBase64,
        };
      }

      case "inventory": {
        const data = await prisma.stock.findMany({
          where: {
            updatedAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
          include: {
            item: true,
            warehouse: true,
          },
        });

        if (data.length === 0) {
          return {
            success: false,
            message: "No inventory data found for the selected date range",
          };
        }

        const doc = new jsPDF();
        doc.text(`Reporte de Inventario`, 10, 10);

        const headers = [
          "ID",
          "Artículo",
          "Almacén",
          "Cantidad",
          "Última actualización",
        ];
        const formattedData = data.map((stock) => [
          stock.id,
          stock.item.name,
          stock.warehouse.title,
          stock.quantity,
          new Date(stock.updatedAt).toLocaleDateString(),
        ]);

        autoTable(doc, {
          head: [headers],
          body: formattedData,
        });

        const pdfBase64 = doc.output("datauristring");

        return {
          success: true,
          message: "Inventory report generated successfully",
          pdf: pdfBase64,
        };
      }

      case "accounting": {
        const data = await prisma.transaction.findMany({
          where: {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
          include: {
            account: true,
          },
        });

        if (data.length === 0) {
          return {
            success: false,
            message: "No accounting data found for the selected date range",
          };
        }

        const doc = new jsPDF();
        doc.text(`Reporte de Contabilidad`, 10, 10);

        const headers = ["ID", "Fecha", "Cuenta", "Monto", "Tipo"];
        const formattedData = data.map((transaction) => [
          transaction.id,
          new Date(transaction.date).toLocaleDateString(),
          transaction.account.name,
          transaction.amount,
          transaction.type,
        ]);

        autoTable(doc, {
          head: [headers],
          body: formattedData,
        });

        const pdfBase64 = doc.output("datauristring");

        return {
          success: true,
          message: "Accounting report generated successfully",
          pdf: pdfBase64,
        };
      }
      case "payments": {
        const data = await prisma.payment.findMany({
          where: {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
          include: {
            order: true,
          },
        });

        if (data.length === 0) {
          return {
            success: false,
            message: "No accounting data found for the selected date range",
          };
        }

        const doc = new jsPDF();
        doc.text(`Reporte de Contabilidad`, 10, 10);

        const headers = ["ID", "Fecha", "Cuenta", "Monto", "Tipo"];
        const formattedData = data.map((payment) => [
          payment.orderNo,
          new Date(payment.createdAt).toLocaleDateString(),
          payment.status,
          payment.amount,
          payment.method,
        ]);

        autoTable(doc, {
          head: [headers],
          body: formattedData,
        });

        const pdfBase64 = doc.output("datauristring");

        return {
          success: true,
          message: "Accounting report generated successfully",
          pdf: pdfBase64,
        };
      }
      default:
        throw new Error("Invalid report type");
    }
  } catch (error) {
    console.error("Error generating report:", error);
    return {
      success: false,
      message: `Failed to generate report: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};
