"use client";
import React, { useEffect } from "react";

export default function ManualEmail() {
  useEffect(() => {
    async function runCron() {
      const res = await fetch(`/api/cron`, {
        headers: {
          "Content-Type": "application/json",
          Cookie: "ojñolasidfioasdfuñoasdikfh",
        },
        method: "POST",
      });

      if (res.ok) {
        console.log("response ok");
      } else {
        console.log("response failure");
      }
    }
    runCron();
  }, []);

  return <div>ManualEmail</div>;
}
