# CHANTIER 8.2 — SPÉCIFICATION FONCTIONNELLE & ALIGNEMENT ARCHITECTURAL

**Date :** 2026-10-07
**Nature :** Audit, spécification et alignement architectural — Aucune modification de production
**Verdict :**

```text
CHANTIER 8.2 — VALIDÉ
```

---

## 1. ARCHITECTURE CIBLE CONFIRMÉE

```text
Frontend React/Vite
        ↓
Express API
        ↓
Prisma
        ↓
PostgreSQL Supabase
```

**Règle d'or :** le frontend ne lit jamais directement les tables métier via PostgREST. Toute opération métier passe par Express/Prisma.

---

## 2. ÉTAT ACTUEL DU MODÈLE DE DONNÉES

### 2.1 Modèles existants

| Modèle | Rôle | Champs clés |
| ------ | ---- | ----------- |
| `User` | Membre, staff, partenaire | email, passwordHash, name, pseudonym, avatar, bio, role, memberStatus, isAnonymous, isSuspended, points, completedCampaigns |
| `Organization` | ONG, hôpital, association | name, acronym, domain, mission, description, logo, coverImage, type, country, city, address, responsibleName, contactEmail, contactPhone, status, subscriptionPlan, quotaCommunitiesMax, quotaMembersMax, quotaCampaignsMax, validatedAt, subscriptionStartedAt, subscriptionExpiresAt, paymentStatus |
| `OrganizationAdmin` | Lien User ↔ Organization | organizationId, userId, role (owner/admin/coordinator) |
| `Community` | Cercle de soutien fermé | name, slug, description, mission, rules, icon, coverImage, isPrivate, category, organizationId, status |
| `CommunityMember` | Adhésion explicite | communityId, userId, role, status, joinedAt |
| `Post` | Publication du fil | communityId, authorId, authorName, authorAvatar, type, title, isAnonymous, content, mediaUrl, mediaType, tags, reactions*, isPinned, createdAt |
| `PostMedia` | Média de publication | postId, type, url, secureUrl, publicId, resourceType, thumbnailUrl, aspectRatio, position |
| `Comment` | Commentaire de bienveillance | postId, authorId, authorName, authorAvatar, content, isAnonymous |
| `Reaction` | Réaction émotionnelle | postId, userId, type, createdAt |
| `Story` | Récit/résilience | communityId, authorId, authorName, authorAvatar, caption, mediaUrl, mediaType, audioDuration, isVoiceNote, isFeatured, expiresAt |
| `Campaign` | Défi collectif | organizationId, communityId, title, description, category, durationDays, startDate, endDate, status, targetActivitiesCount, completedActivitiesCount, rewardBadge, activities (JSON) |
| `CampaignContribution` | Participation campagne | campaignId, userId, authorName, authorAvatar, message, activityTitle, isAnonymous |
| `Invitation` | Code d'invitation | code, organizationId, communityId, maxUses, currentUses, status, expiresAt, createdBy |
| `InvitationRequest` | Demande d'adhésion | organizationId, communityId, candidateName, candidateAvatar, contactEmail, contactPhone, situation, motivation, isFirstRequestOnTulizaana, existingCommunitiesJoined, status, assignedCode, dispatchedVia, dispatchedAt |
| `MessageThread` | Fil de messagerie privée | canonicalParticipantKey, participantOneId, participantTwoId, lastMessage, lastMessageAt |
| `Message` | Message instantané | threadId, senderId, receiverId, content, type, mediaUrl, audioDuration, fileName, fileSize, isRead |
| `ModerationReport` | Signalement | communityId, targetType, targetId, reason, details, status, severity, reportedById, actionTakenBy, actionNotes, resolvedAt |
| `AuditLog` | Registre d'audit | userId, userName, userRole, action, resource, resourceId, details, ipAddress, status |

### 2.2 Relations confirmées

```
Organization
  ├── OrganizationAdmin (Cascade)
  ├── Community (Restrict)
  ├── Campaign (Restrict)
  ├── Invitation (Restrict)
  └── InvitationRequest (Restrict)

Community
  ├── CommunityMember (Cascade)
  ├── Post (Restrict)
  ├── Story (Restrict)
  ├── Campaign (Restrict)
  ├── Invitation (Restrict)
  ├── InvitationRequest (Restrict)
  └── ModerationReport (SetNull)

Campaign
  └── CampaignContribution (Cascade)

Post
  ├── PostMedia (Cascade)
  ├── Comment (Cascade)
  ├── Reaction (Cascade)
  └── author → User (SetNull)

MessageThread
  └── Message (Cascade)
```

---

## 3. AUDIT DES FONCTIONNALITÉS EXISTANTES

### 3.1 Tableau d'état

| Fonctionnalité | Existe | Partielle | Absente | Problèmes |
| -------------- | :----: | :-------: | :-----: | --------- |
| Profil public Organisation | ✅ | | | Route `GET /api/organizations/:id` existe, DTO public déjà construit |
| Profil public Communauté | ✅ | | | Route `GET /api/communities/:id` existe |
| Profil public Campagne | ✅ | | | Route `GET /api/campaigns/:id` existe |
| Recherche globale | ❌ | ✅ | | Recherche locale uniquement (React state) dans les vues existantes |
| Abonnements/Demo | ✅ | | | `subscriptionStartedAt`, `subscriptionExpiresAt`, `paymentStatus` présents |
| Quotas | ✅ | | | `quotaCommunitiesMax`, `quotaMembersMax`, `quotaCampaignsMax` présents |
| Codes d'invitation | ✅ | | | Modèle `Invitation` complet |
| Liens d'invitation | ❌ | ✅ | | Pas de token/link dans `Invitation` |
| Rapports | ❌ | ✅ | | `PartnerReports.tsx` = squelette UI, aucun endpoint backend |
| PDF | ❌ | ✅ | | `handleExportPDF` = setTimeout simulé |
| Insights IA | ❌ | ✅ | | Aucun service Gemini pour analytics |
| Navigation mobile | ✅ | | | `MobileBottomNav` existe mais sans Recherche/Profil |
| Profil utilisateur | ✅ | | | `ProfileView` existe |

### 3.2 Détails par bloc

#### A. Profils publics

**Organisation :**
- Endpoint : `GET /api/organizations/:id`
- Exige : organisation `approved`
- Retourne : DTO public (`PUBLIC_ORGANIZATION_SELECT`) + compteurs communautés/campagnes actives
- Données exclues : `contactEmail`, `contactPhone`, `address`, `responsibleName`, `subscriptionPlan`, `paymentStatus`, quotas
- Slug : absent. L'identifiant public est `id` (CUID)

**Communauté :**
- Endpoint : `GET /api/communities/:id`
- Exige : communauté `active` + soit publique, soit membre actif
- Retourne : DTO public avec `organizationName`
- Données exclues : `rules`, `mission` (selon DTO)

**Campagne :**
- Endpoint : `GET /api/campaigns/:id`
- Exige : communauté lisible + statut `active` ou `completed` (ou staff)
- Retourne : DTO public avec `community` et `organization` réduites
- Données exclues : champs sensibles de l'organisation

#### B. Abonnements / Demo / Quotas

**Service :** `server/services/partner-entitlements.service.ts`

**Règles confirmées :**
- L'organisation est dérivée de `JWT → User → OrganizationAdmin → Organization`
- `req.body.organizationId` n'est jamais lu
- Conditions cumulatives pour actions partenaire :
  1. `status === "approved"`
  2. `subscriptionStartedAt` non nul
  3. `paymentStatus === "validated"`
  4. `subscriptionExpiresAt` null ou dans le futur
  5. Quota disponible

**Quotas :**
- `quotaCommunitiesMax` : nombre max de communautés
- `quotaMembersMax` : nombre max de membres
- `quotaCampaignsMax` : nombre max de campagnes par mois civil
- Fenêtre mensuelle civile : `startOfCurrentCivilMonth()`
- Race condition : documentée, non résolue (P2034 retry dans `createCampaign`)

**Demo 30 jours :**
- Pas de modèle `Subscription` ou `Demo` distinct
- Les champs `subscriptionStartedAt`, `subscriptionExpiresAt`, `paymentStatus` servent de proxy
- Pas de flag `isDemo` ou `demoUsed`
- Aucune logique métier pour "1 démo par organisation, 30 jours"

#### C. Codes d'invitation

**Modèle :** `Invitation`
- `code` : String unique
- `organizationId`, `communityId`
- `maxUses`, `currentUses`, `status`, `expiresAt`, `createdBy`

**Endpoints :**
- `POST /api/invitations/verify` : vérifie un code
- `POST /api/invitations/request` : demande d'adhésion sans code

**Gaps identifiés :**
- Pas de génération de codes côté backend (créés par seed ou manuellement)
- Pas de révocation explicite
- Pas de lien URL signé
- `createdBy` stocké mais pas de vérification que l'appelant est bien admin de l'organisation

#### D. Liens d'invitation

**Absents.** Aucun modèle `InvitationLink` ou token. Aucune route pour générer un lien partageable.

#### E. Rapports & Analytics

**Frontend :** `PartnerReports.tsx` = squelette UI avec boutons Imprimer/Exporter PDF simulés
**Backend :** Aucun endpoint de rapport
**Modèle :** Aucun modèle `Report`

**Gap confirmé :** fonctionnalité non implémentée côté backend.

#### F. Recherche globale

**Existant :**
- Recherche locale React dans `CommunitiesView`, `CommunityProfileView`, `MessagingView`, `PartnerMembers`, `AdminCampaignsTab`, `AdminModerationTab`
- Aucun endpoint `GET /api/search`
- Recherche PostgreSQL absente

**Gap confirmé :** pas de recherche serveur multi-entités.

#### G. Navigation mobile

**Composant :** `MobileBottomNav`
- 5 onglets : Accueil, Communautés, Publier, Campagnes, Chats
- **Absent :** Recherche, Profil utilisateur

**Gap confirmé :** pas d'accès direct à la recherche ni au profil depuis la navigation mobile.

---

## 4. AUDIT DES RÔLES ET PERMISSIONS

### 4.1 Rôles confirmés

| Rôle | Source | Vérification |
| ---- | ------ | ------------ |
| `member` | Base | JWT + relecture DB |
| `peer_helper` | Base | JWT + relecture DB |
| `professional` | Base | JWT + relecture DB |
| `partner_admin` | Base | JWT + relecture DB |
| `superadmin` | Base | JWT + relecture DB |
| `moderator` | Base | JWT + relecture DB |
| `admin` | Base | JWT + relecture DB |

### 4.2 Matrice de permissions

| Action | Member | Partner | Partner Admin | Moderator | Superadmin |
| ------ | :----: | :-----: | :-----------: | :-------: | :--------: |
| Lire son profil | ✅ | ✅ | ✅ | ✅ | ✅ |
| Modifier son profil | ✅ | ✅ | ✅ | ✅ | ✅ |
| Voir organisations (publiques) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Voir communauté publique | ✅ | ✅ | ✅ | ✅ | ✅ |
| Voir communauté privée (membre) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Créer communauté | ❌ | ✅ (si quota) | ✅ (si quota) | ❌ | ✅ |
| Créer campagne | ❌ | ✅ (si quota) | ✅ (si quota) | ❌ | ✅ |
| Contribuer campagne | ❌ | ✅ | ✅ | ❌ | ✅ |
| Voir rapports | ❌ | ❌ | ✅ | ❌ | ✅ |
| Télécharger rapport | ❌ | ❌ | ✅ | ❌ | ✅ |
| Gérer invitations | ❌ | ❌ | ✅ | ❌ | ✅ |
| Voir logs audit | ❌ | ❌ | ❌ | ❌ | ✅ |
| Gérer utilisateurs | ❌ | ❌ | ❌ | ❌ | ✅ |
| Modérer contenu | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gérer organisations | ❌ | ❌ | ❌ | ❌ | ✅ |
| Gérer plans/quotas | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 5. MATRICE DE VISIBILITÉ

| Donnée | Public | Membre | Admin Org | Superadmin |
| ------ | :----: | :----: | :-------: | :--------: |
| Nom organisation | ✅ | ✅ | ✅ | ✅ |
| Logo organisation | ✅ | ✅ | ✅ | ✅ |
| Description organisation | ✅ | ✅ | ✅ | ✅ |
| Mission organisation | ✅ | ✅ | ✅ | ✅ |
| Communautés actives | ✅ | ✅ | ✅ | ✅ |
| Campagnes actives | ✅ | ✅ | ✅ | ✅ |
| Membres communauté | ❌ | ✅ (si membre) | ✅ | ✅ |
| Messages privés | ❌ | ❌ | ❌ | ❌ |
| Données de santé | ❌ | ❌ | ❌ | ❌ |
| Insights/rapports | ❌ | ❌ | ✅ | ✅ |
| Audit logs | ❌ | ❌ | ❌ | ✅ |
| Quotas internes | ❌ | ❌ | ✅ | ✅ |
| Payment status | ❌ | ❌ | ✅ | ✅ |
| Subscription plan | ❌ | ❌ | ✅ | ✅ |

---

## 6. AUDIT FRONTEND

### 6.1 Pages/écrans existants

| Écran | Type | Réutilisable | À modifier | À créer |
| ----- | ---- | :----------: | :--------: | :----: |
| Feed | Membre | ✅ | | |
| Communautés | Membre | ✅ | ✅ (recherche serveur) | |
| Campagnes | Membre | ✅ | ✅ (recherche serveur) | |
| Messages | Membre | ✅ | | |
| Profil | Membre | ✅ | ✅ (nav mobile) | |
| Création post | Membre | ✅ | | |
| Détail post | Membre | ✅ | | |
| Profil organisation | Partenaire | ✅ | | |
| Gestion communauté | Partenaire | ✅ | | |
| Gestion campagne | Partenaire | ✅ | | |
| Abonnement | Partenaire | ✅ | | |
| Rapports | Partenaire | ✅ | ✅ (backend manquant) | |
| Modération | Staff | ✅ | | |
| Admin back-office | Superadmin | ✅ | | |
| Onboarding | Anonyme | ✅ | | |

### 6.2 Navigation desktop

- Navbar : Logo, Communautés, Campagnes, Profil, Notifications, Langue
- **Gap :** pas de bouton Recherche globale dans la navbar

### 6.3 Navigation mobile

- Bottom nav : Accueil, Communautés, Publier, Campagnes, Chats
- **Gaps :**
  - Pas de Recherche
  - Pas de Profil utilisateur

---

## 7. AUDIT BACKEND

### 7.1 Endpoints existants

| Méthode | Path | Auth | Rôle | Ressource | Ownership |
| ------- | ---- | :--: | :--: | --------- | --------- |
| GET | `/api/organizations` | optionnelle | — | Organization | Public (approved) |
| GET | `/api/organizations/:id` | optionnelle | — | Organization | Public (approved) |
| GET | `/api/organizations/:id/manage` | ✅ | Partner Admin | Organization | Admin de l'org |
| GET | `/api/organizations/mine` | ✅ | Partner Admin | Organization | Admin de l'org |
| PUT | `/api/organizations/:id/subscription-request` | ✅ | Partner Admin | Organization | Admin de l'org |
| POST | `/api/admin/organizations/:id/approve` | ✅ | Superadmin | Organization | — |
| POST | `/api/admin/organizations/:id/reject` | ✅ | Superadmin | Organization | — |
| POST | `/api/admin/organizations/:id/suspend` | ✅ | Superadmin | Organization | — |
| POST | `/api/admin/organizations/:id/reactivate` | ✅ | Superadmin | Organization | — |
| GET | `/api/communities` | optionnelle | — | Community | Public/membre |
| GET | `/api/communities/:id` | optionnelle | — | Community | Public/membre |
| POST | `/api/communities` | ✅ | Partner | Community | Admin org |
| POST | `/api/communities/:id/join` | ✅ | Member | CommunityMember | — |
| GET | `/api/campaigns` | optionnelle | — | Campaign | Public/membre |
| GET | `/api/campaigns/:id` | optionnelle | — | Campaign | Public/membre |
| POST | `/api/campaigns` | ✅ | Partner | Campaign | Admin org |
| POST | `/api/campaigns/:id/contribute` | ✅ | Member | CampaignContribution | Membre |
| GET | `/api/posts` | optionnelle | — | Post | Public/membre |
| POST | `/api/posts` | ✅ | Member | Post | Membre |
| POST | `/api/posts/:id/react` | ✅ | Member | Reaction | Membre |
| GET | `/api/posts/:id/comments` | optionnelle | — | Comment | Public/membre |
| POST | `/api/posts/:id/comments` | ✅ | Member | Comment | Membre |
| GET | `/api/messages/threads` | ✅ | Member | MessageThread | Participant |
| GET | `/api/messages/threads/:id` | ✅ | Member | Message | Participant |
| POST | `/api/messages/threads` | ✅ | Member | MessageThread | Participant |
| POST | `/api/upload/media` | ✅ | Member | Media | Membre |
| GET | `/api/moderation/reports` | ✅ | Moderator | ModerationReport | Staff |
| PUT | `/api/moderation/reports/:id` | ✅ | Moderator | ModerationReport | Staff |
| GET | `/api/invitations/verify` | optionnelle | — | Invitation | Public |
| POST | `/api/invitations/request` | optionnelle | — | InvitationRequest | Candidat |
| GET | `/api/invitations` | ✅ | Partner Admin | Invitation | Admin org |
| POST | `/api/invitations` | ✅ | Partner Admin | Invitation | Admin org |
| PUT | `/api/invitations/:id/revoke` | ✅ | Partner Admin | Invitation | Admin org |
| GET | `/api/admin/users` | ✅ | Superadmin | User | — |
| PUT | `/api/admin/users/:id` | ✅ | Superadmin | User | — |
| GET | `/api/admin/logs` | ✅ | Superadmin | AuditLog | — |
| GET | `/api/health` | optionnelle | — | — | — |
| GET | `/api/schema/supabase-sql` | ✅ | Admin | — | — |
| GET | `/api/schema/test-supabase` | optionnelle | — | — | — |

### 7.2 Gaps identifiés

| Endpoint manquant | Priorité | Justification |
| ----------------- | -------- | ------------- |
| `GET /api/search?q=` | Élevée | Recherche globale multi-entités absente |
| `GET /api/public/organizations/:slug` | Moyenne | Profil public par slug (actuellement par id) |
| `GET /api/public/communities/:slug` | Moyenne | Profil public par slug (actuellement par id) |
| `GET /api/reports/communities/:id` | Élevée | Rapports d'analytics absents |
| `POST /api/invitations/links` | Moyenne | Liens d'invitation absents |
| `GET /api/invitations/links/:token` | Moyenne | Validation lien absente |
| `POST /api/admin/plans` | Basse | Gestion des plans payants absente |
| `POST /api/admin/subscriptions/:id/validate` | Basse | Validation paiement absente |

---

## 8. AUDIT DES SERVICES

### 8.1 Services existants

| Service | Rôle | État |
| ------- | ---- | :--: |
| `partner-entitlements.service.ts` | Quotas, abonnements, RBAC partenaire | ✅ |
| `community-access.service.ts` | Isolation communautaire (lecture/écriture) | ✅ |
| `googleAuth.service.ts` | Authentification Google | ✅ |
| `organization-dto.ts` | DTO public/partenaire | ✅ |
| `supabase.ts` | Health checks backend | ✅ |
| `database.ts` | Connexion Prisma | ✅ |

### 8.2 Services manquants

| Service | Rôle |
| ------- | ---- |
| `search.service.ts` | Recherche globale multi-entités |
| `report.service.ts` | Génération de rapports anonymisés |
| `pdf.service.ts` | Génération PDF professionnelle |
| `insight.service.ts` | Analyse statistique + Gemini |
| `subscription.service.ts` | Gestion abonnements/demo |
| `invitation-link.service.ts` | Liens d'invitation signés |
| `quota.service.ts` | Calcul et vérification quotas (avec race condition fix) |

---

## 9. SPÉCIFICATION DES FONCTIONNALITÉS CIBLES

### 9.1 A. Profils publics

**Principe :** tout utilisateur non authentifié peut consulter le profil public d'une organisation ou d'une communauté approuvée/active.

**Données exposées (Organisation) :**
- name, acronym, logo, coverImage
- description, mission
- domain, type, country, city
- nombre de communautés actives
- nombre de campagnes actives
- liste des communautés publiques

**Données exclues (Organisation) :**
- contactEmail, contactPhone, address
- responsibleName
- subscriptionPlan, paymentStatus
- quotas
- status interne (pending, suspended)

**Données exposées (Communauté) :**
- name, slug, description, mission, icon, coverImage
- category
- organization (name, logo)
- nombre de membres
- campagnes actives

**Données exclues (Communauté) :**
- rules (interne)
- statut détaillé
- liste des membres

**Routes cibles :**
- `GET /api/public/organizations/:slug`
- `GET /api/public/organizations/:slug/communities`
- `GET /api/public/communities/:slug`

**Migration nécessaire :** ajout de `slug` sur `Organization` + index unique + DTO public.

### 9.2 B. Abonnements / Demo / Quotas

**Demo 30 jours :**
- 1 seule fois par organisation
- Pendant la démo : 1 communauté, 1 campagne, 20 membres max, 1 rapport de fin de démo
- Date de début : `subscriptionStartedAt`
- Date de fin : `subscriptionExpiresAt` = `subscriptionStartedAt + 30 jours`
- Flag `isDemo` à ajouter sur `Organization`
- Flag `demoUsed` à ajouter sur `Organization`

**Plans payants :**
- 3 plans configurables : BASIC, INTERMEDIATE, ADVANCED
- Stockage : table `Plan` ou configuration JSON dans `Organization`
- Champs plan : `name`, `price`, `currency`, `period`, `communitiesMax`, `membersMax`, `campaignsPerMonth`, `reportLevel`, `active`
- Application des limites : côté backend, dans `partner-entitlements.service.ts`

**Quotas :**
- Calculés à partir de `Organization.quota*`
- Réinitialisation mensuelle civile
- Race condition : utiliser `SELECT ... FOR UPDATE` ou transaction sérialisable

**Migrations nécessaires :**
- Ajout `isDemo`, `demoUsed`, `demoStartedAt`, `demoExpiresAt` sur `Organization`
- Création table `Plan` (ou alternative)
- Ajout `planId` sur `Organization`

### 9.3 C. Codes d'invitation

**Améliorations :**
- Génération côté backend : `crypto.randomBytes(16).toString('base64url')`
- Vérification que `createdBy` est admin de l'organisation
- Révocation explicite
- Pas de lien URL (codes seulement)

**Routes cibles :**
- `POST /api/invitations` (amélioré)
- `PUT /api/invitations/:id/revoke` (amélioré)
- `GET /api/invitations/community/:communityId` (liste)

### 9.4 D. Liens d'invitation

**Nouveau modèle :** `InvitationLink`

```prisma
model InvitationLink {
  id           String   @id @default(cuid())
  token        String   @unique
  type         String   // community, campaign
  targetId     String   // communityId ou campaignId
  organizationId String
  expiresAt    DateTime
  maxUses      Int      @default(1)
  currentUses  Int      @default(0)
  createdBy    String
  createdAt    DateTime @default(now())

  @@index([token])
  @@index([organizationId])
  @@index([expiresAt])
}
```

**Routes cibles :**
- `POST /api/invitations/links` (création)
- `GET /api/invitations/links/:token` (validation)
- `POST /api/invitations/links/:token/accept` (acceptation)

### 9.5 E. Rapports & Analytics

**Niveaux de rapport :**
- BASIC : statistiques essentielles, participation, tendances principales
- INTERMEDIATE : analyse détaillée, segmentation, comparaison temporelle
- ADVANCED : corrélations prudentes, détection de tendances, synthèse exécutive

**Anonymisation :**
- Aucun identifiant personnel dans les rapports
- Seuils minimaux de participants avant publication de statistiques
- Pas de croisement permettant une ré-identification

**Sources de données :**
- Posts, comments, reactions (engagement)
- Campaign contributions (participation)
- Community members (croissance)
- Stories (visibilité)

**Structure cible :**
```
Report
  ├── organizationId
  ├── communityId
  ├── period (JSON : startDate, endDate)
  ├── level (basic/intermediate/advanced)
  ├── data (JSON anonymisé)
  ├── insights (JSON)
  ├── recommendations (JSON)
  ├── generatedAt
  └── generatedBy (userId)
```

**Routes cibles :**
- `GET /api/reports/communities/:communityId`
- `POST /api/reports/communities/:communityId/generate`
- `GET /api/reports/:id`
- `GET /api/reports/:id/download` (PDF)

### 9.6 F. Recherche globale

**Architecture :** Option A — Recherche multi-entités côté API

**Endpoint :**
```
GET /api/search?q=...&types=organizations,communities,campaigns,posts,users
```

**Sécurité :**
- Mêmes règles d'autorisation que les endpoints normaux
- Pas de recherche sur messages privés
- Pas de recherche sur données médicales
- Pagination : 20 résultats par type
- Minimum 2 caractères
- Debounce : 300ms côté frontend

**Index PostgreSQL nécessaires :**
- `Organization(name text_pattern_ops)`
- `Community(name text_pattern_ops)`
- `Campaign(title text_pattern_ops)`
- `Post(content text_pattern_ops)`
- `User(name text_pattern_ops)`

**Types recherchables :**
- Organizations : nom, description, acronym
- Communities : nom, description, mission
- Campaigns : titre, description, catégorie
- Posts : contenu, titre, tags
- Users : nom, pseudonym (selon visibilité)

---

## 10. NAVIGATION CIBLE

### 10.1 Desktop

```
[Logo] Accueil | Communautés | Campagnes | [🔍 Rechercher] | [🔔 Notifications] | [Profil]
```

- Recherche accessible depuis la navbar
- Profil accessible depuis la navbar

### 10.2 Mobile

```
[Accueil] [Recherche] [Communautés] [Campagnes] [Profil]
```

- Remplacement de `Chats` par `Recherche` dans la bottom nav
- Ajout de `Profil` dans la bottom nav
- `Chats` accessible depuis le profil ou un badge notifications

---

## 11. MATRICE DE PERMISSIONS DÉTAILLÉE

| Ressource | Action | Member | Partner | Partner Admin | Moderator | Superadmin |
| --------- | ------ | :----: | :-----: | :-----------: | :-------: | :--------: |
| Organization | lire (publique) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Organization | voir détails privés | ❌ | ❌ | ✅ | ❌ | ✅ |
| Organization | créer | ❌ | ❌ | ✅ | ❌ | ✅ |
| Organization | modifier | ❌ | ❌ | ✅ | ❌ | ✅ |
| Organization | gérer abonnement | ❌ | ❌ | ✅ | ❌ | ✅ |
| Community | lister publiques | ✅ | ✅ | ✅ | ✅ | ✅ |
| Community | voir privée (membre) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Community | créer | ❌ | ✅ (quota) | ✅ (quota) | ❌ | ✅ |
| Community | modifier | ❌ | ✅ (admin) | ✅ (admin) | ❌ | ✅ |
| Community | supprimer | ❌ | ✅ (admin) | ✅ (admin) | ❌ | ✅ |
| Campaign | lister | ✅ | ✅ | ✅ | ✅ | ✅ |
| Campaign | créer | ❌ | ✅ (quota) | ✅ (quota) | ❌ | ✅ |
| Campaign | contribuer | ❌ | ✅ | ✅ | ❌ | ✅ |
| Post | lister (communauté) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Post | créer | ❌ | ✅ (membre) | ✅ (membre) | ❌ | ✅ |
| Post | modifier/supprimer | ❌ | ✅ (auteur/admin) | ✅ (auteur/admin) | ❌ | ✅ |
| Comment | lister | ✅ | ✅ | ✅ | ✅ | ✅ |
| Comment | créer | ❌ | ✅ (membre) | ✅ (membre) | ❌ | ✅ |
| Message | envoyer | ❌ | ✅ | ✅ | ❌ | ✅ |
| Message | lire | ❌ | ✅ (participant) | ✅ (participant) | ❌ | ✅ |
| Invitation | créer | ❌ | ❌ | ✅ | ❌ | ✅ |
| Invitation | révoquer | ❌ | ❌ | ✅ | ❌ | ✅ |
| InvitationLink | créer | ❌ | ❌ | ✅ | ❌ | ✅ |
| InvitationLink | valider | ✅ | ✅ | ✅ | ✅ | ✅ |
| Report | générer | ❌ | ❌ | ✅ | ❌ | ✅ |
| Report | télécharger | ❌ | ❌ | ✅ | ❌ | ✅ |
| AuditLog | lire | ❌ | ❌ | ❌ | ❌ | ✅ |
| User | suspendre | ❌ | ❌ | ❌ | ❌ | ✅ |
| Plan | configurer | ❌ | ❌ | ❌ | ❌ | ✅ |
| Quota | configurer | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 12. ORDRE D'IMPLÉMENTATION RECOMMANDÉ

```text
8.3  Abonnements / Demo / Plans / Quotas
        ↓
8.4  Liens d'invitation
        ↓
8.5  Profils publics Organization & Community
        ↓
8.6  Recherche globale
        ↓
8.7  Rapports & Analytics (backend)
        ↓
8.8  PDF Reports
        ↓
8.9  Frontend Integration & UX
```

**Dépendances :**
- 8.5 dépend de 8.3 (slug, plans)
- 8.6 dépend de 8.5 (profils publics comme destination)
- 8.7 dépend de 8.3 (niveaux de rapport par plan)
- 8.8 dépend de 8.7
- 8.9 dépend de 8.4, 8.5, 8.6

---

## 13. QUESTIONS À TRANCHER

### Rapports
- [ ] Quel seuil minimal de participants avant de publier une statistique ?
- [ ] Quelles données peuvent être croisées sans risque de ré-identification ?
- [ ] Les rapports sont-ils stockés ou générés à la demande ?
- [ ] Quelle durée de conservation des rapports ?

### Abonnements
- [ ] Une organisation peut-elle changer de plan immédiatement ou à la fin de la période ?
- [ ] Que deviennent les communautés/campagnes après expiration ?
- [ ] Les données historiques restent-elles accessibles ?

### Invitations
- [ ] Les liens d'invitation peuvent-ils être révoqués individuellement ?
- [ ] Quel comportement si un lien pointe vers une campagne clôturée ?
- [ ] Les membres peuvent-ils partager des liens ou seulement les admins ?

### Profils publics
- [ ] Une organisation peut-elle masquer son profil public ?
- [ ] Une communauté privée apparaît-elle dans les résultats de recherche ?
- [ ] Les campagnes d'une communauté privée sont-elles publiques ?

### Recherche
- [ ] Les utilisateurs sont-ils recherchables publiquement ?
- [ ] Recherche multilingue ? (français, swahili, lingala, anglais)
- [ ] Recherche avec accents ? (ex: "é" = "e")
- [ ] Minimum de caractères : 2 ou 3 ?
- [ ] Pagination : 20 ou 50 résultats par type ?

### Mobile
- [ ] Remplacer `Chats` par `Recherche` dans la bottom nav mobile ?
- [ ] Ou ajouter `Recherche` et déplacer `Chats` dans le profil ?
- [ ] Où positionner `Profil` ? (bottom nav ou avatar dans navbar)

---

## 14. MIGRATIONS FUTURES

| Migration | Objectif | Dépend de | Risque |
| --------- | -------- | --------- | ------ |
| 20261005000000_add_subscription_demo_fields | `isDemo`, `demoUsed`, `demoStartedAt`, `demoExpiresAt` sur `Organization` | — | Faible |
| 20261006000000_add_organization_slug | `slug` unique sur `Organization` + index | — | Faible |
| 20261007000000_create_plans | Table `Plan` pour les abonnements configurables | — | Moyen |
| 20261008000000_create_invitation_links | Table `InvitationLink` pour les liens d'invitation | — | Faible |
| 20261009000000_create_reports | Table `Report` pour les rapports d'analytics | 8.3 | Moyen |
| 20261010000000_add_search_indexes | Index `text_pattern_ops` sur Organization, Community, Campaign, Post, User | — | Faible |

---

## 15. API CIBLE

### 15.1 Profils publics

```
GET /api/public/organizations/:slug
GET /api/public/organizations/:slug/communities
GET /api/public/organizations/:slug/campaigns
GET /api/public/communities/:slug
GET /api/public/communities/:slug/campaigns
```

### 15.2 Recherche

```
GET /api/search?q=...&types=organizations,communities,campaigns,posts,users&page=1&limit=20
```

### 15.3 Rapports

```
GET /api/reports/communities/:communityId
POST /api/reports/communities/:communityId/generate
GET /api/reports/:id
GET /api/reports/:id/download
```

### 15.4 Invitations

```
POST /api/invitations (amélioré avec vérification admin)
PUT /api/invitations/:id/revoke (amélioré)
POST /api/invitations/links (création lien)
GET /api/invitations/links/:token (validation)
POST /api/invitations/links/:token/accept (acceptation)
```

### 15.5 Abonnements

```
POST /api/admin/plans
PUT /api/admin/plans/:id
POST /api/admin/organizations/:id/subscription
POST /api/admin/organizations/:id/demo
```

---

## 16. RÈGLES MÉTIER CONFIRMÉES

### 16.1 Organisation

- Une organisation passe par : `pending` → `approved` / `rejected` / `suspended`
- Seule une organisation `approved` peut créer des communautés et campagnes
- Les quotas sont stockés sur `Organization`, pas dans un catalogue
- Le cycle abonnement/paiement est cumulatif : 5 conditions nécessaires

### 16.2 Communauté

- `isPrivate = true` par défaut
- Adhésion explicite via `CommunityMember`
- Un cercle privé sans adhésion active est inaccessible en lecture/écriture
- `status` : `active`, `suspended`, `archived`

### 16.3 Campagne

- `status` : `draft`, `active`, `completed`, `paused`
- Seuls `active` et `completed` sont publics
- Hérite de la portée de sa communauté
- Durée par défaut : 14 jours

### 16.4 Invitation

- Code unique, insensible à la casse
- Vérification : statut `active` + non expiré + quota non atteint
- Demande sans code : `InvitationRequest` avec validation manuelle

### 16.5 Modération

- Signalements : `pending`, `under_review`, `resolved`, `dismissed`
- Sévérité : `low`, `medium`, `high`, `critical_sos`
- Seul le staff peut voir et traiter les signalements

### 16.6 Anonymat

- `isAnonymous` sur `Post`, `Comment`, `CampaignContribution`
- En mode anonyme : `authorId` nullifié, `authorName` = "Participant Solidaire" / "Membre du Cercle", `authorAvatar` null
- L'anonymat est un masque d'affichage + suppression de FK

---

## 17. SÉCURITÉ

### 17.1 Confirmé

- ✅ Authentification JWT + Firebase ID token (Google)
- ✅ Relecture compte en base à chaque requête authentifiée
- ✅ Suspension vérifiée côté serveur
- ✅ Isolation Organisation/Communauté via Prisma
- ✅ Aucun accès Supabase direct depuis le frontend
- ✅ Aucune clé secrète dans le bundle frontend
- ✅ RLS activé (défense complémentaire)
- ✅ Audit log pour actions sensibles

### 17.2 À renforcer

- [ ] Race condition quotas (P2034)
- [ ] Recherche : rate limiting
- [ ] Recherche : énumération (minimum 2 caractères, pagination)
- [ ] Rapports : seuil d'anonymisation
- [ ] Rapports : pas de croisement de données permettant ré-identification
- [ ] Invitations : vérification `createdBy` est admin de l'organisation

---

## 18. PERFORMANCE

### 18.1 Index existants

| Modèle | Index |
| ------ | ----- |
| User | email, role, createdAt |
| Organization | status, subscriptionPlan, createdAt |
| Community | organizationId, status, createdAt |
| CommunityMember | communityId, userId, communityId+status, userId, role |
| Post | communityId+createdAt DESC, authorId, createdAt |
| PostMedia | postId, postId+position |
| Comment | postId, authorId, createdAt |
| Reaction | postId+userId+type UNIQUE, postId, userId |
| Story | communityId, authorId, createdAt |
| Campaign | organizationId, communityId, status, createdAt |
| CampaignContribution | campaignId, userId, createdAt |
| Invitation | code UNIQUE, organizationId, communityId, status |
| InvitationRequest | organizationId, communityId, status, requestedAt |
| MessageThread | participantOneId+participantTwoId UNIQUE, participantOneId, participantTwoId, lastMessageAt |
| Message | threadId+createdAt ASC, senderId, receiverId, createdAt |
| ModerationReport | status+severity+createdAt, communityId, targetType+targetId, createdAt |
| AuditLog | userId, action, resource, createdAt |

### 18.2 Index futurs

| Ressource | Index nécessaire |
| --------- | ---------------- |
| Organization | `name text_pattern_ops`, `slug UNIQUE` |
| Community | `name text_pattern_ops` |
| Campaign | `title text_pattern_ops` |
| Post | `content text_pattern_ops`, `title text_pattern_ops` |
| User | `name text_pattern_ops`, `pseudonym text_pattern_ops` |

---

## 19. MODIFICATIONS CODE

**Aucune modification de production effectuée.**

Documentation créée :
- `docs/CHANTIER-8.2-SPECIFICATION.md`

---

## 20. RISQUES

### CRITIQUE

Aucun.

### ÉLEVÉ

1. **Race condition quotas.** Le contrôle de quota mensuel n'est pas sérialisé. Deux requêtes simultanées peuvent dépasser le quota. À traiter dans 8.3.

### MOYEN

2. **Recherche absente.** Aucune recherche serveur multi-entités. Les recherches actuelles sont locales et limitées.
3. **Rapports absents.** Fonctionnalité critique pour les organisations, non implémentée côté backend.
4. **Liens d'invitation absents.** Seuls des codes statiques existent.
5. **Navigation mobile incomplète.** Pas de Recherche, pas de Profil dans la bottom nav.

### FAIBLE

6. **Slugs absents.** Les URLs publiques utilisent des IDs CUID, pas des slugs lisibles.
7. **PDF simulé.** `PartnerReports.tsx` contient un `setTimeout` pour l'export PDF.
8. **Demo 30 jours non tracée.** Pas de flag `isDemo` ou `demoUsed`.

---

## 21. ORDRE D'IMPLÉMENTATION

1. **8.3** — Abonnements / Demo / Plans / Quotas (ajout champs `isDemo`, `demoUsed`, table `Plan`, fix race condition)
2. **8.4** — Liens d'invitation (modèle `InvitationLink`, endpoints, frontend)
3. **8.5** — Profils publics Organization & Community (slugs, routes publiques, DTO)
4. **8.6** — Recherche globale (endpoint `GET /api/search`, index PostgreSQL, frontend)
5. **8.7** — Rapports & Analytics (modèle `Report`, service insight, anonymisation)
6. **8.8** — PDF Reports (génération backend, stockage, téléchargement)
7. **8.9** — Frontend Integration & UX (navigation mobile, profils, recherche)

---

## 22. VERDICT

```text
CHANTIER 8.2 — VALIDÉ
```

La spécification est suffisamment précise pour commencer l'implémentation :

- Architecture cible définie
- Modèle de données cible proposé
- API cible spécifiée
- Frontend cible spécifié
- Matrice de permissions définie
- Migrations futures listées et ordonnées
- Questions ouvertes identifiées
- Risques classés

**Aucune modification de production effectuée.**

**Prêt pour le Chantier 8.3 — Abonnements / Demo / Plans / Quotas.**
