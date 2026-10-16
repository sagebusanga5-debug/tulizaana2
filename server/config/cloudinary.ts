import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

/**
 * Cloudinary SDK configuration
 * Supports both individual variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)
 * and the unified CLOUDINARY_URL format (cloudinary://api_key:api_secret@cloud_name)
 */

export function isCloudinaryConfigured(): boolean {
  if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.startsWith("cloudinary://")) {
    return true;
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return Boolean(cloudName && apiKey && apiSecret && !cloudName.includes("your_"));
}

export function initCloudinary() {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloudinary_url: process.env.CLOUDINARY_URL,
      secure: true,
    });
    return;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Initialize on load if configured
if (isCloudinaryConfigured()) {
  initCloudinary();
}

/**
 * Upload a media (image, audio, document) from base64 data URI to Cloudinary.
 * Returns the secure HTTPS URL and metadata from Cloudinary CDN.
 */
export async function uploadToCloudinary(
  dataUriOrBuffer: string,
  options: {
    folder?: string;
    resourceType?: "image" | "video" | "raw" | "auto";
    publicId?: string;
    tags?: string[];
  } = {}
): Promise<{
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  bytes: number;
  resourceType: string;
}> {
  initCloudinary();

  const folder = options.folder || "tulizaana";
  const resourceType = options.resourceType || "auto";

  const result: UploadApiResponse = await cloudinary.uploader.upload(dataUriOrBuffer, {
    folder,
    resource_type: resourceType,
    public_id: options.publicId,
    tags: options.tags || ["tulizaana", "community"],
    transformation:
      resourceType === "image"
        ? [
            { quality: "auto:good", fetch_format: "auto" },
          ]
        : undefined,
  });

  return {
    url: result.secure_url || result.url,
    secureUrl: result.secure_url,
    publicId: result.public_id,
    format: result.format || "unknown",
    bytes: result.bytes,
    resourceType: result.resource_type,
  };
}

export async function checkCloudinaryHealth(): Promise<{
  configured: boolean;
  cloudName?: string;
  status: "ready" | "not_configured" | "error";
  error?: string;
}> {
  if (!isCloudinaryConfigured()) {
    return {
      configured: false,
      status: "not_configured",
    };
  }

  try {
    initCloudinary();
    // Test API connectivity with ping
    const pingResult = await cloudinary.api.ping();
    return {
      configured: true,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || "configured",
      status: pingResult.status === "ok" ? "ready" : "ready",
    };
  } catch (err: any) {
    return {
      configured: true,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      status: "error",
      error: err?.message || "Erreur de connexion à l'API Cloudinary",
    };
  }
}
