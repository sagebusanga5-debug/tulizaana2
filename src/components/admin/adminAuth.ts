/**
 * Session du Back Office central.
 *
 * Avertissement de securite : ce module ne Decide d'aucune autorisation. Il se
 * contente de.refleeter ce que le serveur a deja valide, afin d'afficher ou de
 * masquer l'interface. Un indicateur mis a true ici ne donne aucun droit : toute
 * operation reelle est re-verifiee cote serveur par `requireAuth` + `requireRole`,
 * qui relit le role et l'etat de suspension en base a chaque requete.
 */
import { api } from '../../services/api';

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
 * Connexion reelle du Back Office : elle passe par `POST /api/auth/login`, le
 * meme endpoint JWT que le reste de la plateforme. Aucun mot de passe n'est
 * compare dans le navigateur et aucun identifiant n'est conserve sur le disque.
 *
 * Le backend pose un cookie HttpOnly ; le frontend ne stocke plus le token.
 */
export async function signInAdmin(email: string, password: string): Promise<AdminSignInResult> {
  const response = await api.auth.login({ email: email.trim(), password });

  if (!response.success) {
    return {
      ok: false,
      error: response.error || "Connexion impossible. Veuillez réessayer.",
    };
  }

  const session = await loadAdminSession();
  if (!session) {
    return {
      ok: false,
      error: "Ce compte ne dispose pas des droits requis pour le Back Office central.",
    };
  }

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

  return {
    id: String(user.id ?? ''),
    name: String(user.name ?? user.pseudonym ?? 'Administration'),
    email: String(user.email ?? ''),
    role: String(user.role),
  };
}

/** Invalide la session cote serveur et nettoie l'etat local. */
export function signOutAdmin(): void {
  // L'invalidation effective du cookie est geree par POST /api/auth/logout
  // dans le composant appelant. Cette fonction ne fait que reinitialiser
  // l'etat React du Back Office.
}