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
    title: "Articulo",
    iconName: "RiSofaFill",
    description:
      "Crea un articulo individual y servicio que puedes comprar y vender.",
    link: "/sistema/negocio/articulos/nuevo",
    linkAll: "/sistema/negocio/articulos",
    buttonText: "Articulo Nuevo",
  },
  {
    title: "Artículos Compuestos",
    iconName: "GiClothes",
    description: "Agrupa varios artículos y véndelos en paquetes.",
    link: "/sistema/negocio/articulos/conjuntos/nuevo",
    linkAll: "/sistema/negocio/articulos/conjuntos",
    buttonText: "Articulo Nuevo",
  },

  {
    title: "Categoría",
    iconName: "BiCategory",
    description:
      "Crea una nueva categoría para clasificar tus artículos o servicios.",
    link: "/sistema/negocio/categorias/nueva",
    linkAll: "/sistema/negocio/categorias",
    buttonText: "Categoría Nueva",
  },
  {
    title: "Vehículos",
    iconName: "FaWarehouse",
    description:
      "Agrega nuevo vehículo para mantener tu inventario organizado.",
    link: "/sistema/negocio/bodegas/nueva",
    linkAll: "/sistema/negocio/bodegas",
    buttonText: "Nuevo vehículo",
  },
  {
    title: "Proveedor",
    iconName: "UserPlus",
    description:
      "Agrega nuevo Proveedor para mantener tu inventario organizado.",
    link: "/sistema/negocio/proveedores/nuevo",
    linkAll: "/sistema/negocio/proveedores",
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

export const ACCOUNTING_ITEMS: InventoryItem[] = [
  {
    title: "Gastos",
    iconName: "LiaFileInvoiceDollarSolid",
    description: "Historial de gastos de negocio.",
    link: "/sistema/contabilidad/gastos/nuevo",
    linkAll: "/sistema/contabilidad/gastos",
    buttonText: "Gasto Nuevo",
  },
  {
    title: "Cortes",
    iconName: "FaUsers",
    description: "Historial de cortes de caja.",
    link: "",
    linkAll: "sistema/cajas/auditoria",
    buttonText: "",
  },

  {
    title: "Ordenes de Compra",
    iconName: "GiPayMoney",
    description: "Historial de ordenes de compra.",
    link: "/sistema/compras/nueva",
    linkAll: "/sistema/compras",
    buttonText: "Nueva Orden",
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
