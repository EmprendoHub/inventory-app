"use client";
import {
  BanknoteIcon,
  BarChart,
  Box,
  Boxes,
  Building2,
  ChevronLeft,
  ChevronRight,
  FilesIcon,
  Group,
  Home,
  PlusCircle,
  Truck,
  Users,
  Users2,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import React, { Dispatch, SetStateAction } from "react";
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

export default function SideBar({
  setHidden,
  hidden,
}: {
  setHidden: Dispatch<SetStateAction<boolean>>;
  hidden: boolean;
}) {
  const path = usePathname();
  const { data: session } = useSession();

  const user = session?.user as UserType;
  return (
    <aside
      className={` duration-300 ease-in-out min-h-screen bg-slate-800  text-slate-50 flex flex-col justify-between fixed ${
        hidden ? "w-10" : "w-44"
      }`}
    >
      {/* Top */}
      <div className="flex flex-col text-sm justify-center">
        {/*   Logo  */}
        <div className="flex items-center gap-2 p-3 bg-slate-900">
          <LogoIcon className="min-w-5 w-10 h-auto" />
          <div
            className={`gap-0 flex flex-col leading-[0] ${
              hidden ? "hidden" : "block"
            }`}
          >
            <span className="text-sm tracking-widest  leading-none">
              MUEBLES
            </span>
            <span className="text-2xl font-black  leading-none">YUNY</span>
          </div>
        </div>
        {/*   Links */}
        <nav className="flex flex-col gap-1 px-1 py-1.5 ">
          <Link
            className={`flex items-center gap-2 ${
              path === "/sistema/home" ? "bg-blue-600" : ""
            } hover:bg-slate-900 p-2 rounded-md`}
            href={"/sistema/home"}
          >
            <Home size={16} />
            <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
              Home
            </span>
          </Link>

          {/* Negocio */}
          {["SUPER_ADMIN", "ADMIN"].includes(user?.role || "") && (
            <Collapsible className="w-full">
              <CollapsibleTrigger className="w-full">
                <div className="flex  items-center gap-2 hover:bg-slate-900 p-2 rounded-md justify-between">
                  <div className="flex items-center gap-2 ">
                    <FaDollyFlatbed size={16} />
                    <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                      Negocio
                    </span>
                  </div>

                  <ChevronRight size={25} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="flex flex-col gap-1  ">
                {/* {user?.role === "SUPER_ADMIN" && (
                  <Link
                    className={`group flex w-full items-center justify-between gap-2 p-1.5   ${
                      hidden ? "pl-2 pr-2" : "pl-4 pr-2"
                    } ${
                      path === "/sistema/negocio" ? "bg-blue-600" : ""
                    } hover:bg-slate-900 rounded-md`}
                    href={"/sistema/negocio"}
                  >
                    <div className="flex items-center gap-1">
                      <Box size={16} />
                      <span
                        className={`text-xs ${hidden ? "hidden" : "block"}`}
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
                  className={`group justify-between flex w-full items-center gap-2  p-1.5  ${
                    hidden ? "pl-2 pr-2" : "pl-4 pr-2"
                  } ${
                    path === "/sistema/negocio/articulos" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/negocio/articulos"}
                >
                  <div className="flex items-center gap-1">
                    <Box size={16} />
                    <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                      Productos
                    </span>
                  </div>
                  <PlusCircle className="hidden group-hover:block" size={16} />
                </Link>
                <Link
                  className={`group justify-between flex w-full items-center gap-2  p-1.5  ${
                    hidden ? "pl-2 pr-2" : "pl-4 pr-2"
                  } ${
                    path === "/sistema/negocio/articulos/conjuntos"
                      ? "bg-blue-600"
                      : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/negocio/articulos/conjuntos"}
                >
                  <div className="flex items-center gap-1">
                    <Boxes size={16} />
                    <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                      Conjuntos
                    </span>
                  </div>
                  <PlusCircle className="hidden group-hover:block" size={16} />
                </Link>
                <Link
                  className={`group justify-between flex w-full items-center gap-2  p-1.5  ${
                    hidden ? "pl-2 pr-2" : "pl-4 pr-2"
                  } ${
                    path === "/sistema/negocio/categorias" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/negocio/categorias"}
                >
                  <div className="flex items-center gap-1">
                    <Group size={16} />
                    <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                      Categorías
                    </span>
                  </div>

                  <PlusCircle className="hidden group-hover:block" size={16} />
                </Link>
                <Link
                  className={`group justify-between flex w-full items-center gap-2  p-1.5  ${
                    hidden ? "pl-2 pr-2" : "pl-4 pr-2"
                  } ${
                    path === "/sistema/negocio/proveedores" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/negocio/proveedores"}
                >
                  <div className="flex items-center gap-1">
                    <BiSupport size={16} />
                    <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                      Proveedores
                    </span>
                  </div>

                  <PlusCircle className="hidden group-hover:block" size={16} />
                </Link>

                <Link
                  className={`group justify-between flex w-full items-center gap-2  p-1.5  ${
                    hidden ? "pl-2 pr-2" : "pl-4 pr-2"
                  } ${
                    path === "/sistema/negocio/marcas" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/negocio/marcas"}
                >
                  <div className="flex items-center gap-1">
                    <TbBrandAmigo size={16} />
                    <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                      Marcas
                    </span>
                  </div>
                  <PlusCircle className="hidden group-hover:block" size={16} />
                </Link>
                <Link
                  className={`group justify-between flex w-full items-center gap-2  p-1.5  ${
                    hidden ? "pl-2 pr-2" : "pl-4 pr-2"
                  } ${
                    path === "/sistema/negocio/bodegas" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/negocio/bodegas"}
                >
                  <div className="flex items-center gap-1">
                    <Warehouse size={16} />
                    <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                      Bodegas
                    </span>
                  </div>
                  <PlusCircle className="hidden group-hover:block" size={16} />
                </Link>
                <Link
                  className={`group justify-between flex w-full items-center gap-2  p-1.5  ${
                    hidden ? "pl-2 pr-2" : "pl-4 pr-2"
                  } ${
                    path === "/sistema/negocio/unidades" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/negocio/unidades"}
                >
                  <div className="flex items-center gap-1">
                    <GoSingleSelect size={16} />
                    <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                      Unidades
                    </span>
                  </div>
                  <PlusCircle className="hidden group-hover:block" size={16} />
                </Link>
                <Link
                  className={`flex w-full items-center gap-2  p-1.5  ${
                    hidden ? "pl-2 pr-2" : "pl-4 pr-2"
                  } ${
                    path === "/sistema/negocio/vehiculos" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/negocio/vehiculos"}
                >
                  <FaShippingFast size={16} />
                  <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                    Vehículos
                  </span>
                </Link>
                <Link
                  className={`flex w-full items-center gap-2  p-1.5  ${
                    hidden ? "pl-2 pr-2" : "pl-6 adminpr-4"
                  } ${
                    path === "/sistema/negocio/usuarios" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/negocio/usuarios"}
                >
                  <Users size={16} />
                  <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                    Usuarios
                  </span>
                </Link>
                {["SUPER_ADMIN"].includes(user?.role || "") && (
                  <Link
                    className={`group justify-between flex w-full items-center gap-2  p-1.5  ${
                      hidden ? "pl-2 pr-2" : "pl-4 pr-2"
                    } ${
                      path === "/sistema/negocio/ajustes/nuevo"
                        ? "bg-blue-600"
                        : ""
                    } hover:bg-slate-900 rounded-md`}
                    href={"/sistema/negocio/ajustes/nuevo"}
                  >
                    <div className="flex items-center gap-1">
                      <FaAdjust size={16} />
                      <span
                        className={`text-xs ${hidden ? "hidden" : "block"}`}
                      >
                        Ajustes inventario
                      </span>
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
          <Collapsible className="w-full">
            <CollapsibleTrigger className="w-full">
              <div className="flex  items-center gap-1 hover:bg-slate-900 p-2 rounded-md justify-between">
                <div className="flex items-center gap-2 ">
                  <FaShop size={16} />
                  <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                    Ventas
                  </span>
                </div>

                <ChevronRight size={25} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-1">
              {["SUPER_ADMIN", "ADMIN", "GERENTE"].includes(
                user?.role || ""
              ) && (
                <>
                  <Link
                    className={`flex w-full items-center gap-2 p-1.5  ${
                      hidden ? "pl-2 pr-2" : "pl-4 pr-2"
                    }  ${
                      path === "/sistema/ventas/clientes" ? "bg-blue-600" : ""
                    } hover:bg-slate-900 rounded-md`}
                    href={"/sistema/ventas/clientes"}
                  >
                    <Users2 size={16} />
                    <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                      Clientes
                    </span>
                  </Link>
                  <Link
                    className={`flex w-full items-center gap-2  p-1.5  ${
                      hidden ? "pl-2 pr-2" : "pl-4 pr-2"
                    } ${
                      path === "/sistema/ventas/pedidos" ? "bg-blue-600" : ""
                    } hover:bg-slate-900 rounded-md`}
                    href={"/sistema/ventas/pedidos"}
                  >
                    <PiInvoice size={16} />
                    <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                      Pedidos
                    </span>
                  </Link>
                </>
              )}

              <Link
                className={`flex w-full items-center gap-2  p-1.5  ${
                  hidden ? "pl-2 pr-2" : "pl-4 pr-2"
                } ${
                  path === "/sistema/ventas/envios" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/ventas/envios"}
              >
                <Truck size={16} />
                <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                  Envíos
                </span>
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
                <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
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
                <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                  Recibos
                </span>
              </Link> */}
              {["SUPER_ADMIN", "ADMIN", "GERENTE"].includes(
                user?.role || ""
              ) && (
                <Link
                  className={`flex w-full items-center gap-2  p-1.5  ${
                    hidden ? "pl-2 pr-2" : "pl-4 pr-2"
                  } ${
                    path === "/sistema/ventas/pagos" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/ventas/pagos"}
                >
                  <GiPayMoney size={16} />
                  <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                    Pagos
                  </span>
                </Link>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Mi caja */}
          {!["SUPER_ADMIN", "ADMIN"].includes(user?.role || "") && (
            <>
              <Link
                className={`flex w-full items-center gap-2 p-1.5  ${
                  hidden ? "pl-2 pr-2" : "pl-2 pr-4"
                }  ${
                  path === `/sistema/cajas/personal/${user?.id}`
                    ? "bg-blue-600"
                    : ""
                } hover:bg-slate-900 rounded-md`}
                href={`/sistema/cajas/personal/${user?.id}`}
              >
                <FaCashRegister size={16} />
                <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                  Caja
                </span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2  p-1.5  pl-2 pr-2
                 ${
                   path === "/sistema/contabilidad/gastos" ? "bg-blue-600" : ""
                 } hover:bg-slate-900 rounded-md`}
                href={"/sistema/contabilidad/gastos"}
              >
                <GiExpense size={16} />
                <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                  Gastos
                </span>
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
                <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                  Gastos
                </span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2 p-1.5 pl-2 pr-2 
                  ${
                    path === "/sistema/cajas/auditoria" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                href={"/sistema/cajas/auditoria"}
              >
                <BanknoteIcon size={16} />
                <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                  Cortes
                </span>
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
                    <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                      Contabilidad
                    </span>
                  </div>

                  <ChevronRight size={25} />
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="flex flex-col gap-1">
                <Link
                  className={`flex w-full items-center gap-2 p-1.5  ${
                    hidden ? "pl-2 pr-2" : "pl-4 pr-2"
                  }  ${
                    path === "/sistema/contabilidad/cuentas"
                      ? "bg-blue-600"
                      : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/contabilidad/cuentas"}
                >
                  <FilesIcon size={16} />
                  <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                    Cuentas
                  </span>
                </Link>

                <Link
                  className={`flex w-full items-center gap-2 p-1.5  ${
                    hidden ? "pl-2 pr-2" : "pl-4 pr-2"
                  }  ${
                    path === "/sistema/cajas" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/cajas"}
                >
                  <FaCashRegister size={16} />
                  <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                    Cajas
                  </span>
                </Link>
                <Link
                  className={`flex w-full items-center gap-2 p-1.5  ${
                    hidden ? "pl-2 pr-2" : "pl-4 pr-2"
                  }  ${
                    path === "/sistema/cajas/auditoria" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/cajas/auditoria"}
                >
                  <BanknoteIcon size={16} />
                  <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                    Cortes
                  </span>
                </Link>
                <Link
                  className={`flex w-full items-center gap-2  p-1.5  ${
                    hidden ? "pl-2 pr-2" : "pl-6 adminpr-4"
                  } ${
                    path === "/sistema/contabilidad/gastos" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/contabilidad/gastos"}
                >
                  <GiExpense size={16} />
                  <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                    Gastos
                  </span>
                </Link>

                <Link
                  className={`flex w-full items-center gap-2  p-1.5  ${
                    hidden ? "pl-2 pr-2" : "pl-4 pr-2"
                  } ${
                    path === "/sistema/contabilidad/transacciones"
                      ? "bg-blue-600"
                      : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/contabilidad/transacciones"}
                >
                  <TbTransactionDollar size={16} />
                  <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                    Transacciones
                  </span>
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
                    <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                      Compras
                    </span>
                  </div>

                  <ChevronRight size={25} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="flex flex-col gap-1">
                <Link
                  className={`flex w-full items-center gap-2 p-1.5  ${
                    hidden ? "pl-2 pr-2" : "pl-4 pr-2"
                  }  ${
                    path === "/sistema/compras" ? "bg-blue-600" : ""
                  } hover:bg-slate-900 rounded-md`}
                  href={"/sistema/compras"}
                >
                  <FilesIcon size={16} />
                  <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                    Ordenes de Compra
                  </span>
                </Link>
                {["SUPER_ADMIN"].includes(user?.role || "") && (
                  <Link
                    className={`flex w-full items-center gap-2  p-1.5  ${
                      hidden ? "pl-2 pr-2" : "pl-4 pr-2"
                    } ${
                      path === "/sistema/compras/recibos" ? "bg-blue-600" : ""
                    } hover:bg-slate-900 rounded-md`}
                    href={"/sistema/compras/recibos"}
                  >
                    <FaRegFileArchive size={16} />
                    <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                      Bienes
                    </span>
                  </Link>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* <Link
            className={`flex items-center gap-2 hover:bg-slate-900 p-2 rounded-md ${
              path === "/sistema/integraciones" ? "bg-blue-600" : ""
            }`}
            href={"/sistema/integraciones"}
          >
            <VscDebugDisconnect size={16} />
            <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
              Integraciones
            </span>
          </Link> */}
          {["SUPER_ADMIN"].includes(user?.role || "") && (
            <Link
              className={`flex items-center gap-2 hover:bg-slate-900 p-2 rounded-md ${
                path === "/sistema/reportes" ? "bg-blue-600" : ""
              }`}
              href={"/sistema/reportes"}
            >
              <BarChart size={16} />
              <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                Reportes
              </span>
            </Link>
          )}
        </nav>
      </div>

      {/* Bottom */}
      <div className="flex flex-col gap-4 w-full">
        {/* <SubscriptionCard
          className={`text-xs ${hidden ? "hidden" : "block"}`}
        /> */}
        {/*   Logo  */}
        <button
          onClick={() => setHidden((prev) => !prev)}
          className="flex items-end justify-end w-full gap-1 p-3 bg-slate-900"
        >
          {hidden ? <ChevronRight size={30} /> : <ChevronLeft size={30} />}
        </button>
      </div>
      {/*   Footer Icon*/}
    </aside>
  );
}
