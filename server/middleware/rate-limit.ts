/**
 * Chantier 5 - Limitation de debit.
 *
 * Le serveur n'avait aucun plafond d'appels, sur aucune route. Chaque route
 * d'ecriture etait une primitive d'amplification sans borne : conduite en
 * boucle, `POST /api/auth/login` devenait une attaque par force brute, et
 * `POST /api/moderation/reports` autorisait la fabrication illimitee
 * d'alertes SOS et d'entrees de journal.
 *
 * Ce limiteur est deliberement interne au depot : ajouter une dependance
 * externe pour un compteur de fenetre n'apporte rien qui ne soit verifiable
 * ici, et evite d'agrandir la surface d'approvisionnement du projet.
 *
 * Modele : fenetre fixe glissante par cle, en memoire. Les compteurs expirent
 * et sont purges. `req.ip` sert de cle, completede par un segment de route
 * pour que la limite soit par operation et non globale.
 */
import { Request, Response, NextFunction } from "express";

interface Bucket {
  count: number;
  resetAt: number;
}

/** Une seule fenetre par cle. La purge est paresseuse, a l'ecriture. */
const buckets = new Map<string, Bucket>();

/** Intervalle de purge des compteursexpires. */
const PURGE_INTERVAL_MS = 60_000;
let lastPurgeAt = 0;

function purgeExpired(now: number): void {
  if (now - lastPurgeAt < PURGE_INTERVAL_MS) return;
  lastPurgeAt = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitOptions {
  /** Duree de la fenetre, en millisecondes. */
  windowMs: number;
  /** Nombre d'appels autorises dans la fenetre. */
  max: number;
  /** Nom fonctionnel, utilise dans le message et pour vider une plage. */
  name: string;
  /**
   * Identifiant additionnel de la cle. Permet de limiter par adresse email
   * autant que par IP, sans que l'adresse n'apparaisse dans la reponse.
   */
  scope?: (req: Request) => string | null;
  /** Message renvoye. Aucun detail sur l'etat du compteur. */
  message?: string;
}

/** Vide les compteurs. Reserve aux tests et au redemarrage. */
export function resetRateLimits(): void {
  buckets.clear();
}

/**
 * Fabrique un middleware de limitation.
 *
 * Renvoie `429` avec le meme contrat d'erreur que le reste de l'API :
 * `{ success: false, error, code }`. Le code est `RATE_LIMITED`, seul element
 * dont le frontend a besoin.
 */
export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, name, scope, message } = options;

  return function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const now = Date.now();
    purgeExpired(now);

    const extra = scope?.(req) ?? "";
    const key = `${name}:${req.ip ?? "unknown"}:${extra}`;

    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (bucket.count >= max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.setHeader("X-RateLimit-Limit", String(max));
      res.setHeader("X-RateLimit-Remaining", "0");
      res.status(429).json({
        success: false,
        error:
          message ??
          "Trop de tentatives. Reessayez dans quelques instants.",
        code: "RATE_LIMITED",
      });
      return;
    }

    bucket.count += 1;
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - bucket.count)));
    next();
  };
}