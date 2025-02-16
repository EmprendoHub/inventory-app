"use client";
import React, { useState } from "react";
import SystemHeader from "./sistema/_components/SystemHeader";
import SideBar from "./sistema/_components/SideBar";
import { ModalProvider } from "@/app/context/ModalContext";

export default function SystemLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [hidden, setHidden] = useState(true);

  return (
    <div className="flex ">
      <ModalProvider>
        <SideBar setHidden={setHidden} hidden={hidden} />
        <main
          className={` w-full bg-background min-h-screen ${
            hidden ? "ml-10" : "ml-52"
          } duration-300 ease-in-out`}
        >
          <SystemHeader />
          <div className="p-4 flex-1">{children}</div>
        </main>
      </ModalProvider>
    </div>
  );
}
