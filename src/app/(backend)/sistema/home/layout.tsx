import React from "react";
import HomeNavbar from "./_components/HomeNavbar";

export default function HomeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="">
      <HomeNavbar />
      {children}
    </div>
  );
}
