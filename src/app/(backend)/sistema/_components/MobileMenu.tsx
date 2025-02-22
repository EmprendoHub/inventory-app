"use client";
import {
  BanknoteIcon,
  BarChart,
  Building2,
  ChevronRight,
  DollarSign,
  FilesIcon,
  Home,
  Truck,
  Wallet2,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { FaDollyFlatbed } from "react-icons/fa";
import { FaCashRegister } from "react-icons/fa6";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { usePathname } from "next/navigation";
import { TbTransactionDollar } from "react-icons/tb";
import { GiExpense } from "react-icons/gi";
import LogoIcon from "@/components/LogoIcon";
import { useSession } from "next-auth/react";
import { UserType } from "@/types/users";

export default function MobileMenu() {
  const path = usePathname();
  const { data: session } = useSession();

  const user = session?.user as UserType;
  return (
    <div
      className={`minsm:hidden duration-300 ease-in-out  bg-slate-800  text-slate-50 flex w-full justify-between fixed bottom-0 `}
    >
      {/* left */}
      <div className="flex flex-col text-sm justify-center">
        {/*   Links */}
        <nav className="flex  gap-3 px-1 py-1.5 ">
          <Link
            className={`flex items-center gap-2 ${
              path === "/sistema/home" ? "bg-blue-600" : ""
            } hover:bg-slate-900 p-2 rounded-md`}
            href={"/sistema/home"}
          >
            <Home size={16} />
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
                <FaDollyFlatbed size={16} />
                <span className={`text-xs $`}>Negocio</span>
              </div>
            </Link>
          )}

          {/* Ventas */}
          {["SUPER_ADMIN", "ADMIN"].includes(user?.role || "") && (
            <Link
              className={`flex w-full items-center gap-2 p-1.5    ${
                path === "/sistema/ventas" ? "bg-blue-600" : ""
              } hover:bg-slate-900 rounded-md`}
              href={"/sistema/ventas"}
            >
              <DollarSign size={16} />
              <span className={`text-xs `}>Ventas</span>
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
                <Truck size={16} />
                <span className={`text-xs `}>Envíos</span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2 p-1.5   ${
                  path === `/sistema/cajas/personal/${user?.id}`
                    ? "bg-blue-600"
                    : ""
                } hover:bg-slate-900 rounded-md`}
                href={`/sistema/cajas/personal/${user?.id}`}
              >
                <Wallet2 size={16} />
                <span className={`text-xs `}>Cartera</span>
              </Link>
            </>
          )}

          {/* GERENTE */}
          {!["SUPER_ADMIN", "ADMIN", "CHOFER"].includes(user?.role || "") && (
            <>
              <Link
                className={`flex w-full items-center gap-2 p-1.5    ${
                  path === "/sistema/ventas" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/ventas"}
              >
                <DollarSign size={16} />
                <span className={`text-xs `}>Ventas</span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2 p-1.5   ${
                  path === `/sistema/cajas/personal/${user?.id}`
                    ? "bg-blue-600"
                    : ""
                } hover:bg-slate-900 rounded-md`}
                href={`/sistema/cajas/personal/${user?.id}`}
              >
                <FaCashRegister size={16} />
                <span className={`text-xs `}>Caja</span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2  p-1.5  pl-2 pr-2
                 ${
                   path === "/sistema/contabilidad/gastos" ? "bg-blue-600" : ""
                 } hover:bg-slate-900 rounded-md`}
                href={"/sistema/contabilidad/gastos"}
              >
                <GiExpense size={16} />
                <span className={`text-xs `}>Gastos</span>
              </Link>
            </>
          )}

          {/*  */}
          {["ADMIN"].includes(user?.role || "") && (
            <Link
              className={`flex w-full items-center gap-2 p-1.5 pl-2 pr-2 
           ${
             path === "/sistema/contabilidad" ? "bg-blue-600" : ""
           } hover:bg-slate-900 rounded-md`}
              href={"/sistema/contabilidad"}
            >
              <GiExpense size={16} />
              <span className={`text-xs `}>Conta</span>
            </Link>
          )}
          {/* Contabilidad */}

          {["SUPER_ADMIN"].includes(user?.role || "") && (
            <Collapsible className="w-full">
              <CollapsibleTrigger className="w-full">
                <div className="flex  items-center gap-1 hover:bg-slate-900 p-2 rounded-md justify-between">
                  <div className="flex items-center gap-2 ">
                    <Building2 size={16} />
                    <span className={`text-xs `}>Contabilidad</span>
                  </div>

                  <ChevronRight size={25} />
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="flex flex-col gap-1">
                <Link
                  className={`flex w-full items-center gap-2 p-1.5    ${
                    path === "/sistema/contabilidad/cuentas"
                      ? "bg-blue-600"
                      : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/contabilidad/cuentas"}
                >
                  <FilesIcon size={16} />
                  <span className={`text-xs `}>Cuentas</span>
                </Link>

                <Link
                  className={`flex w-full items-center gap-2 p-1.5    ${
                    path === "/sistema/cajas" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/cajas"}
                >
                  <FaCashRegister size={16} />
                  <span className={`text-xs `}>Cajas</span>
                </Link>
                <Link
                  className={`flex w-full items-center gap-2 p-1.5    ${
                    path === "/sistema/cajas/auditoria" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/cajas/auditoria"}
                >
                  <BanknoteIcon size={16} />
                  <span className={`text-xs `}>Cortes</span>
                </Link>
                <Link
                  className={`flex w-full items-center gap-2  p-1.5  ${
                    path === "/sistema/contabilidad/gastos" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/contabilidad/gastos"}
                >
                  <GiExpense size={16} />
                  <span className={`text-xs `}>Gastos</span>
                </Link>

                <Link
                  className={`flex w-full items-center gap-2  p-1.5   ${
                    path === "/sistema/contabilidad/transacciones"
                      ? "bg-blue-600"
                      : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/contabilidad/transacciones"}
                >
                  <TbTransactionDollar size={16} />
                  <span className={`text-xs `}>Transacciones</span>
                </Link>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Compras */}
          {["SUPER_ADMIN", "ADMIN"].includes(user?.role || "") && (
            <Link
              className={`flex w-full items-center gap-2 p-1.5    ${
                path === "/sistema/compras" ? "bg-blue-600" : ""
              } hover:bg-slate-900 rounded-md`}
              href={"/sistema/compras"}
            >
              <FilesIcon size={16} />
              <span className={`text-xs `}>OC</span>
            </Link>
          )}

          {["SUPER_ADMIN"].includes(user?.role || "") && (
            <Link
              className={`flex items-center gap-2 hover:bg-slate-900 p-2 rounded-md ${
                path === "/sistema/reportes" ? "bg-blue-600" : ""
              }`}
              href={"/sistema/reportes"}
            >
              <BarChart size={16} />
              <span className={`text-xs `}>Reportes</span>
            </Link>
          )}
        </nav>
      </div>
      {/*   Middle Logo  */}
      <div className="flex items-center gap-2 p-3 bg-slate-900">
        <LogoIcon className="w-8 h-auto" />
      </div>
    </div>
  );
}
