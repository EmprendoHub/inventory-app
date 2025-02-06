"use server";

import { mc } from "@/lib/minio";

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
    console.log(response, "response");
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
