"use client";

import { getMexicoGlobalUtcSelectedDate } from "@/lib/utils";
import { useState, useEffect } from "react";

const ClockTime = () => {
  const [time, setTime] = useState(getMexicoGlobalUtcSelectedDate(new Date()));

  useEffect(() => {
    let animationFrameId: number;

    const updateClock = () => {
      setTime(getMexicoGlobalUtcSelectedDate(new Date()));
      animationFrameId = requestAnimationFrame(updateClock);
    };

    animationFrameId = requestAnimationFrame(updateClock);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return <div className="text-2xl font-mono">{time.toLocaleTimeString()}</div>;
};

export default ClockTime;
