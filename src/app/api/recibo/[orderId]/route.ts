import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import jsPDF from "jspdf";
import { formatCurrency, getMexicoDate } from "@/lib/utils";
import {
  clientType,
  FullOderType,
  OrderItemsType,
  PaymentType,
  paymentType,
} from "@/types/sales";

// Define colors
const COLORS = {
  primary: [51, 49, 68], // Blue
  secondary: [204, 204, 204], // Gray
  accent: [192, 189, 221], // Light Blue
  text: [44, 62, 80], // Dark Gray
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: true,
      payments: true,
      client: true,
    },
  });

  if (!order) {
    return NextResponse.json(
      { error: "Pedido no encontrado" },
      { status: 404 }
    );
  }

  const pdf = await createPDF(order);
  const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
    },
  });
}

async function createPDF(order: FullOderType) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const lineHeight = 10;
  let yPos = 85; // Reduced top spacing

  // Add background header
  pdf.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  pdf.rect(0, 0, pdf.internal.pageSize.width, 35, "F");

  addFromSection(pdf);
  addClientSection(pdf, order.client);
  addInvoiceDetails(pdf, order);
  yPos = await addOrderItems(pdf, order.orderItems, yPos, lineHeight);
  yPos = await addPayments(pdf, order.payments, yPos, lineHeight);
  addTotals(pdf, order.totalAmount, order.payments, yPos);

  if (order.notes) {
    addNotes(pdf, order.notes, yPos + 20);
  }
  yPos += 40;
  pdf.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  pdf.rect(
    0,
    280,
    pdf.internal.pageSize.width,
    pdf.internal.pageSize.height,
    "F"
  );
  return pdf;
}

async function addFromSection(pdf: jsPDF) {
  // Company logo/name section
  const logoResponse = await fetch(
    "https://minio.salvawebpro.com:9000/inventario/yunuen_icon.png"
  );
  const arrayBuffer = await logoResponse.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUrl = `data:image/png;base64,${base64}`;

  pdf.addImage(dataUrl, "PNG", 13, 10, 15, 15);
  pdf.setFontSize(22);
  pdf.setTextColor(255, 255, 255); // White text for header
  pdf.text("Yunuen Company", 30, 15);

  pdf.setFontSize(12);
  pdf.text(["Blvd. Lazaro Cardenas 380", "353 111 0826"], 30, 22);

  pdf.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
}

function addClientSection(pdf: jsPDF, client: clientType) {
  // Styled client section
  pdf.setFillColor(
    COLORS.secondary[0],
    COLORS.secondary[1],
    COLORS.secondary[2]
  );
  pdf.rect(15, 45, 80, 25, "F");

  pdf.setFontSize(12);
  pdf.text("ENVIAR A", 20, 52);

  pdf.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  pdf.setFontSize(10);
  pdf.text([client.name, client.email, client.address], 20, 58);
}

function addInvoiceDetails(pdf: jsPDF, order: FullOderType) {
  // Styled invoice details
  pdf.setFillColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.rect(140, 45, 55, 25, "F");

  pdf.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  pdf.setFontSize(20);
  pdf.text([`R#${order.orderNo}`], 155, 55);
  pdf.setFontSize(10);

  pdf.text(
    [
      `Fecha: ${getMexicoDate(order.createdAt)}`,
      `Vence: ${getMexicoDate(order.dueDate)}`,
    ],
    155,
    60
  );
}

async function addOrderItems(
  pdf: jsPDF,
  orderItems: OrderItemsType[],
  yPos: number,
  lineHeight: number
) {
  pdf.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  pdf.rect(15, yPos - 8, 180, 10, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("Producto", 20, yPos);
  pdf.text("Imagen", 65, yPos);
  pdf.text("Cantidad", 110, yPos);
  pdf.text("Total", 160, yPos);

  yPos += lineHeight;

  pdf.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  pdf.setFont("helvetica", "normal");

  for (const item of orderItems) {
    if (item.image) {
      try {
        const response = await fetch(item.image);
        const arrayBuffer = await response.arrayBuffer();
        const base64 = await Buffer.from(arrayBuffer).toString("base64");
        const dataUrl = `data:image/png;base64,${base64}`;

        pdf.addImage(dataUrl, "PNG", 65, yPos - 7, 15, 15);
      } catch (error) {
        console.error("Error adding image:", error);
      }
    }

    pdf.text(item.name, 20, yPos);
    pdf.text(item.quantity.toString(), 110, yPos);
    pdf.text(
      formatCurrency({ amount: item.price * item.quantity, currency: "MXN" }),
      160,
      yPos
    );

    yPos += lineHeight + 10;
  }

  return yPos;
}

async function addPayments(
  pdf: jsPDF,
  payments: PaymentType[],
  yPos: number,
  lineHeight: number
) {
  yPos += 10;

  // Payment section header
  pdf.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  pdf.rect(15, yPos - 8, 180, 10, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.text("PAGOS", 20, yPos);

  yPos += lineHeight;

  // Payment table header
  pdf.setFontSize(10);
  pdf.text("Fecha", 20, yPos);
  pdf.text("Método", 100, yPos);
  pdf.text("Total", 160, yPos);

  yPos += 5;

  // Payment entries
  pdf.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  payments.forEach((payment) => {
    pdf.setFont("helvetica", "normal");
    pdf.text(getMexicoDate(payment.createdAt), 20, yPos);
    pdf.text(payment.method.toString(), 100, yPos);
    pdf.text(
      formatCurrency({ amount: payment.amount, currency: "MXN" }),
      160,
      yPos
    );
    yPos += lineHeight;
  });

  return yPos;
}

function addTotals(
  pdf: jsPDF,
  totalAmount: number,
  payments: paymentType[],
  yPos: number
) {
  const totalPaymentAmount = payments.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  // Totals section
  pdf.setFillColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.rect(110, yPos + 5, 85, 25, "F");

  pdf.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  pdf.setFont("helvetica", "bold");

  const pendingAmount = totalAmount - totalPaymentAmount;
  pdf.text("Pendiente:", 115, yPos + 15);
  pdf.setFontSize(14);
  pdf.text(
    formatCurrency({ amount: pendingAmount, currency: "MXN" }),
    140,
    yPos + 15
  );
  pdf.text("Total:", 115, yPos + 23);
  pdf.setFontSize(16);
  pdf.text(
    formatCurrency({ amount: totalAmount, currency: "MXN" }),
    140,
    yPos + 23
  );
}

function addNotes(pdf: jsPDF, notes: string, yPos: number) {
  pdf.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("Notas:", 20, yPos);
  pdf.text(notes, 20, yPos + 5);
}
