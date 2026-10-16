import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { getPrismaClient } from "../config/database.js";
import { getTokenFromCookie } from "../utils/cookies.js";

/**
 * Roles autorises a administrer la plateforme. Cette liste vit cote serveur :
 * aucune valeur de role presente dans le client, le localStorage ou le corps
 * d'une requete ne peut elargir cet ensemble.
 */
export const ADMIN_ROLES = ["superadmin", "admin", "moderator", "partner_admin"] as const;

const ADMIN_ROLE_SET: ReadonlySet<string> = new Set<string>(ADMIN_ROLES);

/**
 * Longueur minimale du secret JWT. En dessous, la signature est consideree
 * comme faible et le serveur refuse de demarrer en production.
 */
const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Secret aleatoire genere en memoire pour le developpement uniquement.
 * Il n'est jamais ecrit sur disque ni dans le code source, et il est
 * volontairement perdu au redemarrage du serveur (tous les jetons de la
 * session de developpement deviennent invalides).
 */
let ephemeralDevelopmentSecret: string | null = null;

/**
 * Resout le secret JWT au moment de l'utilisation, et non au chargement du module.
 *
 * Pourquoi paresseux : en ESM, les imports sont evalues avant le corps du module
 * appelant. Comme `dotenv.config()` est appele dans le corps de server.ts, une
 * constante de niveau module dans ce fichier serait figee AVANT le chargement
 * du fichier .env, et le secret reellement configure ne servirait a rien.
 */
function resolveJwtSecret(): string {
  const configuredSecret = process.env.JWT_SECRET?.trim();

  if (configuredSecret) {
    if (configuredSecret.length < MIN_JWT_SECRET_LENGTH) {
      throw new Error(
        `JWT_SECRET est trop court : ${configuredSecret.length} caracteres minimum requis ` +
          `(attendu: au moins ${MIN_JWT_SECRET_LENGTH}). ` +
          `Generez une valeur aleatoire, par exemple : node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
      );
    }
    return configuredSecret;
  }

  // Repli fermee : aucun secret implicite n'est jamais accepte en production.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET est absent. Le serveur Tulizaana refuse de demarrer : " +
        "definissez JWT_SECRET dans l'environnement (32 caracteres minimum)."
    );
  }

  if (!ephemeralDevelopmentSecret) {
    ephemeralDevelopmentSecret = crypto.randomBytes(48).toString("hex");
    console.warn(
      "[AUTH] JWT_SECRET absent : secret temporaire genere en memoire pour cette session de " +
        "developpement. Aucun secret n'est ecrit dans le code ni sur le disque. " +
        "Les jetons seront invalides au redemarrage. Definissez JWT_SECRET dans .env pour " +
        "des sessions persistantes."
    );
  }

  return ephemeralDevelopmentSecret;
}

/**
 * Verifie que le secret JWT est utilisable. A appeler au demarrage du serveur
 * pour echouer tot et explicitement plutot qu'a la premiere connexion.
 * Ne leve jamais : retourne un diagnostic exploitable par l'appelant.
 */
/**
 * Surcharge de test : permet aux scripts de securite locaux d'utiliser un
 * secret de test connu sans dependre d'une variable d'environnement.
 * Reserve aux tests : jamais appele par l'application.
 */
let secretOverrideForTests: string | null = null;

export function __setSecretForTest(secret: string | null): void {
  secretOverrideForTests = secret;
}

export function resolveJwtSecretForTest(): string {
  return secretOverrideForTests || resolveJwtSecret();
}

export function getJwtSecretStatus(): { ready: boolean; error?: string; source: "env" | "ephemeral" } {
  const configuredSecret = process.env.JWT_SECRET?.trim();

  if (configuredSecret && configuredSecret.length >= MIN_JWT_SECRET_LENGTH) {
    return { ready: true, source: "env" };
  }

  if (process.env.NODE_ENV === "production") {
    return {
      ready: false,
      source: "ephemeral",
      error: !configuredSecret
        ? "JWT_SECRET est absent : le serveur ne peut pas produire de jetons de session fiables."
        : `JWT_SECRET est trop court (${configuredSecret.length}/${MIN_JWT_SECRET_LENGTH} caracteres).`,
    };
  }

  return { ready: true, source: "ephemeral" };
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: string;
  name?: string;
  pseudo?: string;
  pseudonym?: string;
  avatar?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Sign a JWT token for an authenticated user.
 */
export function generateAuthToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      pseudo: user.pseudo,
    },
    resolveJwtSecret(),
    { expiresIn: "30d" }
  );
}

function resolveToken(req: Request): string | null {
  const cookieToken = getTokenFromCookie(req);
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return null;
}

/**
 * Middleware: Requires a valid Bearer token.
 *
 * Chantier 5 - le jeton est valide puis le compte est RELU en base afin de
 * verifier la suspension. Le controle existait uniquement dans `requireRole`,
 * ce qui laissait chaque route protegee par le seul `requireAuth` (profil,
 * messages, publications, stories, upload, abonnement) accessible a un compte
 * suspendu pendant toute la duree de vie du jeton (30 jours).
 *
 * La relecture rend aussi `req.user` coherent avec la base : le role utilise
 * en aval n'est plus celui fige a la connexion.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = resolveToken(req);
  if (!token) {
    res.status(401).json({ success: false, error: "Authentification requise. Jeton manquant." });
    return;
  }

  let decoded: AuthenticatedUser;
  try {
    decoded = jwt.verify(token, resolveJwtSecret()) as AuthenticatedUser;
  } catch {
    res.status(401).json({ success: false, error: "Jeton de session invalide ou expiré." });
    return;
  }

  if (!getPrismaClient()) {
    res.status(503).json({
      success: false,
      error: "La base de donnees n'est pas encore connectee.",
    });
    return;
  }

  const fresh = await loadFreshAccount(decoded.id);
  if (!fresh) {
    res.status(401).json({ success: false, error: "Compte introuvable ou supprime." });
    return;
  }

  if (fresh.isSuspended) {
    res.status(403).json({
      success: false,
      error: "Ce compte est suspendu. L'acces est revoque.",
    });
    return;
  }

  req.user = stripAccountState(fresh);
  next();
}

/**
 * Middleware: Optional authentication (attaches req.user if present, but doesn't block).
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = resolveToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, resolveJwtSecret()) as AuthenticatedUser;
    const fresh = await loadFreshAccount(decoded.id);
    if (fresh && !fresh.isSuspended) {
      req.user = stripAccountState(fresh);
    }
  } catch {
    // Ignore token error in optional auth
  }

  next();
}

/**
 * Recharge l'utilisateur depuis la base de donnees.
 *
 * Pourquoi : le JWT transporte un role fige au moment de la connexion. Un role
 * retrocede, ou un compte suspendu, resterait sinon autorise jusqu'a l'expiration
 * du jeton. La base de donnees est la seule source de verite pour les decisions
 * d'autorisation sensibles.
 */
export async function loadCurrentUser(
  userId: string
): Promise<AuthenticatedUser | null> {
  const fresh = await loadFreshAccount(userId);
  return fresh ? stripAccountState(fresh) : null;
}

interface FreshAccount {
  id: string;
  email: string | null;
  role: string;
  name: string | null;
  pseudonym: string | null;
  avatar: string | null;
  isSuspended: boolean;
}

async function loadFreshAccount(userId: string): Promise<FreshAccount | null> {
  const prisma = getPrismaClient();
  if (!prisma) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      pseudonym: true,
      avatar: true,
      isSuspended: true,
    },
  });
}

function stripAccountState(account: FreshAccount): AuthenticatedUser {
  return {
    id: account.id,
    email: account.email ?? undefined,
    role: account.role,
    name: account.name ?? undefined,
    pseudo: account.pseudonym ?? undefined,
    pseudonym: account.pseudonym ?? undefined,
    avatar: account.avatar ?? undefined,
  };
}

/**
 * Middleware: Require specific user roles (e.g. 'superadmin', 'partner_admin', 'peer_helper').
 *
 * Le role n'est PAS lu depuis le JWT : il est relu en base a chaque requete, et un
 * compte suspendu est rejete meme si son jeton est encore valide.
 */
export function requireRole(allowedRoles: string[]) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentification requise." });
      return;
    }

    const prisma = getPrismaClient();
    if (!prisma) {
      res.status(503).json({
        success: false,
        error: "La base de donnees n'est pas encore connectee.",
      });
      return;
    }

    try {
      const freshAccount = await loadFreshAccount(req.user.id);
      if (!freshAccount) {
        res.status(401).json({
          success: false,
          error: "Compte introuvable. Jeton de session invalide.",
        });
        return;
      }

      if (freshAccount.isSuspended) {
        res.status(403).json({
          success: false,
          error: "Acces refuse. Ce compte est suspendu.",
        });
        return;
      }

      if (!allowedRoles.includes(freshAccount.role)) {
        res.status(403).json({
          success: false,
          error:
            "Acces refuse. Vous n'avez pas les autorisations necessaires pour effectuer cette action.",
        });
        return;
      }

      // On remplace l'identite portee par le JWT par l'identite relue en base,
      // afin que les controleurs ne puissent pas utiliser un role perime.
      req.user = stripAccountState(freshAccount);
      next();
    } catch {
      res.status(503).json({
        success: false,
        error: "Verification des droits impossible.",
      });
    }
  };
}

/**
 * Middleware: reserve la route a un administrateur de la plateforme.
 * A utiliser sur toutes les operations d'administration sensibles.
 */
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  await requireRole([...ADMIN_ROLES])(req, res, next);
}

/** true uniquement si le role appartient a la liste serveur des administrateurs. */
export function isAdminRole(role: string | undefined | null): boolean {
  return typeof role === "string" && ADMIN_ROLE_SET.has(role);
}
