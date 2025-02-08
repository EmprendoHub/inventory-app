import { z } from "zod";

export const ProductSchema = z.object({
  id: z.string().nullable().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  category: z.string().min(1, "Se requiere la categoría"),
  warehouse: z.string().min(1, "Se requiere la Bodega"),
  brand: z.string().min(1, "Se requiere la Marca"),
  unit: z.string().min(1, "Se requiere la unidad de medida"),
  sku: z.string().min(1, "Se requiere el SKU"),
  barcode: z.string().min(1, "Se requiere el Codigo de barras"),
  dimensions: z.string(),
  price: z.number().positive("Price must be a positive number"),
  cost: z.number().positive("Price must be a positive number"),
  stock: z
    .number()
    .int()
    .nonnegative("Stock must be a non-negative integer")
    .nullable()
    .optional(),
  minStock: z
    .number()
    .int()
    .nonnegative("Stock mínimo  must be a non-negative integer"),
  supplier: z.string().min(1, "Se requiere el proveedor"),
  tax: z.number(),
  notes: z.string(),
  image: z
    .object({
      size: z.number(),
      type: z.string(),
      name: z.string(),
      lastModified: z.number(),
    })
    .nullable()
    .optional(),
});

export const SupplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Se require un teléfono"),
  email: z
    .string()
    .min(1, { message: "se requiere un correo electrónico." })
    .email("Este email no es valido."),
  address: z.string().min(1, "Se requiere la dirección"),
  contactPerson: z.string(),
  supplierCode: z.string().min(1, "Se requiere el código del proveedor"),
  paymentTerms: z.string().min(1, "Se requiere términos de pago"),
  taxId: z.string(),
  notes: z.string(),
  image: z.object({
    size: z.number(),
    type: z.string(),
    name: z.string(),
    lastModified: z.number(),
  }),
});

export type ProductFormValues = z.infer<typeof ProductSchema>;

export const CategorySchema = z.object({
  title: z.string().min(3, "Se require un Titulo"),
  description: z.string(),
});

export const WarehouseSchema = z.object({
  title: z.string().min(3, "Se require un Titulo"),
  code: z.string().min(3, "Se require un código único"),
  street: z.string().min(3, "Se require una calle"),
  city: z.string().min(3, "Se require una ciudad"),
  state: z.string().min(3, "Se require un estado"),
  country: z.string().min(3, "Se require un país"),
  postalCode: z.string().min(3, "Se require un código postal"),
  type: z.string().min(3, "Se require un tipo de bodega"),
});

export const AdjustmentSchema = z.object({
  articulo: z.string().min(3, "Se require un Producto"),
  transAmount: z
    .number()
    .positive("Cantidad a transferir debe tener un numero positivo"),
  sendingWarehouse: z.string().min(3, "Se require una Ubicación"),
  receivingWarehouse: z.string().min(3, "Se require un tipo de bodega"),
  formType: z.string(),
  notes: z.string(),
});

export const AddInventorySchema = z.object({
  articulo: z.string().min(3, "Se require un Producto"),
  transAmount: z
    .number()
    .positive("Cantidad a transferir debe tener un numero positivo"),
  sendingWarehouse: z.string().min(3, "Se require una Ubicación"),
  formType: z.string(),
  notes: z.string(),
});

export const BrandSchema = z.object({
  name: z.string().min(3, "Se require un Nombre"),
  description: z.string(),
});

export const UnitSchema = z.object({
  title: z.string().min(5, "Se require un Titulo"),
  abbreviation: z.string().min(1, "Se require una abreviación"),
});

export const idSchema = z.object({
  id: z.string().min(3, "Se require un id"),
});

export const TwoIdSchema = z.object({
  id: z.string().min(3, "Se require un id"),
  orderId: z.string().min(3, "Se require un id de pedido"),
});

export const PaymentSchema = z.object({
  id: z.string().min(3, "Se require un id"),
  amount: z.string().min(1, "Se require una cantidad"),
  reference: z.string(),
  method: z.string(),
});

export const UserSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  active: z.boolean(),
  password: z.string(),
  role: z.string(),
  avatar: z
    .object({
      size: z.number(),
      type: z.string(),
      name: z.string(),
      lastModified: z.number(),
    })
    .nullable()
    .optional(),
});

export const VerifyEmailSchema = z.object({
  email: z.string().min(5, { message: "Se requiere un correo electrónico" }),
});
