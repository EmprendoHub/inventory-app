import prisma from "@/lib/db";
// import { requireUser } from "@/app/utils/hooks";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { getMexicoDate, getMexicoGlobalUtcDate } from "@/lib/utils";
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
    const today = new Date(zonedDate);
    today.setHours(23, 59, 59, 999); // Set time to the start of the day (23:59:59)

    // Calculate last Monday's date
    const lastMonday = new Date(zonedDate);
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    if (dayOfWeek === 1) {
      // If today is Monday
      lastMonday.setDate(today.getDate());
    } else {
      // Otherwise, calculate days to go back to reach the last Monday
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      lastMonday.setDate(today.getDate() - daysToSubtract);
    }

    lastMonday.setHours(0, 0, 0, 0); // Ensure time is set to the start of the day

    // Fetch orders from last Monday to today
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: lastMonday, // Orders created on or after last Monday
          lte: today, // Orders created on or before today
        },
      },
      include: {
        delivery: true,
      },
    });

    const payments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: lastMonday, // Payments created on or after last Monday
          lte: today, // Payments created on or before today
        },
      },
    });

    const expenses = await prisma.expense.findMany({
      where: {
        createdAt: {
          gte: lastMonday, // Expenses created on or after last Monday
          lte: today, // Expenses created on or before today
        },
      },
    });

    // Calculate totals
    // Calculate totals
    const totalSales = orders.reduce(
      (acc, item) =>
        acc +
        (item.totalAmount + (item.delivery?.price ?? 0) - (item.discount ?? 0)),
      0
    );
    // const totalPayments = payments.reduce((acc, item) => acc + item.amount, 0);
    const totalTransferPayments = payments.reduce(
      (acc, item) =>
        item.method === "TRANSFERENCIA" ? acc + item.amount : acc,
      0
    );
    const totalCashPayments = payments.reduce(
      (acc, item) => (item.method === "EFECTIVO" ? acc + item.amount : acc),
      0
    );
    const totalExpenses = expenses.reduce((acc, item) => acc + item.amount, 0);

    const subject = "Resumen Semanal de Ventas, Pagos y Gastos";
    const greeting = `Resumen Semanal de Ventas, Pagos y Gastos:`;
    const title = `A continuación encontraras un resumen de ventas, pagos y gastos semanales de tu negocio.`;
    const todaysDate = `${getMexicoGlobalUtcDate().toLocaleString()}`;
    const bodyHeader = `Ventas:`;
    const bodyTwoHeader = `Pagos:`;
    const bodyThreeHeader = `Gastos:`;
    const bestRegards =
      "Ocupas un reporte mas detallado? solicítalo a tu administrador.";
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
            <div>${bodyHeader}</div>
            <p></p>
      
            <table border="1" cellpadding="8" cellspacing="0" width="100%" style="border-collapse: collapse;">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Fecha</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${orders
                  .map(
                    (item) => `
                      <tr>
                        <td>${item.orderNo}</td>
                        <td>${getMexicoDate(item.createdAt)}</td>
                        <td>$${(
                          item.totalAmount +
                          (item.delivery?.price ?? 0) -
                          (item.discount ?? 0)
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}</td>
                      </tr>
                    `
                  )
                  .join("")}
              </tbody>
            </table>
      
            <h3><strong>Total Ventas: ${totalSales.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}</strong></h3>

            <div>${bodyTwoHeader}</div>
            <table border="1" cellpadding="8" cellspacing="0" width="100%"    style="border-collapse: collapse;">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Método</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${payments
                  .map(
                    (item) => `
                      <tr>
                        <td>${item.createdAt.toLocaleDateString()}</td>
                        <td>${item.method}</td>
                        <td>$${item.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}</td>
                      </tr>
                    `
                  )
                  .join("")}
              </tbody>
            </table>
    

         
             <h3><strong>Transferencias: ${totalTransferPayments.toLocaleString(
               undefined,
               {
                 minimumFractionDigits: 2,
                 maximumFractionDigits: 2,
               }
             )}</strong></h3>
           <h3><strong>Efectivo: ${totalCashPayments.toLocaleString(undefined, {
             minimumFractionDigits: 2,
             maximumFractionDigits: 2,
           })}</strong></h3>


             <div>${bodyThreeHeader}</div>
            <table border="1" cellpadding="8" cellspacing="0" width="100%"    style="border-collapse: collapse;">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Referencia</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${expenses
                  .map(
                    (item) => `
                      <tr>
                        <td>${item.createdAt.toLocaleDateString()}</td>
                        <td>${item.description}</td>
                        <td>$${item.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}</td>
                      </tr>
                    `
                  )
                  .join("")}
              </tbody>
            </table>
    

          <h3><strong>Total Gastos: ${totalExpenses.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</strong></h3>

            
      
            <p>${bestRegards}</p>
          </body>
          </html>
        `,
    };

    await transporter.sendMail(mailOption);

    // Prepare WhatsApp message
    const whatsAppMessage = `
     Resumen ${todaysDate} Ventas, Pagos y Gastos:
     - Pedidos: $${totalSales.toLocaleString(undefined, {
       minimumFractionDigits: 2,
       maximumFractionDigits: 2,
     })}
     - Transferencias: $${totalTransferPayments.toLocaleString(undefined, {
       minimumFractionDigits: 2,
       maximumFractionDigits: 2,
     })}
     - Efectivo: $${totalCashPayments.toLocaleString(undefined, {
       minimumFractionDigits: 2,
       maximumFractionDigits: 2,
     })}
     - Total Gastos: -$${totalExpenses.toLocaleString(undefined, {
       minimumFractionDigits: 2,
       maximumFractionDigits: 2,
     })}
   `;

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
