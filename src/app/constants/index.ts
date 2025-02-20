import { LucideIcon } from "lucide-react";
import { IconType } from "react-icons";

// Define a type that can handle both Lucide and React Icons
export type IconComponent = LucideIcon | IconType;

export interface InventoryItem {
  title: string;
  iconName: string;
  description: string;
  link: string;
  buttonText: string;
}

export const INVENTORY_ITEMS: InventoryItem[] = [
  {
    title: "Marcas",
    iconName: "TbComponents",
    description:
      "Crea multiples variantes del mismo articulo usando artículos agrupados",
    link: "/sistema/negocio/marcas/nueva",
    buttonText: "Marca Nueva",
  },
  {
    title: "Articulo",
    iconName: "Shirt",
    description:
      "Crea un articulo individual y servicio que puedes comprar y vender.",
    link: "/sistema/negocio/articulos/nuevo",
    buttonText: "Articulo Nuevo",
  },
  {
    title: "Artículos Compuestos",
    iconName: "GiClothes",
    description: "Agrupa varios artículos y véndelos en paquetes.",
    link: "/sistema/negocio/articulos/conjuntos/nuevo",
    buttonText: "Articulo Nuevo",
  },
  {
    title: "Unidades de Medida",
    iconName: "TbRulerMeasure",
    description:
      "Modifica los precios de tus articulos para contratos o transacciones espesificas.",
    link: "/sistema/negocio/unidades/nueva",
    buttonText: "Nueva Unidad",
  },
  {
    title: "Categoría",
    iconName: "BiCategory",
    description:
      "Crea una nueva categoría para clasificar tus artículos o servicios.",
    link: "/sistema/negocio/categorias/nueva",
    buttonText: "Categoría Nueva",
  },
  {
    title: "Bodegas",
    iconName: "FaWarehouse",
    description: "Agrega nueva bodega para mantener tu inventario organizado.",
    link: "/sistema/negocio/bodegas/nueva",
    buttonText: "Nueva Bodega",
  },
  {
    title: "Proveedor",
    iconName: "UserPlus",
    description:
      "Agrega nuevo Proveedor para mantener tu inventario organizado.",
    link: "/sistema/negocio/proveedores/nuevo",
    buttonText: "Nuevo Proveedor",
  },
];

export const SALES_ITEMS: InventoryItem[] = [
  {
    title: "Clientes",
    iconName: "FaUsers",
    description: "Crea un nuevo cliente a tu sistema.",
    link: "/sistema/ventas/clientes/crear",
    buttonText: "Cliente Nuevo",
  },
  {
    title: "Pedidos",
    iconName: "LiaFileInvoiceDollarSolid",
    description: "Crea un pedido nuevo.",
    link: "/sistema/ventas/pedidos/nuevo",
    buttonText: "Pedido Nuevo",
  },
  {
    title: "Envíos",
    iconName: "FaShippingFast",
    description: "Crea un nuevo envió para entrega.",
    link: "/sistema/ventas/envios/nuevo",
    buttonText: "Envió Nuevo",
  },
  {
    title: "Pagos",
    iconName: "GiPayMoney",
    description: "Recibe pagos para tus pedidos.",
    link: "/sistema/negocio/unidades/nueva",
    buttonText: "Nueva Unidad",
  },
  {
    title: "Facturas",
    iconName: "PiInvoice",
    description: "Crea una nueva factura CFDI para tu contabilidad.",
    link: "/sistema/negocio/facturas",
    buttonText: "Factura Nueva",
  },
];

export const roles = [
  {
    name: "CHOFER",
    value: "CHOFER",
    label: "CHOFER",
  },
  {
    name: "ADMIN",
    value: "ADMIN",
    label: "ADMIN",
  },
  {
    name: "GERENTE",
    value: "GERENTE",
    label: "GERENTE",
  },
];
