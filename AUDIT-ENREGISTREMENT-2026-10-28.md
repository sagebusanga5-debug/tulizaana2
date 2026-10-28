# Audit Complet de l'Enregistrement des Données - Tulizaana
**Date :** 28 octobre 2026
**Objectif :** Définir précisément le comportement actuel quand on essaie de créer une nouvelle donnée

---

## Table des Matières

1. [Membres/Utilisateurs](#1-membresutilisateurs)
2. [Organisations Partenaires](#2-organisations-partenaires)
3. [Communautés/Cercles](#3-communautéscercles)
4. [Campagnes](#4-campagnes)
5. [Publications](#5-publications)
6. [Récits/Stories](#6-récitsstories)
7. [Commentaires](#7-commentaires)
8. [Réactions](#8-réactions)
9. [Résumé des Validations](#résumé-des-validations)

---

## 1. Membres/Utilisateurs

### Endpoint
`POST /api/auth/register`

### Champs Requis
- `code` (string) - Code d'invitation obligatoire
- `name` (string) - Nom complet
- `password` (string) - Minimum 6 caractères

### Champs Optionnels
- `pseudonym` (string) - Pseudonyme
- `email` (string) - Email (si fourni, doit être unique)
- `country` (string) - Pays, défaut "RDC"
- `city` (string) - Ville
- `phoneNumber` (string) - Numéro de téléphone
- `isAnonymous` (boolean) - Anonymat, défaut false
- `bio` (string) - Biographie courte

### Validations
1. **Code d'invitation** :
   - Doit exister dans la table `Invitation`
   - Statut doit être `active`
   - Ne doit pas être expiré (`expiresAt < new Date()`)
   - Quota d'utilisation non atteint (`currentUses < maxUses`)

2. **Email** (si fourni) :
   - Doit être unique dans la table `User`
   - Converti en minuscules et trim
   - **Important** : En cas de conflit, réponse identique à "Code invalide" pour éviter l'énumération

3. **Mot de passe** :
   - Minimum 6 caractères
   - Hashé avec bcrypt (10 rounds)

### Comportement après Validation
1. **Transaction atomique** :
   - Création de l'utilisateur dans `User`
   - Adhésion automatique à la communauté liée à l'invitation (`CommunityMember`)
   - Incrémentation du compteur d'utilisation du code d'invitation
   - Si quota atteint, statut du code passe à `expired`
   - Journal d'audit (`AuditLog`)

2. **Valeurs par défaut imposées par le serveur** :
   - `role`: "member"
   - `memberStatus`: "active_participant"
   - `points`: 50 (bonus de bienvenue)

3. **Réponse** :
   - Token JWT généré et envoyé via cookie HttpOnly
   - Retourne l'utilisateur créé avec les détails de la communauté rejointe

### Autorisations
- **Pas d'authentification requise** (inscription publique)
- Code d'invitation obligatoire (pas d'inscription sans invitation)

### Messages d'Erreur
- `400` : "Un code d'invitation valide est obligatoire..."
- `400` : "Le nom et un mot de passe d'au moins 6 caractères sont requis."
- `404` : "Code d'invitation introuvable."
- `400` : "Ce code d'invitation a expiré."
- `400` : "Ce code d'invitation a atteint son quota maximal d'utilisations."
- `400` : "Inscription impossible. Vérifiez le code d'invitation et vos informations." (inclut conflit email)

---

## 2. Organisations Partenaires

### Endpoint
`POST /api/organizations`

### Champs Requis
- `name` (string) - Nom de l'organisation
- `domain` (string) - Domaine d'activité
- `mission` (string) - Mission
- `contactEmail` (string) - Email de contact
- `contactPhone` (string) - Téléphone de contact
- `responsibleName` (string) - Nom du responsable

### Champs Optionnels
- `acronym` (string) - Acronyme
- `description` (string) - Description
- `type` (string) - Type, défaut "ong" (ong, hospital, association, clinic)
- `country` (string) - Pays, défaut "RDC"
- `city` (string) - Ville, défaut "Kinshasa"
- `address` (string) - Adresse
- `responsibleTitle` (string) - Titre du responsable

### Validations
1. **Champs obligatoires** : Tous les champs légaux doivent être renseignés

2. **Valeurs IMPOSÉES par le serveur** (non envoyées par le client) :
   - `status`: "pending" (toujours pending, candidature)
   - `subscriptionPlan`: "basic" (toujours basic au départ)
   - `quotaCommunitiesMax`: valeur du plan "basic"
   - `quotaMembersMax`: valeur du plan "basic"
   - `quotaCampaignsMax`: valeur du plan "basic"
   - `paymentStatus`: "pending"
   - `subscriptionStartedAt`: NULL
   - `subscriptionExpiresAt`: NULL

3. **Slug** : Généré côté serveur à partir du nom (unique et stable)

### Comportement après Validation
1. **Création** :
   - Organisation créée avec statut `pending`
   - Journal d'audit créé

2. **Réponse** :
   - Message de confirmation
   - Organisation créée retournée

3. **Accès** :
   - L'espace de gestion reste indisponible jusqu'à approbation par admin
   - Création de cercles impossible jusqu'à approbation

### Autorisations
- **Pas d'authentification requise** (candidature publique)
- Approbation requise pour activer l'organisation et son abonnement

### Messages d'Erreur
- `400` : "Tous les champs légaux obligatoires doivent être renseignés."
- `500` : "Erreur lors de la création de la demande de partenariat."

---

## 3. Communautés/Cercles

### Endpoint
`POST /api/communities`

### Champs Requis
- `name` (string) - Nom du cercle

### Champs Optionnels
- `slug` (string) - Slug (si non fourni, généré depuis le nom)
- `description` (string) - Description, défaut "Espace d'écoute..."
- `mission` (string) - Mission, défaut "Faciliter le partage..."
- `rules` (string[]) - Règles, défaut ["Confidentialité...", "Bienveillance", "Non-jugement"]
- `category` (string) - Catégorie, défaut "chronic_disease"
- `icon` (string) - Icône, défaut "heart"
- `coverImage` (string) - Image de couverture
- `isPrivate` (boolean) - Privé, défaut true
- `organizationId` (string) - ID de l'organisation (pour sélection si l'utilisateur en gère plusieurs)

### Validations
1. **Authentification** : Requise (`requireAuth`)

2. **Organisation** :
   - L'utilisateur doit être admin de l'organisation via `OrganizationAdmin`
   - Organisation vérifiée contre `OrganizationAdmin` (404 si non gérée)
   - Statut organisation doit être `approved`
   - Abonnement doit être défini
   - Paiement doit être validé (`paymentStatus = validated`)
   - Abonnement ne doit pas être expiré
   - Quota de communautés disponible

3. **Slug** :
   - Généré avec suffixe unique pour éviter les collisions
   - Format : `{slug}-{timestamp36}-{randomHex}`

4. **Transaction avec retry** :
   - Jusqu'à 3 tentatives en cas de conflit P2034
   - Quota vérifié dans la transaction SERIALIZABLE

### Comportement après Validation
1. **Transaction atomique** :
   - Vérification du quota dans la transaction
   - Création de la communauté
   - Le créateur devient automatiquement `moderator` du cercle

2. **Valeurs par défaut** :
   - `status`: "active"
   - `isPrivate`: true (par défaut fermé)

3. **Réponse** :
   - Communauté créée retournée avec l'organisation

### Autorisations
- **Authentification requise**
- **Doit être admin de l'organisation**
- **Organisation approuvée avec abonnement actif**
- **Quota disponible**

### Messages d'Erreur
- `401` : "Authentification requise pour créer un cercle."
- `400` : "Le nom du cercle est requis."
- `404` : "Organisation introuvable." (si organisation non gérée)
- `409` : "QUOTA_EXCEEDED" (si quota dépassé malgré retry)
- Erreurs d'abonnement via `PartnerEntitlementError`

---

## 4. Campagnes

### Endpoint
`POST /api/campaigns`

### Champs Requis
- `communityId` (string) - ID du cercle
- `title` (string) - Titre de la campagne
- `description` (string) - Description
- `category` (string) - Catégorie

### Champs Optionnels
- `durationDays` (number) - Durée en jours, défaut 14
- `targetActivitiesCount` (number) - Objectif d'activités, défaut 5
- `rewardBadge` (string) - Badge de récompense
- `activities` (array) - Activités
- `organizationId` (string) - Non utilisé (organisation dérivée de l'auth)

### Validations
1. **Authentification** : Requise (`requireAuth`)

2. **Organisation** :
   - L'utilisateur doit être admin de l'organisation
   - Organisation approuvée avec abonnement actif
   - Paiement validé et non expiré

3. **Communauté** :
   - Doit exister
   - Doit appartenir à l'organisation de l'utilisateur
   - Sinon 404 "Cercle introuvable pour votre organisation"

4. **Quota MENSUEL** :
   - Vérifié dans la transaction SERIALIZABLE
   - Borné au mois civil courant
   - Scope à l'organisation

5. **Transaction avec retry** :
   - Jusqu'à 3 tentatives en cas de conflit P2034

### Comportement après Validation
1. **Transaction atomique** :
   - Vérification du quota mensuel
   - Création de la campagne
   - Statut initial : `active`
   - Date de début : maintenant

2. **Réponse** :
   - Campagne créée retournée avec communauté et organisation

### Autorisations
- **Authentification requise**
- **Doit être admin de l'organisation**
- **Organisation approuvée avec abonnement actif**
- **Quota mensuel disponible**
- **Communauté appartient à l'organisation**

### Messages d'Erreur
- `401` : "Authentification requise."
- `400` : "Tous les champs obligatoires doivent être renseignés."
- `404` : "Cercle de soutien introuvable pour votre organisation."
- `409` : "QUOTA_EXCEEDED" (si quota mensuel dépassé)
- Erreurs d'abonnement via `PartnerEntitlementError`

---

## 5. Publications

### Endpoint
`POST /api/posts`

### Champs Requis
- `communityId` (string) - ID du cercle
- `content` (string) - Contenu

### Champs Optionnels
- `title` (string) - Titre
- `type` (string) - Type, défaut "discussion"
- `tags` (string[]) - Tags
- `isAnonymous` (boolean) - Anonymat, défaut false
- `media` (array) - Médias

### Validations
1. **Authentification** : Requise (`requireAuth`)

2. **Accès en écriture** :
   - L'utilisateur doit être membre actif du cercle
   - Le cercle doit avoir le statut `active`
   - Sinon erreur 403 avec message décrivant le problème

3. **Types acceptés** (liste fermée côté serveur) :
   - "discussion"
   - "question"
   - "announcement"
   - "campaign_share"
   - "testimony"

4. **Limite de contenu** :
   - Title : 200 caractères max
   - Content : 8000 caractères max
   - Tags : 10 tags max, 40 caractères chacun

5. **Anonymat** :
   - Si `isAnonymous: true`, `authorId` est NULL dans la base
   - `authorName` devient "Membre"
   - `authorAvatar` devient NULL

### Comportement après Validation
1. **Transaction atomique** :
   - Création de la publication
   - Attribution de 10 points de solidarité à l'auteur

2. **Réponse** :
   - Publication créée retournée avec médias et communauté

### Autorisations
- **Authentification requise**
- **Membre actif du cercle**
- **Cercle actif**

### Messages d'Erreur
- `401` : "Vous devez être connecté pour publier un message."
- `400` : "Le cercle d'entraide et le contenu sont obligatoires."
- Erreurs d'accès via `describeWriteAccess`

---

## 6. Récits/Stories

### Endpoint
`POST /api/stories`

### Champs Requis
- `communityId` (string) - ID du cercle
- `caption` (string) - Légende/description

### Champs Optionnels
- `mediaUrl` (string) - URL du média
- `mediaType` (string) - Type, défaut "image"
- `audioDuration` (number) - Durée audio
- `isVoiceNote` (boolean) - Note vocale, défaut false
- `hoursValidity` (number) - Durée de validité en heures, défaut 48

### Validations
1. **Authentification** : Requise (`requireAuth`)

2. **Accès en écriture** :
   - L'utilisateur doit être membre actif du cercle
   - Le cercle doit être actif

3. **Types acceptés** (liste fermée) :
   - "image"
   - "audio"

4. **Limite de contenu** :
   - Caption : 600 caractères max
   - Validité : 1-168 heures (maximum 7 jours)

5. **Expiration** :
   - Calculée automatiquement : `now + hoursValidity`

### Comportement après Validation
1. **Transaction atomique** :
   - Création de la story
   - Attribution de 10 points de solidarité à l'auteur

2. **Réponse** :
   - Story créée retournée avec communauté

### Autorisations
- **Authentification requise**
- **Membre actif du cercle**
- **Cercle actif**

### Messages d'Erreur
- `401` : "Authentification requise."
- `400` : "Le cercle d'entraide et une légende sont requis."
- Erreurs d'accès via `describeWriteAccess`

---

## 7. Commentaires

### Endpoint
`POST /api/posts/:id/comments`

### Champs Requis
- `content` (string) - Contenu du commentaire

### Champs Optionnels
- `isAnonymous` (boolean) - Anonymat, défaut false

### Validations
1. **Authentification** : Requise (`requireAuth`)

2. **Publication cible** :
   - Doit exister
   - Doit appartenir à un cercle accessible en lecture

3. **Accès en écriture** :
   - L'utilisateur doit être membre actif du cercle

4. **Limite de contenu** :
   - Content : 4000 caractères max

5. **Anonymat** :
   - Si `isAnonymous: true`, `authorId` est NULL
   - `authorName` devient "Membre"

### Comportement après Validation
1. **Transaction atomique** :
   - Création du commentaire
   - Attribution de 5 points de solidarité à l'auteur

2. **Réponse** :
   - Commentaire créé retourné

### Autorisations
- **Authentification requise**
- **Membre actif du cercle**
- **Publication existe et accessible**

### Messages d'Erreur
- `401` : "Connexion requise pour commenter."
- `400` : "Le contenu du commentaire ne peut pas être vide."
- `404` : "Publication introuvable."
- Erreurs d'accès via `describeWriteAccess`

---

## 8. Réactions

### Endpoint
`POST /api/posts/:id/react`

### Champs Requis
- `type` (string) - Type de réaction

### Types valides
- "support"
- "understand"
- "courage"
- "bravo"

### Validations
1. **Authentification** : Requise (`requireAuth`)

2. **Publication cible** :
   - Doit exister
   - Doit appartenir à un cercle accessible en lecture

3. **Type** :
   - Doit être dans la liste des types valides

### Comportement après Validation
1. **Toggle** :
   - Si réaction existe déjà : suppression (toggle off)
   - Sinon : création (toggle on)

2. **Compteurs** :
   - Incrémentation/décrémentation du compteur correspondant sur la publication
   - Transaction atomique

3. **Réponse** :
   - `{ toggled: "added" | "removed", type }`

### Autorisations
- **Authentification requise**
- **Publication accessible en lecture**

### Messages d'Erreur
- `401` : "Connexion requise pour soutenir un membre."
- `400` : "Type de réaction non valide."
- `404` : "Publication introuvable."
- Erreurs d'accès via `resolveReadableCommunityId`

---

## Résumé des Validations

### Sécurité
- **Toutes les opérations d'écriture** requièrent l'authentification (sauf inscription)
- **Autorisations basées sur** :
  - `OrganizationAdmin` pour organisations
  - `CommunityMember` pour communautés
  - `buildReadableCommunityFilter` pour accès lecture
  - `resolveWritableCommunity` pour accès écriture
- **Rôles vérifiés en base** à chaque requête via `requireAuth`

### Intégrité des Données
- **Transactions atomiques** pour les opérations critiques :
  - Inscription (User + CommunityMember + Invitation)
  - Création communauté (quota vérifié dans transaction)
  - Création campagne (quota mensuel vérifié dans transaction)
  - Réactions (compteurs atomiques)
  - Points (attribution atomique)

### Quotas
- **Organisations** : Quotas par formule d'abonnement
- **Communautés** : Quotas par organisation
- **Campagnes** : Quota mensuel par organisation
- **Membres** : Quota par organisation

### Contrôle de Conflit
- **Retry avec backoff** pour les transactions (3 tentatives)
- **Isolation SERIALIZABLE** pour les opérations concurrentes
- **Slug unique** pour éviter les collisions

### Anonymat
- **Posts** : `authorId` NULL si anonyme
- **Stories** : `authorId` peut être NULL (toujours lié pour l'instant)
- **Commentaires** : `authorId` NULL si anonyme
- **Affichage** : Masqué côté frontend ("Membre du Cercle", etc.)

### Points de Solidarité
- **Inscription** : +50 points
- **Publication** : +10 points
- **Story** : +10 points
- **Commentaire** : +5 points
- **Contribution campagne** : +15 points
- **Campagne complétée** : incrément `completedCampaigns`

### Statuts par Défaut
- **Organisation** : `pending` (candidature)
- **Communauté** : `active`
- **Campagne** : `active`
- **Utilisateur** : `active_participant`

### Filtrage de Portée
- **Communautés privées** : Accessibles seulement aux membres
- **Communautés suspendues** : Non accessibles en lecture/écriture
- **Organisations** : Seules les `approved` sont visibles publiquement
- **Campagnes** : Seules `active` et `completed` sont visibles publiquement

---

## Recommandations

### Points Forts
✅ Transactions atomiques pour l'intégrité
✅ Vérification des quotas avant création
✅ Contrôle d'accès basé sur les rôles en base
✅ Anonymat bien géré (null en base, masqué en affichage)
✅ Points de solidarité pour l'engagement
✅ Retry avec isolation SERIALIZABLE pour concurrence

### Points d'Amélioration
⚠️ Pas de validation du format d'email (regex simple possible)
⚠️ Pas de limite de taille pour les médias
⚠️ Pas de rate limiting côté backend (déjà côté routes)
⚠️ Pas de validation de la force du mot de passe
⚠️ Pas de validation du format de téléphone
⚠️ Story anonyme devrait aussi nullifier authorId pour cohérence

### Sécurité
✅ Pas d'oracle d'énumération (réponses identiques pour différentes erreurs)
✅ Portée stricte basée sur l'adhésion
✅ Roles vérifiés en base à chaque requête
✅ JWT valide avec expiration
✅ Hash bcrypt pour les mots de passe

---

## Conclusion

Le système d'enregistrement de Tulizaana est **robuste et sécurisé** avec :
- Des validations strictes côté serveur
- Des transactions atomiques pour l'intégrité
- Un système de quotas pour éviter les abus
- Un contrôle d'accès basé sur les rôles et l'adhésion
- Un système de points pour l'engagement

Les seules améliorations mineures recommandées concernent la validation des formats de données (email, téléphone, mot de passe) et la cohérence de l'anonymat entre posts, stories et commentaires.
