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
  console.log("PROCESS messages", event.messages[0]);
  const client = await prisma.client.findFirst({
    where: {
      phone: event.contacts[0].wa_id,
    },
  });
  // const client = await prisma.client.findFirst({
  //   where: {
  //     phone: "3532464146",
  //   },
  // });
  try {
    // Convert the string to a number
    const unixTimestamp = parseInt(event.messages[0].timestamp, 10);

    // Convert to milliseconds and create a Date object
    const timestamp = new Date(unixTimestamp * 1000);
    const senderPhone = event.contacts[0].wa_id;
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
        messageText: event.messages[0].text.body,
        senderName,
      });
    }
  } catch (error) {
    console.error("Message processing failed:", error);
  }
}

// Store message (stub implementation)
async function storeTextMessage(messageDetails: any) {
  const newWAMessage = await prisma.whatsAppMessage.create({
    data: {
      clientId: messageDetails.clientId,
      phone: messageDetails.senderPhone,
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
      message: messageDetails.messageText,
      sender: "CLIENT" as SenderType,
      timestamp: messageDetails.timestamp,
    },
  });

  console.log("Text Message stored:", newWAMessage);
}
