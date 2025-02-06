import { PrismaClient } from "@prisma/client";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface iAppProps {
  amount: number;
  currency: "MXN" | "USD";
}

export function formatCurrency({ amount, currency }: iAppProps) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export async function generateOrderId(prisma: PrismaClient) {
  try {
    // Create counter if it doesn't exist
    const newCounter = await prisma.counter.create({
      data: { id: "order_counter", sequence: 1 },
    });
    return newCounter.sequence.toString().padStart(6, "0");
  } catch (error) {
    console.log("error", error);

    // If counter exists, update it
    const updated = await prisma.counter.update({
      where: { id: "order_counter" },
      data: { sequence: { increment: 1 } },
    });
    return updated.sequence.toString().padStart(6, "0");
  }
}

export function getMexicoTime(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    timeZone: "America/Mexico_City",
    timeStyle: "short",
  });
}

export function getMexicoDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    timeZone: "America/Mexico_City",
    dateStyle: "medium",
  });
}

export function getMexicoFullDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    timeZone: "America/Mexico_City",
    dateStyle: "full",
    timeStyle: "long",
  });
}

export const getCookiesName = () => {
  let cookieName = "";

  if (process.env.NODE_ENV === "development") {
    cookieName = "next-auth.csrf-token";
  }

  if (process.env.NODE_ENV === "production") {
    cookieName = "__Host-next-auth.csrf-token";
  }

  return cookieName;
};

export const getSessionCookiesName = () => {
  let cookieName = "";

  if (process.env.NODE_ENV === "development") {
    cookieName = "next-auth.session-token";
  }

  if (process.env.NODE_ENV === "production") {
    cookieName = "__Secure-next-auth.session-token";
  }

  return cookieName;
};

export const isValidEmail = (email: string) => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string) => {
  const phoneRegex = /^(\+\d{2}\s?)?(\d{3}[-\s]?\d{3}[-\s]?\d{4})$/;
  return phoneRegex.test(phone);
};
