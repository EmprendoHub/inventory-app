import { LucideIcon } from "lucide-react";
import { IconType } from "react-icons";

// Define a type that can handle both Lucide and React Icons
export type IconComponent = LucideIcon | IconType;

export interface InventoryItem {
  title: string;
  iconName: string;
  description: string;
  link: string;
  linkAll: string;
  buttonText: string;
}

export const INVENTORY_ITEMS: InventoryItem[] = [
  {
    title: "Marcas",
    iconName: "TbComponents",
    description:
      "Crea multiples variantes del mismo articulo usando artículos agrupados",
    link: "/sistema/negocio/marcas/nueva",
    linkAll: "/sistema/ventas/envios",
    buttonText: "Marca Nueva",
  },
  {
    title: "Articulo",
    iconName: "Shirt",
    description:
      "Crea un articulo individual y servicio que puedes comprar y vender.",
    link: "/sistema/negocio/articulos/nuevo",
    linkAll: "/sistema/ventas/envios",
    buttonText: "Articulo Nuevo",
  },
  {
    title: "Artículos Compuestos",
    iconName: "GiClothes",
    description: "Agrupa varios artículos y véndelos en paquetes.",
    link: "/sistema/negocio/articulos/conjuntos/nuevo",
    linkAll: "/sistema/ventas/envios",
    buttonText: "Articulo Nuevo",
  },
  {
    title: "Unidades de Medida",
    iconName: "TbRulerMeasure",
    description:
      "Modifica los precios de tus articulos para contratos o transacciones espesificas.",
    link: "/sistema/negocio/unidades/nueva",
    linkAll: "/sistema/ventas/envios",
    buttonText: "Nueva Unidad",
  },
  {
    title: "Categoría",
    iconName: "BiCategory",
    description:
      "Crea una nueva categoría para clasificar tus artículos o servicios.",
    link: "/sistema/negocio/categorias/nueva",
    linkAll: "/sistema/ventas/envios",
    buttonText: "Categoría Nueva",
  },
  {
    title: "Bodegas",
    iconName: "FaWarehouse",
    description: "Agrega nueva bodega para mantener tu inventario organizado.",
    link: "/sistema/negocio/bodegas/nueva",
    linkAll: "/sistema/ventas/envios",
    buttonText: "Nueva Bodega",
  },
  {
    title: "Proveedor",
    iconName: "UserPlus",
    description:
      "Agrega nuevo Proveedor para mantener tu inventario organizado.",
    link: "/sistema/negocio/proveedores/nuevo",
    linkAll: "/sistema/ventas/envios",
    buttonText: "Nuevo Proveedor",
  },
];

export const SALES_ITEMS: InventoryItem[] = [
  {
    title: "Pedidos",
    iconName: "LiaFileInvoiceDollarSolid",
    description: "Crea un pedido nuevo.",
    link: "/sistema/ventas/pedidos/nuevo",
    linkAll: "/sistema/ventas/pedidos",
    buttonText: "Pedido Nuevo",
  },
  {
    title: "Clientes",
    iconName: "FaUsers",
    description: "Crea un nuevo cliente a tu sistema.",
    link: "/sistema/ventas/clientes/crear",
    linkAll: "/sistema/ventas/clientes",
    buttonText: "Cliente Nuevo",
  },
  {
    title: "Envíos",
    iconName: "FaShippingFast",
    description: "Crea un nuevo envió para entrega.",
    link: "",
    linkAll: "/sistema/ventas/envios",
    buttonText: "",
  },
  {
    title: "Pagos",
    iconName: "GiPayMoney",
    description: "Recibe pagos para tus pedidos.",
    link: "",
    linkAll: "/sistema/ventas/pagos",
    buttonText: "",
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
