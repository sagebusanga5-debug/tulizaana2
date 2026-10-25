import { Response } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { isCloudinaryConfigured, uploadToCloudinary } from "../config/cloudinary.js";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/webm",
  "audio/ogg",
  "audio/opus",
  "audio/wav",
  "audio/mpeg",
  "audio/mp3",
  "application/pdf",
]);

const ALLOWED_REMOTE_SCHEMES = ["https://"];

// Magic byte signatures for additional validation
const MAGIC_SIGNATURES: Array<{ mime: string; bytes: number[] }> = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF - check WEBP later if needed
];

// Création du répertoire uploads s'il n'existe pas encore (fallback local)
if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (err) {
    console.warn("Impossible de créer le dossier uploads:", err);
  }
}

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "application/pdf") {
    const header = buffer.subarray(0, 4).toString();
    return header.startsWith("%PDF");
  }
  if (mimeType === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  if (mimeType === "image/gif") {
    return buffer.length >= 3 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
  }
  if (mimeType === "image/webp") {
    // RIFF....WEBP
    if (buffer.length < 12) return false;
    const riff = buffer.subarray(0, 4).toString();
    const webp = buffer.subarray(8, 12).toString();
    return riff === "RIFF" && webp === "WEBP";
  }
  // For audio types, do basic checks
  if (mimeType === "audio/wav") {
    if (buffer.length < 12) return false;
    return buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WAVE";
  }
  if (mimeType === "audio/ogg" || mimeType === "audio/opus") {
    return buffer.length >= 4 && buffer[0] === 0x4f && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53;
  }
  if (mimeType === "audio/mpeg" || mimeType === "audio/mp3") {
    // MP3 can start with ID3 or FF FB/FF F3/FF F2
    if (buffer.length >= 3 && buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) return true;
    if (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return true;
    return false;
  }
  if (mimeType === "image/webm") {
    // EBML header
    return buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
  }
  return true;
}

function getResourceType(mimeType: string): "image" | "video" | "raw" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/") || mimeType === "application/pdf") return "raw";
  return "auto" as any;
}

/**
 * Téléversement de média (image, audio, document) sécurisé.
 * 1. Priorité absolue à Cloudinary si configuré (recommandé pour Vercel/Render serverless)
 * 2. Repli local uniquement si Cloudinary n'est pas configuré (développement local)
 */
export async function uploadMedia(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { dataUrl, filename, type = "image", folder = "tulizaana" } = req.body;

    if (!dataUrl || typeof dataUrl !== "string") {
      sendError(res, "Le payload 'dataUrl' (Base64) est requis.", 400);
      return;
    }

    // Autoriser uniquement les URLs HTTPS distantes explicites (ne pas téléverser depuis http)
    if (dataUrl.startsWith("http://") || dataUrl.startsWith("https://")) {
      if (!ALLOWED_REMOTE_SCHEMES.some((s) => dataUrl.startsWith(s))) {
        sendError(res, "URL distante non autorisee (seul HTTPS est autorise).", 400);
        return;
      }
      // Pour les URLs distantes, on accepte uniquement si elles proviennent de Cloudinary ou domaines de confiance
      // Pour cette implémentation, on valide le schéma HTTPS uniquement
      sendSuccess(res, { url: dataUrl, format: "remote", type, provider: "external_https" });
      return;
    }

    const matches = dataUrl.match(/^data:([A-Za-z0-9-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      sendError(res, "Format base64 invalide (attendu: data:<mime>;base64,<donnees>).", 400);
      return;
    }

    const mimeType = matches[1].toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      sendError(res, `Type de fichier non autorise : ${mimeType}.`, 415);
      return;
    }

    const base64Data = matches[2];
    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64Data, "base64");
    } catch {
      sendError(res, "Données base64 invalides.", 400);
      return;
    }

    if (buffer.length === 0) {
      sendError(res, "Fichier vide non autorise.", 400);
      return;
    }

    if (buffer.length > 20 * 1024 * 1024) {
      sendError(res, "Le fichier depasse la taille maximale autorisee (20 Mo).", 413);
      return;
    }

    // Validation des magic bytes
    if (!validateMagicBytes(buffer, mimeType)) {
      sendError(res, "Signature de fichier invalide ou incohérente avec le type déclaré.", 400);
      return;
    }

    // Priorité à Cloudinary si configuré
    if (isCloudinaryConfigured()) {
      try {
        const resourceType = getResourceType(mimeType);
        const uploadResult = await uploadToCloudinary(dataUrl, {
          folder,
          resourceType: resourceType === "auto" ? "auto" : resourceType,
          tags: ["tulizaana", "community", req.user?.id ? `user-${req.user.id}` : "anonymous"],
        });
        sendSuccess(
          res,
          {
            url: uploadResult.secureUrl || uploadResult.url,
            secureUrl: uploadResult.secureUrl,
            publicId: uploadResult.publicId,
            filename: uploadResult.publicId,
            size: buffer.length,
            mimeType,
            format: uploadResult.format,
            type: mimeType.startsWith("audio/") ? "audio" : mimeType === "application/pdf" ? "document" : "image",
            provider: "cloudinary",
          },
          201
        );
        return;
      } catch (cloudErr) {
        console.error("Échec upload Cloudinary, tentative de repli local:", cloudErr);
        // Continue vers fallback local en cas d'échec Cloudinary
      }
    }

    // Fallback local (à utiliser uniquement en développement si Cloudinary non configuré)
    let ext = "bin";
    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) ext = "jpg";
    else if (mimeType.includes("png")) ext = "png";
    else if (mimeType.includes("webp")) ext = "webp";
    else if (mimeType.includes("gif")) ext = "gif";
    else if (mimeType.includes("webm")) ext = "webm";
    else if (mimeType.includes("ogg") || mimeType.includes("opus")) ext = "ogg";
    else if (mimeType.includes("wav")) ext = "wav";
    else if (mimeType.includes("mp3") || mimeType.includes("mpeg")) ext = "mp3";
    else if (mimeType.includes("pdf")) ext = "pdf";

    const uniqueId = crypto.randomBytes(12).toString("hex");
    const safeFilename = `${Date.now()}-${uniqueId}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeFilename);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${safeFilename}`;

    sendSuccess(
      res,
      {
        url: publicUrl,
        filename: safeFilename,
        size: buffer.length,
        mimeType,
        type: mimeType.startsWith("audio/") ? "audio" : mimeType === "application/pdf" ? "document" : "image",
        provider: "local",
        notice: "Stockage local utilisé. Pour un stockage persistant en production (Vercel/Render), configurez Cloudinary.",
      },
      201
    );
  } catch (err) {
    console.error("Erreur uploadMedia:", err);
    sendError(res, "Erreur lors du traitement du televersement.", 500);
  }
}
