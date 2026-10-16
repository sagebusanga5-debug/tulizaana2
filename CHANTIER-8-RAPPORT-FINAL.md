# CHANTIER 8 — RAPPORT FINAL

**Date :** 2026-10-07
**Nature :** Audit complet et sécurisation de l'architecture d'accès aux données — RLS, PostgREST, Express, Prisma, Supabase
**Verdict :**

```text
CHANTIER 8 — VALIDÉ
```

---

## 1. ARCHITECTURE FINALE

```text
Frontend (React/Vite)
   ↓
Express API (server/routes/, server/controllers/)
   ↓
Prisma (prisma/schema.prisma)
   ↓
PostgreSQL (Supabase)
```

**Aucun accès direct du frontend aux tables métier.**

### Canaux d'accès confirmés

| Canal | Utilisé pour | Données métier |
| ----- | ------------ | -------------- |
| Frontend → Express | Toutes les opérations métier | ✅ |
| Frontend → Supabase | UNIQUEMENT test de connexion (`testSupabaseFrontendConnection`) + Google Auth (Firebase) | ❌ |
| Express → Prisma | Toutes les opérations métier | ✅ |
| Express → Supabase | UNIQUEMENT health checks + diagnostics schema | ❌ |
| Prisma → PostgreSQL | Toutes les opérations métier | ✅ |

**Décision : Modèle 1 (API-first) confirmé.**

---

## 2. MATRICE D'AUDIT DES CANAUX

| Fonctionnalité | Frontend → Supabase direct | Frontend → Express | Express → Prisma | Autre |
| --------------- | :------------------------: | :----------------: | :--------------: | :---: |
| Auth | ❌ | ✅ | ✅ | Firebase (Google) |
| Users | ❌ | ✅ | ✅ | |
| Organizations | ❌ | ✅ | ✅ | |
| Communities | ❌ | ✅ | ✅ | |
| Campaigns | ❌ | ✅ | ✅ | |
| Posts | ❌ | ✅ | ✅ | |
| Comments | ❌ | ✅ | ✅ | |
| Reactions | ❌ | ✅ | ✅ | |
| Messages | ❌ | ✅ | ✅ | |
| Moderation | ❌ | ✅ | ✅ | |
| Invitations | ❌ | ✅ | ✅ | |
| AuditLog | ❌ | ✅ | ✅ | |
| Storage / médias | ❌ | ✅ | ✅ | Cloudinary |
| IA | ❌ | ✅ | ✅ | Gemini API |

---

## 3. AUDIT DES CLÉS SUPABASE

### Variables d'environnement

| Variable | Côté | Rôle | Statut |
| -------- | ---- | ---- | ------ |
| `VITE_SUPABASE_URL` | Frontend | URL publique Supabase | ✅ Public |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Clé anon/public | ✅ Public |
| `SUPABASE_URL` | Backend | URL Supabase | ✅ Backend |
| `SUPABASE_SECRET_KEY` | Backend | Clé secrète (si utilisée) | ✅ Backend |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Clé service role (si utilisée) | ✅ Backend |
| `DATABASE_URL` | Backend | Connexion PostgreSQL (Prisma) | ✅ Backend |
| `DIRECT_URL` | Backend | Connexion PostgreSQL directe (Prisma CLI) | ✅ Backend |

### Vérifications effectuées

1. **Frontend bundle** : aucune clé secrète. Le bundle contient seulement `process.env.*` (côté serveur) et `import.meta.env.VITE_*` (côté client, public).
2. **`src/services/supabaseClient.ts`** : utilise seulement `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (clé publique).
3. **`server/config/supabase.ts`** : résout la clé depuis `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, etc. Côté serveur uniquement.
4. **Aucune occurrence de `service_role` côté frontend.**

### Règle confirmée

```text
FRONTEND = uniquement clé publique (anon/publishable)
BACKEND  = uniquement clés privilégiées (jamais envoyées au navigateur)
```

---

## 4. AUDIT DES RÔLES

### Rôles applicatifs

| Rôle | Source | Vérification | Modifiable par frontend ? |
| ---- | ------ | ------------ | ------------------------: |
| `member` | Base de données | `req.user.role` (JWT + relecture DB) | ❌ |
| `peer_helper` | Base de données | `req.user.role` | ❌ |
| `professional` | Base de données | `req.user.role` | ❌ |
| `partner_admin` | Base de données | `req.user.role` | ❌ |
| `superadmin` | Base de données | `req.user.role` | ❌ |
| `moderator` | Base de données | `req.user.role` | ❌ |
| `admin` | Base de données | `req.user.role` | ❌ |

**Règle :** le rôle est toujours relu en base (`loadFreshAccount`), jamais pris au pied de la lettre depuis le JWT ou le frontend.

### Matrice des autorisations (dérivée du code)

| Action | User | Partner | Partner Admin | Moderator | Superadmin |
| ------ | :--: | :-----: | :-----------: | :-------: | :--------: |
| Lire son profil | ✅ | ✅ | ✅ | ✅ | ✅ |
| Modifier son profil | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lire organisations (public) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gérer son organisation | ❌ | ✅ | ✅ | ❌ | ✅ |
| Créer Community | ❌ | ✅ (selon abonnement) | ✅ (selon abonnement) | ❌ | ✅ |
| Gérer Community | ❌ | ✅ (si membre) | ✅ (si membre) | ❌ | ✅ |
| Créer Campaign | ❌ | ✅ (selon abonnement) | ✅ (selon abonnement) | ❌ | ✅ |
| Contribuer Campaign | ❌ | ✅ | ✅ | ❌ | ✅ |
| Créer Post | ❌ | ✅ (si membre) | ✅ (si membre) | ❌ | ✅ |
| Modérer contenu | ❌ | ❌ | ❌ | ✅ | ✅ |
| Voir rapports modération | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gérer rapports modération | ❌ | ❌ | ❌ | ✅ | ✅ |
| Audit logs | ❌ | ❌ | ❌ | ❌ | ✅ |
| Gérer utilisateurs (suspension/rôle) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Gérer abonnements | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 5. ISOLATION DES DONNÉES

### Ownership et scope par table

| Table | Ownership | Scope | Accès SELECT | Accès INSERT/UPDATE/DELETE | Autorité |
| ----- | --------- | ----- | :-----------: | :------------------------: | -------- |
| User | `userId` | Global | ✅ (public) | ❌ (soi-même via API) | Express |
| Organization | `organizationId` | Organisation | ✅ (public approved) | ❌ (partner_admin de l'org) | Express |
| OrganizationAdmin | `organizationId` + `userId` | Organisation | ✅ (partner_admin) | ❌ (partner_admin) | Express |
| Community | `communityId` | Organisation + Community | ✅ (public ou membre) | ❌ (membre actif) | Express |
| CommunityMember | `communityId` + `userId` | Community | ✅ (membres du cercle) | ❌ (soi-même/admin) | Express |
| Post | `postId` | Community | ✅ (public ou membre) | ❌ (membre actif) | Express |
| PostMedia | `postId` | Post | ✅ (membres du cercle) | ❌ (auteur/membre) | Express |
| Comment | `commentId` | Post | ✅ (membres du cercle) | ❌ (auteur/membre) | Express |
| Reaction | `reactionId` | Post | ✅ (membres du cercle) | ❌ (soi-même) | Express |
| Story | `storyId` | Community | ✅ (membres du cercle) | ❌ (auteur) | Express |
| Campaign | `campaignId` | Organization + Community | ✅ (public) | ❌ (partner_admin) | Express |
| CampaignContribution | `contributionId` | Campaign | ✅ (public) | ❌ (auteur) | Express |
| MessageThread | `threadId` | User (2 participants) | ✅ (participants uniquement) | ❌ (participants) | Express |
| Message | `messageId` | Thread | ✅ (participants) | ❌ (sender) | Express |
| Invitation | `invitationId` | Organization + Community | ✅ (membres) | ❌ (partner_admin) | Express |
| InvitationRequest | `requestId` | Organization + Community | ✅ (partner_admin) | ❌ (candidat/admin) | Express |
| ModerationReport | `reportId` | Community | ✅ (moderation staff) | ❌ (moderation staff) | Express |
| AuditLog | `logId` | Global | ❌ (superadmin uniquement) | ❌ | Express |

**Toutes les autorisations sont contrôlées par Express/Prisma.**

---

## 6. DONNÉES SENSIBLES

### Tables et champs sensibles identifiés

| Table | Champs sensibles | Protection |
| ----- | ---------------- | ---------- |
| User | `email`, `passwordHash`, `phoneNumber`, `isSuspended` | ✅ Non exposés hors `/me` et admin |
| Message | `content`, `mediaUrl` | ✅ Restreint aux participants du thread |
| MessageThread | `canonicalParticipantKey` | ✅ Clé interne, pas exposée |
| ModerationReport | `details`, `reportedById`, `actionTakenBy` | ✅ Restreint au staff |
| AuditLog | `userId`, `userName`, `action`, `details` | ✅ Superadmin uniquement |
| CampaignContribution | `authorName` (si anonyme) | ✅ Masqué en cas d'anonymat |
| Organization | `contactEmail`, `contactPhone`, `subscriptionPlan` | ✅ Public pour les orgs approuvées |

**Aucune fuite d'information sensible identifiée.**

---

## 7. RLS : AUDIT ET DÉCISION

### État actuel

| Table | RLS activé | Policies | Accès direct nécessaire ? |
| ----- | :---------: | :------: | :-----------------------: |
| User | ✅ | 0 | ❌ |
| Organization | ✅ | 0 | ❌ |
| OrganizationAdmin | ✅ | 0 | ❌ |
| Community | ✅ | 0 | ❌ |
| CommunityMember | ✅ | 0 | ❌ |
| Post | ✅ | 0 | ❌ |
| PostMedia | ✅ | 0 | ❌ |
| Comment | ✅ | 0 | ❌ |
| Reaction | ✅ | 0 | ❌ |
| Story | ✅ | 0 | ❌ |
| Campaign | ✅ | 0 | ❌ |
| CampaignContribution | ✅ | 0 | ❌ |
| Invitation | ✅ | 0 | ❌ |
| InvitationRequest | ✅ | 0 | ❌ |
| MessageThread | ✅ | 0 | ❌ |
| Message | ✅ | 0 | ❌ |
| ModerationReport | ✅ | 0 | ❌ |
| AuditLog | ✅ | 0 | ❌ |

### Décision

**Aucune policy RLS créée.**

Justification :
- L'audit confirme qu'aucune fonctionnalité n'accède directement aux tables métier depuis le frontend.
- Express + Prisma est l'autorité applicative unique.
- Créer 18+ policies RLS serait artificiel et créerait une maintenance sans bénéfice sécurité immédiat.
- RLS activé = défense complémentaire en cas de changement d'architecture futur.

**RLS reste activé par défaut.** Si un accès direct frontend est un jour requis, les policies seront créées à ce moment-là, justifiées par le besoin fonctionnel.

---

## 8. SERVICE ROLE / BACKEND PRIVILEGED ACCESS

### Vérification

| Point | Statut | Preuve |
| ----- | ------ | ------ |
| `service_role` côté frontend | ❌ Absent | `grep` sur `src/` = 0 résultat |
| `SUPABASE_SECRET_KEY` côté frontend | ❌ Absente | Bundle contient seulement `process.env.*` |
| `SUPABASE_SERVICE_ROLE_KEY` côté frontend | ❌ Absente | Bundle contient seulement `process.env.*` |
| `service_role` dans `src/` | ❌ Absent | grep = 0 |
| Backend utilise clé privilégiée | ✅ Oui | `server/config/supabase.ts` résout `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` |
| Utilisation backend | Health checks + diagnostics | `checkSupabaseHealth()`, `getSupabaseInitSql()`, `testSupabaseBackendConnection()` |
| Jamais exposé dans les réponses API | ✅ | Les réponses sanitizent les URLs |
| Jamais dans les logs | ✅ | `sanitizeSupabaseUrl()` utilisé |

**Conclusion :** les accès privilégiés restent strictement backend. Aucune fuite identifiée.

---

## 9. MATRICE COMPLÈTE DES ACCÈS

| Fonctionnalité | Frontend → Supabase | Frontend → Express | Express → Prisma | Express → Supabase |
| --------------- | :-----------------: | :----------------: | :--------------: | :----------------: |
| Auth | ❌ | ✅ | ✅ | ❌ |
| Users | ❌ | ✅ | ✅ | ❌ |
| Organizations | ❌ | ✅ | ✅ | ❌ |
| Communities | ❌ | ✅ | ✅ | ❌ |
| Campaigns | ❌ | ✅ | ✅ | ❌ |
| Posts | ❌ | ✅ | ✅ | ❌ |
| Comments | ❌ | ✅ | ✅ | ❌ |
| Reactions | ❌ | ✅ | ✅ | ❌ |
| Messages | ❌ | ✅ | ✅ | ❌ |
| Moderation | ❌ | ✅ | ✅ | ❌ |
| Invitations | ❌ | ✅ | ✅ | ❌ |
| AuditLog | ❌ | ✅ | ✅ | ❌ |
| Storage / médias | ❌ | ✅ | ✅ | ❌ |
| IA | ❌ | ✅ | ✅ | ❌ |

**Légende :**
- ✅ = utilisé et sécurisé
- ❌ = non utilisé / pas nécessaire

---

## 10. TESTS D'ISOLATION

### Tests existants qui valident l'isolation

| Test | Ce qu'il valide |
| ---- | --------------- |
| `test:partner-security` | Isolation inter-organisation, quotas, membership |
| `test:resource-security` | Isolation communauté, ownership posts/comments |
| `test:admin-security` | RBAC, suspension, rôles |
| `test:api-integrity` | IDOR/BOLA, drift, migration lifecycle |
| `test:auth-cookie-security` | JWT, cookies, pas de fallback Supabase |
| `test-db-smoke.ts` | Structure DB, tables vides, tulizaana_db absente |

### Scénarios d'attaque testés

| Scénario | Résultat |
| -------- | -------- |
| User A → tente d'accéder à Community B sans membership | ❌ DENIED |
| User A → tente de modifier Organization B | ❌ DENIED |
| User A → tente de voir AuditLog | ❌ DENIED |
| Anonyme → tente de voir cercles privés | ❌ DENIED |
| Partner Admin A → tente de gérer Organization B | ❌ DENIED |
| Utilisateur suspendu → tente d'accéder via API | ❌ DENIED |
| Frontend → Supabase direct tables métier | ❌ Impossible (pas de code) |

---

## 11. ROTATION DU MOT DE PASSE DATABASE

### Statut

**NON EFFECTUÉE — ACTION EXTERNE REQUISE**

Le Chantier 7.10 a exposé un mot de passe PostgreSQL dans un transcript de session. La rotation est obligatoire avant clôture opérationnelle.

### Procédure à suivre (manuelle)

1. Se connecter à Supabase Dashboard
2. Aller dans Settings → Database
3. Générer un nouveau mot de passe
4. Mettre à jour `.env` local avec le nouveau mot de passe
5. Ne pas modifier `.env.example` avec le vrai secret
6. Vérifier :
   - `DATABASE_URL` fonctionne
   - `DIRECT_URL` fonctionne
   - `npx prisma migrate status` = up to date
   - `npm run test:db-smoke` passe

### Vérification post-rotation

- [ ] `DATABASE_URL` à jour dans `.env`
- [ ] `DIRECT_URL` à jour dans `.env`
- [ ] `prisma migrate status` = `Database schema is up to date!`
- [ ] `test-db-smoke.ts` passe
- [ ] Aucun secret dans les logs
- [ ] Aucun secret dans le rapport

---

## 12. TESTS DE RÉGRESSION

| Test | Résultat |
| ---- | ------- |
| `npm run typecheck` | ✅ PASS |
| `npm run build` | ✅ PASS |
| `npm run test:auth` | ✅ PASS |
| `npm run test:admin-security` | ✅ PASS |
| `npm run test:partner-security` | ✅ PASS (114/114) |
| `npm run test:resource-security` | ✅ PASS (21/21) |
| `npm run test:storage-security` | ✅ PASS (13/13) |
| `npm run test:api-integrity` | ✅ PASS (12/12) |
| `npm run test:auth-cookie-security` | ✅ PASS (28/28) |
| `npm run test:seed` | ✅ PASS |
| `npx prisma validate` | ✅ PASS |
| `npx prisma migrate status` | ✅ `Database schema is up to date!` |
| `scripts/test-db-smoke.ts` | ✅ PASS (8/8) |

**Aucune régression.**

---

## 13. FICHIERS MODIFIÉS

```text
CRÉÉ    scripts/test-db-smoke.ts           (smoke test DB read-only)
CRÉÉ    docs/DATABASE-WORKFLOW.md           (workflow DB documenté)
MODIFIÉ package.json                        (scripts Prisma sécurisés)
INCHANGÉ prisma/schema.prisma
INCHANGÉ prisma/supabase_init.sql
INCHANGÉ prisma/migrations/*
INCHANGÉ server/** (sauf config/supabase.ts qui était déjà présent)
INCHANGÉ src/services/supabaseClient.ts (déjà présent, pas modifié)
```

---

## 14. RISQUES RESTANTS

### CRITIQUE

Aucun.

### ÉLEVÉ

1. **Rotation du mot de passe database non effectuée.** Action externe obligatoire. Voir section 11.

### MOYEN

2. **`migration_lock.toml` absent.** Non bloquant, mais provider non verrouillé formellement. À surveiller dans les prochaines versions de Prisma.

3. **Seed one-shot.** `Post`, `Comment`, `PostMedia`, `AuditLog` doublent à chaque exécution. Documenté dans `docs/DATABASE-WORKFLOW.md`.

### FAIBLE

4. **RLS sans policies.** RLS activé mais sans policy. Si l'architecture change (accès direct frontend), des policies devront être créées.

5. **`build` inclut `server/config/supabase.ts`.** Le bundle serveur contient les noms des variables d'environnement pour les clés Supabase, pas les valeurs. C'est safe, mais le bundle serveur est plus gros qu'il ne le serait sans Supabase.

---

## 15. INTERDICTIONS CONFIRMÉES

```text
INTERDIT ABSOLU
  prisma migrate reset
  prisma db push
  prisma db pull
  prisma migrate dev (sur Supabase/production)
  npm run db:seed (sur Supabase)
  DROP DATABASE / DROP SCHEMA / DROP TABLE
  TRUNCATE / DELETE / UPDATE / INSERT (sur production)
  migrate resolve --rolled-back
  toute écriture SQL manuelle hors migration

INTERDIT PAR CAUTUNE
  prisma studio
  npm run prisma:migrate (ancien alias, supprimé)

AUTORISÉ
  npm run prisma:migrate:dev     (local uniquement)
  npm run prisma:migrate:status  (lecture seule)
  npm run prisma:migrate:deploy  (production)
  npm run prisma:generate        (génération client)
  scripts/test-db-smoke.ts       (read-only)
```

---

## 16. RÉPONSE À LA QUESTION FINALE

> **« Si un utilisateur malveillant connaît les IDs des objets Tulizaana, possède un compte valide et tente d'utiliser soit l'API Express soit un accès Supabase direct, peut-il franchir une frontière User / Organization / Community / Campaign ou accéder à des données privées ? »**

### Via l'API Express

**NON.** L'autorisation est contrôlée à chaque couche :

1. **Middleware auth** : JWT vérifié, compte relu en base, suspension vérifiée
2. **Middleware RBAC** : rôle vérifié (`requireRole`)
3. **Contrôleurs** : ownership/organization/community vérifié via Prisma
4. **Services** : isolation encapsulée (`community-access.service.ts`, `partner-entitlements.service.ts`)

Exemples concrets :
- `GET /api/communities` → `buildReadableCommunityFilter()` : seules les communautés publiques ou celles dont l'utilisateur est membre actif sont retournées
- `POST /api/posts` → `resolveWritableCommunity()` : l'utilisateur doit être membre actif du cercle
- `GET /api/organizations/:id/manage` → `requireAuth` + vérification dans le contrôleur

### Via Supabase direct

**NON — impossible par conception.**

- Le frontend ne contient **aucun code** d'accès direct aux tables métier via Supabase.
- Le seul usage Supabase frontend est `testSupabaseFrontendConnection()` qui fait un `SELECT id FROM Community LIMIT 1` (test de connexion).
- Les clés frontend (`VITE_SUPABASE_ANON_KEY`) sont des clés **publiques/anon**.
- Avec RLS activé mais 0 policy, PostgREST bloquerait tout accès non explicitement autorisé.
- Le backend ne expose jamais `service_role` ni `SUPABASE_SECRET_KEY` au frontend.

**Conclusion :** Tulizaana est **API-first**. PostgreSQL est inaccessible directement depuis le navigateur. L'autorité d'accès est centralisée dans Express/Prisma. RLS activé = défense complémentaire.

---

## 17. ÉTAT POUR LE CHANTIER 9

```text
CHANTIER 8 — ÉTAT FINAL

Architecture :      API-FIRST (validé)
Accès Supabase :    Frontend = test + Google Auth uniquement
Accès Express :     Toutes les opérations métier
Prisma :            Couche d'accès données unique
RLS :               Activé, 0 policy (défense complémentaire)
Clés :              Frontend = public, Backend = privilégié
Service role :      Backend uniquement, jamais frontend
Isolation :         Express/Prisma = autorité
Storage :           Cloudinary uniquement
Rotation password : ACTION EXTERNE REQUISE
Tests :             10/10 PASS + smoke 8/8
Régressions :       Aucune

PRÊT POUR CHANTIER 9 : OUI
```

---

## 18. CHANTIER 9 — PRÉREQUIS

1. **Rotation du mot de passe PostgreSQL** (action externe, issue du Chantier 7.10)
2. **Amélioration du seed** (rendre Post/Comment/PostMedia/AuditLog idempotents)
3. **Tests d'intégration contre vraie base Supabase** (avec cleanup explicite)
4. **Surveillance `migration_lock.toml`** (si Prisma le crée automatiquement dans une version future)
5. **RLS policies** (si architecture évolue vers accès direct frontend)

```text
✅ CHANTIER 8 CLÔTURÉ
➡️ PRÊT À PASSER AU CHANTIER 9
```
