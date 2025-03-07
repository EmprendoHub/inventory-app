"use server";

import OpenAI from "openai";
import prisma from "@/lib/db";
import { ChatCompletionMessageParam } from "openai/resources/chat";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate ChatGPT response based on customer message
export async function generateChatGPTResponse(
  clientMessage: string,
  clientId: string
) {
  try {
    // Get last 10 messages for context
    const conversationHistory = await prisma.whatsAppMessage.findMany({
      where: { clientId },
      orderBy: { timestamp: "desc" },
      take: 10,
      select: { message: true, sender: true },
    });

    // Format conversation history
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `Eres un agente de servicio al cliente muy servicial trabajas para una empresa de venta de muebles al por mayor y al por menor. Se amable, profesional y servicial. Se conciso en tus respuestas. Si no está seguro de los detalles del pedido, solicita una aclaración.`,
      },
      ...conversationHistory
        .reverse()
        .map<ChatCompletionMessageParam>((msg) => ({
          role: msg.sender === "CLIENT" ? "user" : "assistant",
          content: msg.message,
        })),
    ];

    // Add current message
    messages.push({ role: "user", content: clientMessage });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 256,
    });

    return response.choices[0].message.content?.trim();
  } catch (error) {
    console.error("ChatGPT API error:", error);
    return null;
  }
}

// Send WhatsApp message using ChatGPT response
export async function sendWhatsAppMessage(phone: string, message: string) {
  try {
    const data = JSON.stringify({
      messaging_product: "whatsapp",
      to: `52${phone}`,
      type: "text",
      text: { body: message },
    });

    const response = await fetch(
      `https://graph.facebook.com/v22.0/${process.env.WA_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
        },
        body: data,
      }
    );

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${await response.text()}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Message sending failed:", error);
    return { success: false };
  }
}
