import React from "react";
import DashboardBanner from "./_components/DashboardBanner";
import SalesOverview from "./_components/SalesOverview";

const homePage = () => {
  return (
    <div>
      <DashboardBanner />
      <SalesOverview />
    </div>
  );
};

export default homePage;
