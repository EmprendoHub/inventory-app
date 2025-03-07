"use server";
import { OpenAI } from "openai";
import axios from "axios";

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
