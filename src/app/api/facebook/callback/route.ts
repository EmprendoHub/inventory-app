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
    if (payload.object === "page") {
      // Use Promise.all to handle all events concurrently
      await Promise.all(
        payload.entry.map(async (entry: any) => {
          const webhookEvent = entry.messaging || entry.changes;
          console.log("webhookEvent", webhookEvent);

          if (webhookEvent) {
            const eventPromises = webhookEvent.map(async (event: any) => {
              if (event.message) {
                return processMessageEvent(event);
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
  try {
    const senderPhone = event.sender.phone;
    const senderName = event.sender.name;
    const clientId = event.recipient.id;
    const timestamp = event.timestamp;
    const messageText = event.message.text;

    await storeMessage({
      senderPhone,
      clientId,
      timestamp,
      messageText,
      senderName,
    });
  } catch (error) {
    console.error("Message processing failed:", error);
  }
}

// Store message (stub implementation)
async function storeMessage(messageDetails: any) {
  const newWAMessage = await prisma.whatsAppMessage.create({
    data: {
      clientId: messageDetails.clientId,
      phone: messageDetails.phone,
      message: messageDetails.messageText,
      sender: "CLIENT" as SenderType,
      timestamp: new Date(messageDetails.timestamp),
    },
  });

  console.log("Message stored:", newWAMessage);
}
