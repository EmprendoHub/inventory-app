"use server";
import sharp from "sharp";
import prisma from "@/lib/db";
import { mc } from "@/lib/minio";
import { VerifyEmailSchema } from "@/lib/schemas";
import axios from "axios";
import { writeFile } from "fs/promises";
import nodemailer from "nodemailer";
import { join } from "path";

// Optimize and upload image
export const uploadOptimizedImage = async (rawData: any) => {
  try {
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
      await uploadToBucket("inventario", "products/" + newFilename, path);

      console.log("Image uploaded successfully:", newFilename);
      return newFilename;
    }
  } catch (error) {
    console.error("Error optimizing or uploading image:", error);
    throw error;
  }
};

// Put a file in bucket my-bucketname
export const uploadToBucket = async (
  folder: string,
  filename: string,
  file: string
): Promise<
  { response: Awaited<ReturnType<typeof mc.fPutObject>> } | undefined
> => {
  try {
    const response = await mc.fPutObject(folder, filename, file);
    return { response };
  } catch (error) {
    console.error("Upload failed:", error);
    return undefined;
  }
};

export async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function resendEmail(data: any) {
  const { email, gReCaptchaToken } = Object.fromEntries(data);
  const secretKey = process?.env?.RECAPTCHA_SECRET_KEY;

  //check for errors
  const { error: zodError } = VerifyEmailSchema.safeParse({
    email,
  });
  if (zodError) {
    return { error: zodError.format() };
  }

  const formData = `secret=${secretKey}&response=${gReCaptchaToken}`;
  let res: any;
  try {
    res = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
  } catch (e) {
    console.log("recaptcha error:", e);
  }

  if (res && res.data?.success && res.data?.score > 0.5) {
    // Save data to the database from here
    try {
      const user = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      if (!user) {
        return { error: { email: { _errors: ["Email does not exist"] } } };
      }
      if (user?.active === true) {
        return { error: { email: { _errors: ["Email is already verified"] } } };
      }
      if (user?.id) {
        try {
          const subject = "Confirmar email";
          const body = `Por favor da click en confirmar email para verificar tu cuenta.`;
          const title = "Completar registro";
          const greeting = `Saludos ${user?.name}`;
          const action = "CONFIRMAR EMAIL";
          const bestRegards = "Gracias por unirte a nuestro sitio.";
          const recipient_email = email;
          const sender_email = "invetamexapp@gmail.com";
          const fromName = "Yunuen Company";

          const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
              user: process.env.GOOGLE_MAIL,
              pass: process.env.GOOGLE_MAIL_PASS,
            },
          });

          try {
            // Verify your transporter
            //await transporter.verify();

            const mailOptions = {
              from: `"${fromName}" ${sender_email}`,
              to: recipient_email,
              subject,
              html: `
        <!DOCTYPE html>
        <html lang="es">
        <body>
        <p>${greeting}</p>
        <p>${title}</p>
        <div>${body}</div>
        <a href="${process.env.NEXTAUTH_URL}/exito?token=${user?.verificationToken}">${action}</a>
        <p>${bestRegards}</p>
        </body>
        
        </html>
        
        `,
            };
            await transporter.sendMail(mailOptions);

            return {
              error: {
                success: {
                  _errors: [
                    "El correo se envió exitosamente revisa tu bandeja de entrada y tu correo no deseado",
                  ],
                },
              },
            };
          } catch (error: any) {
            console.log(error);
          }
        } catch (error: any) {
          console.log(error);
          return { error: { email: { _errors: ["Error al enviar email"] } } };
        }
      }
    } catch (error: any) {
      console.log(error);
      throw Error(error);
    }
  } else {
    return {
      error: {
        email: { _errors: [`Failed Google Captcha Score: ${res.data?.score}`] },
      },
    };
  }
}

export async function uploadImageAction(base64Image: string) {
  try {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    const newFilename = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.png`;
    const path = join("/", "tmp", newFilename);

    const uint8Array = new Uint8Array(imageBuffer);
    await writeFile(path, uint8Array);

    await uploadToBucket("inventario", "proofs/" + newFilename, path);
    const imageUrl = `${process.env.MINIO_URL}proofs/${newFilename}`;

    return { success: true, imageUrl };
  } catch (error) {
    console.error("Error uploading image:", error);
    return { success: false, error: "Failed to upload image" };
  }
}

export const verifySupervisorCode = async (
  code: string = ""
): Promise<{ authUserId: string; success: boolean }> => {
  const authorizedUser = await prisma.user.findFirst({
    where: {
      authCode: code,
    },
  });

  if (!authorizedUser) {
    return { authUserId: "", success: false };
  }
  // Implement your logic to verify the supervisor code
  // For example, you can make an API call to verify the code
  // This is a placeholder implementation
  return { authUserId: authorizedUser.id, success: true }; // Replace with actual verification logic
};
