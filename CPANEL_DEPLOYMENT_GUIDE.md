# 🚀 Guide de Déploiement Complet de Tulizaana sur cPanel

Ce guide vous accompagne pas à pas pour déployer et rendre 100% opérationnel le backend et le frontend de **Tulizaana** sur votre hébergement cPanel avec **PostgreSQL** et **Node.js**.

---

## Sommaire
1. [Prérequis sur votre hébergement cPanel](#1-prérequis-sur-votre-hébergement-cpanel)
2. [Étape 1 : Exporter et Déposer le Projet sur cPanel](#2-étape-1--exporter-et-déposer-le-projet-sur-cpanel)
3. [Étape 2 : Créer la Base de Données PostgreSQL](#3-étape-2--créer-la-base-de-données-postgresql)
4. [Étape 3 : Configurer le Fichier d'Environnement `.env`](#4-étape-3--configurer-le-fichier-denvironnement-env)
5. [Étape 4 : Configurer l'Application Node.js dans cPanel](#5-étape-4--configurer-lapplication-nodejs-dans-cpanel)
6. [Étape 5 : Exécuter l'Installation et les Migrations (Terminal)](#6-étape-5--exécuter-linstallation-et-les-migrations-terminal)
7. [Étape 6 : Démarrer et Vérifier l'Application](#7-étape-6--démarrer-et-vérifier-lapplication)
8. [Comptes Administrateurs et Codes d'Invitation de Démonstration](#8-comptes-administrateurs-et-codes-dinvitation-de-démonstration)

---

## 1. Prérequis sur votre hébergement cPanel

Assurez-vous que votre pack cPanel dispose de :
* **Setup Node.js App** (CloudLinux / Phusion Passenger) avec Node.js version **20.x** ou **22.x**.
* **PostgreSQL Databases** (ou à défaut une base PostgreSQL externe/gérée comme Supabase, Neon ou un serveur dédié).
* Accès au **Terminal cPanel** (ou accès SSH).

---

## 2. Étape 1 : Exporter et Déposer le Projet sur cPanel

1. Dans Google AI Studio, cliquez sur le menu en haut à droite et choisissez **Export** > **Download ZIP** (ou liez votre compte GitHub).
2. Connectez-vous à votre interface **cPanel**.
3. Ouvrez le **Gestionnaire de fichiers** (*File Manager*).
4. Créez un répertoire pour votre application, par exemple :
   `/home/VOTRE_USER/tulizaana`
5. Téléversez l'archive ZIP téléchargée et extrayez-la dans ce dossier.

---

## 3. Étape 2 : Créer la Base de Données PostgreSQL

Dans le tableau de bord cPanel :
1. Cliquez sur l'icône **Bases de données PostgreSQL** (*PostgreSQL Databases*).
2. **Créer une nouvelle base :** par exemple `tulizaana_db` (nom complet : `votrecompte_tulizaana_db`).
3. **Créer un utilisateur PostgreSQL :** par exemple `tulizaana_usr` avec un mot de passe robuste (ex: `TulizP@ss2026!`).
4. **Associer l'utilisateur à la base :**
   * Sélectionnez l'utilisateur et la base créés, puis cliquez sur **Ajouter**.
   * Cochez **TOUS LES PRIVILÈGES** (*ALL PRIVILEGES*) et validez.

---

## 4. Étape 3 : Configurer le Fichier d'Environnement `.env`

Dans le Gestionnaire de fichiers cPanel (ou via le Terminal) :
1. Créez un fichier nommé **`.env`** à la racine de votre projet `/home/VOTRE_USER/tulizaana/.env`.
2. Remplissez-le avec vos identifiants réels :

```env
# URL de connexion PostgreSQL (remplacez par vos identifiants cPanel)
DATABASE_URL="postgresql://votrecompte_tulizaana_usr:TulizP@ss2026!@localhost:5432/votrecompte_tulizaana_db?schema=public"

# Clé API Google Gemini pour l'IA Ndugu
GEMINI_API_KEY="AIzaSy..."

# Clé secrète pour les sessions et tokens JWT (mettez une chaîne aléatoire longue)
JWT_SECRET="tulizaana_secret_jwt_securise_production_2026_afrique_solidarite"

# URL publique de votre site
APP_URL="https://votre-domaine.com"

# Port (géré automatiquement par Passenger sur cPanel, 3000 par défaut)
PORT=3000
NODE_ENV="production"
```

---

## 5. Étape 4 : Configurer l'Application Node.js dans cPanel

1. Dans cPanel, ouvrez l'outil **Setup Node.js App**.
2. Cliquez sur **Create Application** :
   * **Node.js version :** Sélectionnez `20.x` ou `22.x`.
   * **Application mode :** `Production`.
   * **Application root :** `tulizaana` (le chemin relatif à votre dossier utilisateur).
   * **Application URL :** Votre nom de domaine ou sous-domaine (ex: `tulizaana.mondomaine.com`).
   * **Application startup file :** **`server.js`** *(très important : tapez `server.js`)*.
3. Cliquez sur **CREATE** en haut à droite.
4. cPanel vous affiche en haut une commande pour entrer dans l'environnement virtuel. Cliquez dessus pour copier la commande (ex : `source /home/votreuser/nodevenv/tulizaana/20/bin/activate && cd /home/votreuser/tulizaana`).

---

## 6. Étape 5 : Exécuter l'Installation et les Migrations (Terminal)

Ouvrez l'icône **Terminal** dans cPanel :

1. **Activez l'environnement Node.js de l'application :**
   Collez la commande `source ...` copiée à l'étape précédente.

2. **Installez les dépendances :**
   ```bash
   npm install
   ```

3. **Testez la connexion à la base de données PostgreSQL :**
   ```bash
   npm run db:test
   ```
   *Ce script vérifie immédiatement vos identifiants PostgreSQL et confirme la communication.*

4. **Appliquez la structure complète des 18 tables et index :**
   ```bash
   npx prisma migrate deploy
   ```
   *Toutes les tables (User, Community, Post, PostMedia, Reaction, Message, ModerationReport, etc.) sont créées en quelques secondes.*

5. **Injectez les données initiales de démarrage (Seed) :**
   ```bash
   npm run db:seed
   ```
   *Ce script insère automatiquement les 2 organisations (Panzi et ALD-RDC), les cercles fermés, les utilisateurs socles et les codes d'invitation valides.*

6. **Compilez l'application pour la production :**
   ```bash
   npm run build
   ```
   *Vite génère le client React dans `dist/` et `esbuild` génère le bundle serveur autonome dans `dist/server.cjs`.*

---

## 7. Étape 6 : Démarrer et Vérifier l'Application

1. Retournez dans cPanel dans **Setup Node.js App**.
2. Cliquez sur le bouton **RESTART** de votre application.
3. Ouvrez votre navigateur et testez la route de santé :
   👉 `https://votre-domaine.com/api/health`
   
   Vous devez obtenir la réponse JSON :
   ```json
   {
     "status": "ok",
     "appName": "Tulizaana",
     "version": "1.0.0",
     "services": {
       "geminiAi": { "configured": true, "status": "ready" },
       "database": { "provider": "postgresql", "configured": true, "connected": true }
     }
   }
   ```
4. Ouvrez ensuite `https://votre-domaine.com` pour accéder à la plateforme complète !

---

## 8. Comptes Administrateurs et Codes d'Invitation de Démonstration

Le script de seed peut peupler des comptes de démonstration afin de tester
immédiatement toutes les fonctionnalités. **Aucun mot de passe n'est écrit dans
le dépôt** : chaque compte est créé uniquement si sa variable d'environnement
est renseignée dans votre panneau cPanel avant l'exécution du seed.

### Comptes utilisateurs possibles :
| Rôle réel en base | Email | Mot de passe |
|---|---|---|
| `superadmin` | `admin@tulizaana.org` | variable `ADMIN_SEED_PASSWORD` |
| `partner_admin` | `coordination@panzi-tulizaana.org` | variable `DEMO_PARTNER_ADMIN_PASSWORD` |
| `peer_helper` | `amina.drepa@tulizaana.cd` | variable `DEMO_PEER_HELPER_PASSWORD` |
| `member` | `jean.marc@tulizaana.cd` | variable `DEMO_MEMBER_PASSWORD` |

### Comment procéder

1. Dans **cPanel → Setup Node.js App → Environment**, déclarez les variables
   nécessaires. Ne les laissez pas vides si vous voulez les comptes.
2. Attribuez à chaque valeur un mot de passe d'au moins 12 caractères, généré
   par exemple avec :
   `node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"`
3. Exécutez le seed. Les mots de passe sont hashés en bcrypt avant insertion ;
   la valeur en clair n'est jamais écrite en base ni conservée.

### Comportement du seed

* **Aucune variable `DEMO_*` renseignée** → les trois comptes de démonstration,
  leurs adhésions, leurs publications et les codes d'invitation associés ne sont
  **pas** créés. Un avertissement nomme les variables attendues. Les
  organisations et les cercles, eux, sont toujours créés.
* **Les trois variables `DEMO_*` renseignées** → les trois comptes sont créés
  avec des mots de passe hashés.
* **Configuration partielle** (une ou deux variables sur trois) → le seed
  s'interrompt en indiquant la variable manquante. Aucun mot de passe par
  défaut n'existe : il est impossible d'obtenir un compte avec un secret connu
  du dépôt.

> 🔐 **Les variables de mots de passe sont lues par le seed uniquement.** Elles
> ne doivent jamais être préfixées par `VITE_`, sinon elles seraient
> compilées dans le bundle public. Les droits administrateur ne sont jamais
> stockés dans le navigateur : ils sont vérifiés côté serveur à chaque requête
> (`requireAuth` + relecture du rôle en base).
>
> Après connexion, changez les mots de passe de démonstration : ce sont des
> comptes de test, pas des accès de production.

### Codes d'invitation de démonstration :
ils ne sont émis que si un compte émetteur existe (compte `superadmin` ou
`partner_admin` ci-dessus) :

* **`DREPA-2026-KIN`** : Rejoint le cercle *Drépanocytose & Espoir Kinshasa* (ALD-RDC).
* **`PANZI-RESILIENCE`** : Rejoint le cercle *Renaissance & Résilience Bukavu* (Fondation Panzi).

---

## 💡 En cas de besoin
Si vous devez relancer l'application après une modification de code :
1. Exécutez `npm run build` dans le terminal.
2. Cliquez sur **Restart** dans l'interface cPanel *Setup Node.js App*.
