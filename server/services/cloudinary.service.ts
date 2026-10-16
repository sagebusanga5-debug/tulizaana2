/**
 * Cloudinary Media Storage Service (Scaffold - Phase ultérieure).
 * 
 * Ce fichier est préparé pour héberger les téléversements sécurisés vers Cloudinary
 * (photos de profils, justificatifs légaux d'ONG, vocaux audio et images de posts).
 * 
 * L'implémentation complète et les dépendances correspondantes seront installées
 * lors de la phase dédiée au stockage média.
 */

export interface UploadResult {
  url: string;
  publicId: string;
  format?: string;
  duration?: number;
}

export async function uploadMediaPlaceholder(): Promise<UploadResult> {
  throw new Error("Cloudinary service is scheduled for a subsequent phase.");
}
