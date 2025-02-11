"use server";

import { uploadToBucket } from "@/app/_actions";
import prisma from "@/lib/db";
import { idSchema, ProductSchema } from "@/lib/schemas";
import { ItemFormState } from "@/types/items";
import { ItemStatus } from "@prisma/client";
import { unlink, writeFile } from "fs/promises";
import { revalidatePath } from "next/cache";
import { join } from "path";

export const createItemAction = async (
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
          mainImage: savedImageUrl,
        },
      });

      // Step 2: Create Stock Entry for the Warehouse
      await prisma.stock.create({
        data: {
          itemId: newProduct.id,
          warehouseId: validatedData.data.warehouse,
          quantity: validatedData.data.stock || 0, // Store stock in the Stock table
        },
      });

      return newProduct;
    });

    // Clean up the temporary file
    await unlink(path);
    revalidatePath("/sistema/negocio/articulos");
    return {
      success: true,
      message: "Producto creado exitosamente!",
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return { success: false, message: "Error al crear producto." };
  }
};

export async function updateItemAction(
  state: {
    errors: { [key: string]: string[] };
    success: boolean;
    message: string;
  },
  formData: FormData
) {
  const rawData = {
    itemId: formData.get("id") as string,
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    warehouse: formData.get("warehouse") as string,
    category: formData.get("category") as string,
    brand: formData.get("brand") as string,
    unit: formData.get("unit") as string,
    dimensions: formData.get("dimensions") as string,
    sku: formData.get("sku") as string,
    barcode: formData.get("barcode") as string,
    cost: parseFloat(formData.get("cost") as string),
    price: parseFloat(formData.get("price") as string),
    minStock: parseInt(formData.get("minStock") as string),
    tax: parseInt(formData.get("tax") as string),
    supplier: formData.get("supplier") as string,
    notes: formData.get("notes") as string,
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
    if (rawData.image) {
      await prisma.item.update({
        where: {
          id: rawData.itemId,
        },
        data: {
          name: rawData.name,
          description: rawData.description,
          categoryId: rawData.category,
          brandId: rawData.brand,
          unitId: rawData.unit,
          dimensions: rawData.dimensions,
          sku: rawData.sku,
          barcode: rawData.barcode,
          cost: rawData.cost,
          price: rawData.price,
          minStock: rawData.minStock,
          tax: rawData.tax,
          supplierId: rawData.supplier,
          notes: rawData.notes,
          mainImage: savedImageUrl,
        },
      });
    } else {
      await prisma.item.update({
        where: {
          id: rawData.itemId,
        },
        data: {
          name: rawData.name,
          description: rawData.description,
          categoryId: rawData.category,
          brandId: rawData.brand,
          unitId: rawData.unit,
          dimensions: rawData.dimensions,
          sku: rawData.sku,
          barcode: rawData.barcode,
          cost: rawData.cost,
          price: rawData.price,
          minStock: rawData.minStock,
          tax: rawData.tax,
          supplierId: rawData.supplier,
          notes: rawData.notes,
        },
      });
    }
    revalidatePath(`/sistemas/negocio/articulos/editar/${rawData.itemId}`);
    return {
      errors: {},
      success: true,
      message: "Articulo actualizado correctamente!",
    };
  } catch (error) {
    console.error("Error al actualizar Articulo:", error);

    return {
      errors: {},
      success: false,
      message: "Fallo al actualizar Articulo",
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

  try {
    await prisma.$transaction([
      prisma.stock.deleteMany({
        where: {
          itemId: validatedData.data.id, // Adjust this field based on your schema
        },
      }),
      prisma.item.delete({
        where: {
          id: validatedData.data.id,
        },
      }),
    ]);

    revalidatePath("/sistema/negocio/articulos");
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

export async function toggleItemStatusAction(formData: FormData) {
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

  try {
    // Fetch the current status of the item
    const item = await prisma.item.findUnique({
      where: {
        id: validatedData.data.id,
      },
      select: {
        status: true,
      },
    });

    if (!item) {
      return {
        success: false,
        message: "Item not found",
      };
    }

    // Toggle the status
    const newStatus = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    // Update the item with the new status
    await prisma.item.update({
      where: {
        id: validatedData.data.id,
      },
      data: {
        status: newStatus as ItemStatus,
      },
    });

    revalidatePath("/sistema/negocio/articulos");
    return {
      errors: {},
      success: true,
      message: `Item status updated to ${newStatus} successfully!`,
    };
  } catch (error) {
    console.error("Error updating item status:", error);
    return {
      errors: {},
      success: false,
      message: "Failed to update item status",
    };
  }
}
