"use server";

import { uploadToBucket } from "@/app/_actions";
import prisma from "@/lib/db";
import { idSchema, UserSchema } from "@/lib/schemas";
import { UserFormState } from "@/types/users";
import { DriverStatus, Role } from "@prisma/client";
import { unlink, writeFile } from "fs/promises";
import { revalidatePath } from "next/cache";
import { join } from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";

export const createUserAction = async (
  state: UserFormState,
  formData: FormData
): Promise<UserFormState> => {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password") as string,
    active: formData.get("active") === "true" ? true : false,
    phone: formData.get("phone"),
    role: formData.get("role"),
    avatar: formData.get("avatar") as File,
  };

  const validatedData = UserSchema.safeParse(rawData);
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
      message: "Error al validar campos del usuario",
    };

  let base64Image = "";
  if (
    rawData.avatar &&
    rawData.avatar instanceof File &&
    rawData.avatar.size > 0
  ) {
    const arrayBuffer = await rawData.avatar.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    base64Image = buffer.toString("base64");
  }

  const hashedPassword = await bcrypt.hash(validatedData.data.password, 10);
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, "base64");

  const newFilename = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.png`;
  const path = join("/", "tmp", newFilename);

  const uint8Array = new Uint8Array(imageBuffer);
  await writeFile(path, uint8Array);

  await uploadToBucket("inventario", "avatars/" + newFilename, path);
  const savedImageUrl = `${process.env.MINIO_URL}avatars/${newFilename}`;
  // Generate a random 64-byte token
  const verificationToken = crypto.randomBytes(64).toString("hex");

  try {
    const newUser = await prisma.user.create({
      data: {
        name: validatedData.data.name,
        email: validatedData.data.email,
        phone: validatedData.data.phone,
        active: validatedData.data.active,
        password: hashedPassword,
        role: validatedData.data.role as Role,
        verificationToken,
        avatar: savedImageUrl,
      },
    });

    if (validatedData.data.role === "CHOFER") {
      await prisma.driver.create({
        data: {
          name: validatedData.data.name,
          userId: newUser.id,
          status: "DISPONIBLE" as DriverStatus,
          licenseNumber: "",
        },
      });
    }

    await unlink(path);
    revalidatePath("/sistema/negocio/usuarios");
    return {
      success: true,
      message: "Usuario creado exitosamente!",
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, message: "Error al crear usuario." };
  }
};

export async function updateUserAction(
  state: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const rawData = {
    id: formData.get("id") as string,
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    authCode: formData.get("authCode") as string,
    phone: formData.get("phone") as string,
    password: formData.get("password") as string,
    active: formData.get("active") === "true" ? true : false,
    role: formData.get("role") as string,
    avatar: formData.get("avatar") as File,
  };

  console.log(rawData);

  const validatedData = UserSchema.safeParse(rawData);

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
      message: "Error al validar campos del usuario",
    };

  const hashedPassword = await bcrypt.hash(validatedData.data.password, 10);
  let base64Image = "";
  if (
    rawData.avatar &&
    rawData.avatar instanceof File &&
    rawData.avatar.size > 0
  ) {
    const arrayBuffer = await rawData.avatar.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    base64Image = buffer.toString("base64");
  }

  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, "base64");

  const newFilename = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.png`;
  const path = join("/", "tmp", newFilename);

  const uint8Array = new Uint8Array(imageBuffer);
  await writeFile(path, uint8Array);

  await uploadToBucket("inventario", "avatars/" + newFilename, path);
  const savedImageUrl = `${process.env.MINIO_URL}avatars/${newFilename}`;

  try {
    if (rawData.avatar) {
      await prisma.user.update({
        where: {
          id: rawData.id,
        },
        data: {
          name: validatedData.data.name,
          email: validatedData.data.email,
          phone: validatedData.data.phone,
          authCode: validatedData.data.authCode,
          active: validatedData.data.active,
          password: hashedPassword,
          role: validatedData.data.role as Role,
          avatar: savedImageUrl,
        },
      });
    } else {
      await prisma.user.update({
        where: {
          id: rawData.id,
        },
        data: {
          name: validatedData.data.name,
          email: validatedData.data.email,
          phone: validatedData.data.phone,
          authCode: validatedData.data.authCode,
          active: validatedData.data.active,
          password: hashedPassword,
          role: validatedData.data.role as Role,
        },
      });
    }
    revalidatePath("/sistema/negocio/usuarios");
    return {
      errors: {},
      success: true,
      message: "Usuario actualizado correctamente!",
    };
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return {
      errors: {},
      success: false,
      message: "Fallo al actualizar usuario",
    };
  }
}

export async function deleteUserAction(formData: FormData) {
  const rawData = {
    id: formData.get("id"),
  };

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
    return { success: false, message: "Error al eliminar usuario" };

  try {
    await prisma.user.delete({
      where: {
        id: validatedData.data.id,
      },
    });

    revalidatePath("/sistema/negocio/usuarios");
    return {
      errors: {},
      success: true,
      message: "Usuario eliminado exitosamente!",
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      errors: {},
      success: false,
      message: "Failed to delete user",
    };
  }
}
