"use client";
import {
  BanknoteIcon,
  BarChart,
  Box,
  Boxes,
  Building2,
  ChevronRight,
  FilesIcon,
  Group,
  Home,
  PlusCircle,
  Truck,
  Users,
  Users2,
  Wallet2,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import {
  FaAdjust,
  FaDollyFlatbed,
  FaRegFileArchive,
  FaShippingFast,
} from "react-icons/fa";
import { FaCashRegister, FaShop } from "react-icons/fa6";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { usePathname } from "next/navigation";
import { PiInvoice } from "react-icons/pi";
import { GoSingleSelect } from "react-icons/go";
import { TbBrandAmigo, TbTransactionDollar } from "react-icons/tb";
import { BiPurchaseTag, BiSupport } from "react-icons/bi";
import { GiExpense, GiPayMoney } from "react-icons/gi";
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
        <nav className="flex  gap-1 px-1 py-1.5 ">
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
            <Collapsible className="w-full">
              <CollapsibleTrigger className="w-full">
                <div className="flex  items-center gap-2 hover:bg-slate-900 p-2 rounded-md justify-between">
                  <div className="flex items-center gap-2 ">
                    <FaDollyFlatbed size={16} />
                    <span className={`text-xs `}>Negocio</span>
                  </div>

                  <ChevronRight size={25} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="flex flex-col gap-1  ">
                {/* {user?.role === "SUPER_ADMIN" && (
                  <Link
                    className={`group flex w-full items-center justify-between gap-2 p-1.5    ${
                      path === "/sistema/negocio" ? "bg-blue-600" : ""
                    } hover:bg-slate-900 rounded-md`}
                    href={"/sistema/negocio"}
                  >
                    <div className="flex items-center gap-1">
                      <Box size={16} />
                      <span
                        className={`text-xs `}
                      >
                        Articulo
                      </span>
                    </div>
                    <PlusCircle
                      className="hidden group-hover:block"
                      size={16}
                    />
                  </Link>
                )} */}

                <Link
                  className={`group justify-between flex w-full items-center gap-2  p-1.5   ${
                    path === "/sistema/negocio/articulos" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/negocio/articulos"}
                >
                  <div className="flex items-center gap-1">
                    <Box size={16} />
                    <span className={`text-xs $`}>Productos</span>
                  </div>
                  <PlusCircle className="hidden group-hover:block" size={16} />
                </Link>
                <Link
                  className={`group justify-between flex w-full items-center gap-2  p-1.5   ${
                    path === "/sistema/negocio/articulos/conjuntos"
                      ? "bg-blue-600"
                      : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/negocio/articulos/conjuntos"}
                >
                  <div className="flex items-center gap-1">
                    <Boxes size={16} />
                    <span className={`text-xs `}>Conjuntos</span>
                  </div>
                  <PlusCircle className="hidden group-hover:block" size={16} />
                </Link>
                <Link
                  className={`group justify-between flex w-full items-center gap-2  p-1.5   ${
                    path === "/sistema/negocio/categorias" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/negocio/categorias"}
                >
                  <div className="flex items-center gap-1">
                    <Group size={16} />
                    <span className={`text-xs `}>Categorías</span>
                  </div>

                  <PlusCircle className="hidden group-hover:block" size={16} />
                </Link>
                <Link
                  className={`group justify-between flex w-full items-center gap-2  p-1.5  ${
                    path === "/sistema/negocio/proveedores" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/negocio/proveedores"}
                >
                  <div className="flex items-center gap-1">
                    <BiSupport size={16} />
                    <span className={`text-xs `}>Proveedores</span>
                  </div>

                  <PlusCircle className="hidden group-hover:block" size={16} />
                </Link>

                <Link
                  className={`group justify-between flex w-full items-center gap-2  p-1.5  ${
                    path === "/sistema/negocio/marcas" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/negocio/marcas"}
                >
                  <div className="flex items-center gap-1">
                    <TbBrandAmigo size={16} />
                    <span className={`text-xs `}>Marcas</span>
                  </div>
                  <PlusCircle className="hidden group-hover:block" size={16} />
                </Link>
                <Link
                  className={`group justify-between flex w-full items-center gap-2  p-1.5 ${
                    path === "/sistema/negocio/bodegas" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/negocio/bodegas"}
                >
                  <div className="flex items-center gap-1">
                    <Warehouse size={16} />
                    <span className={`text-xs `}>Bodegas</span>
                  </div>
                  <PlusCircle className="hidden group-hover:block" size={16} />
                </Link>
                <Link
                  className={`group justify-between flex w-full items-center gap-2  p-1.5 ${
                    path === "/sistema/negocio/unidades" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/negocio/unidades"}
                >
                  <div className="flex items-center gap-1">
                    <GoSingleSelect size={16} />
                    <span className={`text-xs `}>Unidades</span>
                  </div>
                  <PlusCircle className="hidden group-hover:block" size={16} />
                </Link>
                <Link
                  className={`flex w-full items-center gap-2  p-1.5 ${
                    path === "/sistema/negocio/vehiculos" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/negocio/vehiculos"}
                >
                  <FaShippingFast size={16} />
                  <span className={`text-xs `}>Vehículos</span>
                </Link>
                <Link
                  className={`flex w-full items-center gap-2  p-1.5 ${
                    path === "/sistema/negocio/usuarios" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/negocio/usuarios"}
                >
                  <Users size={16} />
                  <span className={`text-xs `}>Usuarios</span>
                </Link>
                {["SUPER_ADMIN"].includes(user?.role || "") && (
                  <Link
                    className={`group justify-between flex w-full items-center gap-2  p-1.5   ${
                      path === "/sistema/negocio/ajustes/nuevo"
                        ? "bg-blue-600"
                        : ""
                    } hover:bg-slate-900 rounded-md`}
                    href={"/sistema/negocio/ajustes/nuevo"}
                  >
                    <div className="flex items-center gap-1">
                      <FaAdjust size={16} />
                      <span className={`text-xs `}>Ajustes inventario</span>
                    </div>
                    <PlusCircle
                      className="hidden group-hover:block"
                      size={16}
                    />
                  </Link>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Ventas */}
          {["SUPER_ADMIN", "ADMIN", "GERENTE"].includes(user?.role || "") && (
            <>
              <Collapsible className="w-full">
                <CollapsibleTrigger className="w-full">
                  <div className="flex  items-center gap-1 hover:bg-slate-900 p-2 rounded-md justify-between">
                    <div className="flex items-center gap-2 ">
                      <FaShop size={16} />
                      <span className={`text-xs `}>Ventas</span>
                    </div>

                    <ChevronRight size={25} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="flex flex-col gap-1">
                  <Link
                    className={`flex w-full items-center gap-2 p-1.5    ${
                      path === "/sistema/ventas/clientes" ? "bg-blue-600" : ""
                    } hover:bg-slate-900 rounded-md`}
                    href={"/sistema/ventas/clientes"}
                  >
                    <Users2 size={16} />
                    <span className={`text-xs `}>Clientes</span>
                  </Link>
                  <Link
                    className={`flex w-full items-center gap-2  p-1.5   ${
                      path === "/sistema/ventas/pedidos" ? "bg-blue-600" : ""
                    } hover:bg-slate-900 rounded-md`}
                    href={"/sistema/ventas/pedidos"}
                  >
                    <PiInvoice size={16} />
                    <span className={`text-xs `}>Pedidos</span>
                  </Link>

                  <Link
                    className={`flex w-full items-center gap-2  p-1.5   ${
                      path === "/sistema/ventas/envios" ? "bg-blue-600" : ""
                    } hover:bg-slate-900 rounded-md`}
                    href={"/sistema/ventas/envios"}
                  >
                    <Truck size={16} />
                    <span className={`text-xs `}>Envíos</span>
                  </Link>
                  {/* <Link
                className={`flex w-full items-center gap-2  p-1.5  ${
                  hidden ? "pl-2 pr-2" : "pl-4 pr-2"
                } ${
                  path === "/sistema/ventas/facturas" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/ventas/facturas"}
              >
                <PiInvoice size={16} />
                <span className={`text-xs `}>
                  Facturas
                </span>
              </Link> */}
                  {/* <Link
                className={`flex w-full items-center gap-2  p-1.5  ${
                  hidden ? "pl-2 pr-2" : "pl-4 pr-2"
                } ${
                  path === "/sistema/ventas/recibos" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/ventas/recibos"}
              >
                <Receipt size={16} />
                <span className={`text-xs `}>
                  Recibos
                </span>
              </Link> */}

                  <Link
                    className={`flex w-full items-center gap-2  p-1.5   ${
                      path === "/sistema/ventas/pagos" ? "bg-blue-600" : ""
                    } hover:bg-slate-900 rounded-md`}
                    href={"/sistema/ventas/pagos"}
                  >
                    <GiPayMoney size={16} />
                    <span className={`text-xs `}>Pagos</span>
                  </Link>
                </CollapsibleContent>
              </Collapsible>
            </>
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
            <>
              {" "}
              <Link
                className={`flex w-full items-center gap-2 p-1.5 pl-2 pr-2 
                ${
                  path === "/sistema/contabilidad/gastos" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/contabilidad/gastos"}
              >
                <GiExpense size={16} />
                <span className={`text-xs `}>Gastos</span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2 p-1.5 pl-2 pr-2 
                  ${
                    path === "/sistema/cajas/auditoria" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                href={"/sistema/cajas/auditoria"}
              >
                <BanknoteIcon size={16} />
                <span className={`text-xs `}>Cortes</span>
              </Link>
            </>
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
            <Collapsible className="w-full">
              <CollapsibleTrigger className="w-full">
                <div className="flex  items-center gap-1 hover:bg-slate-900 p-2 rounded-md justify-between">
                  <div className="flex items-center gap-2 ">
                    <BiPurchaseTag size={16} />
                    <span className={`text-xs `}>Compras</span>
                  </div>

                  <ChevronRight size={25} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="flex flex-col gap-1">
                <Link
                  className={`flex w-full items-center gap-2 p-1.5    ${
                    path === "/sistema/compras" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/compras"}
                >
                  <FilesIcon size={16} />
                  <span className={`text-xs `}>Ordenes de Compra</span>
                </Link>
                {["SUPER_ADMIN"].includes(user?.role || "") && (
                  <Link
                    className={`flex w-full items-center gap-2  p-1.5   ${
                      path === "/sistema/compras/recibos" ? "bg-blue-600" : ""
                    } hover:bg-slate-900 rounded-md`}
                    href={"/sistema/compras/recibos"}
                  >
                    <FaRegFileArchive size={16} />
                    <span className={`text-xs `}>Bienes</span>
                  </Link>
                )}
              </CollapsibleContent>
            </Collapsible>
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
        <LogoIcon className="w-5 h-auto" />
      </div>
    </div>
  );
}
