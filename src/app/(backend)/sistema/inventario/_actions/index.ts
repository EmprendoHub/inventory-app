"use server";

import { uploadToBucket } from "@/app/_actions";
import prisma from "@/lib/db";
import {
  AddInventorySchema,
  AdjustmentSchema,
  BrandSchema,
  CategorySchema,
  idSchema,
  ProductSchema,
  SupplierSchema,
  UnitSchema,
  WarehouseSchema,
} from "@/lib/schemas";
import { ItemFormState } from "@/types/products";
import { unlink, writeFile } from "fs/promises";
import { revalidatePath } from "next/cache";
import { join } from "path";

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

  const newWarehouseData = {
    title: validatedData.data.title,
    description: validatedData.data.description,
    location: validatedData.data.location,
    type: validatedData.data.type,
  };

  const newWarehouse = await prisma.warehouse.create({
    data: newWarehouseData,
  });
  console.log("Creating Warehouse", newWarehouse);

  return { success: true, message: "Bodega creada exitosamente!" };
};

export const createAdjustment = async (
  state: {
    errors?: Record<string, string[]>;
    success?: boolean;
    message?: string;
  },
  formData: FormData
) => {
  const rawData = {
    articulo: formData.get("articulo"),
    transAmount: parseFloat(formData.get("transAmount") as string),
    sendingWarehouse: formData.get("sendingWarehouse"),
    receivingWarehouse: formData.get("receivingWarehouse"),
    formType: formData.get("formType"),
    notes: formData.get("notes"),
  };

  console.log(rawData);
  if (rawData.formType === "add") {
    const validatedData = AddInventorySchema.safeParse(rawData);
    if (!validatedData.success) {
      // Format Zod errors into a field-specific error object
      const errors = validatedData.error.flatten().fieldErrors;
      return {
        errors,
        success: false,
        message: "Validation failed. Please check the fields.",
      };
    }
    const addInventory = await prisma.stock.update({
      where: {
        itemId_warehouseId: {
          itemId: validatedData.data.articulo,
          warehouseId: validatedData.data.sendingWarehouse,
        },
      },
      data: { quantity: { increment: validatedData.data.transAmount } },
    });
    console.log("Inventory add:", addInventory);
  } else {
    // Validate the data using Zod
    const validatedAdjustData = AdjustmentSchema.safeParse(rawData);
    if (!validatedAdjustData.success) {
      // Format Zod errors into a field-specific error object
      const errors = validatedAdjustData.error.flatten().fieldErrors;
      return {
        errors,
        success: false,
        message: "Validation failed. Please check the fields.",
      };
    }

    await prisma.stock.update({
      where: {
        itemId_warehouseId: {
          itemId: validatedAdjustData.data.articulo,
          warehouseId: validatedAdjustData.data.sendingWarehouse,
        },
      },
      data: { quantity: { decrement: validatedAdjustData.data.transAmount } },
    });
    // Check if stock exists in the receiving warehouse
    const existingStock = await prisma.stock.findUnique({
      where: {
        itemId_warehouseId: {
          itemId: validatedAdjustData.data.articulo,
          warehouseId: validatedAdjustData.data.receivingWarehouse,
        },
      },
    });

    // If stock exists, update it; otherwise, create a new stock entry
    if (existingStock) {
      await prisma.stock.update({
        where: {
          itemId_warehouseId: {
            itemId: validatedAdjustData.data.articulo,
            warehouseId: validatedAdjustData.data.receivingWarehouse,
          },
        },
        data: { quantity: { increment: validatedAdjustData.data.transAmount } },
      });
    } else {
      await prisma.stock.create({
        data: {
          itemId: validatedAdjustData.data.articulo,
          warehouseId: validatedAdjustData.data.receivingWarehouse,
          quantity: validatedAdjustData.data.transAmount, // Set initial stock amount
        },
      });
    }
  }

  return { success: true, message: "Ajuste de inventario exitoso!" };
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

  const newUnitData = {
    title: validatedData.data.title,
    abbreviation: validatedData.data.abbreviation,
  };

  const newUnit = await prisma.unit.create({ data: newUnitData });
  console.log("Creating unit", newUnit);

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

  const newBrandData = {
    name: validatedData.data.name,
    description: validatedData.data.description,
  };

  const newBrand = await prisma.brand.create({ data: newBrandData });
  console.log("Creating Brand", newBrand);

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
  const newCatData = {
    title: validatedData.data.title,
    description: validatedData.data.description,
  };

  const newCategory = await prisma.category.create({ data: newCatData });
  console.log("Creating category:", newCategory);
  return { success: true, message: "Categoría creada exitosamente!" };
};

export const createProduct = async (
  state: ItemFormState,
  formData: FormData
): Promise<ItemFormState> => {
  const rawData = {
    name: formData.get("name"),
    description: formData.get("description"),
    warehouse: formData.get("warehouse"),
    category: formData.get("category"),
    brand: formData.get("brand"),
    unit: formData.get("unit"),
    dimensions: formData.get("dimensions"),
    sku: formData.get("sku"),
    barcode: formData.get("barcode"),
    cost: parseFloat(formData.get("cost") as string),
    price: parseFloat(formData.get("price") as string),
    minStock: parseInt(formData.get("minStock") as string),
    tax: parseInt(formData.get("tax") as string),
    supplier: formData.get("supplier"),
    notes: formData.get("notes"),
    stock: parseInt(formData.get("stock") as string), // Stock is now stored separately
    image: formData.get("image") as File,
  };

  // Validate the data using Zod
  const validatedData = ProductSchema.safeParse(rawData);
  if (!validatedData.success) {
    const errors = validatedData.error.flatten().fieldErrors;
    return {
      errors,
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  if (!validatedData.data)
    return {
      errors: {},

      success: false,

      message: "Error al validar campos del producto",
    };

  // Convert the image file to Base64
  let base64Image = "";
  if (
    rawData.image &&
    rawData.image instanceof File &&
    rawData.image.size > 0
  ) {
    const arrayBuffer = await rawData.image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    base64Image = buffer.toString("base64");
  }

  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, "base64");

  const newFilename = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.png`;
  const path = join("/", "tmp", newFilename);

  // Save to temporary file
  const uint8Array = new Uint8Array(imageBuffer);
  await writeFile(path, uint8Array);

  await uploadToBucket("inventario", "products/" + newFilename, path);
  const savedImageUrl = `${process.env.MINIO_URL}products/${newFilename}`;

  try {
    await prisma.$transaction(async (prisma) => {
      // Step 1: Create Product
      const newProduct = await prisma.item.create({
        data: {
          name: validatedData.data.name,
          description: validatedData.data.description,
          categoryId: validatedData.data.category,
          brandId: validatedData.data.brand,
          unitId: validatedData.data.unit,
          dimensions: validatedData.data.dimensions,
          sku: validatedData.data.sku,
          barcode: validatedData.data.barcode,
          cost: validatedData.data.cost,
          price: validatedData.data.price,
          minStock: validatedData.data.minStock,
          tax: validatedData.data.tax,
          supplierId: validatedData.data.supplier,
          notes: validatedData.data.notes,
          image: savedImageUrl,
        },
      });

      // Step 2: Create Stock Entry for the Warehouse
      await prisma.stock.create({
        data: {
          itemId: newProduct.id,
          warehouseId: validatedData.data.warehouse,
          quantity: validatedData.data.stock, // Store stock in the Stock table
        },
      });

      return newProduct;
    });

    // Clean up the temporary file
    await unlink(path);
    revalidatePath("/sistema/inventario/articulos");
    return {
      success: true,
      message: "Producto creado exitosamente!",
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return { success: false, message: "Error al crear producto." };
  }
};

export const createSupplier = async (
  state: {
    errors?: Record<string, string[]>;
    success?: boolean;
    message?: string;
  },
  formData: FormData
) => {
  const rawData = {
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    contactPerson: formData.get("contactPerson"),
    supplierCode: formData.get("supplierCode"),
    paymentTerms: formData.get("paymentTerms"),
    taxId: formData.get("taxId"),
    notes: formData.get("notes"),
    image: formData.get("image") as File,
  };

  // Validate the data using Zod
  const validatedData = SupplierSchema.safeParse(rawData);
  if (!validatedData.success) {
    const errors = validatedData.error.flatten().fieldErrors;
    return {
      errors,
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  if (!validatedData.data)
    return { success: false, message: "Error al crear producto" };

  // Convert the image file to Base64
  let base64Image = "";
  if (
    rawData.image &&
    rawData.image instanceof File &&
    rawData.image.size > 0
  ) {
    const arrayBuffer = await rawData.image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    base64Image = buffer.toString("base64");
  }

  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, "base64");

  const newFilename = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.png`;
  const path = join("/", "tmp", newFilename);

  // Save to temporary file
  const uint8Array = new Uint8Array(imageBuffer);
  await writeFile(path, uint8Array);

  await uploadToBucket("inventario", "suppliers/" + newFilename, path);
  const savedImageUrl = `${process.env.MINIO_URL}suppliers/${newFilename}`;

  try {
    const result = await prisma.$transaction(async (prisma) => {
      // Step 1: Create Supplier
      const newSupplier = await prisma.supplier.create({
        data: {
          name: validatedData.data.name,
          phone: validatedData.data.phone,
          email: validatedData.data.email,
          address: validatedData.data.address,
          contactPerson: validatedData.data.contactPerson,
          supplierCode: validatedData.data.supplierCode,
          paymentTerms: validatedData.data.paymentTerms,
          taxId: validatedData.data.taxId,
          notes: validatedData.data.notes,
          image: savedImageUrl,
        },
      });

      return newSupplier;
    });

    // Clean up the temporary file
    await unlink(path);

    return {
      success: true,
      message: "Supplier creado exitosamente!",
      product: result,
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return { success: false, message: "Error al crear producto." };
  }
};

// Example server action
export async function createItemGroup(
  state: {
    errors?: Record<string, string[]>;
    success?: boolean;
    message?: string;
  },
  formData: FormData
) {
  const rawData = Object.fromEntries(formData);

  const name = rawData.name as string;
  const description = rawData.description as string;
  const itemIds = rawData.itemIds
    ? Array.isArray(rawData.itemIds)
      ? rawData.itemIds
      : [rawData.itemIds]
    : [];

  await prisma.itemGroup.create({
    data: {
      name: name.toString(),
      description: description.toString(),
      items: {
        connect: itemIds.map((id) => ({ id: id.toString() })),
      },
    },
  });
}

// In _actions.ts
export async function createItemGroupTwo(
  state: {
    errors: { [key: string]: string[] };
    success: boolean;
    message: string;
  },
  formData: FormData
) {
  "use server";

  const name = formData.get("name") as string;
  const itemsInput = formData.get("items") as string;

  // Validate inputs
  const errors: { [key: string]: string[] } = {};

  if (!name || name.trim() === "") {
    errors.name = ["Group name is required"];
  }

  const items = itemsInput
    ? itemsInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  if (items.length === 0) {
    errors.items = ["At least one item ID is required"];
  }

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      success: false,
      message: "Please fix the errors before submitting.",
    };
  }

  try {
    // Note: This would require a ItemGroup model in your Prisma schema
    const itemGroup = await prisma.itemGroup.create({
      data: {
        name,
        description: "Default description", // Add a description here
        items: {
          connect: items.map((id) => ({ id })),
        },
      },
    });

    console.log(itemGroup);

    return {
      errors: {},
      success: true,
      message: "Item group created successfully!",
    };
  } catch (error) {
    console.error("Error creating item group:", error);
    return {
      errors: {},
      success: false,
      message: "Failed to create item group",
    };
  }
}

export async function deleteItemAction(formData: FormData) {
  const rawData = {
    id: formData.get("id"),
  };

  // Validate the data using Zod
  const validatedData = idSchema.safeParse(rawData);
  if (!validatedData.success) {
    const errors = validatedData.error.flatten().fieldErrors;
    return {
      errors,
      success: false,
      message: "Validation failed. Please check the fields.",
    };
  }

  if (!validatedData.data)
    return { success: false, message: "Error al crear producto" };
  console.log("item deleted", validatedData.data);

  try {
    const item = await prisma.item.delete({
      where: {
        id: validatedData.data.id,
      },
    });

    console.log("item deleted", item);
    revalidatePath("/sistema/inventario/articulos");
    return {
      errors: {},
      success: true,
      message: "Item deleted successfully!",
    };
  } catch (error) {
    console.error("Error creating item:", error);
    return {
      errors: {},
      success: false,
      message: "Failed to delete item",
    };
  }
}
