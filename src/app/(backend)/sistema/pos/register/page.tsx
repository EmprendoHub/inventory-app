import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/options";
import PosRegisterClient from "./PosRegisterClient";
import prisma from "@/lib/db";
import { headers } from "next/headers";

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;
// Disable caching completely for this route
export const fetchCache = 'force-no-store';

export default async function PosRegisterPage() {
  // Set cache control headers to prevent any caching
  const headersList = headers();
  
  // Check authentication using the main app session
  const session = await getServerSession(options);

  if (!session?.user) {
    redirect("/iniciar");
  }

  // Verify user has POS access permissions
  const allowedRoles = ["EMPLEADO", "GERENTE", "ADMIN", "SUPER_ADMIN"];
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/no-autorizado");
  }

  // Get items for the POS - simplified for demo
  console.log('[POS Register] Fetching items at:', new Date().toISOString());
  
  const items = await prisma.item.findMany({
    where: {
      status: "ACTIVE",
    },
    include: {
      stocks: {
        select: {
          quantity: true,
        },
      },
    },
    take: 500, // Increased from 100 to support more products
    orderBy: { name: "asc" },
  });
  
  console.log('[POS Register] Found items:', items.length);
  console.log('[POS Register] Item names:', items.map(i => i.name).join(', '));

  // Transform items to match ItemType interface
  const posItems = items.map((item) => ({
    id: item.id,
    name: item.name,
    mainImage: item.mainImage,
    status: item.status,
    description: item.description,
    sku: item.sku,
    barcode: item.barcode,
    dimensions: item.dimensions,
    price: item.price,
    cost: item.cost,
    minStock: item.minStock,
    images: item.images,
    weight: item.weight,
    maxStock: item.maxStock,
    reorderPoint: item.reorderPoint,
    tax: item.tax,
    notes: item.notes,
    supplierId: item.supplierId,
    isDigital: item.isDigital,
    categoryId: item.categoryId,
    brandId: item.brandId,
    unitId: item.unitId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    // Add computed stock for POS usage
    totalStock: item.stocks.reduce((total, stock) => total + stock.quantity, 0),
  }));

  // Get customers for the POS
  const customers = await prisma.client.findMany({
    where: {
      status: "ACTIVE",
    },
    take: 50,
    orderBy: { name: "asc" },
  });

  // Transform customers to match clientType interface
  const posCustomers = customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    image: customer.image,
    status: customer.status,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  }));

  // Get favorites from database
  const dbFavorites = await prisma.favorite.findMany({
    where: {
      isActive: true,
    },
    orderBy: { position: "asc" },
  });

  // Transform favorites to match FavoriteType interface
  const favorites = dbFavorites.map((fav) => ({
    id: fav.id,
    itemId: fav.itemId,
    name: fav.name,
    price: fav.price,
    image: fav.image || "/images/product-placeholder.jpg",
    position: fav.position,
    isActive: fav.isActive,
    createdAt: fav.createdAt,
    updatedAt: fav.updatedAt,
  }));

  // Get active discounts from database
  const dbDiscounts = await prisma.discount.findMany({
    where: {
      isActive: true,
      AND: [
        {
          OR: [{ validFrom: null }, { validFrom: { lte: new Date() } }],
        },
        {
          OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
        },
      ],
    },
    orderBy: { name: "asc" },
  });

  // Transform discounts to match Discount type interface
  const discounts = dbDiscounts.map((discount) => ({
    id: discount.id,
    name: discount.name,
    code: discount.code || undefined,
    type: discount.type as any, // Convert Prisma enum to our enum
    value: discount.value,
    minAmount: discount.minAmount || undefined,
    maxAmount: discount.maxAmount || undefined,
    isActive: discount.isActive,
    validFrom: discount.validFrom || undefined,
    validUntil: discount.validUntil || undefined,
    usageLimit: discount.usageLimit || undefined,
    usageCount: discount.usageCount,
    createdAt: discount.createdAt,
    updatedAt: discount.updatedAt,
  }));

  return (
    <PosRegisterClient
      items={posItems}
      favorites={favorites}
      customers={posCustomers}
      discounts={discounts}
    />
  );
}
