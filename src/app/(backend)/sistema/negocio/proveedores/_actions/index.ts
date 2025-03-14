"use server";

import prisma from "@/lib/db";
import { idSchema, SupplierSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { unlink, writeFile } from "fs/promises";
import { join } from "path";
import { uploadToBucket } from "@/app/_actions";
import sharp from "sharp";
import { getMexicoGlobalUtcDate } from "@/lib/utils";

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
      .webp({
        // Convert to WebP format
        quality: 80, // Adjust quality (0-100)
        lossless: false, // Use lossy compression for smaller file size
      })
      .toBuffer();

    // Generate a unique filename
    const newFilename = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.webp`;
    const path = join("/", "tmp", newFilename);

    // Save the optimized image to a temporary file
    await writeFile(path, optimizedImageBuffer);

    // Upload the optimized image to Minio
    await uploadToBucket("inventario", "suppliers/" + newFilename, path);
    const savedImageUrl = `${process.env.MINIO_URL}suppliers/${newFilename}`;

    try {
      const createdAt = getMexicoGlobalUtcDate();
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
            createdAt,
            updatedAt: createdAt,
          },
        });

        return newSupplier;
      });

      // Clean up the temporary file
      await unlink(path);
      revalidatePath("/sistema/negocio/proveedores");
      return {
        success: true,
        message: "Proveedor creado exitosamente!",
        product: result,
      };
    } catch (error) {
      console.error("Error al crear Proveedor:", error);
      return { success: false, message: "Error al crear Proveedor." };
    }
  } else {
    return {
      success: false,
      message: "Falto una imagen!",
    };
  }
};

export async function updateSupplierAction(
  state: {
    errors?: Record<string, string[]>;
    success?: boolean;
    message?: string;
  },
  formData: FormData
) {
  const rawData = {
    supplierId: formData.get("id") as string,
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
    return {
      errors: {},

      success: false,

      message: "Error al validar campos del Proveedor",
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
      .webp({
        // Convert to WebP format
        quality: 80, // Adjust quality (0-100)
        lossless: false, // Use lossy compression for smaller file size
      })
      .toBuffer();

    // Generate a unique filename
    const newFilename = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.webp`;
    const path = join("/", "tmp", newFilename);

    // Save the optimized image to a temporary file
    await writeFile(path, optimizedImageBuffer);

    // Upload the optimized image to Minio
    await uploadToBucket("inventario", "avatars/" + newFilename, path);
    const savedImageUrl = `${process.env.MINIO_URL}avatars/${newFilename}`;
    const createdAt = getMexicoGlobalUtcDate();
    try {
      if (rawData.image) {
        await prisma.supplier.update({
          where: {
            id: rawData.supplierId,
          },
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
            updatedAt: createdAt,
          },
        });
      } else {
        await prisma.supplier.update({
          where: {
            id: rawData.supplierId,
          },
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
            updatedAt: createdAt,
          },
        });
      }
      revalidatePath(
        `/sistemas/negocio/proveedores/editar/${rawData.supplierId}`
      );
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
  } else {
    return {
      success: false,
      message: "Falto una imagen!",
    };
  }
}

export async function deleteSupplierAction(formData: FormData) {
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
      prisma.supplier.delete({
        where: {
          id: validatedData.data.id,
        },
      }),
    ]);

    revalidatePath("/sistema/negocio/proveedores");
    return {
      errors: {},
      success: true,
      message: "Supplier deleted successfully!",
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
