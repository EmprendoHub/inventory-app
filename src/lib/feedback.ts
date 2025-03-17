import prisma from "@/lib/db";
import { sendMessage } from "./whatsapp";

export async function sendFeedbackSurvey(phone: string) {
  const message = "How was your experience with our service?";
  await sendMessage(phone, message);
}

export async function storeFeedback(phone: string, feedback: string) {
  await prisma.feedback.create({
    data: {
      phone,
      feedback,
    },
  });
}
