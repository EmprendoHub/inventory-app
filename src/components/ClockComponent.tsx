"use client";

import { getMexicoGlobalUtcSelectedDateTime } from "@/lib/utils";
import { useState, useEffect } from "react";

const ClockTime = () => {
  const [time, setTime] = useState(
    getMexicoGlobalUtcSelectedDateTime(new Date())
  );

  useEffect(() => {
    let animationFrameId: number;

    const updateClock = () => {
      setTime(getMexicoGlobalUtcSelectedDateTime(new Date()));
      animationFrameId = requestAnimationFrame(updateClock);
    };

    animationFrameId = requestAnimationFrame(updateClock);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return <div className="font-mono">{time.toLocaleTimeString()}</div>;
};

export default ClockTime;
