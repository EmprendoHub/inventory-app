// rbac-config.ts
export const RBAC_CONFIG = {
  SUPER_ADMIN: {
    allowedRoutes: ["*"], // SUPER_ADMIN can access all routes
  },
  ADMIN: {
    allowedRoutes: [
      "!/sistema/config", // Deny /sistema/config
      "!/sistema/ventas/envios/nuevo",
      "!/sistema/negocio/ajustes/nuevo",
      "!/sistema/ventas/pagos/nuevo",
      "!/sistema/contabilidad/gastos/nuevo",
      "!/sistema/contabilidad/transacciones",
      "!/sistema/compras/recibos",
      "!/sistema/cajas/auditoria/nueva",
      "/sistema/home", // Allow all sistema routes
      "/sistema/negocio", // Allow all negocio routes
      "/sistema/ventas", // Allow all negocio routes
      "/sistema/contabilidad", // Allow contabilidad sistema routes
      "/sistema/contabilidad/gastos", // Allow all sistema routes
      "/sistema/compras", // Allow all sistema routes
      "/sistema/reportes",
      "/sistema/cajas/auditoria",
    ],
  },
  GERENTE: {
    allowedRoutes: [
      "!/sistema/ventas/envios/nuevo", // Deny /sistema/ventas/envios/nuevo
      "!/sistema/contabilidad/*", // Deny /sistema/contabilidad/*
      "!/sistema/cajas/nueva", // Deny creating new cash registers
      "!/sistema/cajas/auditoria", // Deny viewing all audits (but allow creating their own)
      "!/sistema/negocio/*", // Deny /sistema/negocio/*
      "!/sistema/ventas/pagos/nuevo", // Deny creating new payments
      "/sistema/home", // Allow all sistema routes
      "/sistema/ventas/clientes", // Allow all sistema routes
      "/sistema/ventas/pedidos",
      "/sistema/ventas/pagos",
      "/sistema/ventas/envios", // Only allow /sistema/ventas/envios
      "/sistema/ventas",
      "/sistema/cajas/personal/", // Allow personal cash register routes
      "/sistema/cajas/auditoria/nueva", // Allow creating audits
      "/sistema/contabilidad/gastos", // Allow all sistema routes
      // POS routes
      "/sistema/pos",
      "/sistema/pos/register",
    ],
  },
  CHOFER: {
    allowedRoutes: [
      "!/sistema/cajas/*", // Deny /sistema/contabilidad/*
      "!/sistema/negocio/*", // Deny /sistema/contabilidad/*
      "!/sistema/ventas/envios/nuevo", // Deny /sistema/ventas/envios/nuevo
      "/sistema/home", // Allow all sistema routes
      "/sistema/ventas/envios", // Only allow /sistema/ventas/envios
      "/sistema/ventas/pedidos/ver", // Only allow /sistema/ventas/envios
      "/sistema/cajas/personal/", // Allow all sistema routes
      "/sistema/cajas/auditoria/nueva", // Allow all sistema routes
    ],
  },
};
