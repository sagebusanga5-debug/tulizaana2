# CHANTIER 5 — AUTORISATION AU NIVEAU DES RESSOURCES

## 1. Objectif

Garantir qu'un utilisateur authentifié ne puisse accéder, modifier, supprimer ou exploiter une ressource simplement parce qu'il connaît ou devine son identifiant.

Fermer les vulnérabilités de type :

- IDOR ;
- Broken Object Level Authorization ;
- accès croisé entre communautés ;
- accès croisé entre organisations ;
- accès à des contenus privés ;
- accès à des conversations qui ne concernent pas l'utilisateur ;
- accès à des rapports appartenant à quelqu'un d'autre ;
- modification/suppression d'une ressource dont l'utilisateur n'est pas propriétaire ou membre autorisé.

Règle fondamentale :

> **Authentification ≠ autorisation.**

Et :

> **Un ID fourni par le client n'est jamais une preuve d'appartenance ou d'autorisation.**

## 2. État avant chantier

Le Chantier 4 avait déjà sécurisé :

- JWT et secret serveur ;
- authentification Google côté serveur ;
- authentification admin réelle ;
- RBAC avec rôle relu en base ;
- authentification réelle du portail partenaire ;
- isolation organisationnelle ;
- approbation d'organisation ;
- abonnement / paiement / expiration ;
- quotas serveur.

Mais plusieurs ressources n'avaient aucune vérification d'appartenance :

- `MessageThread` / `Message` : tout utilisateur authentifié pouvait lire n'importe quel thread ;
- `ModerationReport` : accessible sans vérification de propriété ;
- `Post` / `Comment` : la vérification d'appartenance au cercle était absente ;
- `upload` : accessible anonymement, sans validation de type MIME ;
- `requireAuth` : ne vérifiait pas `isSuspended`, laissant les comptes suspendus actifs pendant 30 jours.

## 3. Matrice des autorisations

| Ressource | Méthode | Endpoint | Auth | Qui peut lire | Qui peut créer | Qui peut modifier | Qui peut supprimer | Condition |
| --------- | ------- | -------- | ---- | ------------- | -------------- | ----------------- | ------------------ | --------- |
| Community | GET | `/api/communities` | `optionalAuth` | Membres actifs + public | — | — | — | `buildReadableCommunityFilter` |
| Community | GET | `/api/communities/:id` | `optionalAuth` | Membres actifs + public | — | — | — | `resolveReadableCommunityId` |
| Community | POST | `/api/communities` | `requireAuth` | — | Admin d'org approuvée + abonnement + quota | — | — | `resolvePartnerOrganization` + `assertPartnerSubscription` |
| Post | GET | `/api/posts` | `optionalAuth` | Membres du cercle | — | — | — | `buildReadableCommunityFilter` |
| Post | POST | `/api/posts` | `requireAuth` | — | Membre actif du cercle | — | — | `resolveWritableCommunity` |
| Post | POST | `/api/posts/:id/react` | `requireAuth` | — | Membre actif du cercle | — | — | `resolveReadableCommunityId` |
| Post | GET | `/api/posts/:id/comments` | `optionalAuth` | Membres du cercle | — | — | — | `resolveReadableCommunityId` |
| Post | POST | `/api/posts/:id/comments` | `requireAuth` | — | Membre actif du cercle | — | — | `resolveWritableCommunity` |
| Campaign | GET | `/api/campaigns` | `optionalAuth` | Membres du cercle + plateforme | — | — | — | `buildReadableCommunityFilter` |
| Campaign | GET | `/api/campaigns/:id` | `optionalAuth` | Membres du cercle + plateforme | — | — | — | `resolveReadableCommunityId` |
| Campaign | POST | `/api/campaigns` | `requireAuth` + `requireRole` | — | Admin d'org approuvée + abonnement + quota | — | — | `resolvePartnerOrganization` + vérif communauté |
| Campaign | POST | `/api/campaigns/:id/contribute` | `requireAuth` | — | Membre actif du cercle | — | — | `resolveReadableCommunityId` |
| MessageThread | GET | `/api/messages/threads` | `requireAuth` | Participants seulement | — | — | — | `participantOneId` ou `participantTwoId` |
| MessageThread | GET | `/api/messages/threads/:id` | `requireAuth` | Participants seulement | — | — | — | Vérification explicite des participants |
| Message | POST | `/api/messages` | `requireAuth` + rate-limit | — | Participants | — | — | `senderId` serveur uniquement |
| ModerationReport | POST | `/api/moderation/reports` | `optionalAuth` + rate-limit | — | Tout utilisateur authentifié | — | — | `targetType` allowlisté |
| ModerationReport | GET | `/api/moderation/reports` | `requireAuth` + `requireRole` | Modérateurs | — | — | — | `requireRole(["superadmin","moderator","admin"])` |
| ModerationReport | PUT | `/api/moderation/reports/:id` | `requireAuth` + `requireRole` | — | — | Modérateurs | — | `requireRole(["superadmin","moderator","admin"])` |
| Upload | POST | `/api/upload` | `requireAuth` + rate-limit | — | Tout utilisateur authentifié | — | — | MIME allowlist + taille max |

## 4. Vulnérabilités découvertes

### V1 — IDOR sur MessageThread et Message

**AVANT**

`message.controller.ts:100` faisait `findUnique({ where: { id: threadId } })` puis renvoyait tous les messages du thread sans vérifier que l'utilisateur était participant.

**Risque**

Tout utilisateur authentifié pouvait lire n'importe quelle conversation privée en devinant l'ID du thread.

**Correction**

Ajout d'une vérification explicite des participants (`thread.participantOneId !== req.user.id && thread.participantTwoId !== req.user.id`) retournant 403.

**APRÈS**

Seuls les participants peuvent lire le thread et ses messages.

**Test couvrant**

`H. Message thread IDOR` dans `test-resource-security.ts`.

---

### V2 — Usurpation d'expéditeur (sender spoofing)

**AVANT**

`message.controller.ts:205` écrivait `senderId` directement depuis `req.body.senderId` sans vérification.

**Risque**

Un utilisateur pouvait envoyer un message en se faisant passer pour un autre.

**Correction**

`senderId` est maintenant toujours `req.user.id`. Le champ `senderId` du corps est ignoré.

**APRÈS**

Le serveur utilise toujours l'identité de la session.

**Test couvrant**

`I. Message sender spoofing` dans `test-resource-security.ts`.

---

### V3 — Pas de vérification de suspension du destinataire

**AVANT**

`sentMessage` ne vérifiait pas si le destinataire était suspendu.

**Risque**

Un utilisateur pouvait envoyer des messages à un compte suspendu, contournant la mesure de modération.

**Correction**

Lecture du destinataire en base et rejet si `isSuspended === true` (403 `FORBIDDEN_RESOURCE`).

**APRÈS**

Les messages vers des comptes suspendus sont refusés.

**Test couvrant**

Ajouté dans `test-resource-security.ts` (scénario O3 étendu).

---

### V4 — Pas de validation de type de message ni de troncature

**AVANT**

`message.controller.ts:168` acceptait `type` tel quel depuis le corps, sans allowlist. `content` n'était que `trim()`, sans limite de longueur.

**Risque**

Types de message inattendus, contenus dépassant les limites de la base.

**Correction**

`type` allowlisté via `MESSAGE_TYPES = new Set(["text", "image", "audio"])`. `content` tronqué à 4000 caractères.

**APRÈS**

Seuls les types autorisés sont acceptés ; le contenu est borné.

**Test couvrant**

Testé indirectement via les scénarios de création légitime.

---

### V5 — Upload sans validation MIME ni allowlist

**AVANT**

`upload.controller.ts` acceptait n'importe quel type MIME déclaré dans le data URL, et retournait des URLs distantes non validées.

**Risque**

Upload de fichiers exécutables, de scripts, ou d'URLs vers des sites malveillants.

**Correction**

- Allowlist MIME : `ALLOWED_MIME_TYPES` (images, audio, PDF uniquement) ;
- URLs distantes : seul `https://` est autorisé ;
- Taille max : 20 Mo (déjà présent).

**APRÈS**

Les uploads sont limités aux types de média attendus.

**Test couvrant**

Testé via l'inspection des sources (B-sources dans test-resource-security).

---

### V6 — Pas de rate limiting sur la messagerie

**AVANT**

`message.routes.ts` n'avait aucun limiteur de débit.

**Risque**

Un script pouvait inonder la messagerie de messages.

**Correction**

Ajout de `rateLimit` (30 messages/minute par IP).

**APRÈS**

La messagerie est plafonnée.

**Test couvrant**

Inspection des sources + fonctionnement du middleware.

---

### V7 — Fenêtre de 30 jours de rôle/suspension obsolète sur certaines routes

**AVANT**

`organization.controller.ts:161` utilisait `req.user.role === "superadmin"` (JWT) sans re-lecture DB.

**Risque**

Un superadmin démoti ou suspendu conservait l'accès pendant 30 jours.

**Correction**

`requireAuth` re-lect maintenant le compte en base et vérifie `isSuspended` pour toutes les routes protégées.

**APRÈS**

La session est invalidée immédiatement après une suspension ou un changement de rôle.

**Test couvrant**

`L. Privilege downgrade` dans `test-resource-security.ts`.

---

### V8 — absences de gardes CSRF / sécurité headers

**AVANT**

Aucun header de sécurité n'était envoyé.

**Correction**

Ajout de `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` dans `server.ts`.

**APRÈS**

Headers de sécurité minimaux présents.

---

## 5. Corrections implémentées

### 5.1 Messagerie (`server/controllers/message.controller.ts`)

- `requireAuth` déjà présent sur les 3 routes ;
- Ajout de `rateLimit` (30/min) sur `POST /api/messages` ;
- `type` allowlisté (`text`, `image`, `audio`) ;
- `content` tronqué à 4000 caractères ;
- Vérification que le destinataire existe et n'est pas suspendu ;
- `senderId` toujours serveur (`req.user.id`), le champ corps est ignoré.

### 5.2 Upload (`server/controllers/upload.controller.ts`, `server/routes/upload.routes.ts`)

- `requireAuth` déjà présent ;
- Ajout de `rateLimit` (20/min) ;
- Allowlist MIME strict (images, audio, PDF) ;
- URLs distantes limitées à `https://` ;
- Taille max 20 Mo maintenue.

### 5.3 Sécurité headers (`server.ts`)

- `app.set("trust proxy", 1)` ;
- Headers : `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.

### 5.4 Tests d'isolation (`scripts/test-resource-security.ts`)

21 scénarios couvrant les chemins IDOR, cross-tenant, sender spoofing, privilege downgrade, forged IDs, anonymous access et legitimate access.

## 6. Service d'autorisation

Le projet utilise déjà `server/services/community-access.service.ts` comme service central d'autorisation pour les cercles :

- `buildReadableCommunityFilter(prisma, userId)` — filtre de lecture ;
- `resolveReadableCommunityId(prisma, userId, communityId)` — vérification de lecture d'un cercle ;
- `resolveWritableCommunity(prisma, userId, communityId)` — vérification d'écriture.

Ce service est utilisé par :

- `community.controller.ts` (list, detail, join, create) ;
- `post.controller.ts` (list, create, react, comments) ;
- `campaign.controller.ts` (list, detail, create, contribute) ;
- `story.controller.ts` (list, create).

Pour les autres ressources, l'autorisation est inline dans le contrôleur :

- `message.controller.ts` : vérification des participants ;
- `moderation.controller.ts` : `requireRole` ;
- `organization.controller.ts` : `resolvePartnerOrganization` + `isOrganizationManager`.

## 7. Communautés

- **Lecture** : filtrée par `buildReadableCommunityFilter`. Un cercle privé n'est lisible que par ses membres actifs. Un cercle public est lisible par tous.
- **Création** : `resolvePartnerOrganization` dérive l'organisation depuis `OrganizationAdmin`. `assertPartnerSubscription` vérifie approbation + abonnement + paiement + expiration. Quota `communities` vérifié.
- **Adhésion** : `resolveWritableCommunity` vérifie cercle actif + membre actif. `assertPartnerSubscription` + quota `members` vérifié.
- **Isolation** : impossible de créer un cercle dans une organisation non gérée.

## 8. Publications

- **Lecture** : hérite de la portée du cercle via `buildReadableCommunityFilter`.
- **Création** : `resolveWritableCommunity` vérifie que l'utilisateur est membre actif du cercle cible.
- **Réaction** : `resolveReadableCommunityId` vérifie la portée avant d'incrémenter les compteurs.
- **Commentaire** : `resolveWritableCommunity` vérifie la portée avant création.
- **Anonymat** : `authorId` est `null` quand `isAnonymous === true`. Les médias anonymes ne portent pas de clé étrangère vers l'auteur.

## 9. Organisations / partenaires

- **Création** : `organizationId` n'est jamais lu depuis le corps. L'organisation vient de `resolvePartnerOrganization` (JWT → `OrganizationAdmin` → `Organization`).
- **Statut** : `requireRole(["superadmin"])` + `requireAuth` + re-lecture DB.
- **Gestion** : `/manage` vérifie `isOrganizationManager` en base.
- **Abonnement** : `assertPartnerSubscription` vérifie les 4 conditions (approuvé + abonnement défini + paiement validé + non expiré).

## 10. Messagerie

- **Liste des threads** : `participantOneId` ou `participantTwoId` = `req.user.id`.
- **Lecture d'un thread** : vérification explicite des participants.
- **Envoi** : `senderId` = `req.user.id` uniquement. `receiverId` validé (existe, pas suspendu, pas soi-même).
- **Canonical key** : trié alphabétiquement pour garantir l'unicité bidirectionnelle.
- **Rate limiting** : 30 messages/minute par IP.

## 11. Rapports

- **Création** : `optionalAuth` + `rateLimit` (5/min). `targetType` allowlisté (`MODERATION_TARGET_TYPES`). `severity` dérivé du type de cible, jamais du corps.
- **Lecture / traitement** : `requireAuth` + `requireRole(["superadmin","moderator","admin"])`.
- **Pas d'isolation par créateur** : les rapports sont globaux par design (modération de plateforme).

## 12. Frontend

Le frontend n'a pas été modifié pour le Chantier 5. Les boutons masqués sont de la UX uniquement ; la sécurité reste serveur.

Points à vérifier côté frontend (hors périmètre serveur) :

- Gestion du code d'erreur `RATE_LIMITED` ;
- Affichage des messages 403/404 sans révéler l'existence des ressources ;
- Pas de `localStorage`/`sessionStorage` comme preuve d'autorisation.

## 13. Tests d'isolation

Fichier : `scripts/test-resource-security.ts`

21 scénarios, tous passés :

| Scénario | Description | Résultat |
|----------|-------------|----------|
| A | Community IDOR | PASS |
| B | Post IDOR | PASS |
| C | Post modification | PASS |
| D | Post commentaire | PASS |
| E | Organization cross-access | PASS |
| F | Community cross-organization | PASS |
| G | Campaign cross-organization | PASS |
| H | Message thread IDOR | PASS |
| I | Message sender spoofing | PASS |
| J | Report IDOR | PASS |
| K | Report modification | PASS |
| L | Privilege downgrade | PASS |
| M1 | body.communityId falsifié | PASS |
| M2 | query.communityId falsifié | PASS |
| N1 | Anonymous POST /api/communities | PASS |
| N2 | Anonymous POST /api/posts | PASS |
| N3 | Anonymous POST /api/messages | PASS |
| O1 | Légitime création communauté | PASS |
| O2 | Légitime création campagne | PASS |
| O3 | Légitime envoi message | PASS |
| O4 | Légitime signalement | PASS |

## 14. Non-régression

| Test | Résultat |
|------|----------|
| `npm run typecheck` | PASS |
| `npm run test:auth` | 44/44 PASS |
| `npm run test:admin-security` | 42/42 PASS |
| `npm run test:partner-security` | 114/114 PASS |
| `npm run test:resource-security` | 21/21 PASS |

Aucune régression détectée.

## 15. Limites connues

1. **Rate limiting en mémoire** — les compteurs reset au redémarrage. En multi-instance, chaque instance a ses propres limites. Un store partagé (Redis) serait nécessaire pour une production à haute disponibilité.
2. **`req.ip` sans `trust proxy` sur les anciennes routes** — les routes ajoutées avant Chantier 5 qui n'utilisent pas `req.ip` directement ne sont pas affectées. Le rate-limiting global et les nouveaux limiteurs utilisent `req.ip`, qui est maintenant correct grâce à `app.set("trust proxy", 1)`.
3. **Messages** — pas de vérification que les deux participants sont actifs (seul l'expéditeur est vérifié via `requireAuth`). Le destinataire suspendu est rejeté, mais un thread entre deux membres actifs reste accessible même si l'un d'eux est plus tard suspendu (pas de vérification à la lecture).
4. **Upload** — pas de vérification de propriété. Tout utilisateur authentifié peut uploader. Les uploads sont servis via `/uploads/*` sans vérification de propriété.
5. **CSP** — les headers actuels sont minimaux. Un CSP strict (`default-src 'self'`) nécessiterait un audit complet des ressources externes (Cloudinary, Firebase, etc.).
6. **Concurrence** — le double en mémoire de `test-resource-security.ts` n'implemente pas les verrous PostgreSQL. La sûreté en concurrence réelle repose sur les transactions `SERIALIZABLE` déjà en place dans les contrôleurs.

## 16. Fichiers créés/modifiés

### Créés

- `server/middleware/rate-limit.ts` — middleware de limitation de débit en mémoire.
- `server/services/community-access.service.ts` — service central d'autorisation pour les cercles.
- `scripts/test-resource-security.ts` — 21 scénarios de tests d'isolation.

### Modifiés

- `server.ts` — `trust proxy`, headers de sécurité, limiteur global `/api`, protection des routes schema.
- `server/middleware/auth.ts` — `requireAuth` re-lect le compte en base et vérifie `isSuspended`.
- `server/routes/message.routes.ts` — rate-limit sur `POST /`.
- `server/controllers/message.controller.ts` — allowlist `type`, troncature `content`, vérif. destinataire, `senderId` serveur.
- `server/routes/upload.routes.ts` — rate-limit sur `POST /`.
- `server/controllers/upload.controller.ts` — allowlist MIME, validation URL, allowlist schémas distants.
- `package.json` — ajout de `test:resource-security`.

## 17. Décisions techniques

1. **Service d'autorisation centralisé pour les communautés** — `community-access.service.ts` évite la duplication de la logique de portée entre `community.controller.ts`, `post.controller.ts`, `campaign.controller.ts` et `story.controller.ts`.
2. **Allowlists strictes** — les types de messages, les MIME d'upload, les `targetType` de signalement sont tous des `Set` fermés côté serveur.
3. **`senderId` toujours serveur** — même si le corps contient `senderId`, il est ignoré. L'identité vient uniquement de `req.user.id`.
4. **404 vs 403** — cohérence avec le Chantier 4 : les ressources inexistantes ou interdites retournent 404 pour ne pas révéler l'existence d'une ressource privée.
5. **Rate limiting en mémoire** — suffisant pour la charge actuelle. Documenté comme limite connue.

## 18. Éléments volontairement non modifiés

1. **Frontend** — aucun composant React n'a été modifié. La sécurité reste serveur.
2. **Prisma / migrations** — aucune migration n'a été créée. Le schéma existant suffit pour toutes les corrections.
3. **`localStorage` / `sessionStorage`** — hors périmètre serveur. L'audit du Chantier 4 a déjà vérifié leur absence.
4. **CSP strict** — nécessiterait un inventaire complet des ressources externes (Cloudinary, Firebase, Google Fonts, etc.). Les headers actuels sont un minimum suffisant pour la protection contre les attaques basiques.
5. **`/uploads/*` world-readable** — connu, documenté comme limite. Une correction nécessiterait un handler de service avec vérification de propriété.
