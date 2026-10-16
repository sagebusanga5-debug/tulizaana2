import { cert, getApps, initializeApp, applicationDefault, App } from "firebase-admin/app";
import { getAuth, DecodedIdToken } from "firebase-admin/auth";

/**
 * Configuration serveur de Firebase Admin (verification des ID tokens).
 *
 * Principe de securite : aucune cle privee n'est lue depuis le depot.
 * Les identifiants de service proviennent exclusivement de l'environnement :
 *  - variables explicites (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY),
 *  - FIREBASE_CONFIG au format JSON (secret manager),
 *  - ou Application Default Credentials du runtime (GOOGLE_APPLICATION_CREDENTIALS, metadonnees GCP).
 *
 * Ce module n'est JAMAIS importe depuis le code frontend.
 */

let firebaseApp: App | null = null;
let initializationAttempted = false;
let lastInitializationError: string | null = null;

export interface FirebaseConfigurationStatus {
  configured: boolean;
  source: "explicit_env" | "firebase_config_json" | "application_default" | "none";
  error?: string;
}

function normalizePrivateKey(rawKey: string): string {
  // Les secrets stockes dans des variables d'environnement arrivent souvent
  // avec des retours a la ligne litteraux "\n" plutot que de vrais sauts de ligne.
  return rawKey.replace(/\\n/g, "\n").trim();
}

/**
 * Determine comment le serveur obtient ses identifiants Firebase,
 * sans jamais lire ni exposer la valeur du secret.
 */
export function getFirebaseConfigurationStatus(): FirebaseConfigurationStatus {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();

  if (projectId && clientEmail && privateKey) {
    return { configured: true, source: "explicit_env" };
  }

  if (process.env.FIREBASE_CONFIG?.trim()) {
    return { configured: true, source: "firebase_config_json" };
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) {
    return { configured: true, source: "application_default" };
  }

  return {
    configured: false,
    source: "none",
    error:
      "Identifiants Firebase Admin absents. Definissez FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL et " +
      "FIREBASE_PRIVATE_KEY (ou FIREBASE_CONFIG, ou GOOGLE_APPLICATION_CREDENTIALS).",
  };
}

export function isFirebaseAdminConfigured(): boolean {
  return getFirebaseConfigurationStatus().configured;
}

export function getFirebaseInitializationError(): string | null {
  return lastInitializationError;
}

/**
 * Initialise paresseusement l'application Firebase Admin.
 * L'echec n'est pas bloquant au demarrage : il rend seulement
 * l'authentification Google indisponible, avec un diagnostic explicite.
 */
function getFirebaseApp(): App | null {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (initializationAttempted) {
    return null;
  }
  initializationAttempted = true;

  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseApp = existingApps[0];
      return firebaseApp;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();

    if (projectId && clientEmail && privateKey) {
      firebaseApp = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey: normalizePrivateKey(privateKey) }),
      });
      return firebaseApp;
    }

    const firebaseConfigJson = process.env.FIREBASE_CONFIG?.trim();
    if (firebaseConfigJson) {
      const parsedConfig = parseFirebaseConfigJson(firebaseConfigJson);

      if (parsedConfig) {
        const privateKeyFromJson =
          typeof parsedConfig.private_key === "string"
            ? normalizePrivateKey(parsedConfig.private_key)
            : undefined;
        const clientEmailFromJson =
          typeof parsedConfig.client_email === "string" ? parsedConfig.client_email : undefined;
        const projectIdFromJson =
          typeof parsedConfig.project_id === "string" ? parsedConfig.project_id : undefined;

        firebaseApp =
          projectIdFromJson && clientEmailFromJson && privateKeyFromJson
            ? initializeApp({
                credential: cert({
                  projectId: projectIdFromJson,
                  clientEmail: clientEmailFromJson,
                  privateKey: privateKeyFromJson,
                }),
              })
            : initializeApp({
                credential: applicationDefault(),
                projectId: projectIdFromJson,
              });
        return firebaseApp;
      }
    }

    // Dernier recours : Application Default Credentials du runtime d'hebergement.
    firebaseApp = initializeApp({
      credential: applicationDefault(),
      projectId: process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT,
    });
    return firebaseApp;
  } catch (err) {
    lastInitializationError = err instanceof Error ? err.message : String(err);
    console.error("[FIREBASE_ADMIN] Initialisation impossible:", lastInitializationError);
    return null;
  }
}

function parseFirebaseConfigJson(raw: string): Record<string, unknown> | null {
  const candidates = [raw, raw.replace(/\\n/g, "\n")];
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Essaie le candidat suivant.
    }
  }
  return null;
}

/**
 * Identite Google prouvee cryptographiquement, extraite d'un ID token
 * verifie par Firebase Admin. Aucune de ces valeurs ne provient du client.
 */
export interface VerifiedGoogleIdentity {
  firebaseUid: string;
  email: string;
  emailVerified: boolean;
  displayName: string | null;
  photoUrl: string | null;
}

export type FirebaseTokenVerificationResult =
  | { ok: true; identity: VerifiedGoogleIdentity }
  | { ok: false; code: "not_configured" | "invalid_token"; reason: string };

/**
 * Verifie un Firebase ID token et en extrait l'identite.
 *
 * Le token DOIT provenir de l'en-tete Authorization: Bearer.
 * Aucun fallback sur un champ du corps de la requete n'est accepte ici :
 * ce module ne lit jamais req.body.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseTokenVerificationResult> {
  const trimmedToken = idToken?.trim();
  if (!trimmedToken) {
    return { ok: false, code: "invalid_token", reason: "Jeton Firebase absent." };
  }

  const app = getFirebaseApp();
  if (!app) {
    return {
      ok: false,
      code: "not_configured",
      reason:
        lastInitializationError ||
        "Verification Firebase indisponible : identifiants Firebase Admin non configures sur le serveur.",
    };
  }

  try {
    const decoded: DecodedIdToken = await getAuth(app).verifyIdToken(trimmedToken, true);

    if (!decoded.sub) {
      return { ok: false, code: "invalid_token", reason: "Jeton Firebase sans identifiant utilisateur." };
    }

    if (!decoded.email || typeof decoded.email !== "string") {
      return {
        ok: false,
        code: "invalid_token",
        reason: "Jeton Firebase valide mais sans adresse email exploitable.",
      };
    }

    return {
      ok: true,
      identity: {
        firebaseUid: decoded.sub,
        email: decoded.email.trim().toLowerCase(),
        emailVerified: decoded.email_verified === true,
        displayName: typeof decoded.name === "string" && decoded.name.trim() ? decoded.name.trim() : null,
        photoUrl: typeof decoded.picture === "string" && decoded.picture.trim() ? decoded.picture.trim() : null,
      },
    };
  } catch (err) {
    return {
      ok: false,
      code: "invalid_token",
      reason: err instanceof Error ? err.message : "Jeton Firebase invalide.",
    };
  }
}

export async function verifyFirebaseIdTokenForRequest(
  idToken: string
): Promise<FirebaseTokenVerificationResult> {
  return verifyFirebaseIdToken(idToken);
}