import { Request, Response } from "express";
import { checkDatabaseHealth } from "../config/database.js";
import { checkCloudinaryHealth } from "../config/cloudinary.js";
import { checkSupabaseHealth } from "../config/supabase.js";

export async function getHealthController(_req: Request, res: Response): Promise<void> {
  const [dbHealth, cloudinaryHealth, supabaseHealth] = await Promise.all([
    checkDatabaseHealth(),
    checkCloudinaryHealth(),
    checkSupabaseHealth(),
  ]);

  const isSupabaseDb = process.env.DATABASE_URL?.includes("supabase");

  res.json({
    status: "ok",
    appName: "Tulizaana",
    version: "1.2.0",
    architecture: {
      frontend: "Vercel / React Vite SPA",
      backend: "Node.js Express / Supabase",
      database: isSupabaseDb ? "Supabase PostgreSQL" : "PostgreSQL",
      mediaStorage: "Cloudinary CDN",
    },
    timestamp: new Date().toISOString(),
    services: {
      database: {
        provider: isSupabaseDb ? "supabase_postgresql" : "postgresql",
        configured: dbHealth.configured,
        connected: dbHealth.connected,
        error: dbHealth.error,
      },
      supabase: {
        configured: supabaseHealth.configured,
        connected: supabaseHealth.connected,
        status: supabaseHealth.status,
        url: supabaseHealth.url,
        error: supabaseHealth.error,
      },
      cloudinary: {
        configured: cloudinaryHealth.configured,
        cloudName: cloudinaryHealth.cloudName,
        status: cloudinaryHealth.status,
        error: cloudinaryHealth.error,
      },
      geminiAi: {
        configured: !!process.env.GEMINI_API_KEY,
        status: process.env.GEMINI_API_KEY ? "ready" : "fallback_mode",
      },
    },
  });
}
