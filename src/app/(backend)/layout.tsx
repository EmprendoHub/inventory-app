"use client";
import React, { useState } from "react";
import SystemHeader from "./sistema/_components/SystemHeader";
import SideBar from "./sistema/_components/SideBar";

export default function SystemLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [hidden, setHidden] = useState(false);

  return (
    <div className="flex ">
      <SideBar setHidden={setHidden} hidden={hidden} />
      <main
        className={` w-full bg-slate-100 min-h-screen ${
          hidden ? "ml-10" : "ml-52"
        } duration-300 ease-in-out`}
      >
        <SystemHeader />
        <div className="p-4">{children}</div>
      </main>
    </div>
  );
}
