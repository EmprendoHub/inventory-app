import { z } from "zod";

export const ProductSchema = z.object({
  id: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  category: z.string().min(1, "Se requiere la categoría"),
  warehouse: z.string().min(1, "Se requiere la Bodega"),
  brand: z.string().min(1, "Se requiere la Marca"),
  unit: z.string().min(1, "Se requiere la unidad de medida"),
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
  image: z
    .instanceof(File)
    .refine((file) => !file || file.size > 0, "Image file must have content")
    .refine(
      (file) => !file || file.size <= 10 * 1024 * 1024,
      "File size must be less than 10MB"
    )
    .refine(
      (file) =>
        !file ||
        [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
          "image/bmp",
          "image/tiff",
        ].includes(file.type),
      "Only JPEG, PNG, GIF, WebP, BMP, and TIFF images are allowed"
    )
    .nullable()
    .optional(),
});

export const SupplierSchema = z.object({
  id: z.string().nullable().optional(),
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

export type ProductFormValues = z.infer<typeof ProductSchema>;

export const CategorySchema = z.object({
  id: z.string().nullable().optional(),
  title: z.string().min(3, "Se require un Titulo"),
  description: z.string(),
});

export const WarehouseSchema = z.object({
  id: z.string().nullable().optional(),
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

export const RemoveInventorySchema = z.object({
  articulo: z.string().min(3, "Se require un Producto"),
  transAmount: z
    .number()
    .positive("Cantidad a remover debe tener un numero positivo"),
  sendingWarehouse: z.string().min(3, "Se require una Ubicación"),
  formType: z.string(),
  notes: z.string(),
});

export const BrandSchema = z.object({
  id: z.string().nullable().optional(),
  name: z.string().min(3, "Se require un Nombre"),
  description: z.string(),
});

export const UnitSchema = z.object({
  id: z.string().nullable().optional(),
  title: z.string().min(3, "Se require un Titulo"),
  abbreviation: z.string().min(1, "Se require una abreviación"),
});

export const idSchema = z.object({
  id: z.string().min(3, "Se require un id"),
  userId: z.string().nullable().optional(),
});

export const TwoIdSchema = z.object({
  id: z.string().min(3, "Se require un id"),
  orderId: z.string().min(3, "Se require un id de pedido"),
  userId: z.string().nullable().optional(),
});

export const PaymentSchema = z.object({
  id: z.string().min(3, "Se require un id"),
  amount: z.string().min(1, "Se require una cantidad"),
  reference: z.string(),
  method: z.string(),
  createdAt: z.date().nullable().optional(),
});

export const UserSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  authCode: z.string(),
  active: z.boolean(),
  password: z.string(),
  role: z.string(),
  warehouseId: z.string().optional().nullable(),
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

export const TruckSchema = z.object({
  id: z.string().optional(),
  licensePlate: z.string().min(1, "Placa is required"),
  name: z.string().min(1, "Nombre Plate is required"),
  km: z.string().min(1, "Km Plate is required"),
  status: z.enum(["DISPONIBLE", "EN_USO", "MANTENIMIENTO"]),
});

export const DeliverySchema = z.object({
  id: z.string().optional(),
  orderId: z.string(),
  orderNo: z.string().nullable().optional(),
  method: z.enum(["INTERNO", "EXTERNO"]),
  driverId: z.string().optional(),
  truckId: z.string().optional(),
  price: z.number().positive("Price must be a positive number"),
  carrier: z.string().min(1, "Paquetería is required"),
  deliveryDate: z.string().optional(), // Will convert to Date in the action
  status: z.enum([
    "Pendiente para entrega",
    "Fuera para entrega",
    "Entregado",
    "Fallido",
  ]),
});

export const ItemGroupSchema = z.object({
  id: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
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
