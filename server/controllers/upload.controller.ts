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

// Création du répertoire uploads s'il n'existe pas encore (fallback local)
if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (err) {
    console.warn("Impossible de créer le dossier uploads:", err);
  }
}

/**
 * Téléversement de média (image ou audio) :
 * 1. Priorité absolue à Cloudinary dès que configuré (Production Vercel/Supabase).
 * 2. Repli local résilient sur disque si les identifiants Cloudinary ne sont pas encore définis.
 */
export async function uploadMedia(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { dataUrl, filename, type = "image", folder = "tulizaana" } = req.body;

    if (!dataUrl || typeof dataUrl !== "string") {
      sendError(res, "Le payload 'dataUrl' (Base64) est requis.", 400);
      return;
    }

    if (dataUrl.startsWith("http://") || dataUrl.startsWith("https://")) {
      if (!ALLOWED_REMOTE_SCHEMES.some((s) => dataUrl.startsWith(s))) {
        sendError(res, "URL distante non autorisee.", 400);
        return;
      }
      sendSuccess(res, { url: dataUrl, format: "remote", type, provider: "cloudinary_remote" });
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
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length > 20 * 1024 * 1024) {
      sendError(res, "Le fichier depasse la taille maximale autorisee (20 Mo).", 413);
      return;
    }

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
        type: mimeType.startsWith("audio/") ? "audio" : "image",
        provider: "local",
        notice: "Pour heberger directement sur Cloudinary, renseignez CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET.",
      },
      201
    );
  } catch (err) {
    console.error("Erreur uploadMedia:", err);
    sendError(res, "Erreur lors du traitement du televersement.", 500);
  }
}
