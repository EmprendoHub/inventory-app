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
      // Use Promise.all to handle all events concurrently
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

// Process message events
async function processMessageEvent(event: any) {
  if (event.statuses) {
    console.log("PROCESS statuses", event.statuses[0]);

    const WAPhone = event.statuses[0].recipient_id.replace(/^521/, "");
    const client = await prisma.client.findFirst({
      where: {
        phone: WAPhone,
      },
    });
    console.log(client);
  }

  if (event.messages) {
    console.log("PROCESS messages", event.messages[0]);

    const WAPhone = event.contacts[0].wa_id.replace(/^521/, "");
    const client = await prisma.client.findFirst({
      where: {
        phone: WAPhone,
      },
    });
    try {
      // Convert the string to a number
      const unixTimestamp = parseInt(event.messages[0].timestamp, 10);

      // Convert to milliseconds and create a Date object
      const timestamp = new Date(unixTimestamp * 1000);
      const senderPhone = WAPhone;
      const senderName = event.contacts[0].profile.name;
      const clientId = client?.id;
      const messageType = event.messages[0].type;

      if (messageType === "text") {
        await storeTextMessage({
          senderPhone,
          clientId,
          timestamp,
          messageText: event.messages[0].text.body,
          senderName,
        });
      }

      if (messageType === "button") {
        await storeButtonResponseMessage({
          senderPhone,
          clientId,
          timestamp,
          messagePayload: event.messages[0].button.payload,
          messageText: event.messages[0].button.text,
          senderName,
        });
      }

      if (messageType === "audio") {
        await storeAudioResponseMessage({
          senderPhone,
          clientId,
          timestamp,
          messageText: "no text",
          senderName,
          itemId: event.messages[0].audio.id,
        });
      }

      if (messageType === "image") {
        await storeImageResponseMessage({
          senderPhone,
          clientId,
          timestamp,
          messageText: event.messages[0].image.caption,
          senderName,
          itemId: event.messages[0].image.id,
        });
      }

      if (messageType === "interactive") {
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
      }
    } catch (error) {
      console.error("Message processing failed:", error);
    }
  }
}

// Store message (stub implementation)
async function storeTextMessage(messageDetails: any) {
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
}

async function storeTextInteractiveMessage(messageDetails: any) {
  const newWAMessage = await prisma.whatsAppMessage.create({
    data: {
      clientId: messageDetails.clientId,
      phone: messageDetails.senderPhone,
      type: "interactive",
      header: messageDetails.messageTitle,
      message: messageDetails.messageDescription,
      sender: "CLIENT" as SenderType,
      timestamp: messageDetails.timestamp,
    },
  });

  const response = await processPdfFile(messageDetails.orderId);
  if (response.success) {
    await sendWATemplateOrderPdfMessage(
      messageDetails.orderId,
      response.pdfUrl
    );
  }

  console.log("PDF Message stored:", newWAMessage);
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

async function storeAudioResponseMessage(messageDetails: any) {
  const audioResult = await processAudioFile(messageDetails.itemId);
  if (!audioResult.success) {
    throw new Error(`Failed to process audio file: ${audioResult}`);
  }
  const newWAMessage = await prisma.whatsAppMessage.create({
    data: {
      clientId: messageDetails.clientId,
      phone: messageDetails.senderPhone,
      type: "audio",
      mediaUrl: audioResult.audioUrl,
      message: messageDetails.messageText,
      sender: "CLIENT" as SenderType,
      timestamp: messageDetails.timestamp,
    },
  });

  console.log("Audio Message stored:", newWAMessage);
}

async function storeImageResponseMessage(messageDetails: any) {
  const imageResult = await processImageFile(messageDetails.itemId);
  if (!imageResult.success) {
    throw new Error(`Failed to process audio file: ${imageResult}`);
  }
  const newWAMessage = await prisma.whatsAppMessage.create({
    data: {
      clientId: messageDetails.clientId,
      phone: messageDetails.senderPhone,
      type: "image",
      mediaUrl: imageResult.imageUrl,
      message: messageDetails.caption,
      sender: "CLIENT" as SenderType,
      timestamp: messageDetails.timestamp,
    },
  });

  console.log("Image Message stored:", newWAMessage);
}

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
  const WAAudioUrl = data.url; // URL to download the audio file

  // Fetch the audio file as a blob
  const audioResponse = await axios.get(WAAudioUrl, {
    headers: {
      Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
      "Content-Type": data.mime_type,
    },
    responseType: "arraybuffer", // This is important for binary data
  });

  console.log("audioResponse", audioResponse);
  const audioBuffer = await audioResponse.data;

  const newFilename = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.ogg`;
  const filePath = join("/", "tmp", newFilename);
  fs.writeFileSync(filePath, audioBuffer);

  await uploadToBucket("inventario", "audio/" + newFilename, filePath);
  const audioUrl = `${process.env.MINIO_URL}audio/${newFilename}`;

  return { success: true, audioUrl };
}

async function processImageFile(imageId: string) {
  try {
    // Step 1: Fetch image metadata
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
    console.log("DATA", data);

    const WAImageUrl = data.url; // URL to download the image file
    console.log("WAImageUrl", WAImageUrl);

    // Step 2: Fetch the image file as a blob
    const imageResponse = await axios.get(WAImageUrl, {
      headers: {
        Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
        "Content-Type": data.mime_type,
      },
      responseType: "arraybuffer", // This is important for binary data
    });

    console.log("imageResponse", imageResponse);

    if (!imageResponse.data) {
      const errorBody = imageResponse.status; // or .json() if the response is JSON
      console.error("Error Response Body:", errorBody);
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.data;
    console.log("Image Bufer:", imageBuffer);

    // Step 3: Generate a unique filename and save the image to a temporary file
    const newFilename = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.jpeg`;
    const filePath = join("/", "tmp", newFilename);

    console.log("Saving file to:", filePath);
    fs.writeFileSync(filePath, imageBuffer);
    console.log("File saved successfully");

    // Step 4: Upload the file to the bucket
    await uploadToBucket("inventario", "images/" + newFilename, filePath);
    console.log("File uploaded to bucket");

    // Step 5: Return the public URL of the uploaded image
    const imageUrl = `${process.env.MINIO_URL}images/${newFilename}`;
    return { success: true, imageUrl };
  } catch (error) {
    console.error("Error in processImageFile:", error);
    throw error; // Re-throw the error for further handling
  }
}

async function processPdfFile(orderId: string) {
  try {
    // Step 1: Fetch pdf order receipt
    const url = `/api/factura/${orderId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }

    // Step 2: Get the PDF buffer from the response
    const pdfBuffer = await response.arrayBuffer();
    console.log("PDF Buffer:", pdfBuffer);

    // Step 3: Generate a unique filename and save the PDF to a temporary file
    const newFilename = `${orderId}.pdf`;
    const filePath = join("/", "tmp", newFilename);

    console.log("Saving file to:", filePath);
    fs.writeFileSync(filePath, Buffer.from(pdfBuffer));
    console.log("File saved successfully");

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
