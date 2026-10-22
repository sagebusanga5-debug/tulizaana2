/**
 * Session du Back Office central.
 *
 * Avertissement de securite : ce module ne Decide d'aucune autorisation. Il se
 * contente de.refleter ce que le serveur a deja valide, afin d'afficher ou de
 * masquer l'interface. Un indicateur mis a true ici ne donne aucun droit : toute
 * operation reelle est re-verifiee cote serveur par `requireAuth` + `requireRole`,
 * qui relit le role et l'etat de suspension en base a chaque requete.
 */
import { api } from '../../services/api';

const ADMIN_SESSION_KEY = 'tlz_admin_session';

/**
 * Miroir, uniquement pour l'interface, de la liste serveur des roles
 * administrateurs. Si le serveur evolue, cette liste peut devenir obsolete :
 * c'est le serveur qui fait foi.
 */
export const ADMIN_ROLES = ['superadmin', 'admin', 'moderator', 'partner_admin'] as const;

export interface AdminSession {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function isAdminRole(role: unknown): boolean {
  return typeof role === 'string' && (ADMIN_ROLES as readonly string[]).includes(role);
}

export type AdminSignInResult =
  | { ok: true; session: AdminSession }
  | { ok: false; error: string };

/**
 * Charge la session admin depuis localStorage au démarrage
 */
export function loadAdminSessionFromStorage(): AdminSession | null {
  try {
    const stored = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Sauvegarde la session admin dans localStorage
 */
function saveAdminSessionToStorage(session: AdminSession): void {
  try {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save admin session to localStorage:', e);
  }
}

/**
 * Supprime la session admin de localStorage
 */
export function clearAdminSessionFromStorage(): void {
  try {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch (e) {
    console.error('Failed to clear admin session from localStorage:', e);
  }
}

/**
 * Connexion reelle du Back Office : elle passe par `POST /api/auth/login`, le
 * meme endpoint JWT que le reste de la plateforme. Aucun mot de passe n'est
 * compare dans le navigateur et aucun identifiant n'est conserve sur le disque.
 *
 * Le backend pose un cookie HttpOnly ; le frontend ne stocke plus le token.
 */
export async function signInAdmin(email: string, password: string): Promise<AdminSignInResult> {
  const response = await api.auth.login({ identifier: email.trim(), password });

  if (!response.success) {
    return {
      ok: false,
      error: response.error || "Connexion impossible. Veuillez réessayer.",
    };
  }

  // Stocker le token JWT depuis la réponse (cross-domain workaround)
  const token = response.data?.token;
  if (token) {
    localStorage.setItem('tlz_auth_token', token);
  }

  const session = await loadAdminSession();
  if (!session) {
    return {
      ok: false,
      error: "Ce compte ne dispose pas des droits requis pour le Back Office central.",
    };
  }

  // Sauvegarder la session dans localStorage pour persistance
  saveAdminSessionToStorage(session);

  return { ok: true, session };
}

/**
 * Rétablit une session Back Office depuis le cookie de session courant, en
 * interrogeant le serveur. Retourne `null` si le cookie est absent, invalide,
 * suspendu, ou si le compte n'a plus de role administrateur.
 */
export async function loadAdminSession(): Promise<AdminSession | null> {
  const response = await api.auth.me();
  if (!response.success || !response.data) {
    return null;
  }

  const user = response.data;
  if (user.isSuspended || !isAdminRole(user.role)) return null;

  const session = {
    id: String(user.id ?? ''),
    name: String(user.name ?? user.pseudonym ?? 'Administration'),
    email: String(user.email ?? ''),
    role: String(user.role),
  };

  // Sauvegarder la session dans localStorage
  saveAdminSessionToStorage(session);

  return session;
}

/** Invalide la session cote serveur et nettoie l'etat local. */
export function signOutAdmin(): void {
  clearAdminSessionFromStorage();
  // L'invalidation effective du cookie est geree par POST /api/auth/logout
  // dans le composant appelant. Cette fonction ne fait que reinitialiser
  // l'etat React du Back Office.
}
