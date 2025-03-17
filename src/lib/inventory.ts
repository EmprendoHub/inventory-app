import prisma from "@/lib/db";
import { sendMessage } from "./whatsapp";

export async function checkStockLevels() {
  // Fetch items with low stock
  const items = await prisma.item.findMany({
    where: {
      stocks: {
        some: {
          quantity: { lt: 10 }, // Filter items where any stock has quantity < 10
        },
      },
    },
    include: {
      stocks: true, // Include the stock details
    },
  });

  // Get unique supplier IDs
  const supplierIds = Array.from(new Set(items.map((item) => item.supplierId)));

  // Fetch all suppliers in a single query
  const suppliers = await prisma.supplier.findMany({
    where: { id: { in: supplierIds } },
    select: { id: true, phone: true },
  });

  // Create a map of supplier ID to phone number
  const supplierMap = suppliers.reduce(
    (acc: { [key: string]: string }, supplier) => {
      acc[supplier.id] = supplier.phone;
      return acc;
    },
    {}
  );

  // Group items by supplier
  const itemsBySupplier = items.reduce(
    (acc: { [key: string]: { items: typeof items } }, item) => {
      const supplierId = item.supplierId;
      if (!acc[supplierId]) {
        acc[supplierId] = {
          items: [],
        };
      }
      acc[supplierId].items.push(item);
      return acc;
    },
    {}
  );

  // Send messages to each supplier
  for (const supplierId in itemsBySupplier) {
    const supplierPhone = supplierMap[supplierId];
    if (!supplierPhone) {
      console.error(
        `Teléfono del proveedor no encontrado para ID: ${supplierId}`
      );
      continue;
    }

    const { items } = itemsBySupplier[supplierId];
    const message = `Alerta de stock bajo para los siguientes artículos:\n${items
      .map((item) => `- ${item.name}: Stock actual: ${item.stocks[0].quantity}`) // Access the first stock entry
      .join("\n")}`;

    await sendMessage(supplierPhone, message);
  }
}
