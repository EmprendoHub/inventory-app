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
  const counterId = "order_counter";

  // Check if the counter already exists
  let counter = await prisma.counter.findUnique({
    where: { id: counterId },
  });

  if (!counter) {
    // If the counter doesn't exist, create it
    counter = await prisma.counter.create({
      data: {
        id: counterId,
        sequence: 1, // Start with sequence 1
      },
    });
  } else {
    // If the counter exists, increment the sequence
    counter = await prisma.counter.update({
      where: { id: counterId },
      data: { sequence: { increment: 1 } },
    });
  }

  // Generate the order number using the sequence
  return counter.sequence.toString().padStart(6, "0");
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

export const verifySupervisorCode = async (
  code: string = ""
): Promise<boolean> => {
  // Implement your logic to verify the supervisor code
  // For example, you can make an API call to verify the code
  // This is a placeholder implementation
  return ["1234", "5795", "8745"].includes(code); // Replace with actual verification logic
};

// Function to mask the input value
export const maskValue = (value: string) => {
  return value.replace(/./g, "•"); // Replace every character with a bullet (•)
};
