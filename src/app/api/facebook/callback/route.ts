import { uploadAudioBlobAction, uploadImageBlobAction } from "@/app/_actions";
import prisma from "@/lib/db";
import { SenderType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

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
          messageText: event.messages[0].button.payload,
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
          messageText: "no text",
          senderName,
          itemId: event.messages[0].image.id,
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

  console.log("Text Message stored:", newWAMessage);
}

async function storeAudioResponseMessage(messageDetails: any) {
  const audioResult = await processAudioFile(messageDetails.itemId);
  if (!audioResult.success) {
    throw new Error(`Failed to process audio file: ${audioResult.error}`);
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
    throw new Error(`Failed to process audio file: ${imageResult.error}`);
  }
  const newWAMessage = await prisma.whatsAppMessage.create({
    data: {
      clientId: messageDetails.clientId,
      phone: messageDetails.senderPhone,
      type: "image",
      mediaUrl: imageResult.imageUrl,
      message: messageDetails.messageText,
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
  const audioUrl = data.url; // URL to download the audio file
  console.log("audioUrl", audioUrl);

  // Fetch the audio file as a blob
  const audioResponse = await fetch(audioUrl);
  const audioBlob = await audioResponse.blob();

  const uploadedAudioUrl = await uploadAudioBlobAction(audioBlob);

  return uploadedAudioUrl;
}

async function processImageFile(imageId: string) {
  const url = `https://graph.facebook.com/v22.0/${imageId}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("DATA", data);

  const imageUrl = data.url; // URL to download the image file
  console.log("imageUrl", imageUrl);

  // Fetch the image file as a blob
  const imageResponse = await fetch(imageUrl);
  const imageBlob = await imageResponse.blob();

  const uploadedAudioUrl = await uploadImageBlobAction(imageBlob);

  return uploadedAudioUrl;
}
