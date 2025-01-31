import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Se require una Descripción"),
  category: z.string().min(1, "Se requiere la categoría"),
  warehouse: z.string().min(1, "Se requiere la Bodega"),
  brand: z.string().min(1, "Se requiere la Marca"),
  unit: z.string().min(1, "Se requiere la unidad de medida"),
  sku: z.string().min(1, "Se requiere el SKU"),
  barcode: z.string().min(1, "Se requiere el Codigo de barras"),
  dimensions: z.string().min(1, "Se requiere el Codigo de barras"),
  weight: z.number().positive("Impuestos debe tener un numero positivo"),
  price: z.number().positive("Price must be a positive number"),
  cost: z.number().positive("Price must be a positive number"),
  stock: z.number().int().nonnegative("Stock must be a non-negative integer"),
  minStock: z
    .number()
    .int()
    .nonnegative("Stock mínimo  must be a non-negative integer"),
  supplier: z.string().min(1, "Se requiere el proveedor"),
  tax: z.number().positive("Impuestos debe tener un numero positivo"),
  notes: z.string(),
});

export type ProductFormValues = z.infer<typeof ProductSchema>;

export const CategorySchema = z.object({
  title: z.string().min(3, "Se require un Titulo"),
  description: z.string().min(5, "Se require una Descripción"),
});

export const WarehouseSchema = z.object({
  title: z.string().min(3, "Se require un Titulo"),
  location: z.string().min(3, "Se require una Ubicación"),
  type: z.string().min(3, "Se require un tipo de bodega"),
  description: z.string().min(5, "Se require una Descripción"),
});

export const BrandSchema = z.object({
  name: z.string().min(3, "Se require un Nombre"),
  description: z.string().min(5, "Se require una Descripción"),
});

export const UnitSchema = z.object({
  title: z.string().min(5, "Se require un Titulo"),
  abbreviation: z.string().min(1, "Se require una abreviación"),
});
