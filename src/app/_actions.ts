"use server";
import { unstable_noStore as noStore } from "next/cache";
import sharp from "sharp";
import prisma from "@/lib/db";
import { mc } from "@/lib/minio";
import { VerifyEmailSchema } from "@/lib/schemas";
import axios from "axios";
import { writeFile } from "fs/promises";
import nodemailer from "nodemailer";
import { join } from "path";
import {
  formatCurrency,
  getMexicoDate,
  getMexicoGlobalUtcDate,
} from "@/lib/utils";
import fs from "fs";
import { SenderType } from "@prisma/client";

// Optimize and upload image
export const uploadOptimizedImage = async (rawData: any) => {
  try {
    if (
      rawData.image &&
      rawData.image instanceof File &&
      rawData.image.size > 0
    ) {
      // Convert the image file to ArrayBuffer
      const arrayBuffer = await rawData.image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Optimize the image using sharp
      const optimizedImageBuffer = await sharp(buffer)
        .resize(800, 800, {
          // Resize to a maximum of 800x800 pixels
          fit: "inside", // Maintain aspect ratio
          withoutEnlargement: true, // Don't enlarge images smaller than 800x800
        })
        .png({
          // Convert to WebP format
          quality: 80, // Adjust quality (0-100)
          compressionLevel: 9, // Compression level (0-9, 9 being the highest compression)
          adaptiveFiltering: true, // Use adaptive filtering for better compression
        })
        .toBuffer();

      // Generate a unique filename
      const newFilename = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.png`;
      const path = join("/", "tmp", newFilename);

      // Save the optimized image to a temporary file
      await writeFile(path, optimizedImageBuffer);

      // Upload the optimized image to Minio
      await uploadToBucket("inventario", "products/" + newFilename, path);

      console.log("Image uploaded successfully:", newFilename);
      return newFilename;
    }
  } catch (error) {
    console.error("Error optimizing or uploading image:", error);
    throw error;
  }
};

// Put a file in bucket my-bucketname
export const uploadToBucket = async (
  folder: string,
  filename: string,
  file: string
): Promise<
  { response: Awaited<ReturnType<typeof mc.fPutObject>> } | undefined
> => {
  try {
    const response = await mc.fPutObject(folder, filename, file);
    return { response };
  } catch (error) {
    console.error("Upload failed:", error);
    return undefined;
  }
};

export async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function resendEmail(data: any) {
  const { email, gReCaptchaToken } = Object.fromEntries(data);
  const secretKey = process?.env?.RECAPTCHA_SECRET_KEY;

  //check for errors
  const { error: zodError } = VerifyEmailSchema.safeParse({
    email,
  });
  if (zodError) {
    return { error: zodError.format() };
  }

  const formData = `secret=${secretKey}&response=${gReCaptchaToken}`;
  let res: any;
  try {
    res = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
  } catch (e) {
    console.log("recaptcha error:", e);
  }

  if (res && res.data?.success && res.data?.score > 0.5) {
    // Save data to the database from here
    try {
      const user = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      if (!user) {
        return { error: { email: { _errors: ["Email does not exist"] } } };
      }
      if (user?.active === true) {
        return { error: { email: { _errors: ["Email is already verified"] } } };
      }
      if (user?.id) {
        try {
          const subject = "Confirmar email";
          const body = `Por favor da click en confirmar email para verificar tu cuenta.`;
          const title = "Completar registro";
          const greeting = `Saludos ${user?.name}`;
          const action = "CONFIRMAR EMAIL";
          const bestRegards = "Gracias por unirte a nuestro sitio.";
          const recipient_email = email;
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

          try {
            // Verify your transporter
            //await transporter.verify();

            const mailOptions = {
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
        <a href="${process.env.NEXTAUTH_URL}/exito?token=${user?.verificationToken}">${action}</a>
        <p>${bestRegards}</p>
        </body>
        
        </html>
        
        `,
            };
            await transporter.sendMail(mailOptions);

            return {
              error: {
                success: {
                  _errors: [
                    "El correo se envió exitosamente revisa tu bandeja de entrada y tu correo no deseado",
                  ],
                },
              },
            };
          } catch (error: any) {
            console.log(error);
          }
        } catch (error: any) {
          console.log(error);
          return { error: { email: { _errors: ["Error al enviar email"] } } };
        }
      }
    } catch (error: any) {
      console.log(error);
      throw Error(error);
    }
  } else {
    return {
      error: {
        email: { _errors: [`Failed Google Captcha Score: ${res.data?.score}`] },
      },
    };
  }
}

export async function uploadImageAction(base64Image: string) {
  try {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    const newFilename = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.png`;
    const path = join("/", "tmp", newFilename);

    const uint8Array = new Uint8Array(imageBuffer);
    await writeFile(path, uint8Array);

    await uploadToBucket("inventario", "proofs/" + newFilename, path);
    const imageUrl = `${process.env.MINIO_URL}proofs/${newFilename}`;

    return { success: true, imageUrl };
  } catch (error) {
    console.error("Error uploading image:", error);
    return { success: false, error: "Failed to upload image" };
  }
}

export async function uploadAudioBlobAction(audioBlob: Blob) {
  try {
    const newFilename = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.ogg`;
    const buffer = Buffer.from(await audioBlob.arrayBuffer());

    const uint8Array = new Uint8Array(buffer);
    const path = join("/", "tmp", newFilename);
    await writeFile(path, uint8Array);

    await uploadToBucket("inventario", "audio/" + newFilename, path);
    const audioUrl = `${process.env.MINIO_URL}audio/${newFilename}`;

    return { success: true, audioUrl };
  } catch (error) {
    console.error("Error uploading image:", error);
    return { success: false, error: "Failed to upload image" };
  }
}

export async function uploadImageBlobAction(imageBlob: Blob) {
  try {
    const newFilename = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.png`;
    const buffer = await imageBlob.arrayBuffer();

    const filePath = join("/", "tmp", newFilename);
    // Save the buffer to a file
    fs.writeFileSync(filePath, Buffer.from(buffer));

    await uploadToBucket("inventario", "images/" + newFilename, filePath);
    const imageUrl = `${process.env.MINIO_URL}images/${newFilename}`;

    return { success: true, imageUrl };
  } catch (error) {
    console.error("Error uploading image:", error);
    return { success: false, error: "Failed to upload image" };
  }
}

export const verifySupervisorCode = async (
  code: string
): Promise<{ authUserId: string; success: boolean }> => {
  const authorizedUser = await prisma.user.findFirst({
    where: {
      authCode: code,
    },
  });

  if (!authorizedUser) {
    return { authUserId: "", success: false };
  }
  // Implement your logic to verify the supervisor code
  // For example, you can make an API call to verify the code
  // This is a placeholder implementation
  return { authUserId: authorizedUser.id, success: true }; // Replace with actual verification logic
};

export async function sendSMSMessage(
  message: string,
  phone: string
): Promise<boolean> {
  const data = JSON.stringify({
    message: message,
    tpoa: "Sender",
    recipient: [
      {
        msisdn: `521${phone}`,
      },
    ],
  });

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://api.labsmobile.com/json/send",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.LABS_MOBILE_API_USER}:${process.env.LABS_MOBILE_API_KEY}`
        ).toString("base64"),
    },
    data: data,
  };

  try {
    const response = await axios.request(config);

    // Check for success based on API response
    if (response.data && response.data.success) {
      return true; // SMS sent successfully
    } else {
      return false; // API response indicates failure
    }
  } catch (error) {
    console.error("SMS sending failed:", error);
    return false; // Request failed
  }
}

export async function sendWATemplateMessage(phone: string): Promise<boolean> {
  const data = JSON.stringify({
    messaging_product: "whatsapp",
    to: `52${phone}`,
    type: "template",
    template: {
      name: "hello_world",
      language: {
        code: "en_US",
      },
    },
  });

  const config = {
    method: "post",
    url: `https://graph.facebook.com/v22.0/${process.env.WA_PHONE_ID}/messages`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
    },
    data: data,
  };

  try {
    const response: any = await axios(config);

    // Check for success based on API response
    if (response && response.status === 200) {
      return true; // SMS sent successfully
    } else {
      return false; // API response indicates failure
    }
  } catch (error) {
    console.error("WA Template sending failed:", error);
    return false; // Request failed
  }
}

export async function sendWATextMessage(
  message: string,
  phone: string
): Promise<boolean> {
  const data = JSON.stringify({
    messaging_product: "whatsapp",
    to: `52${phone}`,
    type: "text",
    text: {
      body: message,
    },
  });

  const config = {
    method: "post",
    url: `https://graph.facebook.com/v22.0/${process.env.WA_PHONE_ID}/messages`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
    },
    data: data,
  };

  try {
    const response: any = await axios(config);

    // Check for success based on API response
    if (response && response.status === 200) {
      return true; // SMS sent successfully
    } else {
      return false; // API response indicates failure
    }
  } catch (error) {
    console.error("WA text message sending failed:", error);
    return false; // Request failed
  }
}

export async function sendWAMediaMessage(
  message: string,
  phone: string,
  mainImage: string
): Promise<boolean> {
  const data = JSON.stringify({
    messaging_product: "whatsapp",
    to: `52${phone}`,
    type: "image",
    image: {
      link: mainImage,
      caption: message,
    },
  });

  const config = {
    method: "post",
    url: `https://graph.facebook.com/v22.0/${process.env.WA_PHONE_ID}/messages`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
    },
    data: data,
  };

  try {
    const response: any = await axios(config);

    // Check for success based on API response
    if (response && response.status === 200) {
      return true; // SMS sent successfully
    } else {
      return false; // API response indicates failure
    }
  } catch (error) {
    console.error("WA Template sending failed:", error);
    return false; // Request failed
  }
}

export async function sendWATemplatePaymentPendingMessage(
  orderId: string
): Promise<boolean> {
  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: {
      payments: true,
      client: true,
    },
  });

  if (!order) return false;

  const orderTotal = order.totalAmount;
  const previousPayments = order.payments.reduce((total, payment) => {
    return total + payment.amount;
  }, 0);
  const pendingPayment = orderTotal - previousPayments || 0;
  const dueDate = getMexicoDate(order.dueDate);

  const formattedTotal = formatCurrency({
    amount: order.totalAmount,
    currency: "USD",
  });
  const formattedPayments = formatCurrency({
    amount: previousPayments,
    currency: "USD",
  });
  const formattedPending = formatCurrency({
    amount: pendingPayment,
    currency: "USD",
  });
  const data = JSON.stringify({
    messaging_product: "whatsapp",
    to: `52${order.client.phone}`,
    type: "template",
    template: {
      name: "pago_pendiente_2",
      language: {
        code: "es_MX",
      },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: order.client.name }, // Variable 1
            { type: "text", text: order.orderNo }, // Variable 2
            { type: "text", text: formattedTotal }, // Variable 3
            { type: "text", text: formattedPayments }, // Variable 4
            { type: "text", text: formattedPending }, // Variable 5
            { type: "text", text: dueDate }, // Variable 6
          ],
        },
      ],
    },
  });

  const config = {
    method: "post",
    url: `https://graph.facebook.com/v22.0/${process.env.WA_PHONE_ID}/messages`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
    },
    data: data,
  };

  try {
    const response: any = await axios(config);

    // Check for success based on API response
    if (response && response.status === 200) {
      const pago_pendiente_2 = `Hola ${order.client.name}, esto es un recordatorio de pago para: \n
      PEDIDO: #${order.orderNo} \n
      \n
      Total: ${formattedTotal}\n
      Pagado: ${formattedPayments}\n
      Pendiente: ${formattedPending}\n
      \n
      Por favor realiza tu pago antes del ${dueDate} para evitar la cancelación de tu pedido.`;
      const currentDateTime = getMexicoGlobalUtcDate();
      await prisma.whatsAppMessage.create({
        data: {
          clientId: order.client.id,
          phone: order.client.phone,
          type: "text",
          message: pago_pendiente_2,
          template: "pago_pendiente_2",
          header: "Recordatorio de Pago",
          footer: "Si ya realizaste este pago ignora este mensaje.",
          button: "Ver pedidos recientes",
          variables: [
            order.client.name, // Variable 1
            order.orderNo, // Variable 2
            formattedTotal, // Variable 3
            formattedPayments, // Variable 4
            formattedPending, // Variable 5
            dueDate, // Variable 6
          ],
          sender: "SYSTEM" as SenderType,
          createdAt: currentDateTime,
          updatedAt: currentDateTime,
        },
      });
      console.error("API response indicates success");
      return true; // Message sent successfully
    } else {
      console.error("API response indicates failure");
      return false; // API response indicates failure
    }
  } catch (error) {
    console.error("WA Template sending failed:", error);
    return false; // Request failed
  }
}

export async function sendWATemplateOrderPdfMessage(
  orderId: string,
  pdfUrl: string
): Promise<boolean> {
  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: {
      client: true,
    },
  });

  if (!order) return false;

  // const data = JSON.stringify({
  //   messaging_product: "whatsapp",
  //   to: `52${order.client.phone}`,
  //   type: "document",
  //   document: {
  //     name: "order_pdf",
  //     language: {
  //       code: "es_MX",
  //     },
  //     components: [
  //       {
  //         type: "header",
  //         parameters: [
  //           {
  //             type: "document",
  //             image: {
  //               link: pdfUrl,
  //             },
  //           },
  //         ],
  //       },
  //       {
  //         type: "body",
  //         parameters: [
  //           { type: "text", text: order.orderNo }, // Variable 1
  //         ],
  //       },
  //     ],
  //   },
  // });

  const data = JSON.stringify({
    messaging_product: "whatsapp",
    to: `52${order.client.phone}`,
    type: "document",
    document: {
      link: pdfUrl,
      caption: order.orderNo,
      filename: `${order.id}.pdf`,
    },
  });

  const config = {
    method: "post",
    url: `https://graph.facebook.com/v22.0/${process.env.WA_PHONE_ID}/messages`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
    },
    data: data,
  };

  try {
    const response: any = await axios(config);

    // Check for success based on API response
    if (response && response.status === 200) {
      const order_pdf = `Gracias por usar tu compra. Adjunto encontrarás tu recibo para el pedido No: ${order.orderNo} en formato PDF.`;
      const currentDateTime = getMexicoGlobalUtcDate();
      await prisma.whatsAppMessage.create({
        data: {
          clientId: order.client.id,
          phone: order.client.phone,
          type: "text",
          message: order_pdf,
          template: "order_pdf",
          variables: [
            order.orderNo, // Variable 1
          ],
          sender: "SYSTEM" as SenderType,
          createdAt: currentDateTime,
          updatedAt: currentDateTime,
        },
      });
      console.error("API response indicates success");
      return true; // Message sent successfully
    } else {
      console.error("API response indicates failure");
      return false; // API response indicates failure
    }
  } catch (error) {
    console.error("WA Template sending failed:", error);
    return false; // Request failed
  }
}

export async function sendRecentOrdersInteractiveMessage(
  clientId: string
): Promise<boolean> {
  // Fetch the last 3 orders for the client
  const recentOrders = await prisma.order.findMany({
    where: {
      clientId: clientId,
      NOT: { status: "CANCELADO" },
    },
    include: { client: true },
    orderBy: {
      createdAt: "desc", // Sort by createdAt in descending order (most recent first)
    },
    take: 3, // Limit the results to 3 orders
  });

  // If no orders are found, return false
  if (!recentOrders || recentOrders.length === 0) return false;

  // Extract the client's phone number from the first order
  const clientPhone = recentOrders[0].client.phone;

  // Create the interactive message payload dynamically
  const data = JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: `52${clientPhone}`, // Add the country code for Mexico
    type: "interactive",
    interactive: {
      type: "list",
      header: {
        type: "text",
        text: "Selecciona un pedido",
      },
      body: {
        text: "Gracias por tu compra. Adjunto encontrarás tus últimos 3 pedidos.",
      },
      footer: {
        text: "Selecciona un pedido para ver más detalles.",
      },
      action: {
        sections: [
          {
            title: "Tus pedidos recientes",
            rows: recentOrders.map((order) => ({
              id: order.id,
              title: `Pedido No ${order.orderNo}`,
              description: `Total: ${formatCurrency({
                amount: order.totalAmount,
                currency: "MXN",
              })}`,
            })),
          },
        ],

        button: "Pedidos",
      },
    },
  });

  // Configure the Axios request
  const config = {
    method: "post",
    url: `https://graph.facebook.com/v22.0/${process.env.WA_PHONE_ID}/messages`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
    },
    data: data,
  };

  try {
    const response = await axios(config);

    // Check for success based on API response
    if (response && response.status === 200) {
      const currentDateTime = getMexicoGlobalUtcDate();
      // Save the WhatsApp message in the database
      await prisma.whatsAppMessage.create({
        data: {
          clientId: recentOrders[0].client.id,
          phone: clientPhone,
          type: "interactive",
          header: "Selecciona un pedido",
          message:
            "Gracias por usar tu compra. Adjunto encontrarás tus últimas 3 compras.",
          footer: "Selecciona un pedido para ver más detalles.",
          template: "recent_orders",
          variables: recentOrders.map((order) => order.orderNo), // Store order numbers as variables
          sender: "SYSTEM" as SenderType,
          timestamp: currentDateTime,
          createdAt: currentDateTime,
          updatedAt: currentDateTime,
        },
      });

      console.log("Interactive message sent successfully");
      return true; // Message sent successfully
    } else {
      console.error("API response indicates failure");
      return false; // API response indicates failure
    }
  } catch (error) {
    console.error("WA Template sending failed:", error);
    return false; // Request failed
  }
}

export async function getAllPOSProductNoFilter() {
  // Disable caching to ensure fresh product data
  noStore();

  try {
    // Get all items with their stock information
    const items = await prisma.item.findMany({
      where: {
        status: "ACTIVE",
        stocks: {
          some: {
            availableQty: { gt: 0 }, // Only items with available stock
          },
        },
      },
      include: {
        stocks: {
          where: {
            availableQty: { gt: 0 }, // Only stocks with available quantity
          },
        },
        variants: true,
      },
      orderBy: [
        {
          createdAt: "desc", // Sort by creation date, newest first
        },
      ],
    });

    // Calculate total counts
    const filteredProductsCount = items.length;

    // Transform data to match expected format
    const products = items.map((item) => {
      const totalAvailableStock = item.stocks.reduce(
        (sum, stock) => sum + stock.availableQty,
        0
      );

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        sku: item.sku,
        barcode: item.barcode,
        price: item.price,
        cost: item.cost,
        mainImage: item.mainImage,
        images: item.images,
        status: item.status,
        totalAvailableStock,
        stocks: item.stocks,
        variants: item.variants,
      };
    });

    // Return the products and count of filtered products
    return {
      products,
      filteredProductsCount,
    };
  } catch (error: any) {
    console.error("Error fetching POS products:", error);
    throw new Error(`Failed to fetch POS products: ${error.message}`);
  }
}
