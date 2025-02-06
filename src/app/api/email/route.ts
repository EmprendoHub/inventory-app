import prisma from "@/lib/db";
// import { requireUser } from "@/app/utils/hooks";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const cookie = request.headers.get("cookie");
  if (!cookie) {
    // Not Signed in
    const notAuthorized = "You are not authorized no no no";
    return new Response(JSON.stringify(notAuthorized), {
      status: 400,
    });
  }

  const { id } = await request.json();
  try {
    //const session = await requireUser();

    const orderData = await prisma.order.findUnique({
      where: {
        id: id,
      },
      include: {
        orderItems: true, // Includes all related order items
        payments: true, // Includes all related order payments
        client: true, // Includes related order client
      },
    });

    if (!orderData) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const subject = "Pedido de Muebles Yunuen";
    const body = `Pedido:`;
    const bodyTwo = `Pagos:`;
    const title =
      "Gracias por tu compra no olvides realizar el pago pendiente.";
    const greeting = `Hola ${orderData?.client.name}`;
    const bestRegards = "¿Problemas? Ponte en contacto invetamexapp@gmail.com";
    const recipient_email = orderData?.client.email;
    const sender_email = "invetamexapp@gmail.com";
    const fromName = "Yunuen Company";

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
            <div>${body}</div>
            <p></p>
      
            <table border="1" cellpadding="8" cellspacing="0" width="100%" style="border-collapse: collapse;">
              <thead>
                <tr>
                  <th>Articulo</th>
                  <th>Cntd.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderData?.orderItems
                  .map(
                    (item) => `
                      <tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>$${(item.quantity * item.price).toFixed(2)}</td>
                      </tr>
                    `
                  )
                  .join("")}
              </tbody>
            </table>
      
            <h3><strong>Total Pedido: ${orderData?.orderItems
              .reduce((acc, item) => acc + item.quantity * item.price, 0)
              .toFixed(2)}</strong></h3>

            <div>${bodyTwo}</div>
            <table border="1" cellpadding="8" cellspacing="0" width="100%" style="border-collapse: collapse;">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Método</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${orderData?.payments
                .map(
                  (item) => `
                    <tr>
                      <td>${item.createdAt.toLocaleDateString()}</td>
                      <td>${item.method}</td>
                      <td>$${item.amount.toFixed(2)}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
    

          <h3><strong>Total Pagos: ${orderData?.payments
            .reduce((acc, item) => acc + item.amount, 0)
            .toFixed(2)}</strong></h3>
            <p></p>
            <h2><strong>Pendiente: ${
              orderData?.orderItems.reduce(
                (acc, item) => acc + item.quantity * item.price,
                0
              ) -
              orderData?.payments.reduce((acc, item) => acc + item.amount, 0)
            }</strong></h2>
      
            <p>${bestRegards}</p>
          </body>
          </html>
        `,
    };

    await transporter.sendMail(mailOption);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to send Email reminder" },
      { status: 500 }
    );
  }
}
