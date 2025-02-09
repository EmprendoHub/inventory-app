"use client";
import {
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
import React, { Dispatch, SetStateAction, useState } from "react";
import {
  FaAdjust,
  FaDolly,
  FaDollyFlatbed,
  FaRegFileArchive,
} from "react-icons/fa";
import { FaShop, FaTruckFast } from "react-icons/fa6";
import { MdPayment } from "react-icons/md";
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
import { GiExpense } from "react-icons/gi";

export default function SideBar({
  setHidden,
  hidden,
}: {
  setHidden: Dispatch<SetStateAction<boolean>>;
  hidden: boolean;
}) {
  const path = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <aside
      className={`duration-300 ease-in-out min-h-screen bg-slate-800 text-slate-50 flex flex-col justify-between fixed 
      ${hidden ? "w-10" : "w-52"}`}
    >
      {/* Top */}
      <div className="flex flex-col text-sm justify-center">
        {/*   Logo  */}
        <div className="flex items-center gap-1 p-3 bg-slate-900">
          <FaDolly size={40} />
          <span
            className={`font-semibold text-xl transition-opacity duration-300 ${
              hidden ? "opacity-0" : "opacity-100"
            }`}
          >
            Inventario
          </span>
        </div>
        {/*   Links */}
        <nav className="flex flex-col gap-1 px-1 py-1.5">
          <Link
            className={`flex items-center gap-2 ${
              path === "/sistema/home" ? "bg-blue-600" : ""
            } hover:bg-slate-900 p-2 rounded-md`}
            href={"/sistema/home"}
          >
            <Home size={16} />
            <span
              className={`text-xs transition-opacity duration-300 ${
                hidden ? "opacity-0" : "opacity-100"
              }`}
            >
              Home
            </span>
          </Link>

          {/* Inventario */}
          <Collapsible
            className="w-full"
            open={openSections["inventario"]}
            onOpenChange={() => toggleSection("inventario")}
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center gap-2 hover:bg-slate-900 p-2 rounded-md justify-between">
                <div className="flex items-center gap-2">
                  <FaDollyFlatbed size={16} />
                  <span
                    className={`text-xs transition-opacity duration-300 ${
                      hidden ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    Inventario
                  </span>
                </div>
                <ChevronRight
                  size={25}
                  className={`transform transition-transform duration-300 ${
                    openSections["inventario"] ? "rotate-90" : ""
                  } ${hidden ? "opacity-0" : "opacity-100"}`}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-1">
              <Link
                className={`group flex w-full items-center justify-between gap-2 p-1.5 ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/inventario" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/inventario"}
              >
                <div className="flex items-center gap-1">
                  <Box size={16} />
                  <span
                    className={`text-xs transition-opacity duration-300 ${
                      hidden ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    Articulo
                  </span>
                </div>
                <PlusCircle
                  className={`hidden group-hover:block transition-opacity duration-300 ${
                    hidden ? "opacity-0" : "opacity-100"
                  }`}
                  size={16}
                />
              </Link>
              <Link
                className={`group justify-between flex w-full items-center gap-2 p-1.5 ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/inventario/articulos" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/inventario/articulos"}
              >
                <div className="flex items-center gap-1">
                  <Boxes size={16} />
                  <span
                    className={`text-xs transition-opacity duration-300 ${
                      hidden ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    Productos
                  </span>
                </div>
                <PlusCircle
                  className={`hidden group-hover:block transition-opacity duration-300 ${
                    hidden ? "opacity-0" : "opacity-100"
                  }`}
                  size={16}
                />
              </Link>
              <Link
                className={`group justify-between flex w-full items-center gap-2 p-1.5 ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/inventario/categorias" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/inventario/categorias"}
              >
                <div className="flex items-center gap-1">
                  <Group size={16} />
                  <span
                    className={`text-xs transition-opacity duration-300 ${
                      hidden ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    Categorías
                  </span>
                </div>
                <PlusCircle
                  className={`hidden group-hover:block transition-opacity duration-300 ${
                    hidden ? "opacity-0" : "opacity-100"
                  }`}
                  size={16}
                />
              </Link>
              <Link
                className={`group justify-between flex w-full items-center gap-2 p-1.5 ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/inventario/proveedores"
                    ? "bg-blue-600"
                    : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/inventario/proveedores"}
              >
                <div className="flex items-center gap-1">
                  <BiSupport size={16} />
                  <span
                    className={`text-xs transition-opacity duration-300 ${
                      hidden ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    Proveedores
                  </span>
                </div>
                <PlusCircle
                  className={`hidden group-hover:block transition-opacity duration-300 ${
                    hidden ? "opacity-0" : "opacity-100"
                  }`}
                  size={16}
                />
              </Link>
              <Link
                className={`group justify-between flex w-full items-center gap-2 p-1.5 ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/inventario/marcas" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/inventario/marcas"}
              >
                <div className="flex items-center gap-1">
                  <TbBrandAmigo size={16} />
                  <span
                    className={`text-xs transition-opacity duration-300 ${
                      hidden ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    Marcas
                  </span>
                </div>
                <PlusCircle
                  className={`hidden group-hover:block transition-opacity duration-300 ${
                    hidden ? "opacity-0" : "opacity-100"
                  }`}
                  size={16}
                />
              </Link>
              <Link
                className={`group justify-between flex w-full items-center gap-2 p-1.5 ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/inventario/bodegas" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/inventario/bodegas"}
              >
                <div className="flex items-center gap-1">
                  <Warehouse size={16} />
                  <span
                    className={`text-xs transition-opacity duration-300 ${
                      hidden ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    Bodegas
                  </span>
                </div>
                <PlusCircle
                  className={`hidden group-hover:block transition-opacity duration-300 ${
                    hidden ? "opacity-0" : "opacity-100"
                  }`}
                  size={16}
                />
              </Link>
              <Link
                className={`group justify-between flex w-full items-center gap-2 p-1.5 ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/inventario/unidades" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/inventario/unidades"}
              >
                <div className="flex items-center gap-1">
                  <GoSingleSelect size={16} />
                  <span
                    className={`text-xs transition-opacity duration-300 ${
                      hidden ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    Unidades
                  </span>
                </div>
                <PlusCircle
                  className={`hidden group-hover:block transition-opacity duration-300 ${
                    hidden ? "opacity-0" : "opacity-100"
                  }`}
                  size={16}
                />
              </Link>
              <Link
                className={`group justify-between flex w-full items-center gap-2 p-1.5 ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/inventario/ajustes/nuevo"
                    ? "bg-blue-600"
                    : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/inventario/ajustes/nuevo"}
              >
                <div className="flex items-center gap-1">
                  <FaAdjust size={16} />
                  <span
                    className={`text-xs transition-opacity duration-300 ${
                      hidden ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    Ajustes inventario
                  </span>
                </div>
                <PlusCircle
                  className={`hidden group-hover:block transition-opacity duration-300 ${
                    hidden ? "opacity-0" : "opacity-100"
                  }`}
                  size={16}
                />
              </Link>
            </CollapsibleContent>
          </Collapsible>

          {/* Ventas */}
          <Collapsible
            className="w-full"
            open={openSections["ventas"]}
            onOpenChange={() => toggleSection("ventas")}
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center gap-1 hover:bg-slate-900 p-2 rounded-md justify-between">
                <div className="flex items-center gap-2">
                  <FaShop size={16} />
                  <span
                    className={`text-xs transition-opacity duration-300 ${
                      hidden ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    Ventas
                  </span>
                </div>
                <ChevronRight
                  size={25}
                  className={`transform transition-transform duration-300 ${
                    openSections["ventas"] ? "rotate-90" : ""
                  } ${hidden ? "opacity-0" : "opacity-100"}`}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-1">
              <Link
                className={`flex w-full items-center gap-2 p-1.5 ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/ventas/clientes" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/ventas/clientes"}
              >
                <Users2 size={16} />
                <span
                  className={`text-xs transition-opacity duration-300 ${
                    hidden ? "opacity-0" : "opacity-100"
                  }`}
                >
                  Clientes
                </span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2 p-1.5 ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/ventas/pedidos" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/ventas/pedidos"}
              >
                <PiInvoice size={16} />
                <span
                  className={`text-xs transition-opacity duration-300 ${
                    hidden ? "opacity-0" : "opacity-100"
                  }`}
                >
                  Pedidos
                </span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2 p-1.5 ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/admin/usuarios" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/admin/usuarios"}
              >
                <Users size={16} />
                <span
                  className={`text-xs transition-opacity duration-300 ${
                    hidden ? "opacity-0" : "opacity-100"
                  }`}
                >
                  Usuarios
                </span>
              </Link>

              <Link
                className={`flex w-full items-center gap-2 p-1.5 ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/ventas/envios" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/ventas/envios"}
              >
                <Truck size={16} />
                <span
                  className={`text-xs transition-opacity duration-300 ${
                    hidden ? "opacity-0" : "opacity-100"
                  }`}
                >
                  Envíos
                </span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2 p-1.5 ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/ventas/facturas" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/ventas/facturas"}
              >
                <PiInvoice size={16} />
                <span
                  className={`text-xs transition-opacity duration-300 ${
                    hidden ? "opacity-0" : "opacity-100"
                  }`}
                >
                  Facturas
                </span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2 p-1.5 ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/ventas/pagos" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/ventas/pagos"}
              >
                <MdPayment size={16} />
                <span
                  className={`text-xs transition-opacity duration-300 ${
                    hidden ? "opacity-0" : "opacity-100"
                  }`}
                >
                  Pagos
                </span>
              </Link>
            </CollapsibleContent>
          </Collapsible>

          {/* Negocio */}
          <Collapsible
            className="w-full"
            open={openSections["negocio"]}
            onOpenChange={() => toggleSection("negocio")}
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center gap-1 hover:bg-slate-900 p-2 rounded-md justify-between">
                <div className="flex items-center gap-2">
                  <Building2 size={16} />
                  <span
                    className={`text-xs transition-opacity duration-300 ${
                      hidden ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    Negocio
                  </span>
                </div>
                <ChevronRight
                  size={25}
                  className={`transform transition-transform duration-300 ${
                    openSections["negocio"] ? "rotate-90" : ""
                  } ${hidden ? "opacity-0" : "opacity-100"}`}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-1">
              <Link
                className={`flex w-full items-center gap-2 p-1.5 ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/negocio/contabilidad/cuentas"
                    ? "bg-blue-600"
                    : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/negocio/contabilidad/cuentas"}
              >
                <FilesIcon size={16} />
                <span
                  className={`text-xs transition-opacity duration-300 ${
                    hidden ? "opacity-0" : "opacity-100"
                  }`}
                >
                  Cuentas
                </span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2 p-1.5 ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/negocio/vehiculos" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/negocio/vehiculos"}
              >
                <FaTruckFast size={16} />
                <span
                  className={`text-xs transition-opacity duration-300 ${
                    hidden ? "opacity-0" : "opacity-100"
                  }`}
                >
                  Vehículos
                </span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2 p-1.5 ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/negocio/contabilidad/gastos"
                    ? "bg-blue-600"
                    : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/negocio/contabilidad/gastos"}
              >
                <GiExpense size={16} />
                <span
                  className={`text-xs transition-opacity duration-300 ${
                    hidden ? "opacity-0" : "opacity-100"
                  }`}
                >
                  Gastos
                </span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2 p-1.5 ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/negocio/contabilidad/transacciones"
                    ? "bg-blue-600"
                    : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/negocio/contabilidad/transacciones"}
              >
                <TbTransactionDollar size={16} />
                <span
                  className={`text-xs transition-opacity duration-300 ${
                    hidden ? "opacity-0" : "opacity-100"
                  }`}
                >
                  Transacciones
                </span>
              </Link>
            </CollapsibleContent>
          </Collapsible>

          {/* Compras */}
          <Collapsible
            className="w-full"
            open={openSections["compras"]}
            onOpenChange={() => toggleSection("compras")}
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center gap-1 hover:bg-slate-900 p-2 rounded-md justify-between">
                <div className="flex items-center gap-2">
                  <BiPurchaseTag size={16} />
                  <span
                    className={`text-xs transition-opacity duration-300 ${
                      hidden ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    Compras
                  </span>
                </div>
                <ChevronRight
                  size={25}
                  className={`transform transition-transform duration-300 ${
                    openSections["compras"] ? "rotate-90" : ""
                  } ${hidden ? "opacity-0" : "opacity-100"}`}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-1">
              <Link
                className={`flex w-full items-center gap-2 p-1.5 ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/compras" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/compras"}
              >
                <FilesIcon size={16} />
                <span
                  className={`text-xs transition-opacity duration-300 ${
                    hidden ? "opacity-0" : "opacity-100"
                  }`}
                >
                  Ordenes de Compra
                </span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2 p-1.5 ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/compras/recibos" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/compras/recibos"}
              >
                <FaRegFileArchive size={16} />
                <span
                  className={`text-xs transition-opacity duration-300 ${
                    hidden ? "opacity-0" : "opacity-100"
                  }`}
                >
                  Bienes
                </span>
              </Link>
            </CollapsibleContent>
          </Collapsible>

          {/* Reportes */}
          <Link
            className={`flex items-center gap-2 hover:bg-slate-900 p-2 rounded-md ${
              path === "/sistema/reportes" ? "bg-blue-600" : ""
            }`}
            href={"/sistema/reportes"}
          >
            <BarChart size={16} />
            <span
              className={`text-xs transition-opacity duration-300 ${
                hidden ? "opacity-0" : "opacity-100"
              }`}
            >
              Reportes
            </span>
          </Link>
        </nav>
      </div>

      {/* Bottom */}
      <div className="flex flex-col gap-4 w-full">
        <button
          onClick={() => setHidden((prev) => !prev)}
          className="flex items-end justify-end w-full gap-1 p-3 bg-slate-900"
        >
          <ChevronRight
            size={30}
            className={`transform transition-transform duration-300 ${
              hidden ? "" : "rotate-180"
            }`}
          />
        </button>
      </div>
    </aside>
  );
}
