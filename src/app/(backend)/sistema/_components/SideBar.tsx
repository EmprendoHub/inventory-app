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
  Truck,
  Users,
  Users2,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import React, { Dispatch, SetStateAction } from "react";
import { FaAdjust, FaDolly, FaDollyFlatbed } from "react-icons/fa";
import { FaShop } from "react-icons/fa6";
import { MdPayment, MdSell } from "react-icons/md";
import { VscDebugDisconnect } from "react-icons/vsc";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { usePathname } from "next/navigation";
import { PiInvoice } from "react-icons/pi";
import { GoSingleSelect } from "react-icons/go";
import { TbBrandAmigo } from "react-icons/tb";
import { BiSupport } from "react-icons/bi";

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
                className={`group justify-between flex w-full items-center gap-2  p-1.5  ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/inventario/articulos" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/inventario/articulos"}
              >
                <div className="flex items-center gap-1">
                  <Boxes size={16} />
                  <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                    Productos
                  </span>
                </div>
                <PlusCircle className="hidden group-hover:block" size={16} />
              </Link>
              <Link
                className={`group justify-between flex w-full items-center gap-2  p-1.5  ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/inventario/categorias" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/inventario/categorias"}
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
                  <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                    Proveedores
                  </span>
                </div>

                <PlusCircle className="hidden group-hover:block" size={16} />
              </Link>

              <Link
                className={`group justify-between flex w-full items-center gap-2  p-1.5  ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/inventario/marcas" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/inventario/marcas"}
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
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/inventario/bodegas" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/inventario/bodegas"}
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
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
                } ${
                  path === "/sistema/inventario/unidades" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/inventario/unidades"}
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
                className={`group justify-between flex w-full items-center gap-2  p-1.5  ${
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
                  <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                    Ajustes inventario
                  </span>
                </div>
                <PlusCircle className="hidden group-hover:block" size={16} />
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
                  hidden ? "pl-2 pr-2" : "pl-6 adminpr-4"
                } ${
                  path === "/sistema/admin/usuarios" ? "bg-blue-600" : ""
                } hover:bg-slate-900 rounded-md`}
                href={"/sistema/admin/usuarios"}
              >
                <Users size={16} />
                <span className={`text-xs ${hidden ? "hidden" : "block"}`}>
                  Usuarios
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
              {/* <Link
                className={`flex w-full items-center gap-2  p-1.5  ${
                  hidden ? "pl-2 pr-2" : "pl-6 pr-4"
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
