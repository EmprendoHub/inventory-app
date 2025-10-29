"use client";
import React, { useState } from "react";
import SystemHeader from "./sistema/_components/SystemHeader";
import SideBar from "./sistema/_components/SideBar";
import { ModalProvider } from "@/app/context/ModalContext";
import MobileMenu from "./sistema/_components/MobileMenu";

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
          className={` w-full bg-background min-h-screen maxlg:mb-10 ${
            hidden ? "ml-10 maxlg:ml-0" : "ml-44 maxlg:ml-0"
          } duration-300 ease-in-out`}
        >
          <SystemHeader hidden={hidden} />
          <div className="p-4 maxlg:p-2 flex-1 pt-14 maxlg:pt-12">
            {children}
          </div>
        </main>
        <MobileMenu />
      </ModalProvider>
    </div>
  );
}
