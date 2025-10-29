import prisma from "@/lib/db";
// import { requireUser } from "@/app/utils/hooks";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { getMexicoGlobalUtcDate } from "@/lib/utils";
import { sendWhatsAppMessage } from "@/app/(backend)/sistema/ventas/clientes/_actions/chatgpt";
import { toZonedTime } from "date-fns-tz";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log("cron log error");
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  try {
    // Define your desired time zone (e.g., 'America/Mexico_City')
    const timeZone = "America/Mexico_City";

    // Get the current date in the specified time zone
    const now = new Date();
    const zonedDate = toZonedTime(now, timeZone);

    // Set the start and end of the day in the specified time zone
    const startOfToday = new Date(zonedDate);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(zonedDate);
    endOfToday.setHours(23, 59, 59, 999);

    // Fetch orders with user (who has warehouse) and payments
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
        status: {
          in: ["COMPLETADO", "PAGADO", "ENTREGADO"],
        },
      },
      include: {
        user: {
          include: {
            warehouse: true,
          },
        },
        payments: true,
        delivery: true,
      },
    });

    // Fetch all warehouses
    const warehouses = await prisma.warehouse.findMany({
      select: {
        id: true,
        title: true,
      },
    });

    const expenses = await prisma.expense.findMany({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
        status: {
          not: "CANCELADO", // Exclude cancelled expenses
        },
      },
      include: {
        warehouse: true,
      },
    });

    // Group orders by warehouse and calculate totals
    type WarehouseSummary = {
      warehouseName: string;
      totalSales: number;
      cashSales: number;
      transferSales: number;
      cardSales: number;
      orderCount: number;
      totalExpenses: number; // Add expenses to summary
    };

    const warehouseSummaries: { [key: string]: WarehouseSummary } = {};

    // Initialize warehouse summaries
    warehouses.forEach((warehouse) => {
      warehouseSummaries[warehouse.id] = {
        warehouseName: warehouse.title,
        totalSales: 0,
        cashSales: 0,
        transferSales: 0,
        cardSales: 0,
        orderCount: 0,
        totalExpenses: 0,
      };
    });

    // Process orders and group by warehouse
    orders.forEach((order) => {
      const warehouseId = order.user?.warehouseId;

      if (warehouseId && warehouseSummaries[warehouseId]) {
        // Calculate order total (totalAmount + delivery - discount)
        const orderTotal =
          order.totalAmount +
          (order.delivery?.price ?? 0) -
          (order.discount ?? 0);

        warehouseSummaries[warehouseId].totalSales += orderTotal;
        warehouseSummaries[warehouseId].orderCount += 1;

        // Categorize by payment method from payments
        order.payments.forEach((payment) => {
          const paymentAmount = payment.amount;

          switch (payment.method) {
            case "EFECTIVO":
              warehouseSummaries[warehouseId].cashSales += paymentAmount;
              break;
            case "TRANSFERENCIA":
              warehouseSummaries[warehouseId].transferSales += paymentAmount;
              break;
            case "TARJETA":
              warehouseSummaries[warehouseId].cardSales += paymentAmount;
              break;
          }
        });
      }
    });

    // Process expenses and group by warehouse
    expenses.forEach((expense) => {
      const warehouseId = expense.warehouseId;

      if (warehouseId && warehouseSummaries[warehouseId]) {
        warehouseSummaries[warehouseId].totalExpenses += expense.amount;
      }
    });

    // Calculate global totals
    let totalSales = 0;
    let totalCashSales = 0;
    let totalTransferSales = 0;
    let totalCardSales = 0;
    let totalExpenses = 0;

    Object.values(warehouseSummaries).forEach((summary) => {
      totalSales += summary.totalSales;
      totalCashSales += summary.cashSales;
      totalTransferSales += summary.transferSales;
      totalCardSales += summary.cardSales;
      totalExpenses += summary.totalExpenses;
    });

    const subject = "Resumen Diario de Ventas y Gastos por Sucursal";
    const greeting = `Resumen Diario de Ventas y Gastos por Sucursal:`;
    const title = `A continuación encontrarás un resumen de ventas y gastos diarios de tu negocio, organizados por sucursal.`;
    const todaysDate = `${getMexicoGlobalUtcDate().toLocaleString()}`;
    const bodyHeader = `Resumen por Sucursal:`;
    const bestRegards =
      "¿Ocupas un reporte más detallado? Solicítalo a tu administrador.";
    const recipient_email = "emprendomex@gmail.com";
    const sender_email = "invetamexapp@gmail.com";
    const fromName = "YUNUEN COMPANY";

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.GOOGLE_MAIL,
        pass: process.env.GOOGLE_MAIL_PASS,
      },
    });

    const mailOption = {
      from: `"${fromName}" ${sender_email}`,
      to: recipient_email,
      subject,
      html: `
          <!DOCTYPE html>
          <html lang="es">
          <body>
            <p>${greeting}</p>
            <p>${title}</p>
            <p><strong>${todaysDate}</strong></p>

            <h2>${bodyHeader}</h2>
      
            <table border="1" cellpadding="8" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 20px;">
              <thead style="background-color: #4a5568; color: white;">
                <tr>
                  <th>Sucursal</th>
                  <th>Pedidos</th>
                  <th>Efectivo</th>
                  <th>Transf.</th>
                  <th>Tarjeta</th>
                  <th>Total Ventas</th>
                  <th>Gastos</th>
                </tr>
              </thead>
              <tbody>
                ${Object.values(warehouseSummaries)
                  .filter(
                    (summary) =>
                      summary.orderCount > 0 || summary.totalExpenses > 0
                  )
                  .map(
                    (summary) => `
                      <tr>
                        <td><strong>${summary.warehouseName}</strong></td>
                        <td style="text-align: center;">${
                          summary.orderCount
                        }</td>
                        <td style="text-align: right;">$${summary.cashSales.toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}</td>
                        <td style="text-align: right;">$${summary.transferSales.toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}</td>
                        <td style="text-align: right;">$${summary.cardSales.toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}</td>
                        <td style="text-align: right;"><strong>$${summary.totalSales.toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}</strong></td>
                        <td style="text-align: right; color: red;">-$${summary.totalExpenses.toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}</td>
                      </tr>
                    `
                  )
                  .join("")}
                <tr style="background-color: #edf2f7; font-weight: bold;">
                  <td>TOTAL GENERAL</td>
                  <td style="text-align: center;">${orders.length}</td>
                  <td style="text-align: right;">$${totalCashSales.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}</td>
                  <td style="text-align: right;">$${totalTransferSales.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}</td>
                  <td style="text-align: right;">$${totalCardSales.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}</td>
                  <td style="text-align: right;">$${totalSales.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}</td>
                  <td style="text-align: right; color: red;">-$${totalExpenses.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}</td>
                </tr>
              </tbody>
            </table>

            <h3 style="text-align: center; margin-top: 20px;">
              <span style="color: green;">💰 Ganancia Neta del Día: $${(
                totalSales - totalExpenses
              ).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}</span>
            </h3>
    
            <p style="margin-top: 30px;">${bestRegards}</p>
          </body>
          </html>
        `,
    };

    await transporter.sendMail(mailOption);

    // Prepare WhatsApp message with warehouse breakdown
    const warehouseBreakdown = Object.values(warehouseSummaries)
      .filter((summary) => summary.orderCount > 0 || summary.totalExpenses > 0)
      .map(
        (summary) =>
          `*${summary.warehouseName}*\n` +
          `  Pedidos: ${summary.orderCount}\n` +
          `  💵 Efectivo: $${summary.cashSales.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}\n` +
          `  🏦 Transferencias: $${summary.transferSales.toLocaleString(
            undefined,
            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          )}\n` +
          ` 💳 Tarjeta: $${summary.cardSales.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}\n` +
          `  ✅ Ventas: $${summary.totalSales.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}\n` +
          `  ❌ Gastos: -$${summary.totalExpenses.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
      )
      .join("\n\n");

    const whatsAppMessage = `
📊 *Resumen Diario ${todaysDate}*

${warehouseBreakdown}

━━━━━━━━━━━━━━━━━
*TOTAL GENERAL*
💵 Efectivo: $${totalCashSales.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
🏦 Transferencias: $${totalTransferSales.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
💳 Tarjeta: $${totalCardSales.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
━━━━━━━━━━━━━━━━━
✅ *Total Ventas: $${totalSales.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}*
❌ *Total Gastos: -$${totalExpenses.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}*
━━━━━━━━━━━━━━━━━
💰 *Ganancia Neta: $${(totalSales - totalExpenses).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}*
   `.trim();

    // Send WhatsApp message
    const whatsAppResponse = await sendWhatsAppMessage(
      "3532464146", // Replace with the recipient's phone number
      whatsAppMessage
    );

    if (!whatsAppResponse.success) {
      throw new Error("Failed to send WhatsApp message");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to send Email reminder" },
      { status: 500 }
    );
  }
}
