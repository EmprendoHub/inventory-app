"use server";

import { uploadToBucket } from "@/app/_actions";
import prisma from "@/lib/db";
import { idSchema } from "@/lib/schemas";
import { getMexicoGlobalUtcDate } from "@/lib/utils";
import { writeFile } from "fs/promises";
import { revalidatePath } from "next/cache";
import { join } from "path";

export async function createClient(
  state: {
    errors: { [key: string]: string[] };
    success: boolean;
    message: string;
  },
  formData: FormData
) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const image = formData.get("image") as File;

  // Validate inputs
  const errors: { [key: string]: string[] } = {};

  if (!name || name.trim() === "") {
    errors.name = ["Name is required"];
  }

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    errors.email = ["Valid email is required"];
  }

  if (!phone || !/^\+?[1-9]\d{1,14}$/.test(phone)) {
    errors.phone = ["Valid phone number is required"];
  }

  if (!address || address.trim() === "") {
    errors.address = ["Address is required"];
  }

  // Convert the image file to Base64
  let savedImageUrl = `${process.env.MINIO_URL}avatars/avatar_placeholder.jpg`;
  if (image && image instanceof File && image.size > 0) {
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    const newFilename = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.png`;
    const path = join("/", "tmp", newFilename);

    // Save to temporary file
    const uint8Array = new Uint8Array(imageBuffer);
    await writeFile(path, uint8Array);

    await uploadToBucket("inventario", "avatars/" + newFilename, path);
    savedImageUrl = `${process.env.MINIO_URL}avatars/${newFilename}`;
  }

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      success: false,
      message: "Please fix the errors before submitting.",
    };
  }
  const createdAt = getMexicoGlobalUtcDate();
  try {
    await prisma.client.create({
      data: {
        name,
        email,
        phone,
        address,
        image: savedImageUrl,
        status: "ACTIVE",
        createdAt,
        updatedAt: createdAt,
      },
    });
    revalidatePath("/sistema/ventas/clientes");
    revalidatePath("/sistema/negocio/articulos/nuevo");
    revalidatePath("/sistema/ventas/pedidos/nuevo");

    return {
      errors: {},
      success: true,
      message: "Client created successfully!",
    };
  } catch (error) {
    console.error("Error creating client:", error);

    // Handle unique constraint errors
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return {
        errors: {
          email: ["El correo electrónico o número de teléfono ya existe"],
        },
        success: false,
        message: "Client creation failed",
      };
    }

    revalidatePath("/sistema/ventas/clientes");

    return {
      errors: {},
      success: false,
      message: "Failed to create client",
    };
  }
}

export async function updateClient(
  state: {
    errors: { [key: string]: string[] };
    success: boolean;
    message: string;
  },
  formData: FormData
) {
  "use server";

  const clientId = formData.get("id") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const image = formData.get("image") as File;

  // Validate inputs
  const errors: { [key: string]: string[] } = {};

  if (!name || name.trim() === "") {
    errors.name = ["Name is required"];
  }

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    errors.email = ["Valid email is required"];
  }

  if (!phone || !/^\+?[1-9]\d{1,14}$/.test(phone)) {
    errors.phone = ["Valid phone number is required"];
  }

  if (!address || address.trim() === "") {
    errors.address = ["Address is required"];
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

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      success: false,
      message: "Please fix the errors before submitting.",
    };
  }
  const createdAt = getMexicoGlobalUtcDate();
  try {
    if (image) {
      await prisma.client.update({
        where: {
          id: clientId,
        },
        data: {
          name,
          email,
          phone,
          address,
          image: savedImageUrl,
          updatedAt: createdAt,
        },
      });
    } else {
      await prisma.client.update({
        where: {
          id: clientId,
        },
        data: {
          name,
          email,
          phone,
          address,
          updatedAt: createdAt,
        },
      });
    }
    revalidatePath(`/sistemas/ventas/clientes/editar/${clientId}`);
    revalidatePath("/sistema/ventas/clientes");
    revalidatePath("/sistema/ventas/pedidos/nuevo");

    return {
      errors: {},
      success: true,
      message: "Cliente actualizado correctamente!",
    };
  } catch (error) {
    console.error("Error creating client:", error);

    // Handle unique constraint errors
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return {
        errors: {
          email: ["El correo electrónico o número de teléfono ya existe"],
        },
        success: false,
        message: "Client creation failed",
      };
    }

    return {
      errors: {},
      success: false,
      message: "Failed to create client",
    };
  }
}

export async function deleteClientAction(formData: FormData) {
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
      // First, delete all OrderItems related to the Orders of the client
      prisma.orderItem.deleteMany({
        where: {
          order: {
            clientId: validatedData.data.id,
          },
        },
      }),

      // Then, delete all Payments related to the Orders of the client
      prisma.payment.deleteMany({
        where: {
          order: {
            clientId: validatedData.data.id,
          },
        },
      }),

      // Then, delete all Orders of the client
      prisma.order.deleteMany({
        where: {
          clientId: validatedData.data.id,
        },
      }),

      // Finally, delete the client
      prisma.client.delete({
        where: {
          id: validatedData.data.id,
        },
      }),
    ]);

    revalidatePath("/sistema/negocio/clientes");
    return {
      errors: {},
      success: true,
      message: "Client deleted successfully!",
    };
  } catch (error) {
    console.error("Error deleting client:", error);
    return {
      errors: {},
      success: false,
      message: "Failed to delete client",
    };
  }
}

export async function toggleClientStatusAction(formData: FormData) {
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
    const client = await prisma.client.findUnique({
      where: {
        id: validatedData.data.id,
      },
      select: {
        status: true,
      },
    });

    if (!client) {
      return {
        success: false,
        message: "Item not found",
      };
    }
    // Toggle the status
    const newStatus = client.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const createdAt = getMexicoGlobalUtcDate();
    await prisma.$transaction([
      prisma.client.update({
        where: {
          id: validatedData.data.id,
        },
        data: {
          status: newStatus,
          updatedAt: createdAt,
        },
      }),
    ]);

    revalidatePath("/sistema/negocio/clientes");
    return {
      errors: {},
      success: true,
      message: "Category deleted successfully!",
    };
  } catch (error) {
    console.error("Error creating category:", error);
    return {
      errors: {},
      success: false,
      message: "Failed to delete category",
    };
  }
}

export async function revalidateClientPaths() {
  revalidatePath("/sistema/ventas/clientes");
  revalidatePath("/sistema/ventas/pedidos/nuevo");
  revalidatePath("/sistema/negocio/articulos/nuevo");
}
