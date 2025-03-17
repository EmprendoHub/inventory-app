import { sendWhatsAppMessage } from "@/app/(backend)/sistema/ventas/clientes/_actions/chatgpt";
import axios from "axios";

export async function sendMessage(phone: string, message: string) {
  try {
    await sendWhatsAppMessage(phone, message);
  } catch (error) {
    console.error(`Failed to send WhatsApp message: ${error}`);
  }
}

export async function sendRichMediaMessage(
  phone: string,
  mediaUrl: string,
  caption: string
) {
  const data = JSON.stringify({
    messaging_product: "whatsapp",
    to: phone,
    type: "image",
    image: {
      link: mediaUrl,
      caption: caption,
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

  await axios(config);
}
