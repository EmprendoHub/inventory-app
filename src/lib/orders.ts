import prisma from "@/lib/db";
import { sendMessage } from "./whatsapp";

export async function getOrderStatus(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });
  return order?.status;
}

export async function notifyOrderStatus(phone: string, orderId: string) {
  const status = await getOrderStatus(orderId);
  const message = `Your order ${orderId} is currently ${status}.`;
  await sendMessage(phone, message);
}
