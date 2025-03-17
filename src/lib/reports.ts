import prisma from "@/lib/db";

export async function generateSalesReport(startDate: Date, endDate: Date) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      totalAmount: true,
      createdAt: true,
    },
  });

  const totalSales = orders.reduce((acc, order) => acc + order.totalAmount, 0);
  return { totalSales, orders };
}
