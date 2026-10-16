import { api } from './api';

export interface CloudinaryUploadResult {
  url: string;
  provider: 'cloudinary' | 'local' | 'cloudinary_remote';
  publicId?: string;
  format?: string;
  bytes?: number;
  type?: 'image' | 'audio';
}

/**
 * Upload an image or audio to Cloudinary CDN
 * Sends the base64 or data URL to the backend, which uploads to Cloudinary with secure credentials.
 */
export async function uploadMediaToCloudinary(
  fileOrDataUrl: File | string,
  type: 'image' | 'audio' = 'image',
  folder: string = 'media'
): Promise<CloudinaryUploadResult> {
  let dataUrl: string;

  if (typeof fileOrDataUrl === 'string') {
    dataUrl = fileOrDataUrl;
  } else {
    dataUrl = await fileToDataUrl(fileOrDataUrl);
  }

  // Si c'est déjà une URL distante Cloudinary
  if (dataUrl.startsWith('https://res.cloudinary.com')) {
    return {
      url: dataUrl,
      provider: 'cloudinary',
      type,
    };
  }

  const response = await api.upload.media(dataUrl, type);

  if (!response.success || !response.data?.url) {
    throw new Error(response.error || 'Échec du téléversement du média.');
  }

  return {
    url: response.data.url,
    provider: (response.data as any).provider || 'cloudinary',
    publicId: (response.data as any).publicId,
    format: (response.data as any).format,
    bytes: response.data.size,
    type,
  };
}

/**
 * Convert a File object to Data URL base64
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
