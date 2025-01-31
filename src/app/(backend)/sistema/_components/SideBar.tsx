"use client";
import {
  BarChart,
  Box,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Folder,
  Group,
  Home,
  PlusCircle,
  Receipt,
  SaveAll,
  Truck,
  Users2,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import React, { Dispatch, SetStateAction } from "react";
import { FaAdjust, FaDolly, FaDollyFlatbed } from "react-icons/fa";
import { FaShop } from "react-icons/fa6";
import { MdPayment, MdSell } from "react-icons/md";
import { VscDebugDisconnect } from "react-icons/vsc";
import SubscriptionCard from "./SubscriptionCard";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { usePathname } from "next/navigation";
import { PiInvoice } from "react-icons/pi";
import { GoSingleSelect } from "react-icons/go";
import { TbBrandAmigo } from "react-icons/tb";

export default function SideBar({
  setHidden,
  hidden,
}: {
  setHidden: Dispatch<SetStateAction<boolean>>;
  hidden: boolean;
}) {
  const path = usePathname();
  return (
    <aside
      className={` duration-300 ease-in-out min-h-screen bg-slate-800 text-slate-50 flex flex-col justify-between fixed ${
        hidden ? "w-10" : "w-52"
      }`}
    >
      {/* Top */}
      <div className="flex flex-col text-sm justify-center">
        {/*   Logo  */}
        <div className="flex items-center gap-1 p-3 bg-slate-900">
          <FaDolly size={40} />
          <span
            className={`font-semibold text-xl ${hidden ? "hidden" : "block"}`}
          >
            Inventario
          </span>
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
          {/* Inventario */}
          <Collapsible className="w-full">
            <CollapsibleTrigger className="w-full">
              <div className="flex  items-center gap-2 hover:bg-slate-900 p-2 rounded-md justify-between">
                <div className="flex items-center gap-2 ">
                  <FaDollyFlatbed size={16} />
                  <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                    Inventario
                  </span>
                </div>

                <ChevronRight size={25} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-1">
              <Link
                className={`group flex w-full items-center justify-between gap-2 p-1.5   ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/inventario" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/inventario"}
              >
                <div className="flex items-center gap-1">
                  <Box size={16} />
                  <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                    Articulo
                  </span>
                </div>
                <PlusCircle className="hidden group-hover:block" size={16} />
              </Link>
              <Link
                className={`flex w-full items-center gap-2  p-1.5  ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/inventario/categorias" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/inventario/categorias"}
              >
                <Group size={16} />
                <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                  Categorías
                </span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2  p-1.5  ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/inventario/articulos" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/inventario/articulos"}
              >
                <Boxes size={16} />
                <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                  Artículos
                </span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2  p-1.5  ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/inventario/marcas" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/inventario/marcas"}
              >
                <TbBrandAmigo size={16} />
                <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                  Marcas
                </span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2  p-1.5  ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/inventario/bodegas" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/inventario/bodegas"}
              >
                <Warehouse size={16} />
                <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                  Bodegas
                </span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2  p-1.5  ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/inventario/unidades" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/inventario/unidades"}
              >
                <GoSingleSelect size={16} />
                <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                  Unidades
                </span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2  p-1.5  ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/inventario/ajustes" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/inventario/ajustes"}
              >
                <FaAdjust size={16} />
                <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                  Ajustes inventario
                </span>
              </Link>
            </CollapsibleContent>
          </Collapsible>

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
              <Link
                className={`flex w-full items-center gap-2 p-1.5  ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
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
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
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
              <Link
                className={`flex w-full items-center gap-2  p-1.5  ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/ventas/paquetes" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/ventas/paquetes"}
              >
                <Box size={16} />
                <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                  Paquetes
                </span>
              </Link>

              <Link
                className={`flex w-full items-center gap-2  p-1.5  ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
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
              <Link
                className={`flex w-full items-center gap-2  p-1.5  ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/ventas/facturas" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/ventas/facturas"}
              >
                <PiInvoice size={16} />
                <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                  Facturas
                </span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2  p-1.5  ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/ventas/receipts" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/ventas/receipts"}
              >
                <Receipt size={16} />
                <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                  Recibos
                </span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2  p-1.5  ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/ventas/pagos" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/ventas/pagos"}
              >
                <MdPayment size={16} />
                <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                  Pagos
                </span>
              </Link>
              <Link
                className={`flex w-full items-center gap-2  p-1.5  ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/ventas/apartados" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/ventas/apartados"}
              >
                <SaveAll size={16} />
                <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                  Apartados
                </span>
              </Link>
            </CollapsibleContent>
          </Collapsible>

          <button className="flex items-center gap-2 hover:bg-slate-900 p-2 rounded-md justify-between">
            <div className="flex items-center gap-2 ">
              <MdSell size={16} />
              <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                Compras
              </span>
            </div>

            <ChevronRight size={25} />
          </button>
          <Link
            className={`flex items-center gap-2 hover:bg-slate-900 p-2 rounded-md ${
              path === "/sistema/integraciones" ? "bg-blue-600" : ""
            }`}
            href={"/sistema/integraciones"}
          >
            <VscDebugDisconnect size={16} />
            <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
              Integraciones
            </span>
          </Link>
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
          <Link
            className={`flex items-center gap-2 hover:bg-slate-900 p-2 rounded-md ${
              path === "/sistema/documentos" ? "bg-blue-600" : ""
            }`}
            href={"/sistema/documentos"}
          >
            <Folder size={16} />
            <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
              Documentos
            </span>
          </Link>
        </nav>
      </div>

      {/* Bottom */}
      <div className="flex flex-col gap-4 w-full">
        <SubscriptionCard
          className={`text-xs ${hidden ? "hidden" : "block"}`}
        />
        {/*   Logo  */}
        <button
          onClick={() => setHidden((prev) => !prev)}
          className="flex items-end justify-end w-full gap-1 p-3 bg-slate-900"
        >
          {hidden ? <ChevronRight size={30} /> : <ChevronLeft size={30} />}
        </button>
      </div>
      {/*   Subscription Card  */}
      {/*   Footer Icon*/}
    </aside>
  );
}
