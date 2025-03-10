"use client";
import React from "react";

export default function ManualReport({ secret }: { secret: string }) {
  console.log("secret", secret);

  const runWeeklyCron = async () => {
    const res = await fetch(`/api/cron`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      method: "POST",
    });

    if (res.ok) {
      console.log("response ok");
    } else {
      console.log("response failure");
    }
  };

  const runDailyCron = async () => {
    const res = await fetch(`/api/daily-cron`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      method: "POST",
    });

    if (res.ok) {
      console.log("response ok");
    } else {
      console.log("response failure");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center w-full h-full gap-10">
      <button onClick={() => runWeeklyCron()}>Reporte Semanal</button>
      <button onClick={() => runDailyCron()}>Reporte Diario</button>
    </div>
  );
}
