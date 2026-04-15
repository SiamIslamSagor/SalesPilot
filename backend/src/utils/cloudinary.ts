/**
 * Cloudinary Image Upload Utility
 *
 * Uploads base64-encoded images to Cloudinary for permanent hosting.
 * Requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET
 * environment variables.
 */

import { v2 as cloudinary } from "cloudinary";

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error(
      "[Cloudinary] Missing required env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET",
    );
    return false;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  configured = true;
  return true;
}

/**
 * Ensure a base64 string has the data URI prefix required by Cloudinary.
 * If raw base64, default to image/png.
 */
function ensureDataUri(input: string): string {
  if (input.startsWith("data:")) return input;
  return `data:image/png;base64,${input}`;
}

/**
 * Upload a base64-encoded image to Cloudinary for permanent hosting.
 * Accepts both raw base64 and data URI formats.
 *
 * @param base64Image - Base64-encoded image string (with or without data URI prefix)
 * @returns The hosted image URL, or null on failure
 */
export async function uploadToCloudinary(
  base64Image: string,
): Promise<string | null> {
  if (!ensureConfigured()) return null;

  try {
    const dataUri = ensureDataUri(base64Image);

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "prod-pros",
    });

    if (result.secure_url) {
      return result.secure_url;
    }

    console.error("[Cloudinary] Response missing URL", result);
    return null;
  } catch (error) {
    console.error("[Cloudinary] Upload error:", error);
    return null;
  }
}
