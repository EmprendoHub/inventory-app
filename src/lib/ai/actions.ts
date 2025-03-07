"use server";
import { OpenAI } from "openai";
import axios from "axios";
import prisma from "../db";
import { ChatCompletionMessageParam } from "openai/resources/chat";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Updated function for processing images
export async function processImageWithAI(imageUrl: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe esta imagen con detalle en español.",
            },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 300,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error processing image with AI:", error);
    return "No se pudo procesar la imagen";
  }
}

// Updated function for transcribing audio
export async function transcribeAudioWithAI(audioUrl: string) {
  try {
    // Download the audio file
    const response = await axios.get(audioUrl, {
      responseType: "arraybuffer",
      headers: {
        Authorization: `Bearer ${process.env.WA_BUSINESS_TOKEN}`,
      },
    });

    // Create a file-like object from response data
    const audioFile = new File([response.data], "audio.ogg", {
      type: "audio/ogg",
    });

    // Transcribe audio using OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "text",
      language: "es",
    });

    return transcription;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return "No se pudo transcribir el audio";
  }
}

export async function generateCustomerServiceResponse(
  message: string,
  clientId: string | undefined,
  phone: string,
  prompt?: string | null
) {
  try {
    if (!phone) {
      console.error("Phone number is missing");
      return "Error: No phone number provided.";
    }

    // Get conversation history
    const history = await prisma.whatsAppMessage.findMany({
      where: { phone },
      orderBy: { timestamp: "desc" },
      take: 10,
      select: { message: true, sender: true },
    });

    // System prompt (correctly typed)
    const systemPrompt: ChatCompletionMessageParam = {
      role: "system",
      content:
        prompt ||
        `Eres un asistente de servicio al cliente y ventas para una tienda en línea. 
      Responde en español de manera amable y profesional. Si no tienes suficiente información,
      pregunta amablemente para obtener más detalles.`,
    };

    // Format messages correctly
    const messages: ChatCompletionMessageParam[] = [
      systemPrompt,
      ...history.reverse().map<ChatCompletionMessageParam>((msg) => ({
        role: msg.sender === "CLIENT" ? "user" : "assistant",
        content: msg.message,
      })),
      { role: "user", content: message },
    ];

    // Generate response
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 256,
    });

    return (
      response.choices[0]?.message?.content?.trim() ||
      "No se pudo generar respuesta."
    );
  } catch (error) {
    console.error("Error generating customer service response:", error);
    return "Disculpa, estoy teniendo dificultades para responder. Por favor intenta de nuevo más tarde.";
  }
}

export async function storeMessage(messageDetails: any) {
  return prisma.whatsAppMessage.create({
    data: {
      clientId: messageDetails.clientId,
      phone: messageDetails.phone,
      type: messageDetails.type,
      message: messageDetails.message,
      mediaUrl: messageDetails.mediaUrl,
      sender: messageDetails.sender,
      timestamp: messageDetails.timestamp,
      sentiment: messageDetails.sentiment,
      template: messageDetails.template,
    },
  });
}
