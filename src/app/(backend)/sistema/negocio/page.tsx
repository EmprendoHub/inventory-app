import React from "react";
import { Shirt, UserPlus } from "lucide-react";
import { GiClothes } from "react-icons/gi";
import { TbComponents, TbRulerMeasure } from "react-icons/tb";
import Link from "next/link";
import { BiCategory } from "react-icons/bi";
import { FaWarehouse } from "react-icons/fa";

export default function Inventario() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-6 maxmd:grid-cols-1 ">
        <div className="shadow-xl items-center bg-card p-8 rounded-md flex flex-col">
          <h3 className="font-semibold">Marcas</h3>
          <TbComponents strokeWidth={".5px"} size={140} />
          <p className="text-xs text-muted text-center">
            Crea multiples variantes del mismo articulo usando artículos
            agrupados
          </p>
          <Link
            href={"/sistema/negocio/marcas/nueva"}
            className="bg-accent text-white  px-3 py-1.5 rounded-md text-xs mt-2 hover:bg-foreground/30"
          >
            Marca Nueva
          </Link>
        </div>
        <div className="shadow-xl items-center bg-card p-8 rounded-md flex flex-col">
          <h3 className="font-semibold">Articulo</h3>
          <Shirt strokeWidth={".5px"} size={140} />
          <p className="text-xs text-muted text-center">
            Crea un articulo individual y servicio que puedes comprar y vender.
          </p>
          <Link
            href={"/sistema/negocio/articulos/nuevo"}
            className="bg-accent text-white px-3 py-1.5 rounded-md text-xs mt-2 hover:bg-foreground/30"
          >
            Articulo Nuevo
          </Link>
        </div>
        <div className="shadow-xl items-center bg-card p-8 rounded-md flex flex-col">
          <h3 className="font-semibold">Artículos Compuestos</h3>
          <GiClothes strokeWidth={".5px"} size={140} />
          <p className="text-xs text-muted text-center">
            Agrupa varios artículos y véndelos en paquetes.
          </p>
          <Link
            href={"/sistema/negocio/articulos/nuevo"}
            className="bg-accent text-white  px-3 py-1.5 rounded-md text-xs mt-2 hover:bg-foreground/30"
          >
            Articulo Nuevo
          </Link>
        </div>
        <div className="shadow-xl items-center bg-card p-8 rounded-md flex flex-col">
          <h3 className="font-semibold">Unidades de Medida</h3>
          <TbRulerMeasure strokeWidth={".5px"} size={140} />
          <p className="text-xs text-muted text-center">
            Modifica los precios de tus articulos para contratos o transacciones
            espesificas.
          </p>
          <Link
            href={"/sistema/negocio/unidades/nueva"}
            className="bg-accent text-white  px-3 py-1.5 rounded-md text-xs mt-2 hover:bg-foreground/30"
          >
            Nueva Unidad
          </Link>
        </div>
        <div className="shadow-xl items-center bg-card p-8 rounded-md flex flex-col">
          <h3 className="font-semibold">Categoría</h3>
          <BiCategory strokeWidth={".5px"} size={140} />
          <p className="text-xs text-muted text-center">
            Crea una nueva categoría para clasificar tus artículos o servicios.
          </p>
          <Link
            href={"/sistema/negocio/categorias/nueva"}
            className="bg-accent text-white  px-3 py-1.5 rounded-md text-xs mt-2 hover:bg-foreground/30"
          >
            Categoría Nueva
          </Link>
        </div>
        <div className="shadow-xl items-center bg-card p-8 rounded-md flex flex-col">
          <h3 className="font-semibold">Bodegas</h3>
          <FaWarehouse strokeWidth={".5px"} size={140} />
          <p className="text-xs text-muted text-center">
            Agrega nueva bodega para mantener tu inventario organizado.
          </p>
          <Link
            href={"/sistema/negocio/bodegas/nueva"}
            className="bg-accent text-white  px-3 py-1.5 rounded-md text-xs mt-2 hover:bg-foreground/30"
          >
            Nueva Bodega
          </Link>
        </div>
        <div className="shadow-xl items-center bg-card p-8 rounded-md flex flex-col">
          <h3 className="font-semibold">Proveedor</h3>
          <UserPlus strokeWidth={".5px"} size={140} />
          <p className="text-xs text-muted text-center">
            Agrega nuevo Proveedor para mantener tu inventario organizado.
          </p>
          <Link
            href={"/sistema/negocio/proveedores/nuevo"}
            className="bg-accent text-white  px-3 py-1.5 rounded-md text-xs mt-2 hover:bg-foreground/30"
          >
            Nuevo Proveedor
          </Link>
        </div>
      </div>
    </div>
  );
}
