"use server";

import { uploadToBucket } from "@/app/_actions";
import prisma from "@/lib/db";
import { writeFile } from "fs/promises";
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

  try {
    await prisma.client.create({
      data: {
        name,
        email,
        phone,
        address,
        image: savedImageUrl,
      },
    });

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
          email: ["Email or phone number already exists"],
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

  console.log(image);

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
        },
      });
    }

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
          email: ["Email or phone number already exists"],
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
