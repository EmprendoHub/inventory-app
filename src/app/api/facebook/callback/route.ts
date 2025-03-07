import {
  sendRecentOrdersInteractiveMessage,
  sendWATemplateOrderPdfMessage,
  uploadToBucket,
} from "@/app/_actions";
import prisma from "@/lib/db";
import { SenderType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import fs from "fs";
import axios from "axios";
import {
  generateCustomerServiceResponse,
  processImageWithAI,
  transcribeAudioWithAI,
} from "@/lib/ai/actions";
import { sendWhatsAppMessage } from "@/app/(backend)/sistema/ventas/clientes/_actions/chatgpt";

const FACEBOOK_VERIFY_TOKEN = process.env.FB_WEBHOOKTOKEN;

// Facebook webhook verification (GET)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = searchParams.get("hub.verify_token");
  const mode = searchParams.get("hub.mode");

  if (mode === "subscribe" && verifyToken === FACEBOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  } else {
    return new Response("Verification failed", { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  try {
    if (payload.object === "whatsapp_business_account") {
      await Promise.all(
        payload.entry.map(async (entry: any) => {
          const webhookEvent = entry.messaging || entry.changes;

          if (webhookEvent) {
            const eventPromises = webhookEvent.map(async (event: any) => {
              console.log("EVENT", event);

              if (event.field === "messages") {
                return processMessageEvent(event.value);
              }
            });

            await Promise.all(eventPromises);
          }
        })
      );
    }

    return NextResponse.json({ message: "EVENT_RECEIVED" }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function processMessageEvent(event: any) {
  if (event.statuses) {
    console.log("PROCESS statuses", event.statuses[0]);
    const WAPhone = event.statuses[0].recipient_id.replace(/^521/, "");
    const client = await prisma.client.findFirst({
      where: { phone: WAPhone },
    });
    console.log(client);
  }

  if (event.messages) {
    console.log("PROCESS contacts", event.contacts[0]);
    console.log("PROCESS messages", event.messages[0]);

    const WAPhone = event.contacts[0].wa_id.replace(/^521/, "");
    const client = await prisma.client.findFirst({
      where: { phone: WAPhone },
    });

    try {
      const timestamp = new Date(parseInt(event.messages[0].timestamp) * 1000);
      const senderPhone = WAPhone;
      const senderName = event.contacts[0].profile.name;
      const clientId = client?.id;
      const messageType = event.messages[0].type;

      // Process different message types
      switch (messageType) {
        case "text":
          await storeTextMessage({
            senderPhone,
            clientId,
            timestamp,
            messageText: event.messages[0].text.body,
            senderName,
          });
          break;

        case "button":
          await storeButtonResponseMessage({
            senderPhone,
            clientId,
            timestamp,
            messagePayload: event.messages[0].button.payload,
            messageText: event.messages[0].button.text,
            senderName,
          });
          break;

        case "audio":
          await storeAudioResponseMessage({
            senderPhone,
            clientId,
            timestamp,
            messageText: "Audio recibido", // Will be updated with transcription
            senderName,
            itemId: event.messages[0].audio.id,
          });
          break;

        case "image":
          await storeImageResponseMessage({
            senderPhone,
            clientId,
            timestamp,
            messageText: event.messages[0].image.caption || "Imagen recibida",
            senderName,
            itemId: event.messages[0].image.id,
          });
          break;

        case "interactive":
          await storeTextInteractiveMessage({
            senderPhone,
            orderId: event.messages[0].interactive.list_reply.id,
            clientId,
            timestamp,
            messageTitle: event.messages[0].interactive.list_reply.title,
            messageDescription:
              event.messages[0].interactive.list_reply.description,
            senderName,
          });
          break;

        default:
          console.warn("Unsupported message type:", messageType);
      }
    } catch (error) {
      console.error("Message processing failed:", error);
    }
  }
}

// Update the media processing functions
async function processAudioFile(audioId: string) {
  const url = `https://graph.facebook.com/v22.0/${audioId}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download audio file: ${response.statusText}`);
  }

  const data = await response.json();
  const WAAudioUrl = data.url;

  // Save to storage
  const audioResponse = await axios.get(WAAudioUrl, {
    headers: {
      Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
      "Content-Type": data.mime_type,
    },
    responseType: "arraybuffer",
  });

  const audioBuffer = await audioResponse.data;
  const newFilename = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.ogg`;
  const filePath = join("/", "tmp", newFilename);
  fs.writeFileSync(filePath, audioBuffer);

  await uploadToBucket("inventario", "audio/" + newFilename, filePath);
  const audioUrl = `${process.env.MINIO_URL}audio/${newFilename}`;

  // Transcribe audio using AI
  const transcription = await transcribeAudioWithAI(audioUrl);
  return { success: true, audioUrl, transcription };
}

async function processImageFile(imageId: string) {
  try {
    const url = `https://graph.facebook.com/v22.0/${imageId}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image metadata: ${response.statusText}`);
    }

    const data = await response.json();
    const WAImageUrl = data.url;

    // Save to storage
    const imageResponse = await axios.get(WAImageUrl, {
      headers: {
        Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
        "Content-Type": data.mime_type,
      },
      responseType: "arraybuffer",
    });

    const imageBuffer = await imageResponse.data;
    const newFilename = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.jpeg`;
    const filePath = join("/", "tmp", newFilename);
    fs.writeFileSync(filePath, imageBuffer);

    await uploadToBucket("inventario", "images/" + newFilename, filePath);
    const imageUrl = `${process.env.MINIO_URL}images/${newFilename}`;
    // Process image with AI
    const imageDescription = await processImageWithAI(imageUrl);

    return { success: true, imageUrl, description: imageDescription };
  } catch (error) {
    console.error("Error in processImageFile:", error);
    throw error;
  }
}

// Update the store functions to handle AI-processed content
async function storeAudioResponseMessage(messageDetails: any) {
  const audioResult = await processAudioFile(messageDetails.itemId);

  // Generate AI response based on transcription
  const aiResponse = await generateCustomerServiceResponse(
    audioResult.transcription,
    messageDetails.clientId,
    messageDetails.senderPhone
  );

  const newWAMessage = await prisma.whatsAppMessage.create({
    data: {
      clientId: messageDetails.clientId,
      phone: messageDetails.senderPhone,
      type: "audio",
      mediaUrl: audioResult.audioUrl,
      message: audioResult.transcription || "Audio recibido",
      sender: "CLIENT" as SenderType,
      timestamp: messageDetails.timestamp,
    },
  });

  console.log("Audio Message stored:", newWAMessage);

  if (aiResponse) {
    // Send AI response
    await sendWhatsAppMessage(messageDetails.senderPhone, aiResponse);

    // Store AI response
    await prisma.whatsAppMessage.create({
      data: {
        clientId: messageDetails.clientId,
        phone: messageDetails.senderPhone,
        type: "text",
        message: aiResponse,
        sender: "SYSTEM" as SenderType,
        timestamp: new Date(),
      },
    });
  }
}

async function storeImageResponseMessage(messageDetails: any) {
  const imageResult = await processImageFile(messageDetails.itemId);

  // Generate AI response based on image description
  const aiResponse = await generateCustomerServiceResponse(
    `El cliente envió una imagen con la descripción: ${imageResult.description}`,
    messageDetails.clientId,
    messageDetails.senderPhone
  );

  const newWAMessage = await prisma.whatsAppMessage.create({
    data: {
      clientId: messageDetails.clientId,
      phone: messageDetails.senderPhone,
      type: "image",
      mediaUrl: imageResult.imageUrl,
      message: imageResult.description || messageDetails.messageText,
      sender: "CLIENT" as SenderType,
      timestamp: messageDetails.timestamp,
    },
  });

  console.log("Image Message stored:", newWAMessage);

  if (aiResponse) {
    // Send AI response
    await sendWhatsAppMessage(messageDetails.senderPhone, aiResponse);

    // Store AI response
    await prisma.whatsAppMessage.create({
      data: {
        clientId: messageDetails.clientId,
        phone: messageDetails.senderPhone,
        type: "text",
        message: aiResponse,
        sender: "SYSTEM" as SenderType,
        timestamp: new Date(),
      },
    });
  }
}

// Store message (stub implementation)
async function storeTextMessage(messageDetails: any) {
  // First store the incoming message
  const newWAMessage = await prisma.whatsAppMessage.create({
    data: {
      clientId: messageDetails.clientId,
      phone: messageDetails.senderPhone,
      type: "text",
      message: messageDetails.messageText,
      sender: "CLIENT" as SenderType,
      timestamp: messageDetails.timestamp,
    },
  });

  console.log("Text Message stored:", newWAMessage);

  // Generate AI response
  const aiResponse = await generateCustomerServiceResponse(
    messageDetails.messageText,
    messageDetails.clientId,
    messageDetails.senderPhone
  );

  if (aiResponse) {
    // Send AI response
    await sendWhatsAppMessage(messageDetails.senderPhone, aiResponse);

    // Store AI response
    await prisma.whatsAppMessage.create({
      data: {
        clientId: messageDetails.clientId,
        phone: messageDetails.senderPhone,
        type: "text",
        message: aiResponse,
        sender: "SYSTEM" as SenderType,
        timestamp: new Date(),
      },
    });
  }
}

async function storeTextInteractiveMessage(messageDetails: any) {
  // typing on
  const data = JSON.stringify({
    messaging_product: "whatsapp",
    to: `52${messageDetails.senderPhone}`,
    type: "text",
    text: {
      body: "Estamos procesando tu solicitud...",
    },
  });

  const config = {
    method: "post",
    url: "https://graph.facebook.com/v22.0/340943589100021/messages",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
    },
    data: data,
  };

  await axios(config);

  const response = await processPdfFile(messageDetails.orderId);
  if (response.success) {
    const newWAMessage = await prisma.whatsAppMessage.create({
      data: {
        clientId: messageDetails.clientId,
        phone: messageDetails.senderPhone,
        type: "interactive",
        header: messageDetails.messageTitle,
        message: messageDetails.messageDescription,
        mediaUrl: response.pdfUrl,
        sender: "CLIENT" as SenderType,
        timestamp: messageDetails.timestamp,
      },
    });

    await sendWATemplateOrderPdfMessage(
      messageDetails.orderId,
      response.pdfUrl
    );
    console.log("PDF Message stored:", newWAMessage);
  }
}

async function storeButtonResponseMessage(messageDetails: any) {
  const newWAMessage = await prisma.whatsAppMessage.create({
    data: {
      clientId: messageDetails.clientId,
      phone: messageDetails.senderPhone,
      type: "button",
      message: messageDetails.messageText,
      sender: "CLIENT" as SenderType,
      timestamp: messageDetails.timestamp,
    },
  });

  if (messageDetails.messageText === "Ver Pedido") {
    // send last 3 orders as options
    await sendRecentOrdersInteractiveMessage(messageDetails.clientId);
  }

  console.log("Button Message stored:", newWAMessage);
}

async function processPdfFile(orderId: string) {
  try {
    // Step 1: Fetch pdf order receipt
    const url = `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/api/factura/${orderId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }

    // Step 2: Get the PDF buffer from the response
    const pdfBuffer = await response.arrayBuffer();

    // Step 3: Generate a unique filename and save the PDF to a temporary file
    const newFilename = `${orderId}.pdf`;
    const filePath = join("/", "tmp", newFilename);

    fs.writeFileSync(filePath, Buffer.from(pdfBuffer));

    // Step 4: Upload the file to the bucket
    await uploadToBucket("inventario", "pdf/" + newFilename, filePath);
    console.log("File uploaded to bucket");

    // Step 5: Return the public URL of the uploaded PDF
    const pdfUrl = `${process.env.MINIO_URL}pdf/${newFilename}`;
    return { success: true, pdfUrl };
  } catch (error) {
    console.error("Error in processPdfFile:", error);
    throw error; // Re-throw the error for further handling
  }
}
