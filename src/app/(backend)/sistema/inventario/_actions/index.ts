"use server";

import {
  BrandSchema,
  CategorySchema,
  ProductSchema,
  UnitSchema,
  WarehouseSchema,
} from "@/lib/schemas";

export const createWarehouse = async (
  state: {
    errors?: Record<string, string[]>;
    success?: boolean;
    message?: string;
  },
  formData: FormData
) => {
  const rawData = {
    title: formData.get("title"),
    location: formData.get("location"),
    type: formData.get("type"),
    description: formData.get("description"),
  };

  console.log(rawData);

  // Validate the data using Zod
  const validatedData = WarehouseSchema.safeParse(rawData);

  if (!validatedData.success) {
    // Format Zod errors into a field-specific error object
    const errors = validatedData.error.flatten().fieldErrors;
    return {
      errors,
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  // Simulate saving to a database or API
  console.log("Creating product:", validatedData.data);

  return { success: true, message: "Bodega creada exitosamente!" };
};

export const createUnit = async (
  state: {
    errors?: Record<string, string[]>;
    success?: boolean;
    message?: string;
  },
  formData: FormData
) => {
  const rawData = {
    title: formData.get("title"),
    abbreviation: formData.get("abbreviation"),
  };

  // Validate the data using Zod
  const validatedData = UnitSchema.safeParse(rawData);

  if (!validatedData.success) {
    // Format Zod errors into a field-specific error object
    const errors = validatedData.error.flatten().fieldErrors;
    return {
      errors,
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  // Simulate saving to a database or API
  console.log("Creating product:", validatedData.data);

  return { success: true, message: "Unidad creada exitosamente!" };
};

export const createBrand = async (
  state: {
    errors?: Record<string, string[]>;
    success?: boolean;
    message?: string;
  },
  formData: FormData
) => {
  const rawData = {
    name: formData.get("name"),
    description: formData.get("description"),
  };

  // Validate the data using Zod
  const validatedData = BrandSchema.safeParse(rawData);

  if (!validatedData.success) {
    // Format Zod errors into a field-specific error object
    const errors = validatedData.error.flatten().fieldErrors;
    return {
      errors,
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  // Simulate saving to a database or API
  console.log("Creating product:", validatedData.data);

  return { success: true, message: "Marca creada exitosamente!" };
};

export const createCategory = async (
  state: {
    errors?: Record<string, string[]>;
    success?: boolean;
    message?: string;
  },
  formData: FormData
) => {
  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
  };

  // Validate the data using Zod
  const validatedData = CategorySchema.safeParse(rawData);

  if (!validatedData.success) {
    // Format Zod errors into a field-specific error object
    const errors = validatedData.error.flatten().fieldErrors;
    return {
      errors,
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  // Simulate saving to a database or API
  console.log("Creating product:", validatedData.data);

  return { success: true, message: "Categoría creada exitosamente!" };
};

export const createProduct = async (
  state: {
    errors?: Record<string, string[]>;
    success?: boolean;
    message?: string;
  },
  formData: FormData
) => {
  const rawData = {
    name: formData.get("name"),
    description: formData.get("description"),
    warehouse: formData.get("warehouse"),
    category: formData.get("category"),
    brand: formData.get("brand"),
    unit: formData.get("unit"),
    sku: formData.get("sku"),
    barcode: formData.get("barcode"),
    cost: parseFloat(formData.get("cost") as string),
    price: parseFloat(formData.get("price") as string),
    stock: parseInt(formData.get("stock") as string),
    minStock: parseInt(formData.get("minStock") as string),
    supplier: formData.get("supplier"),
    images: formData.get("images"),
  };

  // Validate the data using Zod
  const validatedData = ProductSchema.safeParse(rawData);

  if (!validatedData.success) {
    // Format Zod errors into a field-specific error object
    const errors = validatedData.error.flatten().fieldErrors;
    return {
      errors,
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  // Simulate saving to a database or API
  console.log("Creating product:", validatedData.data);

  return { success: true, message: "Producto creado exitosamente!" };
};
