# Audit complet du stockage des données - Cloudinary / Stockage média

**Date :** 25 octobre 2026  
**Périmètre :** Configuration Cloudinary, service d'upload, routes, stockage local/fallback, sécurité  
**Statut :** Analyse du code source existant

## 1. Vue d'ensemble

L'application utilise un système d'upload hybride avec un fallback local. La configuration Cloudinary est bien présente, mais l'intégration effective côté contrôleur d'upload diffère de ce qui est annoncé dans les commentaires.

## 2. Configuration Cloudinary

**Fichier :** [`server/config/cloudinary.ts`](server/config/cloudinary.ts)

- **Configuration supportée :** `CLOUDINARY_URL` (format `cloudinary://key:secret@cloud_name`) ou variables individuelles (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`). 
- **Initialisation :** Automatique au chargement si configuré ([lignes 37-39](server/config/cloudinary.ts:37-39)). `initCloudinary()` applique `secure: true`.
- **Fonction d'upload :** `uploadToCloudinary(dataUriOrBuffer, options)` ([lignes 45-87](server/config/cloudinary.ts:45-87)) - upload vers Cloudinary avec `resource_type: "auto"`, optimisations d'image (`quality: "auto:good"`, `fetch_format: "auto"`), tags par défaut `["tulizaana", "community"]`, dossier configurable (défaut `"tulizaana"`).
- **Vérification de santé :** `checkCloudinaryHealth()` teste la connectivité via `cloudinary.api.ping()` ([lignes 89-119](server/config/cloudinary.ts:89-119)).

**Constat :** La configuration et les utilitaires Cloudinary existent et sont fonctionnels au niveau SDK. Ils ne sont toutefois **pas utilisés par le contrôleur d'upload principal**.

## 3. Service Cloudinary (scaffold)

**Fichier :** [`server/services/cloudinary.service.ts`](server/services/cloudinary.service.ts)

- Actuellement un **scaffold** (phase ultérieure). `uploadMediaPlaceholder()` lève une erreur indiquant que le service est prévu pour une phase ultérieure ([lignes 18-20](server/services/cloudinary.service.ts:18-20)).
- L'interface `UploadResult` est définie mais non utilisée par l'implémentation active.

**Constat :** Le service dédié est en attente d'implémentation complète.

## 4. Contrôleur d'upload

**Fichier :** [`server/controllers/upload.controller.ts`](server/controllers/upload.controller.ts)

**Comportement actuel :**
1. Accepte un payload `{ dataUrl, filename, type, folder }` ([ligne 43](server/controllers/upload.controller.ts:43))
2. Si `dataUrl` est une URL distante `http(s)://`, il vérifie le schéma autorisé (`ALLOWED_REMOTE_SCHEMES = ["https://"]`) et renvoie directement l'URL avec `provider: "cloudinary_remote"` ([lignes 50-57](server/controllers/upload.controller.ts:50-57)) - **ce cas ne fait pas appel à l'API Cloudinary, il accepte juste une URL HTTPS fournie par le client**.
3. Pour les données base64 (`data:<mime>;base64,...`) : validation du format, vérification du type MIME contre une whitelist ([lignes 11-23](server/controllers/upload.controller.ts:11-23)), décodage en buffer, validation de taille (max 20 Mo) ([lignes 59-77](server/controllers/upload.controller.ts:59-77)), détermination de l'extension, génération d'un nom de fichier unique, **écriture sur disque local dans `./uploads/`** ([lignes 94-110](server/controllers/upload.controller.ts:94-110)), retour avec `provider: "local"`.
4. Le message de retour pour le fallback local indique : *"Pour héberger directement sur Cloudinary, renseignez CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET"* ([ligne 107](server/controllers/upload.controller.ts:107)) - ce qui suggère que Cloudinary devrait être utilisé s'il est configuré, **mais ce n'est pas implémenté dans le code actuel**.

**Problèmes constatés :**
- **Incohérence avec les commentaires :** Le commentaire en tête ([lignes 37-40](server/controllers/upload.controller.ts:37-40)) annonce "Priorité absolue à Cloudinary dès que configuré" et "Repli local résilient", mais le code n'appelle jamais `uploadToCloudinary()` et ne vérifie pas `isCloudinaryConfigured()`.
- **Absence d'intégration Cloudinary effective :** Même si Cloudinary est configuré, tous les uploads base64 sont écrits localement. Seules les URLs HTTPS distantes sont acceptées telles quelles (sans vérification côté serveur d'origine/validité autre que le schéma).
- **Dépendance au système de fichiers local :** En environnement serverless (Vercel) le disque est éphémère - les fichiers écrits en local ne persisteront pas entre invocations/redéploiements. C'est problématique pour la production.
- **Pas de nettoyage/gestion des fichiers locaux** : Aucun mécanisme de suppression, pas de quota par utilisateur visible.

## 5. Routage et exposition

**Fichier :** [`server/routes/upload.routes.ts`](server/routes/upload.routes.ts)
- Route `POST /` avec middlewares : `requireAuth`, `rateLimit` (20 req/min par fenêtre) ([lignes 8-15](server/routes/upload.routes.ts:8-15))
- Protégé par authentification et rate-limiting - bon point de sécurité.

**Fichier :** [`server.ts`](server.ts)
- Route montée via `app.use('/api/upload', uploadRoutes)` (montage dans le serveur principal)
- Dossier `uploads/` servi statiquement : `app.use("/uploads", express.static(path.join(process.cwd(), "uploads")))` ([ligne 230](server.ts:230)) - **exposition publique sans authentification** des fichiers uploadés localement.

**Constat :** Les fichiers uploadés localement sont accessibles publiquement via `/uploads/*`. Pas de contrôle d'accès par ressource. Si des documents sensibles sont uploadés, ils seraient directement accessibles s'ils sont découverts.

## 6. Types de fichiers autorisés

Whitelist stricte dans le contrôleur ([lignes 11-23](server/controllers/upload.controller.ts:11-23)) :
- Images : `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/webm`
- Audio : `audio/ogg`, `audio/opus`, `audio/wav`, `audio/mpeg`, `audio/mp3`
- Documents : `application/pdf`

Taille maximale : 20 Mo. Bon encadrement global.

## 7. Sécurité

**Points positifs :**
- Authentification requise (`requireAuth`) sur l'endpoint d'upload
- Rate-limiting appliqué (20/min)
- Whitelist stricte de MIME types
- Limite de taille (20 Mo)
- Génération de nom de fichier aléatoire/non-prévisible (`crypto.randomBytes(12) + timestamp`)
- Validation du format data URL base64
- Seuls les schémas HTTPS autorisés pour les URLs distantes
- Cloudinary configuré en mode `secure: true`

**Points d'amélioration / risques :**
- **Absence d'intégration Cloudinary effective** : En production serverless, le stockage local est non-persistant. Si l'intention est d'utiliser Cloudinary, l'implémentation doit être complétée.
- **Exposition publique des uploads locaux** : `express.static("/uploads")` sans contrôle d'accès - tout fichier uploadé localement est accessible à quiconque connaît l'URL. Pour des contenus sensibles (témoignages, documents médicaux/ONG), ce comportement est problématique.
- **Vérification de contenu limitée** : Seul le MIME type est vérifié (header côté client dans le data URL), pas de scan de contenu/magic bytes côté serveur. Un attaquant pourrait théoriquement contourner en forgeant l'en-tête MIME.
- **Pas de transformation/optimisation systématique** : Seul `uploadToCloudinary` applique des transformations; le chemin local ne le fait pas.
- **Logs sensibles** : Messages d'erreur génériques, ce qui est bien. Mais pas de journalisation d'audit spécifique aux uploads visible dans le contrôleur.
- **Gestion des URLs distantes** : Le contrôleur accepte directement n'importe quelle URL `https://` sans validation de domaine - potentiellement problématique si utilisé pour afficher du contenu non fiable.

## 8. Recommandations

### Prioritaires
1. **Implémenter l'upload vers Cloudinary quand configuré** : Modifier `uploadMedia` pour utiliser `uploadToCloudinary` si `isCloudinaryConfigured()` est vrai, avec fallback local uniquement en développement/hors-ligne explicite. Actuellement l'inverse est effectif.
2. **Sécuriser l'accès aux fichiers locaux** : Si le stockage local doit être conservé, ne pas exposer tout le dossier publiquement sans authentification/autorisations. Préférer Cloudinary pour la production (notamment serverless).
3. **Renforcer la validation** : Ajouter une vérification des magic bytes (signature de fichier) en plus du MIME type pour les uploads base64.
4. **Compléter le service Cloudinary** : Remplacer le scaffold par une implémentation cohérente avec le reste du codebase.

### Améliorations
5. **Ajouter un journal d'audit** : Enregistrer les uploads (utilisateur, type, taille, provider) dans `AuditLog`.
6. **Gérer la suppression** : Ajouter des endpoints pour supprimer les fichiers (Cloudinary via API `destroy`, local avec précaution).
7. **Politique de rétention** : Définir clairement la durée de conservation et le nettoyage.
8. **Contrôles additionnels** : Limiter par type de contenu selon le contexte d'usage (avatar vs document légal vs audio de témoignage).

## 9. État de déploiement

- **Vercel (serverless)** : Le stockage local (`/uploads`) est **non-persistant**. Les fichiers uploadés seront perdus entre redéploiements/fonctions froides. Cloudinary est donc **fortement recommandé** pour cet environnement.
- **Render** : Peut utiliser un disque persistant, mais Cloudinary reste préférable pour la scalabilité/CDN.
- **Configuration actuelle** : Le code est prêt au niveau config, mais l'intégration effective manque dans le contrôleur.

## Conclusion

L'infrastructure Cloudinary est bien amorcée (config + utilitaires), mais **l'upload effectif n'utilise pas Cloudinary** - il écrit systématiquement sur disque local pour les données base64. C'est la principale lacune à corriger pour un déploiement fiable en environnement serverless. La sécurité de base (auth, rate-limit, whitelist MIME, taille) est présente, mais l'exposition publique du dossier local et l'absence de validation par magic bytes méritent attention.
