import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { getHealthController } from "./server/controllers/health.controller";
import { getSupabaseInitSql, testSupabaseBackendConnection } from "./server/controllers/schema.controller";
import { errorHandler } from "./server/middleware/errorHandler";
import { getJwtSecretStatus, requireAuth, requireRole } from "./server/middleware/auth";
import { rateLimit } from "./server/middleware/rate-limit";
import { attachParsedCookies } from "./server/utils/cookies";
import authRoutes from "./server/routes/auth.routes";
import adminRoutes from "./server/routes/admin.routes";
import communityRoutes from "./server/routes/community.routes";
import postRoutes from "./server/routes/post.routes";
import messageRoutes from "./server/routes/message.routes";
import invitationRoutes from "./server/routes/invitation.routes";
import moderationRoutes from "./server/routes/moderation.routes";
import campaignRoutes from "./server/routes/campaign.routes";
import storyRoutes from "./server/routes/story.routes";
import organizationRoutes from "./server/routes/organization.routes";
import uploadRoutes from "./server/routes/upload.routes";
import searchRoutes from "./server/routes/search.routes";
import partnerReportRoutes from "./server/routes/partner-report.routes";

dotenv.config();

const PORT = 3000;

const DEFAULT_ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

function getAllowedOrigins(): Set<string> {
  const configured = [
    process.env.FRONTEND_ORIGIN,
    process.env.CORS_ALLOWED_ORIGINS,
    process.env.VITE_API_ORIGIN,
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...configured]);
}

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. AI features will operate in fallback mode.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

/**
 * Server-side in-memory cache for translations to avoid redundant Gemini calls,
 * respect Free Tier rate limits, and provide sub-millisecond responses.
 */
const serverTranslationCache = new Map<string, string>();

/**
 * Circuit breaker: automatically pauses calls to Gemini when 429 (quota) or 503 (high demand)
 * are received, serving instant fallbacks without flooding logs or failing requests.
 */
let geminiSuspendedUntil = 0;

function isGeminiSuspended(): boolean {
  return Date.now() < geminiSuspendedUntil;
}

function suspendGemini(seconds: number = 45) {
  geminiSuspendedUntil = Math.max(geminiSuspendedUntil, Date.now() + seconds * 1000);
}

function safeParseJson(rawText: string | undefined): any {
  if (!rawText) return {};
  const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    try {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {
      // ignore
    }
    return {};
  }
}

interface GenerateOptions {
  contents: any;
  config?: any;
  preferredModel?: string;
  timeoutMs?: number;
}

/**
 * Resilient wrapper for Gemini generateContent:
 * Automatically uses gemini-3.8-flash (recommended for basic text tasks per gemini-api skill)
 * with automatic fallback to gemini-flash-latest, circuit-breaker suspension, and timeouts.
 */
async function generateContentWithResilience(
  client: GoogleGenAI,
  options: GenerateOptions
) {
  if (isGeminiSuspended()) {
    throw new Error("GEMINI_SUSPENDED");
  }

  const primaryModel = options.preferredModel || "gemini-3.8-flash";
  const candidates = [primaryModel, "gemini-3.1-flash-lite", "gemini-flash-latest"];
  const modelsToTry = Array.from(new Set(candidates));

  let lastError: any = null;
  const timeoutLimit = options.timeoutMs || 10000;

  for (let attempt = 0; attempt < modelsToTry.length; attempt++) {
    const model = modelsToTry[attempt];
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutLimit}ms on model ${model}`)), timeoutLimit)
      );

      const responsePromise = client.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      });

      const response: any = await Promise.race([responsePromise, timeoutPromise]);
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || "").toLowerCase();
      const status = err?.status || err?.code;
      const isDemand = status === 503 || errMsg.includes("503") || errMsg.includes("high demand");
      const isQuota = status === 429 || errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("resource_exhausted");

      if (isDemand || isQuota) {
        // Model quota exceeded or high demand: try next candidate model
        if (attempt < modelsToTry.length - 1) {
          continue;
        }
        if (isQuota) {
          suspendGemini(45);
        }
        break;
      }

      if (attempt < modelsToTry.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        continue;
      }
      break;
    }
  }

  throw lastError;
}

async function startServer() {
  // Refus explicite de demarrer en production sans secret JWT exploitable.
  // Sans ce garde-fou, toute session serait signee avec une cle devinee par
  // quiconque, ce qui equivale a aucune authentification.
  const jwtSecretStatus = getJwtSecretStatus();
  if (!jwtSecretStatus.ready) {
    console.error(`\n❌ DEMARRAGE REFUSE : ${jwtSecretStatus.error}`);
    console.error(
      "   Generez un secret avec : node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"\n" +
        "   puis definissez JWT_SECRET dans l'environnement du serveur.\n"
    );
    process.exit(1);
  }

  const app = express();
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));
  app.use((req, _res, next) => {
    attachParsedCookies(req);
    next();
  });

  // Chantier 5 - le reverse proxy (Vercel, nginx) injecte l'IP reelle du
  // client dans `X-Forwarded-For`. Sans cette ligne, `req.ip` serait
  // systematiquement l'adresse du load balancer, ce qui fausse le
  // rate-limiting et l'audit trail.
  app.set("trust proxy", 1);

  // Chantier 5 - en-tetes de securites minimales sans dependance externe.
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      const normalizedOrigin = origin.replace(/\/$/, "");
      if (getAllowedOrigins().has(normalizedOrigin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Vary", "Origin");
      }
    }

    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.status(204).end();
      return;
    }

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // Static directory for uploaded voice notes, pictures, and documents
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // API Routes
  // Chantier 5 - plafond global. Il est volontairement genereux : son role est
  // d arreter les boucles, pas de contraindre l'usage normal. Les operation
  // sensibles (connexion, inscription, signalement, verification de code,
  // depot de media) portent en plus leur propre plafond, plus strict.
  app.use("/api", rateLimit({ name: "api", windowMs: 60_000, max: 300 }));
  app.get("/api/health", getHealthController);
  // Chantier 5 - ces deux routes exposaient le DDL complet et un oracle de
  // compteurs de lignes a tout appelant. Elles sont reservees au superadmin.
  app.get("/api/schema/supabase-sql", requireAuth, requireRole(["superadmin"]), getSupabaseInitSql);
  app.get(
    "/api/schema/test-supabase",
    requireAuth,
    requireRole(["superadmin"]),
    testSupabaseBackendConnection
  );
  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/communities", communityRoutes);
  app.use("/api/posts", postRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/invitations", invitationRoutes);
  app.use("/api/moderation", moderationRoutes);
  app.use("/api/campaigns", campaignRoutes);
  app.use("/api/stories", storyRoutes);
  app.use("/api/organizations", organizationRoutes);
  app.use("/api/search", searchRoutes);
  app.use("/api/partner/reports", partnerReportRoutes);
  app.use("/api/upload", uploadRoutes);

  // Real-time AI Translation for Dynamic Content (Posts, Comments, Messages, Stories, Campaigns)
  // Ces trois routes appellent un modele payant et n'etaient accessibles a aucun
// appelant, sans plafond : une boucle consomme la cle et le cache de traduction.
const aiEndpointLimiter = rateLimit({
    name: "ai-endpoint",
    windowMs: 60_000,
    max: 20,
    message: "Trop de demandes. Reessayez dans une minute.",
  });

  app.post("/api/translate", aiEndpointLimiter, async (req, res) => {
    const { text, texts, targetLanguage = "fr", sourceLanguage } = req.body || {};

    const targetLangName =
      targetLanguage === "ar"
        ? "Arabe standard moderne (اللغة العربية الفصحى الحديثة)"
        : targetLanguage === "pt"
        ? "Portugais (Português de Angola, Moçambique e internacional)"
        : targetLanguage === "sw"
        ? "Swahili (Kiswahili fasaha cha kisasa cha Afrika Mashariki na Jamhuri ya Kidemokrasia ya Kongo / Maziwa Makuu)"
        : targetLanguage === "en"
        ? "English"
        : "Français (langue internationale et officielle d'Afrique francophone)";

    try {
      const client = getGeminiClient();

      // Batch translation mode
      if (Array.isArray(texts) && texts.length > 0) {
        const results: string[] = new Array(texts.length);
        const missingIndices: number[] = [];
        const missingTexts: string[] = [];

        texts.forEach((item, index) => {
          const trimmed = typeof item === "string" ? item.trim() : "";
          if (!trimmed) {
            results[index] = item;
            return;
          }
          const cacheKey = `${targetLanguage}:::${trimmed}`;
          if (serverTranslationCache.has(cacheKey)) {
            results[index] = serverTranslationCache.get(cacheKey)!;
          } else {
            missingIndices.push(index);
            missingTexts.push(trimmed);
          }
        });

        // If everything is in cache, return immediately
        if (missingTexts.length === 0) {
          return res.json({ translatedTexts: results, targetLanguage, cached: true });
        }

        if (!client || isGeminiSuspended()) {
          missingIndices.forEach((origIdx, i) => {
            results[origIdx] = missingTexts[i];
          });
          return res.json({ translatedTexts: results, targetLanguage, fallback: true });
        }

        const prompt = `Tu es un traducteur expert pour la plateforme Tulizaana, dédiée à la santé mentale et au soutien solidaire en Afrique.
Traduis fidèlement chaque texte du tableau ci-dessous vers la langue cible : ${targetLangName}.
Conserve le ton bienveillant, l'empathie, les termes de résilience et les emojis.
Tableau de textes :
${JSON.stringify(missingTexts, null, 2)}

Réponds STRICTEMENT par un objet JSON valide avec la clé "translations" :
{
  "translations": ["traduction 1", "traduction 2", ...]
}`;

        try {
          const response = await generateContentWithResilience(client, {
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.3,
            },
          });

          const parsed = safeParseJson(response.text);
          const translations: string[] = parsed.translations || [];

          missingIndices.forEach((origIdx, i) => {
            const translatedItem = translations[i] || missingTexts[i];
            results[origIdx] = translatedItem;
            if (translatedItem && translatedItem !== missingTexts[i]) {
              serverTranslationCache.set(`${targetLanguage}:::${missingTexts[i]}`, translatedItem);
            }
          });

          return res.json({ translatedTexts: results, targetLanguage });
        } catch (batchErr: any) {
          const errMsg = String(batchErr?.message || batchErr);
          const isQuota = errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED");
          if (isQuota) {
            suspendGemini(45);
            console.log("Translation service notice: quota rate limit reached (429). Using original texts fallback.");
          } else {
            console.log("Translation service notice: using fallback text.");
          }
          missingIndices.forEach((origIdx, i) => {
            results[origIdx] = missingTexts[i];
          });
          return res.json({ translatedTexts: results, targetLanguage, fallback: true });
        }
      }

      // Single text translation mode
      if (!text || typeof text !== "string" || !text.trim()) {
        return res.json({ translatedText: text || "", targetLanguage });
      }

      const trimmedText = text.trim();
      const cacheKey = `${targetLanguage}:::${trimmedText}`;
      if (serverTranslationCache.has(cacheKey)) {
        return res.json({
          translatedText: serverTranslationCache.get(cacheKey)!,
          targetLanguage,
          cached: true,
        });
      }

      if (!client || isGeminiSuspended()) {
        return res.json({ translatedText: text, targetLanguage, fallback: true });
      }

      const prompt = `Tu es un traducteur expert pour la communauté Tulizaana, plateforme solidaire d'entraide et de résilience en santé mentale et maladies chroniques en Afrique (RDC, Rwanda, Burundi, Kenya, etc.).
Traduis fidèlement, chaleureusement et avec justesse le texte suivant vers la langue cible : ${targetLangName}.
${sourceLanguage ? `Langue source présumée : ${sourceLanguage}.` : ""}
Conserve le sens profond, l'empathie humaine, les emojis et le naturel de l'expression.

Texte à traduire :
"""${text}"""

Réponds STRICTEMENT par un objet JSON avec les clés :
{
  "translatedText": "le texte traduit",
  "detectedLanguage": "la langue détectée (ex: fr, sw, en, ou autre)"
}`;

      try {
        const response = await generateContentWithResilience(client, {
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        });

        const parsed = safeParseJson(response.text);
        const translatedResult = parsed.translatedText || text;

        if (translatedResult && translatedResult !== text) {
          serverTranslationCache.set(cacheKey, translatedResult);
        }

        return res.json({
          translatedText: translatedResult,
          detectedLanguage: parsed.detectedLanguage,
          targetLanguage,
        });
      } catch (err: any) {
        const errMsg = String(err?.message || err);
        const isQuota = errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED");
        if (isQuota) {
          suspendGemini(45);
          console.log("Translation service notice: quota rate limit reached (429). Using original text fallback.");
        } else {
          console.log("Translation service notice: using fallback text.");
        }
        return res.json({ translatedText: text, targetLanguage, fallback: true });
      }
    } catch (outerErr: any) {
      if (Array.isArray(texts)) {
        return res.json({ translatedTexts: texts, targetLanguage, fallback: true });
      }
      return res.json({ translatedText: text || "", targetLanguage, fallback: true });
    }
  });

  // AI Mood Analysis & Supportive Insights
  app.post("/api/analyze-mood", aiEndpointLimiter, async (req, res) => {
    const { moodEntries, language = "fr" } = req.body || {};
    const fallbackData = {
      insight: language === "sw"
        ? "Mwelekeo wako unaonyesha kuwa unajitahidi kusonga mbele. Endelea kujijali na kuchukua mapumziko pale unapohitaji."
        : language === "en"
        ? "Your regular self-check-ins reflect thoughtful self-care. Continue honoring your rhythm and taking rest when needed."
        : "Votre régularité dans le suivi de vos émotions témoigne d'une belle démarche de bienveillance envers vous-même. Continuez à vous accorder des pauses régulières.",
      suggestions: [
        language === "sw" ? "Fanya zoezi la kupumua kwa dakika 5" : language === "en" ? "Practice 5 minutes of deep breathing" : "Faites 5 minutes de cohérence cardiaque",
        language === "sw" ? "Andika shukrani 3 katika jarida lako" : language === "en" ? "Write down 3 gratitude notes in your journal" : "Notez 3 gratitudes dans votre journal intime",
        language === "sw" ? "Sikiliza sauti za asili kabla ya kulala" : language === "en" ? "Listen to calming nature sounds before sleep" : "Écoutez les sons de la nature au coucher"
      ]
    };

    try {
      const client = getGeminiClient();

      if (!client || isGeminiSuspended() || !moodEntries || moodEntries.length === 0) {
        return res.json(fallbackData);
      }

      const prompt = `Voici les dernières entrées d'humeur et d'émotions d'un utilisateur de l'application Tulizaana :
${JSON.stringify(moodEntries, null, 2)}

En tant que psychologue bienveillant et conseiller en santé mentale :
1. Rédige une analyse bienveillante, encourageante et concise (3-4 phrases) sur son évolution émotionnelle.
2. Propose 3 recommandations d'activités d'apaisement concrètes adaptées.
Réponds en format JSON avec les clés :
"insight" (string), "suggestions" (tableau de 3 strings).
Langue : ${language === "sw" ? "Swahili" : language === "en" ? "Anglais" : "Français"}.`;

      const response = await generateContentWithResilience(client, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.6,
        },
      });

      let parsedData;
      try {
        parsedData = JSON.parse(response.text || "{}");
      } catch {
        parsedData = fallbackData;
      }

      return res.json(parsedData);
    } catch {
      return res.json(fallbackData);
    }
  });

  // AI Guided Soothing Imagery / Sleep Story
  app.post("/api/guided-relaxation", aiEndpointLimiter, async (req, res) => {
    const { theme = "foret", duration = "court", language = "fr" } = req.body || {};
    const fallbackData = {
      title: language === "sw"
        ? "Amani Katika Msitu wa Kivu"
        : language === "en"
        ? "Peaceful Journey in the Rainforest"
        : "Voyage Apaisant au Cœur de la Forêt",
      text: language === "sw"
        ? "Funga macho yako polepole. Sikia hewa safi ikiingia kwenye mapafu yako. Wazia ukitembea kwenye msitu mtulivu wenye majani ya kijani kibichi. Ndege wanaimba kwa utulivu. Kila hatua unayopiga inakuondolea uchovu na wasiwasi..."
        : language === "en"
        ? "Gently close your eyes. Feel the fresh air filling your lungs with every breath. Imagine walking on a serene trail surrounded by gentle tall trees. A warm breeze carries away tension..."
        : "Fermez doucement les yeux. Sentez l'air frais et pur emplir vos poumons à chaque inspiration. Imaginez-vous marchant sur un sentier bordé de grands arbres bienveillants. Une brise tiède caresse votre visage et emporte avec elle toutes les tensions de votre journée..."
    };

    try {
      const client = getGeminiClient();

      if (!client || isGeminiSuspended()) {
        return res.json(fallbackData);
      }

      const prompt = `Génère une méditation de visualisation guidée et d'apaisement sensoriel sur le thème : "${theme}".
Format souhaité : Un texte doux, rythmé par des invitations à respirer lentement, avec une imagerie sensorielle relaxante (ouïe, toucher, vue, bien-être intérieur).
Longueur : ${duration === "court" ? "environ 200 mots" : "environ 450 mots"}.
Langue : ${language === "sw" ? "Swahili" : language === "en" ? "Anglais" : "Français"}.
Réponds en format JSON avec les clés "title" (titre évocateur et doux) et "text" (le texte complet de la méditation).`;

      const response = await generateContentWithResilience(client, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      let parsed;
      try {
        parsed = JSON.parse(response.text || "{}");
      } catch {
        parsed = fallbackData;
      }

      return res.json(parsed);
    } catch {
      return res.json(fallbackData);
    }
  });

  // Emergency Hotlines data endpoint
  app.get("/api/emergency-helplines", (req, res) => {
    res.json([
      {
        country: "RDC (République Démocratique du Congo)",
        code: "CD",
        services: [
          { name: "Ligne d'Écoute Nationale Enfants & Familles", number: "116", free: true, description: "Assistance d'urgence, écoute psychologique et protection 24h/24" },
          { name: "SOS Violences & Écoute Traumatisme (Clinique Panzi / Partenaires)", number: "+243 81 000 0000", free: false, description: "Soutien psychologique et prise en charge médicale/holistique" },
          { name: "Croix-Rouge RDC Urgences", number: "118", free: true, description: "Secours et soutien d'urgence humanitaire" }
        ]
      },
      {
        country: "Afrique de l'Est & Grands Lacs (Rwanda, Burundi, Kenya, Ouganda)",
        code: "EAF",
        services: [
          { name: "Rwanda Mental Health Helpline", number: "114", free: true, description: "Écoute et orientation en santé mentale" },
          { name: "Kenya Befrienders Suicide Helpline", number: "+254 722 178 177", free: false, description: "Écoute 24/7 pour la prévention du suicide" }
        ]
      },
      {
        country: "France & International",
        code: "FR",
        services: [
          { name: "3114 - Numéro National de Prévention du Suicide (France)", number: "3114", free: true, description: "Accessible 24h/24 et 7j/7, gratuit et confidentiel" },
          { name: "SOS Amitié (France)", number: "09 72 39 40 50", free: true, description: "Écoute bienveillante et anonyme permanente" },
          { name: "Urgences Médicales Internationales / Samu", number: "15 ou 112", free: true, description: "Urgences vitales et assistance médicale" }
        ]
      },
      {
        country: "Canada & Amérique du Nord",
        code: "CA",
        services: [
          { name: "988 - Ligne d'aide en cas de crise de suicide", number: "988", free: true, description: "Appel ou texto gratuit 24/7 en français et anglais" },
          { name: "Tel-Aide", number: "514 935 1101", free: true, description: "Service d'écoute sans jugement" }
        ]
      }
    ]);
  });

  // Global Error Handler for API routes
  app.use(errorHandler);

  // Dedicated handlers for PWA Service Worker and Manifest
  app.get("/sw.js", (req, res) => {
    const distSw = path.join(process.cwd(), "dist", "sw.js");
    if (fs.existsSync(distSw)) {
      res.setHeader("Content-Type", "application/javascript");
      return res.sendFile(distSw);
    }
    res.setHeader("Content-Type", "application/javascript");
    res.send("// Tulizaana Dev Service Worker\nself.addEventListener('install', () => self.skipWaiting());\nself.addEventListener('activate', () => self.clients.claim());\n");
  });

  app.get("/workbox-:hash.js", (req, res, next) => {
    const filePath = path.join(process.cwd(), "dist", `workbox-${req.params.hash}.js`);
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "application/javascript");
      return res.sendFile(filePath);
    }
    next();
  });

  app.get("/manifest.webmanifest", (req, res, next) => {
    const distManifest = path.join(process.cwd(), "dist", "manifest.webmanifest");
    if (fs.existsSync(distManifest)) {
      res.setHeader("Content-Type", "application/manifest+json");
      return res.sendFile(distManifest);
    }
    next();
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true, hmr: false },
        appType: "spa",
      });

      // Provide a silent Vite client without WebSocket HMR connection to prevent iframe/proxy connection errors
      app.get("/@vite/client", (req, res) => {
        res.setHeader("Content-Type", "application/javascript");
        res.send(`import "/node_modules/vite/dist/client/env.mjs";

export class ErrorOverlay extends HTMLElement {}
if (typeof customElements !== "undefined" && !customElements.get("vite-error-overlay")) {
  customElements.define("vite-error-overlay", ErrorOverlay);
}

export class HMRContext {
  constructor(client, ownerPath) {
    this.ownerPath = ownerPath;
    this.data = {};
  }
  accept(deps, callback) {}
  acceptDeps() {}
  dispose() {}
  prune() {}
  decline() {}
  invalidate() {}
  on() {}
  off() {}
  send() {}
}

export function createHotContext(ownerPath) {
  return new HMRContext(null, ownerPath);
}

export function injectQuery(url, queryToInject) {
  if (url[0] !== "." && url[0] !== "/") return url;
  const pathname = url.replace(/[?#].*$/, "");
  const { search, hash } = new URL(url, "http://vite.dev");
  return \`\${pathname}?\${queryToInject}\${search ? "&" + search.slice(1) : ""}\${hash || ""}\`;
}

const sheetsMap = new Map();
let lastInsertedStyle;

export function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.setAttribute("data-vite-dev-id", id);
    style.textContent = content;
    if (!lastInsertedStyle) {
      document.head.appendChild(style);
      setTimeout(() => {
        lastInsertedStyle = void 0;
      }, 0);
    } else {
      lastInsertedStyle.insertAdjacentElement("afterend", style);
    }
    lastInsertedStyle = style;
  } else {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}

export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}
`);
      });

      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn("Vite development middleware could not be started, falling back to static files:", viteErr);
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌸 Tulizaana Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal error starting Tulizaana server:", err);
  process.exit(1);
});
