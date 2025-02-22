"use client";
import { Building2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function HomeNavbar() {
  const { data: session } = useSession();

  const path = usePathname();
  return (
    <div className="h-24 flex flex-col justify-between shadow-md bg-secondary  mb-4 p-3">
      <div className="flex items-center justify-start rounded-md px-2 gap-3 ">
        <Building2 size={30} className="text-gray-500" />
        <div className="flex flex-col">
          <p className="text-xl leading-none">Hola, {session?.user?.name}</p>
          <span className="text-sm text-muted">{session?.user?.email}</span>
        </div>
      </div>
      {/* Navigation */}
      <div className=" h-12 p-2 rounded-md">
        <ul className="flex text-sm text-muted items-center gap-6">
          <li
            className={` ${
              path === "/sistema/home" ? "border-b-2 border-primary" : ""
            }`}
          >
            <Link href="/sistema/home">Dashboard</Link>
          </li>
          <li
            className={` ${
              path === "/sistema/home/comenzando"
                ? "border-b-2 border-primary"
                : ""
            }`}
          >
            <Link href="/sistema/home/comenzando">Comenzando</Link>
          </li>
          <li
            className={` ${
              path === "/sistema/home/notificaciones"
                ? "border-b-2 border-primary"
                : ""
            }`}
          >
            <Link href="/sistema/home/notificaciones">Notificaciones</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
