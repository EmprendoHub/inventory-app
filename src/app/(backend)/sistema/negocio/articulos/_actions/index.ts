"use server";

import { uploadToBucket } from "@/app/_actions";
import prisma from "@/lib/db";
import { idSchema, ProductSchema } from "@/lib/schemas";
import {
  generateUniqueBarcode,
  generateUniqueSKU,
  getMexicoGlobalUtcDate,
} from "@/lib/utils";
import { ItemFormState } from "@/types/items";
type ItemStatus = "ACTIVE" | "INACTIVE";
import { unlink, writeFile } from "fs/promises";
import { revalidatePath } from "next/cache";
import { join } from "path";
import sharp from "sharp";

export const createItemAction = async (
  state: ItemFormState,
  formData: FormData
): Promise<ItemFormState> => {
  const rawData = {
    userId: formData.get("userId"),
    name: formData.get("name"),
    description: formData.get("description"),
    warehouse: formData.get("warehouse"),
    category: formData.get("category"),
    brand: formData.get("brand"),
    unit: formData.get("unit"),
    dimensions: formData.get("dimensions"),
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
  if (
    rawData.image &&
    rawData.image instanceof File &&
    rawData.image.size > 0
  ) {
    // Convert the image file to ArrayBuffer
    const arrayBuffer = await rawData.image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Optimize the image using sharp
    const optimizedImageBuffer = await sharp(buffer)
      .resize(800, 800, {
        // Resize to a maximum of 800x800 pixels
        fit: "inside", // Maintain aspect ratio
        withoutEnlargement: true, // Don't enlarge images smaller than 800x800
      })
      .png({
        // Convert to WebP format
        quality: 80, // Adjust quality (0-100)
        compressionLevel: 9, // Compression level (0-9, 9 being the highest compression)
        adaptiveFiltering: true, // Use adaptive filtering for better compression
      })
      .toBuffer();

    // Generate a unique filename
    const newFilename = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.png`;
    const path = join("/", "tmp", newFilename);

    // Save the optimized image to a temporary file
    await writeFile(path, optimizedImageBuffer);

    // Upload the optimized image to Minio
    await uploadToBucket("inventario", "products/" + newFilename, path);
    const savedImageUrl = `${process.env.MINIO_URL}products/${newFilename}`;
    const generatedBarcode = await generateUniqueBarcode();
    const generatedSku = await generateUniqueSKU();
    try {
      const createdAt = getMexicoGlobalUtcDate();
      await prisma.$transaction(async (prisma: any) => {
        // Step 1: Create Product
        const newProduct = await prisma.item.create({
          data: {
            name: validatedData.data.name,
            description: validatedData.data.description,
            categoryId: validatedData.data.category,
            brandId: validatedData.data.brand,
            unitId: validatedData.data.unit,
            dimensions: validatedData.data.dimensions,
            sku: generatedSku,
            barcode: generatedBarcode,
            cost: validatedData.data.cost,
            price: validatedData.data.price,
            minStock: validatedData.data.minStock,
            tax: validatedData.data.tax,
            supplierId: validatedData.data.supplier,
            notes: validatedData.data.notes,
            mainImage: savedImageUrl,
            createdAt,
            updatedAt: createdAt,
          },
        });

        // Step 2: Create Stock Entry for the Warehouse
        await prisma.stock.create({
          data: {
            itemId: newProduct.id,
            warehouseId: validatedData.data.warehouse,
            quantity: validatedData.data.stock || 0, // Store stock in the Stock table
            availableQty: validatedData.data.stock || 0, // Set available quantity
            reservedQty: 0, // Initially, no reserved quantity
            createdAt,
            updatedAt: createdAt,
          },
        });

        // Step 3: Create Stock Movement Record
        await prisma.stockMovement.create({
          data: {
            itemId: newProduct.id,
            type: "PURCHASE", // Assuming the initial stock is added via a purchase
            quantity: validatedData.data.stock || 0,
            toWarehouseId: validatedData.data.warehouse,
            reference: `Initial stock for product ${newProduct.id}`,
            status: "COMPLETED",
            createdBy: validatedData.data.userId ?? "", // Or the user ID who created the product
            createdAt,
            updatedAt: createdAt,
          },
        });

        return newProduct;
      });

      // Clean up the temporary file
      await unlink(path);
      revalidatePath("/sistema/negocio/articulos");
      revalidatePath("/sistema/ventas/pedidos/nuevo");
      return {
        success: true,
        message: "Producto creado exitosamente!",
      };
    } catch (error) {
      console.error("Error creating product:", error);
      return { success: false, message: "Error al crear producto." };
    }
  } else {
    return {
      success: false,
      message: "Falto una imagen!",
    };
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

  try {
    const createdAt = getMexicoGlobalUtcDate();
    if (
      rawData.image &&
      rawData.image instanceof File &&
      rawData.image.size > 0
    ) {
      // Convert the image file to ArrayBuffer
      const arrayBuffer = await rawData.image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Optimize the image using sharp
      const optimizedImageBuffer = await sharp(buffer)
        .resize(800, 800, {
          // Resize to a maximum of 800x800 pixels
          fit: "inside", // Maintain aspect ratio
          withoutEnlargement: true, // Don't enlarge images smaller than 800x800
        })
        .png({
          // Convert to WebP format
          quality: 80, // Adjust quality (0-100)
          compressionLevel: 9, // Compression level (0-9, 9 being the highest compression)
          adaptiveFiltering: true, // Use adaptive filtering for better compression
        })
        .toBuffer();

      // Generate a unique filename
      const newFilename = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.png`;
      const path = join("/", "tmp", newFilename);

      // Save the optimized image to a temporary file
      await writeFile(path, optimizedImageBuffer);

      // Upload the optimized image to Minio
      await uploadToBucket("inventario", "products/" + newFilename, path);
      const savedImageUrl = `${process.env.MINIO_URL}products/${newFilename}`;
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
          cost: rawData.cost,
          price: rawData.price,
          minStock: rawData.minStock,
          tax: rawData.tax,
          supplierId: rawData.supplier,
          notes: rawData.notes,
          mainImage: savedImageUrl,
          updatedAt: createdAt,
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
          cost: rawData.cost,
          price: rawData.price,
          minStock: rawData.minStock,
          tax: rawData.tax,
          supplierId: rawData.supplier,
          notes: rawData.notes,
          updatedAt: createdAt,
        },
      });
    }
    revalidatePath(`/sistemas/negocio/articulos/editar/${rawData.itemId}`);
    revalidatePath("/sistema/negocio/articulos/nuevo");
    revalidatePath("/sistema/negocio/articulos");

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
      // Delete all related StockMovement records
      prisma.stockMovement.deleteMany({
        where: {
          itemId: validatedData.data.id, // Adjust this field based on your schema
        },
      }),
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
    revalidatePath("/sistema/ventas/pedidos/nuevo");
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
    const createdAt = getMexicoGlobalUtcDate();
    // Update the item with the new status
    await prisma.item.update({
      where: {
        id: validatedData.data.id,
      },
      data: {
        status: newStatus as ItemStatus,
        updatedAt: createdAt,
      },
    });

    revalidatePath("/sistema/negocio/articulos");
    revalidatePath("/sistema/ventas/pedidos/nuevo");
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

export async function createItemGroup(
  state: {
    errors: { [key: string]: string[] };
    success: boolean;
    message: string;
  },
  formData: FormData
) {
  const name = formData.get("name") as string;
  const price = formData.get("price") as string;
  const image = formData.get("image") as File;
  const itemsInput = formData.get("items") as string;

  // Validate inputs
  const errors: { [key: string]: string[] } = {};

  if (!name || name.trim() === "") {
    errors.name = ["Group name is required"];
  }

  // Parse items input (format: "itemId1:quantity1,itemId2:quantity2")
  const items = itemsInput
    ? itemsInput.split(",").map((pair) => {
        const [itemId, quantity] = pair.split(":");
        return { itemId, quantity: parseInt(quantity, 10) };
      })
    : [];

  if (items.length === 0) {
    errors.items = ["At least one item is required"];
  }

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      success: false,
      message: "Please fix the errors before submitting.",
    };
  }

  // Convert the image file to Base64
  let base64Image = "";
  if (image && image instanceof File && image.size > 0) {
    const arrayBuffer = await image.arrayBuffer();
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
  const createdAt = getMexicoGlobalUtcDate();
  try {
    // Create the ItemGroup
    await prisma.itemGroup.create({
      data: {
        name,
        mainImage: savedImageUrl,
        price: Number(price),
        items: {
          create: items.map(({ itemId, quantity }) => ({
            itemId,
            quantity,
          })),
        },
        createdAt,
        updatedAt: createdAt,
      },
    });

    revalidatePath("/sistema/negocio/articulos/conjuntos");
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

export async function updateItemGroupAction(
  state: {
    errors: { [key: string]: string[] };
    success: boolean;
    message: string;
  },
  formData: FormData
) {
  const groupItemId = formData.get("id") as string;
  const name = formData.get("name") as string;
  const price = formData.get("price") as string;
  const image = formData.get("image") as File;
  const itemsInput = formData.get("items") as string;

  // Validate inputs
  const errors: { [key: string]: string[] } = {};

  if (!name || name.trim() === "") {
    errors.name = ["Group name is required"];
  }

  // Parse items input (format: "itemId1:quantity1,itemId2:quantity2")
  const items = itemsInput
    ? itemsInput.split(",").map((pair) => {
        const [itemId, quantity] = pair.split(":");
        return { itemId, quantity: parseInt(quantity, 10) };
      })
    : [];

  if (items.length === 0) {
    errors.items = ["At least one item is required"];
  }

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      success: false,
      message: "Please fix the errors before submitting.",
    };
  }

  // Convert the image file to Base64
  let base64Image = "";
  if (image && image instanceof File && image.size > 0) {
    const arrayBuffer = await image.arrayBuffer();
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
  const createdAt = getMexicoGlobalUtcDate();
  try {
    // Update the ItemGroup
    await prisma.itemGroup.update({
      where: {
        id: groupItemId,
      },
      data: {
        name,
        price: Number(price),
        mainImage: image ? savedImageUrl : undefined, // Only update image if a new one is provided
        items: {
          deleteMany: {}, // Delete existing ItemGroupItem records
          create: items.map(({ itemId, quantity }) => ({
            itemId,
            quantity,
          })),
        },
        updatedAt: createdAt,
      },
    });

    revalidatePath(
      `/sistemas/negocio/articulos/conjuntos/editar/${groupItemId}`
    );
    return {
      errors: {},
      success: true,
      message: "Articulo compuesto actualizado correctamente!",
    };
  } catch (error) {
    console.error("Error al actualizar Articulo compuesto:", error);
    return {
      errors: {},
      success: false,
      message: "Fallo al actualizar Articulo compuesto",
    };
  }
}

export async function deleteItemGroupAction(formData: FormData) {
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
    return { success: false, message: "Error al eliminar producto compuesto" };

  try {
    await prisma.$transaction([
      prisma.itemGroup.delete({
        where: {
          id: validatedData.data.id,
        },
      }),
    ]);

    revalidatePath("/sistema/negocio/articulos/conjuntos");
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

export async function toggleItemGroupStatusAction(formData: FormData) {
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
    const item = await prisma.itemGroup.findUnique({
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
    const createdAt = getMexicoGlobalUtcDate();
    // Update the item with the new status
    await prisma.itemGroup.update({
      where: {
        id: validatedData.data.id,
      },
      data: {
        status: newStatus as ItemStatus,
        updatedAt: createdAt,
      },
    });

    revalidatePath("/sistema/negocio/articulos/conjuntos");
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
