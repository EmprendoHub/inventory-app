import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import jsPDF from "jspdf";
import { formatCurrency, getMexicoDate } from "@/lib/utils";
import path from "path";
import fs from "fs/promises";
import {
  clientType,
  FullOderType,
  OrderItemsType,
  paymentType,
} from "@/types/sales";

// Define colors
const COLORS = {
  primary: [221, 231, 221], // light pastel avocado green
  secondary: [241, 241, 241], // Gray
  accent: [101, 152, 97], // bright green
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
      delivery: true,
    },
  });

  if (!order) {
    return NextResponse.json(
      { error: "Pedido no encontrado" },
      { status: 404 }
    );
  }

  const pdf = await createPDF(order as FullOderType);
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

  // Create a single full-page receipt
  await createReceiptCopy(pdf, order, 0);

  return pdf;
}

async function createReceiptCopy(
  pdf: jsPDF,
  order: FullOderType,
  yOffset: number
) {
  const lineHeight = 10;
  const yPos = yOffset + 35;
  const sectionHeight = 297; // Full A4 height in mm
  const termsHeight = 20;
  const bottomSectionHeight = 35; // Height for the bottom section (client info + totals)
  const notesHeight = order.notes ? 15 : 0;

  // Add background header
  pdf.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  pdf.rect(0, yOffset, pdf.internal.pageSize.width, 22, "F");

  await addFromSection(pdf, yOffset);
  addInvoiceDetails(pdf, order, yOffset);

  // Add border for products section first
  pdf.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  const productsStartY = yPos - 8;
  let productsEndY = yPos;

  if (order.orderItems) {
    productsEndY = await addOrderItems(pdf, order.orderItems, yPos, lineHeight);
  }

  // Calculate the end of the products section to leave space for bottom elements
  const maxProductsEndY =
    yOffset +
    sectionHeight -
    bottomSectionHeight -
    termsHeight -
    notesHeight -
    5;
  if (productsEndY > maxProductsEndY) {
    productsEndY = maxProductsEndY;
  }

  // Draw the border around products
  pdf.rect(15, productsStartY, 180, productsEndY - productsStartY, "S");

  // Calculate the starting Y position for the bottom section
  const bottomSectionY =
    yOffset + sectionHeight - bottomSectionHeight - termsHeight;

  // Add client section at the bottom left
  if (order.client) {
    addClientSection(pdf, order.client, bottomSectionY);
  }

  // Add totals at the bottom right, aligned with client section
  addTotals(
    pdf,
    order.totalAmount,
    order.discount || 0,
    order.delivery?.price || 0,
    order.payments ?? [],
    bottomSectionY
  );

  // Add notes if present
  if (order.notes) {
    addNotes(pdf, order.notes, bottomSectionY - notesHeight);
  }

  // Add terms and conditions at the very bottom
  const termsY = yOffset + sectionHeight - termsHeight;
  pdf.setFontSize(8);
  pdf.setTextColor(100);
  pdf.text(
    "Los muebles son artículos de liquidación de hoteles y no son nuevos. No aplican garantías. El costo de envío",
    34,
    termsY + 10
  );
  pdf.text(
    "varía según la localidad. Las entregas son solo a primer nivel. En caso de entregas fallidas, los costos de",
    36,
    termsY + 13
  );
  pdf.text(
    "envío serán acumulables. Se requiere liquidación total del saldo antes de la descarga de los muebles.",
    38,
    termsY + 16
  );
}

async function addFromSection(pdf: jsPDF, yOffset: number) {
  const logoPath = path.join(
    process.cwd(),
    "public",
    "logos",
    "logo_icon_dark.png"
  );
  const logoData = await fs.readFile(logoPath);
  const base64 = logoData.toString("base64");
  const dataUrl = `data:image/png;base64,${base64}`;

  pdf.addImage(dataUrl, "PNG", 13, yOffset + 3, 15, 15);

  // Company name
  pdf.setFontSize(12);
  pdf.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  pdf.text("Yunuen Company Liquidación de Muebles Americanos", 30, yOffset + 8);

  // Address and phone on separate lines with more spacing
  pdf.setFontSize(11);
  pdf.text("Blvd. Lazaro Cardenas 380", 30, yOffset + 13);
  pdf.text("353 111 0826", 30, yOffset + 17);
}

function addClientSection(pdf: jsPDF, client: clientType, yPos: number) {
  pdf.setFillColor(
    COLORS.secondary[0],
    COLORS.secondary[1],
    COLORS.secondary[2]
  );
  pdf.rect(15, yPos + 18, 80, 22, "F");

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("ENVIAR A:", 20, yPos + 26);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(client.name, 20, yPos + 30);
  pdf.text(client.address, 20, yPos + 34);
  pdf.text(client.phone, 20, yPos + 38);
}

function addInvoiceDetails(pdf: jsPDF, order: FullOderType, yOffset: number) {
  pdf.setFontSize(16);
  pdf.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  pdf.text(`No ${order.orderNo}`, 185, yOffset + 8, { align: "right" });
  pdf.setFontSize(11);
  pdf.text(`Fecha: ${getMexicoDate(order.createdAt)}`, 185, yOffset + 13, {
    align: "right",
  });
  pdf.text(`Vence: ${getMexicoDate(order.dueDate)}`, 185, yOffset + 17, {
    align: "right",
  });
}

async function addOrderItems(
  pdf: jsPDF,
  orderItems: OrderItemsType[],
  yPos: number,
  lineHeight: number
) {
  // Header for products
  pdf.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  pdf.rect(15, yPos - 10, 180, 10, "F");

  pdf.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("Producto", 20, yPos);
  pdf.text("Cantidad", 110, yPos);
  pdf.text("Total", 160, yPos);

  yPos += lineHeight;

  pdf.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  pdf.setFont("helvetica", "normal");

  for (const item of orderItems) {
    // Product name
    pdf.setFont("helvetica", "bold");
    pdf.text(item.name, 20, yPos);

    // Product description (if available)
    if (item.description) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(item.description, 20, yPos + 4);
      pdf.setFontSize(10);
    }

    // Quantity and price
    pdf.setFont("helvetica", "normal");
    pdf.text(item.quantity.toString(), 110, yPos);
    pdf.text(
      formatCurrency({ amount: item.price * item.quantity, currency: "MXN" }),
      160,
      yPos
    );

    yPos += lineHeight + (item.description ? 4 : 0);
  }

  return yPos;
}

function addTotals(
  pdf: jsPDF,
  totalAmount: number,
  discount: number,
  delivery: number,
  payments: paymentType[],
  yPos: number
) {
  const totalPaymentAmount = payments.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  pdf.setFillColor(
    COLORS.secondary[0],
    COLORS.secondary[1],
    COLORS.secondary[2]
  );
  pdf.rect(110, yPos + 8, 85, 32, "F");

  pdf.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  pdf.setFont("helvetica", "bold");

  pdf.text("SubTotal:", 115, yPos + 11);
  pdf.text(
    formatCurrency({ amount: totalAmount, currency: "USD" }),
    190,
    yPos + 11,
    { align: "right" }
  );

  pdf.setFontSize(10);
  pdf.text("Envió:", 115, yPos + 15);
  pdf.text(
    formatCurrency({ amount: delivery, currency: "USD" }),
    190,
    yPos + 15,
    {
      align: "right",
    }
  );

  pdf.setFontSize(10);
  pdf.text("Descuento:", 115, yPos + 19);
  pdf.text(
    `-${formatCurrency({ amount: discount, currency: "USD" })}`,
    190,
    yPos + 19,
    {
      align: "right",
    }
  );

  const grandTotal = totalAmount + delivery - discount;
  pdf.setFontSize(14);
  pdf.text("Total:", 115, yPos + 25);
  pdf.setFontSize(14);
  pdf.text(
    `${formatCurrency({ amount: grandTotal, currency: "USD" })}`,
    190,
    yPos + 25,
    { align: "right" }
  );

  const orderPaymentsTotal = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  pdf.setFontSize(10);
  pdf.text("Pagos:", 115, yPos + 31);
  pdf.text(
    formatCurrency({ amount: -orderPaymentsTotal, currency: "USD" }),
    190,
    yPos + 31,
    { align: "right" }
  );

  const pendingAmount = totalAmount - totalPaymentAmount - discount;
  pdf.text("Pendiente:", 115, yPos + 37);
  pdf.setFontSize(14);
  pdf.text(
    formatCurrency({ amount: pendingAmount, currency: "USD" }),
    190,
    yPos + 37,
    { align: "right" }
  );
}

function addNotes(pdf: jsPDF, notes: string, yPos: number) {
  pdf.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("Notas:", 20, yPos);
  pdf.text(notes, 20, yPos + 5);
}
