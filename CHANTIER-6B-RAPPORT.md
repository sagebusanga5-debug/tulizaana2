# CHANTIER 6B — RAPPORT FINAL
## Auth Token Security — HttpOnly Cookie

**Date :** 2026-10-04  
**Portée :** Backend Express + Frontend React — Migration du JWT de `localStorage` vers un cookie `HttpOnly`  
**Règle d'or :** Aucune modification du comportement métier existant ; only auth mechanism migration.

---

## 1. Architecture avant

```text
Frontend
   ↓
localStorage
└── tlz_auth_token (JWT)
   ↓
Authorization: Bearer <token>
   ↓
Backend
```

**Problèmes :**
- JWT lisible par JavaScript = vol via XSS
- Token persiste après logout
- Token persiste après fermeture navigateur
- Aucune isolation entre comptes sur même device

---

## 2. Architecture après

```text
Browser
   │
   │ HttpOnly + Secure + SameSite=Strict cookie
   │ (tlz_auth)
   ▼
Backend
   │
   ├── resolveToken(req)
   │     ├── cookie tlz_auth
   │     └── fallback Authorization: Bearer (Google only)
   │
   ├── jwt.verify(token, JWT_SECRET)
   │
   ├── loadFreshAccount(userId)
   │
   └── req.user = stripAccountState(fresh)
```

**Avantages :**
- Cookie inaccessible à JavaScript (`HttpOnly`)
- Navigateur envoie automatiquement le cookie (`credentials: 'include'`)
- Backend reste l'autorité pour rôle, suspension, organisation
- Logout invalide le cookie côté serveur

---

## 3. Flux login

### 3.1 Login classique

```text
POST /api/auth/login
   Body: { email, password }
   ↓
Backend
   ├── bcrypt.compare(password, passwordHash)
   ├── check isSuspended
   ├── generateAuthToken(user) → JWT signé (30d)
   ├── setAuthCookie(res, token)
   │     └── Set-Cookie: tlz_auth=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000
   └── JSON: { success: true, data: { token, user: {...} } }
```

**Frontend :**
- Reçoit le token dans le JSON (backward compat)
- **Ne stocke pas** le token
- Toutes les requêtes suivantes utilisent `credentials: 'include'`

### 3.2 Google Auth

```text
POST /api/auth/google
   Headers: Authorization: Bearer <Firebase ID token>
   Body: { invitationCode }
   ↓
Backend
   ├── verifyFirebaseIdToken(idToken)
   ├── resolveGoogleSignIn(...)
   ├── generateAuthToken(user) → JWT Tulizaana
   ├── setAuthCookie(res, token)
   └── JSON: { success: true, data: { token, user: {...} } }
```

**Frontend :**
- Envoie le Firebase ID token dans `Authorization: Bearer` (Chantier 2 intact)
- Backend renvoie un cookie `tlz_auth` (JWT Tulizaana)
- Frontend ne stocke aucun token

### 3.3 Admin login

```text
POST /api/auth/login (same endpoint)
   ↓
Backend → setAuthCookie + JSON
   ↓
Frontend → GET /api/auth/me (avec cookie)
   ↓
Backend → { id, name, email, role: 'superadmin' }
   ↓
Frontend → setAdminSession(session)
```

### 3.4 Partner login

```text
POST /api/auth/login
   ↓
Backend → setAuthCookie + JSON
   ↓
Frontend → GET /api/organizations/mine (avec cookie)
   ↓
Backend → { organizations: [...] }
   ↓
Frontend → setManagedPartnerOrganizations(orgs)
```

---

## 4. Flux Google

**Inchangé depuis Chantier 2 :**
- Firebase ID token envoyé dans `Authorization: Bearer`
- Vérification côté serveur avec `firebase-admin`
- Rôle forcé à `member`
- Invitation obligatoire

**Nouveau :**
- Après vérification, le backend pose un cookie `tlz_auth` (JWT Tulizaana)
- Le frontend ne stocke plus le JWT Tulizaana

---

## 5. Flux admin

**Inchangé :**
- `adminAuth.ts` appelle `POST /api/auth/login`
- Puis `GET /api/auth/me` pour confirmer le rôle
- `requireRole(['superadmin', ...])` protège les routes

**Nouveau :**
- Session repose sur cookie HttpOnly
- `signOutAdmin()` ne fait plus de `clearAuthToken()` (no-op)
- `handleAdminLogout()` appelle `POST /api/auth/logout` + `clearAppStorage()`

---

## 6. Flux partner

**Inchangé :**
- `PartnerAuthModal` appelle `api.partner.login()`
- Puis `api.partner.managedOrganizations()`
- Organisation résolue par le serveur

**Nouveau :**
- Cookie HttpOnly pour la session
- Plus de `setAuthToken`/`clearAuthToken` dans le frontend

---

## 7. Cookie configuration

### 7.1 Nom du cookie

```
tlz_auth
```

### 7.2 Attributs

| Attribut | Valeur | Justification |
|---|---|---|
| `HttpOnly` | `true` | inaccessible à JavaScript |
| `Secure` | `true` en prod, `false` en dev | HTTPS en production |
| `SameSite` | `strict` | protection CSRF native |
| `Path` | `/` | cookie envoyé sur toutes les routes |
| `Max-Age` | `2592000` (30 jours) | cohérent avec expiration JWT |

### 7.3 Secure flag

Défini par `resolveCookieSecureFlag()` dans `server/utils/cookies.ts` :
- `production` → `true`
- `development` → `process.env.COOKIE_SECURE === "true"` (défaut `false`)

### 7.4 SameSite

Défini par `resolveCookieSameSite()` dans `server/utils/cookies.ts` :
- Défaut : `strict`
- Surchargeable par `COOKIE_SAME_SITE` (`strict`, `lax`, `none`)

---

## 8. CSRF

### Stratégie retenue

**`SameSite=Strict`** + **meth

ods HTTP idempotents pour les GET**.

### Justification

- `SameSite=Strict` : le navigateur n'envoie pas le cookie sur les requêtes cross-site
- Les GET ne provoquent pas de mutations métier
- Les mutations (POST/PUT/PATCH/DELETE) sont protégées par le rate limiting existant

### Compléments

- `trust proxy` activé dans `server.ts` (c

hap. 5)
- Security headers : `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
- Pas de `Access-Control-Allow-Origin: *` avec credentials

### Limitation connue

Si un flux nécessite du cross-site (ex: SSO), `SameSite=Strict` devra être assoupli vers `lax` et une protection CSRF explicite (token double-submit) devra être ajoutée.

---

## 9. Logout

### Frontend

```ts
const handleLogout = async () => {
  logoutGoogle().catch(() => {});
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch {}
  setIsLoggedIn(false);
  setIsPartnerAuthenticated(false);
  clearAppStorage();
  setShowProfileModal(false);
  setActiveUserTab('feed');
  setOnboardingStep('welcome');
};
```

### Backend

```ts
export async function logout(req: Request, res: Response): Promise<void> {
  clearAuthCookie(res);
  sendSuccess(res, { success: true });
}
```

### Cookie de logout

```
Set-Cookie: tlz_auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

### Admin logout

```ts
const handleAdminLogout = async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch {}
  signOutAdmin();
  setAdminSession(null);
  setShowAdminBackOffice(false);
  clearAppStorage();
};
```

---

## 10. Expiration session

| Paramètre | Valeur |
|---|---|
| Expiration JWT | 30 jours (`expiresIn: "30d"`) |
| Max-Age cookie | 30 jours (`2592000` secondes) |
| Rafraîchissement | `GET /api/auth/me` (re-vérifie suspension) |
| Invalidation | `POST /api/auth/logout` (cookie supprimé) |

**Note :** Le backend ne conserve pas d'état de session serveur. Un JWT expiré ou révoqué reste cryptographiquement valide jusqu'à sa date d'expiration, mais n'est plus accessible au navigateur après logout.

---

## 11. CORS

### Configuration actuelle

- Frontend et backend servis depuis la même origine (`http://localhost:3000`) en développement
- En production (Vercel), même architecture same-origin via SSR/API routes
- **Pas de configuration CORS explicite nécessaire** dans le cas actuel

### Si déploiement séparé

Ajouter dans `server.ts` :

```ts
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
```

**À ne jamais faire :**
- `Access-Control-Allow-Origin: *` avec credentials
- `Access-Control-Allow-Credentials: true` sans allowlist

---

## 12. localStorage

### JWT

- **`tlz_auth_token` n'est plus stocké dans `localStorage`**
- `getAuthToken()` retourne `null`
- `setAuthToken()` est un no-op
- `clearAuthToken()` est un no-op

### Autres données

Les autres clés `tlz_*` (posts, organizations, etc.) restent dans `localStorage` pour l'instant. Elles seront migrées en 6D.

---

## 13. Tests

### 13.1 Résultats globaux

| Suite | Résultat |
|---|---|
| `npm run typecheck` | PASS (0 erreur) |
| `npm run build` | PASS (vite + esbuild) |
| `npm run test:auth` | PASS (44/44) |
| `npm run test:admin-security` | PASS (42/42) |
| `npm run test:partner-security` | PASS (114/114) |
| `npm run test:resource-security` | PASS (21/21) |
| `npm run test:storage-security` | PASS (16/16) |
| `npm run test:auth-cookie-security` | PASS (23/23) |
| `npm run test:seed` | PASS (34/34) |

### 13.2 Détail des tests cookie

| ID | Test | Résultat |
|---|---|---|
| A | Login → Set-Cookie `tlz_auth` présent, HttpOnly, SameSite=Strict | PASS |
| B | JWT présent dans JSON (backward compat) | PASS |
| C | JWT absent de localStorage après login | PASS |
| D | JWT absent de sessionStorage après login | PASS |
| E | `GET /api/auth/me` avec cookie → 200 | PASS |
| F | Endpoint protégé avec cookie → 200 | PASS |
| G | Cookie falsifié → 401 | PASS |
| H | Utilisateur suspendu → 403 | PASS |
| I | Logout expire le cookie | PASS |
| J | Refresh → session reconnue via cookie | PASS |
| K | Changement de compte isole les données | PASS |
| L | Google Auth → cookie posé | PASS |
| M | Admin login → cookie posé | PASS |
| N | Partner login → cookie posé | PASS |
| O | SameSite=Strict protège les mutations | PASS |
| P | Frontend utilise `credentials: 'include'` | PASS |
| Q | Frontend ne génère plus `Authorization: Bearer` (sauf Google) | PASS |
| R | `setAuthToken()` est un no-op | PASS |
| S | `getAuthToken()` retourne `null` | PASS |
| T | `tlz_auth_token` absent du frontend | PASS |

---

## 14. Régressions

### 14.1 Aucune régression détectée

- Tous les tests existants passent
- Login classique fonctionne
- Google Auth fonctionne
- Admin login fonctionne
- Partner login fonctionne
- Logout fonctionne
- `requireAuth` et `requireRole` restent intactes

### 14.2 Changements comportementaux acceptés

- `localStorage.getItem('tlz_auth_token')` retourne `null` (attendu)
- `sessionStorage` ne contient plus de token
- Le token n'est plus affiché dans les DevTools Application > Local Storage (attendu)

---

## 15. Limitations restantes

### 15.1 Token dans la réponse JSON

Le backend renvoie toujours le token dans la réponse JSON pour backward compat. Ceci est acceptable car :
- Le frontend ne le stocke plus
- Les tests existants s'appuient sur ce contrat

**Optionnel :** Retirer le token de la réponse JSON en 6C ou 6D.

### 15.2 Pas de refresh token

Le JWT a une durée de vie de 30 jours. Pas de mécanisme de refresh token pour l'instant.

**Optionnel :** Ajouter un refresh token rotatif en 6D.

### 15.3 SameSite=Strict

Bloque les flux cross-site légitimes (ex: SSO, partenaires).

**Optionnel :** Assouplir vers `lax` + CSRF token si nécessaire.

### 15.4 Pas de CORS explicite

Fonctionne car same-origin. À ajouter si séparation des origines.

---

## 16. Recommandations pour 6C

1. **Retirer `tlz_auth_token` de `STORAGE_KEYS`** (garder uniquement pour compatibilité)
2. **Supprimer `getAuthToken`/`setAuthToken`/`clearAuthToken`** du frontend
3. **Nettoyer `INITIAL_AUDIT_LOGS`** (données PII factices)
4. **Supprimer `tlz_registered_users`** (credentials locaux)
5. **Retirer `Authorization: Bearer` de `googleLogin`** si Firebase ID token passe par un header dédié

---

*Fin du rapport 6B.*
