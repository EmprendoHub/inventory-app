import { PrismaClient } from "@prisma/client";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Shirt, UserPlus } from "lucide-react";
import { GiClothes } from "react-icons/gi";
import { TbComponents, TbRulerMeasure } from "react-icons/tb";
import { BiCategory } from "react-icons/bi";
import { FaWarehouse } from "react-icons/fa";
import { IconComponent } from "@/app/constants";
import { FaUsers } from "react-icons/fa";
import { LiaFileInvoiceDollarSolid } from "react-icons/lia";
import { GiPayMoney } from "react-icons/gi";
import { PiInvoice } from "react-icons/pi";
import { FaShippingFast } from "react-icons/fa";
import { RBAC_CONFIG } from "./rbac-config";

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

export async function generatePurchaseOrderId(prisma: PrismaClient) {
  const counterId = "po_counter";

  // Check if the counter already exists
  let pOCounter = await prisma.pOCounter.findUnique({
    where: { id: counterId },
  });

  if (!pOCounter) {
    // If the counter doesn't exist, create it
    pOCounter = await prisma.pOCounter.create({
      data: {
        id: counterId,
        sequence: 1, // Start with sequence 1
      },
    });
  } else {
    // If the counter exists, increment the sequence
    pOCounter = await prisma.pOCounter.update({
      where: { id: counterId },
      data: { sequence: { increment: 1 } },
    });
  }

  // Generate the order number using the sequence
  return pOCounter.sequence.toString().padStart(6, "0");
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

// Function to mask the input value
export const maskValue = (value: string) => {
  return value.replace(/./g, "•"); // Replace every character with a bullet (•)
};

export function generateDeliveryOTP() {
  // Generate a random 6-digit number
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString(); // Convert to string for consistency
}

export function generateTrackingNumber() {
  // Get the current timestamp in base-36 (alphanumeric)
  const timestampPart = Date.now().toString(36).toUpperCase();

  // Generate a random 4-character alphanumeric string
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();

  // Combine the timestamp and random parts to create a unique tracking number
  return `ENV-${timestampPart}-${randomPart}`;
}

export const iconMap: Record<string, IconComponent> = {
  TbComponents,
  Shirt,
  GiClothes,
  TbRulerMeasure,
  BiCategory,
  FaWarehouse,
  UserPlus,
  FaUsers,
  LiaFileInvoiceDollarSolid,
  GiPayMoney,
  PiInvoice,
  FaShippingFast,
};

export async function generateUniqueBarcode() {
  let barcode = "";
  for (let i = 0; i < 12; i++) {
    barcode += Math.floor(Math.random() * 10); // Random digit between 0 and 9
  }
  return barcode;
}

export async function generateUniqueSKU() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const timestampPart = Date.now().toString().slice(-4); // Last 4 digits of the timestamp
  return `SKU-${randomPart}-${timestampPart}`;
}

export function isRouteAllowed(role: string, pathname: string): boolean {
  const roleConfig = RBAC_CONFIG[role as keyof typeof RBAC_CONFIG];

  if (!roleConfig) {
    return false; // Role not found in config
  }

  const { allowedRoutes } = roleConfig;
  console.log("allowedRoutes", allowedRoutes);

  // Always allow access to /no-autorizado
  if (pathname === "/no-autorizado") {
    return true;
  }

  // If the role has access to all routes
  if (allowedRoutes.includes("*")) {
    return true;
  }

  // Check if the pathname matches any allowed route
  for (const route of allowedRoutes) {
    if (route.startsWith("!")) {
      console.log("route.startsWith(!):", route, route.startsWith("!"));

      // Deny route (e.g., "!/sistema/config")
      const denyRoute = route.slice(1);
      if (pathname.startsWith(denyRoute)) {
        return false;
      }
    } else {
      // Allow route (e.g., "/sistema/ventas/envios")
      console.log(
        "pathname.startsWith(route):",
        pathname.startsWith(route),
        pathname,
        route
      );

      if (pathname.startsWith(route)) {
        console.log("TRUEEEEEEEEEEEEEEEE");

        return true;
      }
    }
  }

  return false; // Route not allowed
}
