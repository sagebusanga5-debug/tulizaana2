# Guide de configuration pour le déploiement

## Problème actuel

Votre projet utilise un **serveur Express long-running** (`server.ts`), mais Vercel est conçu pour des **serverless functions**. C'est pourquoi :
- Le back-office ne fonctionne pas (API backend inaccessible)
- L'authentification Google ne fonctionne pas (Firebase non configuré)

## Solution recommandée : Séparer Frontend et Backend

### Option 1 : Déployer sur Render (RECOMMANDÉ - Plus simple)

1. Créez un compte sur [render.com](https://render.com)
2. Cliquez "New" → "Web Service"
3. Connectez votre repository GitHub
4. Configurez :
   - **Name**: tulizaana-backend
   - **Region**: choisissez la région la plus proche (ex: Oregon)
   - **Branch**: main
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. **IMPORTANT**: Dans "Advanced", assurez-vous que "Install Command" est vide (laissez Render utiliser npm)
6. Cliquez "Create Web Service"

### Étape 2 : Configurer les variables d'environnement sur Render

Une fois le service créé, allez dans Render → Votre service → Environment et ajoutez ces variables :

```bash
# Base de données (Supabase) - OBLIGATOIRE
DATABASE_URL=votre_url_supabase_pooler
DIRECT_URL=votre_url_supabase_direct

# Sécurité - OBLIGATOIRE
JWT_SECRET=votre_secret_jwt_32_caracteres_minimum
# Générez-le avec: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# Firebase (pour Google Auth) - OBLIGATOIRE si vous voulez Google Auth
FIREBASE_PROJECT_ID=votre_project_id
FIREBASE_CLIENT_EMAIL=votre_client_email
FIREBASE_PRIVATE_KEY=votre_private_key

# Cloudinary - OBLIGATOIRE pour les uploads
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret

# Supabase (optionnel)
SUPABASE_URL=votre_supabase_url
SUPABASE_SECRET_KEY=votre_supabase_secret_key

# Google Gemini (optionnel)
GEMINI_API_KEY=votre_gemini_api_key

# Node environment
NODE_ENV=production
PORT=3000
```

### Étape 3 : Mettre à jour le frontend pour pointer vers le backend Render

Dans votre projet Vercel :
1. Allez dans Vercel → Votre projet → Settings → Environment Variables
2. Ajoutez :
   ```bash
   VITE_API_URL=https://votre-projet.onrender.com
   ```
3. Redéployez votre projet Vercel

### Étape 4 : Configurer Firebase pour Google Auth

1. Allez dans [Firebase Console](https://console.firebase.google.com)
2. Project Settings → Authentication → Sign-in method → Google
3. Dans "Authorized domains", ajoutez : `votre-projet.onrender.com`
4. Project Settings → Service Accounts → Generate New Private Key
5. Téléchargez le JSON et copiez les valeurs dans les variables Render

## Option 2 : Déployer sur Railway (Alternative)

1. Créez un compte sur [railway.app](https://railway.app)
2. Cliquez "New Project" → "Deploy from GitHub repo"
3. Sélectionnez votre repository Tulizaana
4. Railway détectera automatiquement votre projet Node.js
5. Configurez les mêmes variables d'environnement que ci-dessus
6. Notez l'URL Railway et configurez `VITE_API_URL` sur Vercel

## Alternative : Utiliser Vercel avec refactor (avancé)

Si vous voulez absolument utiliser Vercel pour tout, vous devez refactoriser votre code pour utiliser des serverless functions. C'est un travail important qui nécessite :

1. Convertir chaque route Express en une fonction serverless
2. Supprimer le serveur Express central
3. Adapter la logique de middleware pour serverless
4. Utiliser Vercel Postgres ou Supabase pour la base de données

Cette approche n'est pas recommandée pour votre projet actuel car elle nécessite beaucoup de refactoring.

## Résolution du problème Firebase (Google Auth)

Une fois le backend déployé sur Railway/Render :

1. Allez dans Firebase Console → Project Settings → Service Accounts
2. Cliquez "Generate New Private Key"
3. Téléchargez le fichier JSON
4. Copiez les valeurs dans les variables d'environnement :
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (incluez les \n pour les sauts de ligne)

5. Assurez-vous que votre projet Firebase est configuré pour autoriser le domaine de votre backend :
   - Firebase Console → Authentication → Sign-in method → Google
   - Ajoutez votre domaine Railway/Render dans "Authorized domains"

## Test du déploiement

Une fois déployé :

1. Testez l'API : `https://votre-backend.railway.app/api/health`
2. Testez l'authentification email/mot de passe
3. Testez l'authentification Google
4. Testez l'accès au back-office

## Résumé

Pour résoudre vos problèmes actuels :
1. **Backend** : Déployez sur Railway ou Render (pas Vercel)
2. **Frontend** : Gardez sur Vercel
3. **Firebase** : Configurez les variables d'environnement sur le backend
4. **CORS** : Ajoutez l'URL Vercel dans les origines autorisées du backend
