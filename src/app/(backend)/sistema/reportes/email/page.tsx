import React from "react";
import ManualReport from "../_components/ManualReport";

export default function ManualEmail() {
  return <ManualReport secret={process.env.CRON_SECRET || ""} />;
}
