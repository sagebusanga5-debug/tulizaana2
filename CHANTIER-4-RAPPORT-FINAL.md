# CHANTIER 4 — Portail partenaire : droits, quotas et espace de gestion

**Rapport final**

Projet : `Tulizaana-main/Tulizaana-main`
Date : 3 octobre 2026
Périmètre : droits partenaires, cycle abonnement/paiement, quotas, profil public, DTO et portail partenaire
Chantiers antérieurs (1, 2, 3, 3.1) : non régressés

---

## Synthèse

Le portail partenaire fonctionnait sans aucun contrôle d'accès réel. Une personne non
authentifiée pouvait créer un cercle dans n'importe quelle organisation, en choisir une autre
que la sienne, ou voir le modèle Prisma complet d'une organisation — coordonnées, quotas et
état d'abonnement — lui être renvoyé publiquement. Dans le même temps, l'authentification du
portail était entièrement simulée dans le navigateur, et le flux de paiement affichait une
autorisation bancaire fictive avant d'accord les quotas côté client.

Ce chantier ferme ces accès. L'identité de l'organisation est désormais dérivée du JWT via la
table `OrganizationAdmin`, jamais du corps de la requête. Les quotas sont lus sur les colonnes
`Organization.quota*`, seule autorité opérationnelle. L'approbation, l'abonnement et la
validation du paiement sont trois états distincts, dont aucun n'implique les deux autres. Le
profil public passe par un DTO à sélection positive, et plus aucun paiement n'est simulé.

**État : terminé**, sous deux réserves explicitées en section 10 (exécution de
`prisma migrate deploy` sur une base réelle, et décision produit sur le point d'entrée de la
candidature).

---

## 1. Sécurité corrigée

### 1.1 Les cinq failles confirmées à l'audit

| Faille | Comportement avant | Comportement après |
|---|---|---|
| Candidature auto-privilegée | `POST /api/organizations` lisait `status` et `subscriptionPlan` dans le corps : un tiers pouvait déposer une candidature `approved` en `enterprise`. | Le serveur impose `status: "pending"` (`organization.controller.ts:271`), `subscriptionPlan: "basic"`, les trois quotas `basic` et `paymentStatus: "pending"` (`:276`). Le corps ne les lit plus. |
| Création de cercle anonyme | `POST /api/communities` en `optionalAuth`. `organizationId` libre dans le corps. Fallback sur la première organisation approuvée, et **auto-création d'une organisation racine approuvée** si aucune n'existait. | `requireAuth` (`community.routes.ts:21`). Organisation dérivée de l'identité serveur. Auto-création supprimée (`createCommunity`, `community.controller.ts:114`). |
| Campagne inter-organisation | `organizationId` **et** `communityId` lus dans le corps : un `partner_admin` créait une campagne au nom de n'importe quelle ONG. | `organizationId` non lu. Vérification explicite `community.organizationId !== organization.id` → 404 `FORBIDDEN_RESOURCE` (`campaign.controller.ts:215`). |
| Fuite du modèle Prisma brut | `GET /api/organizations/:id` renvoyait `prisma.organization.findUnique(...)` tel quel : `contactEmail`, `contactPhone`, `address`, `responsibleName`, `validatedAt`, les trois quotas et la formule. | `toPublicOrganization()` (`organization-dto.ts:193`). La sélection Prisma (`PUBLIC_ORGANIZATION_SELECT`, `:116`) ne ramène pas les colonnes sensibles. |
| Test de rôle JWT dans le contrôleur | `updateOrganizationStatus` testait `req.user.role !== "superadmin"`, contournant la relecture en base du Chantier 3. | Test supprimé. Autorisation uniquement par `requireRole(["superadmin"])` (`organization.routes.ts:54`). |

### 1.2 Quatre failles découvertes pendant l'implémentation

**Le quota s'auto-ajustait.** `createCommunity` augmentait `quotaCommunitiesMax` à chaque
création. Un quota était donc une variable, pas une borne. La ligne est supprimée ; le test 6b
vérifie que le maximum reste inchangé après une création.

**L'authentification partenaire n'authentifiait rien.**
`PartnerAuthModal.tsx:143-155` acceptait toute chaîne de longueur ≥ 4, mentionnait un code de
démo `ONG-2025`, et appelait `onSuccessAuth(selectedOrgId)` où l'organisation était **choisie
dans une liste déroulante**. Aucun serveur n'était consulté. Remplacé par `POST /api/auth/login`
puis `GET /api/organizations/mine`, qui retourne les organisations issues de `OrganizationAdmin`
relues en base.

**Le plan était escaladé côté client.** `handleUpgradeOrganizationPlan` (`App.tsx`) dérivait les
quotas du nom du plan — `enterprise ? 50000 : …` — et les écrivait dans l'état local. C'est
exactement l'architecture interdite. Supprimé ; la demande passe par le serveur.

**L'accès était accordé avant la réponse serveur.** `handleCreateOrganization` positionnait
`isPartnerAuthenticated = true` et basculait en mode partenaire **avant** l'appel API, en
envoyant `status: 'approved'` et `subscriptionPlan` dans le corps. Supprimé.

---

## 2. Fonctionnalités branchées

| Route | Accès | Rôle |
|---|---|---|
| `GET /api/organizations` | public | Liste, organisations approuvées, DTO public. |
| `GET /api/organizations/:id` | public | Profil de présentation d'une organisation **approuvée** seulement. |
| `POST /api/organizations` | public | Candidature. Valeurs imposées par le serveur. |
| `GET /api/organizations/mine` | authentifié | Organisations réellement gérées, avec quotas et `blockedBy`. |
| `GET /api/organizations/:id/manage` | admin de l'org ou superadmin | Profil de gestion. 404 sinon. |
| `PUT /api/organizations/:id/status` | superadmin | Statut, formule, quotas, activation. |
| `POST /api/organizations/:id/subscription-request` | admin de l'org | Demande de formule, sans effet sur les droits. |
| `POST /api/communities` | authentifié | Création de cercle sous entitlements. |
| `POST /api/campaigns` | authentifié | Création de campagne sous entitlements. |

Côté interface : `src/components/partner/CreateCommunityModal.tsx` porte le bouton
« Créer une communauté », lit ses quotas et son échéance depuis le serveur, et se désactive
visuellement avec la raison du blocage.

---

## 3. Modèle d'abonnement

`Organization.status` (agrément) et le cycle abonnement/paiement sont deux axes **distincts**.
Une action partenaire exige **simultanément** cinq conditions, évaluées dans cet ordre par
`assertPartnerSubscription()` (`partner-entitlements.service.ts:258`) :

```
1. status === "approved"
2. subscriptionStartedAt !== null          (abonnement défini)
3. paymentStatus === "validated"
4. subscriptionExpiresAt === null || >= now()   (non expiré)
5. quota disponible
```

### `paymentStatus = "validated"` ne suffit jamais à lui seul

Le test 3e fixe les conditions 2, 3 et 4 comme valides et laisse `status = "pending"` : le
résultat est `ORGANIZATION_NOT_APPROVED`. Inversement, le test 10b approuve une organisation
(`status = "approved"`) dont l'abonnement n'a pas démarré : le résultat est
`SUBSCRIPTION_REQUIRED`. Les deux moitiés du contrat sont donc prouvées par des tests distincts.

### L'approbation n'active pas l'abonnement

`updateOrganizationStatus` traite `status` et l'abonnement comme deux opérations séparées.
L'activation exige `activateSubscription: true` plus un `paymentStatus` explicite. Le seed
applique la même règle pour les deux organisations de démonstration
(`prisma/seed.ts:163` et `:196`), sans quoi elles resteraient en `SUBSCRIPTION_REQUIRED`
malgré `status: "approved"`.

### Un changement de formule n'hérite d'aucune validation

`applySubscriptionChange()` (`:457`) applique le garde-fou n°2 : un changement de formule remet
`paymentStatus` à `pending` sauf état explicitement fourni par un superadmin. La règle est
appliquée dans les **deux** chemins possibles d'un changement de formule :
`organization.controller.ts:379` et `admin.controller.ts:294`.

### Garde-fou supplémentaire : pas d'écrasement de quota négocié

Un quota non fourni lors d'un changement de formule est laissé intact. Le seed porte Panzi en
`enterprise` avec 20 communautés, plus spécifique que le catalogue (25) ; sans cette règle, un
changement de formule aurait silencieusement relevé ce plafond.

---

## 4. Quotas

### Autorité

`Organization.quotaCommunitiesMax`, `quotaMembersMax` et `quotaCampaignsMax` sont l'unique
autorité opérationnelle, relus en base à chaque requête.

`shared/partner-plans.ts` est un **catalogue de données** : il ne contient aucune fonction
d'autorisation et **n'est pas importé** par le service d'entitlements. Le test B2 vérifie les
deux points. Un contrôle d'accès qui importerait ce module pourrait interroger
`plan === "enterprise"` pour décider : la structure l'interdit par construction.

`planDefaults()` sert aux valeurs par défaut de candidature et à la validation de configuration,
jamais à une autorisation.

### Application

| Quota | Règle |
|---|---|
| Communautés | `count(Community where organizationId = org.id)`, comparé à `quotaCommunitiesMax`. Strictement appliqué. |
| Campagnes/mois | `count(Campaign where organizationId = org.id AND startDate ∈ [1er du mois, 1er du mois suivant))`, calculé en **heure locale serveur**. |
| Membres | Hors périmètre : la création de membre passe par `Invitation`. |

Le comptage mensuel borne par `createdAt` les campagnes sans `startDate`, afin qu'une colonne
nullable ne consomme pas un quota invisible. Le test 6d vérifie qu'une campagne du mois
antérieur ne consomme pas le quota du mois courant.

---

## 5. Paiement

**Aucun paiement n'est simulé. Aucun prestataire de paiement n'a été inventé.**

Le projet n'a pas de prestataire. Le flux `PartnerSubscription` affichait pourtant
« Autorisation bancaire accordée » après 3,6 secondes de minuteurs fictifs, déclenchait des
confettis, positionnait `paymentSuccess = true` et validait le plan — donc les quotas — côté
client.

Remplacé par `POST /api/organizations/:id/subscription-request`
(`organization.controller.ts:460`), qui :

- ne modifie **ni** la formule, **ni** les quotas, **ni** l'état de paiement ;
- enregistre l'intention dans `AuditLog` sous `PARTNER_SUBSCRIPTION_CHANGE_REQUESTED` (`:501`) ;
- renvoie explicitement `subscriptionUnchanged: true` (`:518`).

L'interface affiche « Demande transmise, en attente de validation ». Aucun numéro de transaction
n'est fabriqué, aucun montant n'est débité, aucune confirmation de paiement n'est affichée.
`subscription selected` ne devient jamais `subscription active`.

---

## 6. Données publiques

`GET /api/organizations/:id` ne renvoie plus `prisma.organization.findUnique(...)`.

`PUBLIC_ORGANIZATION_SELECT` (`organization-dto.ts:116`) est une **sélection positive** : les
colonnes `contactEmail`, `contactPhone`, `address`, `responsibleName`, `validatedAt`, les trois
quotas et les colonnes d'abonnement ne sont pas demandées, donc la base ne les ramène pas. Une
fuite par oubli ultérieur est structurellement impossible : un champ ajouté au modèle n'apparaît
que s'il est explicitement listé dans le DTO.

**Champs exposés** : `id`, `name`, `acronym`, `logo`, `coverImage`, `type`, `country`, `city`,
`domain`, `mission`, `description`, `isVerified`, `counters`.

**Vérification** : le test 8a contre-vérifie sur le **JSON sérialisé** de la réponse, pas sur
l'objet JavaScript — 0 occurrence des 12 noms interdits. Une organisation non approuvée renvoie
404 : une candidature en attente n'est pas devinable.

**Compteurs** : `numberOfActiveCampaigns` et `numberOfPublicCommunities` sont exposés parce
qu'ils sont déjà publics via `GET /api/campaigns` et `GET /api/communities`.
`numberOfMembers` n'est **pas** exposé : `Community.isPrivate` vaut `true` par défaut, et
compter les membres d'une communauté protégée est une fuite d'information.

---

## 7. Données privées

`GET /api/organizations/:id/manage` (`organization.controller.ts:136`) exige un lien
`OrganizationAdmin` sur cette organisation, ou le rôle superadmin.

Pour tout autre appelant la réponse est **404 et non 403**, afin que cet endpoint ne serve pas
d'oracle d'existence. La raison est portée par le `code` `FORBIDDEN_RESOURCE` et par le texte.

Le DTO de gestion (`organization-dto.ts:215`) contient les coordonnées, le responsable, la
formule, les trois quotas en `used`/`max` et les dates d'abonnement. C'est la seule source des
quotas affichés dans le portail.

---

## 8. Tests de concurrence

### Implémentation

La vérification du quota et l'insertion sont dans la **même** transaction
(`isolationLevel: Serializable`, `community.controller.ts:220`), avec 3 tentatives sur le code
`P2034`. Le schéma naïf `SELECT count()` puis `INSERT` ne peut donc pas être contourné par deux
requêtes qui observent le même compteur dans deux transactions séparées.

### Test H — résultat mesuré

```
créations réussies : 1/2
invariant dur : used (2) <= max (2)
```

Le test n'affirme **que** cet invariant, parce que c'est le seul que le modèle actuel garantit.
Le script affiche explicitement, en sortie :

```
[H] Limite assumee : ce double n'implemente ni verrou PostgreSQL ni conflit P2034.
[H] Il ne prouve donc PAS l'absence de place perdue en cas de course reelle.
```

Aucun PASS n'est déduit ni simulé.

### Limite connue

Un `count()` puis `insert()` sous `SERIALIZABLE` ne garantit pas mathématiquement l'unicité :
Postgres SSI n'aborte pas nécessairement un cycle lecture→écriture en l'absence de dépendance
circulaire. Deux requêtes concurrentes pourraient donc consommer deux places quand une seule
restait. **Aucun compteur atomique n'a été ajouté**, conformément à la consigne.

Deux contre-mesures disponibles, non implémentées :

1. **Compteur atomique** — table `OrganizationQuotaCounter(organizationId, quota, used,
   periodKey)` avec `UPDATE ... SET used = used + 1 WHERE used < max`. Le verrou de ligne
   PostgreSQL sérialise nativement sous `READ COMMITTED`. `periodKey` au format `2026-10` pour
   le quota mensuel.
2. **Emplacement unique** — colonne `Community.quotaSlot` avec `UNIQUE (organizationId,
   quotaSlot)`, le slot étant la place libre. Deux insertions concurrentes visent le même slot ;
   une seule gagne, l'autre reçoit `P2002` et est refusée proprement.

---

## 9. Migrations

`prisma/migrations/20261003000000_partner_subscription_lifecycle/migration.sql`

```sql
ALTER TABLE "Organization"
  ADD COLUMN "subscriptionStartedAt" TIMESTAMP(3),
  ADD COLUMN "subscriptionExpiresAt" TIMESTAMP(3),
  ADD COLUMN "paymentStatus"        TEXT;
```

Strictement additive : trois colonnes `NULL`. Aucun `DROP`, aucun `ALTER TYPE`, aucun backfill.
Aucune migration historique modifiée. `npx prisma generate` exécuté avec succès.

Ces colonnes séparent deux axes qui étaient confondus : l'agrément (`status`) et le cycle
commercial (abonnement + paiement).

**Écart par rapport au plan initial** : une troisième colonne plutôt que les deux dates
prévues, parce que la séparation abonnement/paiement est inexprimable avec deux dates seules.

**Réserve** : `npx prisma migrate deploy` **n'a pas pu être exécuté** — aucun `DATABASE_URL`
dans cet environnement (`P1012`). La commande est prête, son exécution reste à faire sur un
environnement de base réel, puis `npx prisma db seed`.

---

## 10. Problèmes restants

### Réserves sur le chantier

1. **`prisma migrate deploy` non exécuté** faute de base disponible. À faire avant déploiement.
2. **Le modal de candidature n'a plus de point d'entrée dans l'interface.** Conséquence directe
   du remplacement imposé du bouton portail : il était ouvert depuis `PartnerAuthModal`, dont le
   bouton « Créer un profil organisation » a été remplacé par « Créer une communauté ». Le
   formulaire a été relabelisé en « Déposer une candidature de partenariat » et relié à
   `handleCreateOrganization`, qui attend désormais une réponse serveur — mais plus aucun
   élément ne l'ouvre. Le **choix de l'emplacement du bouton de candidature publique** relève
   d'une décision produit ; je ne l'ai pas inventé.
3. `GET /:id/manage` renvoie 404 aux non-autorisés. Arbitrage validé pour ne pas révéler
   l'existence d'une ressource, mais cela masque aussi les erreurs de droits côté client, dont
   le diagnostic est moins direct.
4. `src/App.tsx` conserve `tlz_organizations` et `tlz_current_organization` en `localStorage`
   comme cache d'affichage. Ces valeurs ne alimentent plus aucune décision d'accès : le
   portail s'ouvre sur la réponse de `/api/auth/me` et `/api/organizations/mine`.

### Hors périmètre, non traités

- Rate limiting global.
- Uploads.
- `localStorage` sensible.
- Migrations historiques `PostMedia` / `MessageThread.canonicalParticipantKey`.
- Messagerie.
- IA.
- CSP / Helmet.
- Performance.

Le mojibake préexistant de `server/controllers/campaign.controller.ts` n'a **pas** été corrigé
globalement, conformément à la consigne. Les chaînes ajoutées dans ce fichier ont été réécrites
en UTF-8 propre.

La connexion Google de production reste à `503` tant que les variables Firebase Admin ne sont
pas configurées sur l'hébergeur. Ce point est extérieur au Chantier 4.

---

## Fichiers créés ou modifiés

### Créés

| Fichier | Rôle |
|---|---|
| `shared/partner-plans.ts` | Catalogue de plans. Données seules, aucune autorisation. |
| `server/services/partner-entitlements.service.ts` | Résolution d'identité, conditions d'abonnement/paiement, quotas, codes d'erreur. |
| `server/services/organization-dto.ts` | DTO public et DTO de gestion à sélection positive. |
| `scripts/test-partner-security.ts` | 114 contrôles de sécurité du portail partenaire. |
| `src/components/partner/CreateCommunityModal.tsx` | Bouton et formulaire « Créer une communauté ». |
| `prisma/migrations/20261003000000_partner_subscription_lifecycle/migration.sql` | Migration additive. |

### Modifiés — serveur

| Fichier | Modification |
|---|---|
| `prisma/schema.prisma` | Trois colonnes `Organization` nullable. |
| `prisma/seed.ts` | Activation explicite des deux organisations de démonstration. |
| `server/utils/response.ts` | `code` métier optionnel sur `ApiResponse` et `sendError`. Rétrocompatible. |
| `server/controllers/organization.controller.ts` | DTO public et `/manage`, candidature verrouillée, entitlement, demande de formule, `/mine`, suppression du test JWT. |
| `server/controllers/community.controller.ts` | `createCommunity` : identité dérivée, entitlements, quota en transaction. |
| `server/controllers/campaign.controller.ts` | `createCampaign` : identité dérivée, appartenance de la communauté, quota mensuel en transaction. |
| `server/controllers/admin.controller.ts` | Remise à `pending` de la validation de paiement sur changement de formule. |
| `server/routes/organization.routes.ts` | `/mine`, `/:id/manage`, `/:id/subscription-request`, `requireRole` sur le statut. |
| `server/routes/community.routes.ts` | `requireAuth` sur `POST /`. |

### Modifiés — interface

| Fichier | Modification |
|---|---|
| `src/services/api.ts` | `code` métier distinct du statut HTTP ; section `api.partner` ; types partenaires. |
| `src/components/partner/PartnerAuthModal.tsx` | Réécrit : authentification serveur, aucune organisation choisie par le client. |
| `src/components/partner/PartnerSubscription.tsx` | Paiement simulé supprimé ; quotas et échéance lus du serveur. |
| `src/components/partner/PartnerOrganizationProfile.tsx` | `onOpenCreateOrganization` → `onOpenCreateCommunity`. |
| `src/components/partner/CreateOrganizationModal.tsx` | Relabelisé en candidature. |
| `src/components/onboarding/InviteGateScreen.tsx` | Relabelisé en candidature. |
| `src/translations/orgProfile.ts` | `createOrgProfile` → `createCommunity` dans les cinq langues. |
| `src/App.tsx` | Session partenaire dérivée du serveur ; suppression des trois `setIsPartnerAuthenticated(true)` dispensing d'une réponse ; suppression de l'escalade de plan ; mutations attendent le serveur. |
| `package.json` | Script `test:partner-security`. |

---

## Règles d'autorisation réellement exécutées côté serveur

1. `requireAuth` — jeton valide, signature vérifiée.
2. `requireRole(["superadmin"])` — rôle **relu en base** à chaque requête, compte suspendu rejeté.
   Le rôle du JWT n'est jamais utilisé pour autoriser.
3. `resolvePartnerOrganization()` — `OrganizationAdmin` → `Organization`. Le `organizationId`
   éventuellement fourni par le client est une **sélection** vérifiée contre la liste réelle des
   organisations gérées ; une organisation arbitraire est rejetée en 404. Sans sélection et
   plusieurs organisations gérées, la requête est refusée plutôt que de trancher arbitrairement.
4. `assertPartnerSubscription()` — les cinq conditions cumulatives de la section 3.
5. `assertQuotaAvailable()` — comparaison sur les colonnes stockées.
6. Appartenance de la ressource — `community.organizationId === organization.id`.

## Règles d'abonnement, de paiement et de quota

- Sept codes stables : `PARTNER_NO_ORGANIZATION`, `ORGANIZATION_NOT_APPROVED`,
  `SUBSCRIPTION_REQUIRED`, `PAYMENT_PENDING`, `SUBSCRIPTION_EXPIRED`, `QUOTA_EXCEEDED`,
  `FORBIDDEN_RESOURCE`.
- HTTP `403` uniforme, y compris pour l'expiration. Aucun `402` n'est émis : le frontend se
  branche sur `code`, jamais sur le statut HTTP. Le statut HTTP reste disponible dans `status`
  pour le diagnostic.
- L'expiration ne supprime aucune ressource existante : les lectures restent servies, seules les
  mutations sont refusées. Vérifié par le test 3d.
- Le texte des messages est libre et traduisible ; seul `code` fait contrat.

## Comportement du frontend

- **Authentification** : e-mail et mot de passe réels via `POST /api/auth/login`, puis
  `GET /api/organizations/mine`. L'organisation est celle que le serveur a résolue. Le code de
  démo et l'acceptation par longueur sont supprimés.
- **Session** : `isPartnerAuthenticated` n'est plus initialisé depuis `sessionStorage` et n'est
  plus posé par une chaîne de navigateur. Il n'est mis à `true` qu'après une réponse serveur
  favorable.
- **Mutations** : `clic → API → succès → mise à jour UI`. Aucune mise à jour préalable.
- **Quotas** : affichés depuis `/manage`. Les valeurs codées en dur de `PartnerSubscription`
  (`organization.quotaMembers?.max || 500`) sont retirées ; un champ sans réponse serveur affiche
  `—` plutôt qu'une valeur inventée.
- **Bouton portail** : « Créer une communauté », visible quand l'action a du sens, désactivé
  visuellement quand le quota est atteint, avec la raison lue dans le `code`. Le backend refait
  toujours la vérification.
- **Formule** : la demande part au serveur, qui ne change rien. Aucun escalade local.

---

## Résultats exacts des commandes

| Commande | Résultat |
|---|---|
| `npm run typecheck` | **PASS** — 0 erreur |
| `npm run test:auth` | **PASS** — 44/44 |
| `npm run test:admin-security` | **PASS** — 42/42 |
| `npm run test:seed` | **PASS** — 34/34 |
| `npm run test:partner-security` | **PASS** — 114/114 |
| `npm run build` | **PASS** — code de sortie 0, `dist/server.cjs` 166,1 ko |

Aucune commande n'a échoué.

### Détail du `test:partner-security`

114 contrôles : 12 scénarios HTTP de base, les tests imposés A à H, et 10 groupes
d'inspection de sources.

```
1.  Partenaire sans organisation associée
2.  Organisation en attente d'agrément
2b. Organisation suspendue
3a. Abonnement jamais activé
3b. Paiement non validé (test F)
3c. Paiement en échec
3d. Abonnement expiré (test E)
3e. paymentStatus=validated seul ne suffit pas
4.  Organisation falsifiée dans le corps (test C)
4bis. La communauté appartient toujours à l'organisation résolue
4b. Un partenaire de B ne peut pas créer dans A
4c. Utilisateur gérant plusieurs organisations
5a. Campagne dans une communauté d'une autre organisation
5b. Campagne dans une communauté inexistante
5c. organizationId falsifié sur une campagne
5d. Détournement de l'organisation d'une campagne
6a. Quota de communautés atteint (test G)
6b. Le quota n'est jamais augmenté à la volée
6c. Quota mensuel de campagnes (test G)
6d. Le mois civil borne le comptage
7a. Plan falsifié (test A)
7b. Impossible de s'auto-attribuer enterprise
8a. Profil public sans fuite
8b. Une candidature en attente n'est pas devinable
8c. /manage réservé aux administrateurs
9.  Candidature publique : le client ne choisit rien
9b. Une candidature ne donne aucun accès
10a. La route de statut exige le rôle relu en base
10b. Approuver n'active pas l'abonnement
10c. Un changement de formule n'hérite d'aucun validated
10d. Activation explicite de l'abonnement
11. Demande de formule sans effet sur les droits
12. Aucune création sans jeton
H.  Concurrence : invariant used <= max
B1-B10. Inspection des sources
```

### Vérifications du bundle de production

- 0 occurrence des 8 motifs de secrets réels et des 3 variables de seed.
- « Créer un profil organisation » absent.
- « Créer une communauté » présent et correctement encodé en UTF-8.
- Aucune confirmation de paiement automatique.
- Aucun numéro de transaction fabriqué.

---

## Note sur la méthode

Trois défauts sont apparus pendant les tests et ont été corrigés **dans le produit** quand le
produit était fautif, et **dans le test** quand la mesure était fautive :

- L'invariant de concurrence échouait parce que le test comptait les communautés de toutes les
  organisations. La mesure a été corrigée pour être scopée à l'organisation, comme le fait le
  backend. Le produit n'a pas été modifié.
- Les scénarios d'isolation échouaient parce qu'un même utilisateur de test gérait deux
  organisations. Les données ont été séparées en un partenaire mono-organisation et un
  partenaire multi-organisations, ce qui a rendu le test de la sélection vérifiée possible.
- L'écriture de `tlz_partner_auth` dans le navigateur a été supprimée du produit : le test avait
  raison de la signaler.