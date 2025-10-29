"use client";
import { BarChart, DollarSign, Home, Truck, Wallet2 } from "lucide-react";
import Link from "next/link";
import React from "react";
import { FaDollyFlatbed } from "react-icons/fa";
import { usePathname } from "next/navigation";
import { GiExpense } from "react-icons/gi";
import LogoIcon from "@/components/LogoIcon";
import { useSession } from "next-auth/react";
import { UserType } from "@/types/users";
import { TbReport } from "react-icons/tb";

export default function MobileMenu() {
  const path = usePathname();
  const { data: session } = useSession();

  const user = session?.user as UserType;
  return (
    <div
      className={`minmd:hidden duration-300 ease-in-out  bg-slate-800  text-slate-50 flex w-full justify-between fixed bottom-0 `}
    >
      {/* left */}
      <div className="flex flex-col text-sm justify-center">
        {/*   Links */}
        <nav className="flex  gap-3 px-1 ">
          <Link
            className={`flex items-center gap-2 ${
              path === "/sistema/home" ? "bg-blue-600" : ""
            } hover:bg-slate-900 p-4 rounded-md`}
            href={"/sistema/home"}
          >
            <Home size={24} />
          </Link>

          {/* Negocio */}
          {["SUPER_ADMIN", "ADMIN"].includes(user?.role || "") && (
            <Link
              className={`group justify-between flex w-full items-center gap-2  p-1.5   ${
                path === "/sistema/negocio" ? "bg-blue-600" : ""
              } hover:bg-slate-900 rounded-md`}
              href={"/sistema/negocio"}
            >
              <div className="flex items-center gap-1">
                <FaDollyFlatbed size={24} />
                <span className={`text-xl $`}>Negocio</span>
              </div>
            </Link>
          )}

          {/* Ventas */}
          {["SUPER_ADMIN", "ADMIN"].includes(user?.role || "") && (
            <Link
              className={`flex w-full items-center gap-2 p-4    ${
                path === "/sistema/ventas" ? "bg-blue-600" : ""
              } hover:bg-slate-900 rounded-md`}
              href={"/sistema/ventas"}
            >
              <DollarSign size={24} />
              <span className={`text-xl `}>Ventas</span>
            </Link>
          )}

          {/* CHOFER */}
          {!["SUPER_ADMIN", "ADMIN", "GERENTE"].includes(user?.role || "") && (
            <>
              <Link
                className={`flex w-full items-center gap-2  p-1.5 pl-2 pr-2 ${
                  path === "/sistema/ventas/envios" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/ventas/envios"}
              >
                <Truck size={24} />
                <span className={`text-xl `}>Envíos</span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2 p-1.5   ${
                  path === `/sistema/cajas/personal/${user?.id}`
                    ? "bg-blue-600"
                    : ""
                } hover:bg-slate-900 rounded-md`}
                href={`/sistema/cajas/personal/${user?.id}`}
              >
                <Wallet2 size={24} />
                <span className={`text-xl `}>Cartera</span>
              </Link>
            </>
          )}

          {/* GERENTE */}
          {!["SUPER_ADMIN", "ADMIN", "CHOFER"].includes(user?.role || "") && (
            <>
              <Link
                className={`flex w-full items-center gap-4 p-8    ${
                  path === "/sistema/ventas" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/ventas"}
              >
                <DollarSign size={24} />
                <span className={`text-xl `}>Ventas</span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2 p-8   ${
                  path === `/sistema/cajas/personal/${user?.id}`
                    ? "bg-blue-600"
                    : ""
                } hover:bg-slate-900 rounded-md`}
                href={`/sistema/cajas/personal/${user?.id}`}
              >
                <TbReport size={24} />
                <span className={`text-xl `}>Corte</span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2 p-8 
                 ${
                   path === "/sistema/contabilidad/gastos" ? "bg-blue-600" : ""
                 } hover:bg-slate-900 rounded-md`}
                href={"/sistema/contabilidad/gastos"}
              >
                <GiExpense size={24} />
                <span className={`text-xl `}>Gastos</span>
              </Link>
            </>
          )}

          {/*  Contabilidad */}
          {["ADMIN", "SUPER_ADMIN"].includes(user?.role || "") && (
            <Link
              className={`flex w-full items-center gap-2 p-1.5 pl-2 pr-2 
           ${
             path === "/sistema/contabilidad" ? "bg-blue-600" : ""
           } hover:bg-slate-900 rounded-md`}
              href={"/sistema/contabilidad"}
            >
              <GiExpense size={24} />
              <span className={`text-xl `}>ACCG</span>
            </Link>
          )}

          {["SUPER_ADMIN"].includes(user?.role || "") && (
            <Link
              className={`flex items-center gap-2 hover:bg-slate-900 p-4 rounded-md ${
                path === "/sistema/reportes" ? "bg-blue-600" : ""
              }`}
              href={"/sistema/reportes"}
            >
              <BarChart size={24} />
              <span className={`text-xl `}>Reportes</span>
            </Link>
          )}
        </nav>
      </div>
      {/*   Middle Logo  */}
      <div className="flex items-center gap-2 p-3 bg-slate-900">
        <LogoIcon className="w-14 h-auto" />
      </div>
    </div>
  );
}
