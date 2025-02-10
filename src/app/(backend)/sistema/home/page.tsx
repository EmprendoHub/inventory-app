import React from "react";
// import DashboardBanner from "./_components/DashboardBanner";
import SalesOverview from "./_components/SalesOverview";
import prisma from "@/lib/db";

const homePage = async () => {
  const payments = await prisma.payment.findMany({});
  const orders = await prisma.order.findMany({});
  const shipments = await prisma.delivery.findMany({});

  return (
    <div>
      {/* <DashboardBanner /> */}
      <SalesOverview
        payments={payments}
        orders={orders}
        shipments={shipments}
      />
    </div>
  );
};

export default homePage;
