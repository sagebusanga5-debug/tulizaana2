# Audit complet - Persistance des données dynamiques

**Date :** 25 octobre 2026  
**Périmètre :** Publications (posts), profils utilisateurs, synchronisation frontend/backend, base de données Prisma/Supabase

## 1. Architecture de persistance

### Backend
- **ORM :** Prisma Client ([`server/config/database.ts`](server/config/database.ts))
- **Base de données :** PostgreSQL via Supabase (configurée dans `.env` avec `DATABASE_URL`, `POSTGRES_PRISMA_URL`)
- **Contrôleurs :** [`server/controllers/post.controller.ts`](server/controllers/post.controller.ts), [`server/controllers/auth.controller.ts`](server/controllers/auth.controller.ts), etc.
- **Routes montées :** `/api/posts`, `/api/auth`, etc. dans [`server.ts`](server.ts)

### Frontend
- **Client API :** [`src/services/api.ts`](src/services/api.ts) avec `credentials: 'include'` pour les cookies HTTPOnly
- **État local :** React state dans [`src/App.tsx`](src/App.tsx) avec mise à jour optimiste
- **Chargement initial :** Communautés, campagnes, organisations, stories et maintenant publications ([`src/App.tsx:662-706`](src/App.tsx:662-706))

## 2. Flux de création de publication

### Frontend ([`src/App.tsx:703-819`](src/App.tsx:703-819))
1. Crée un objet `Post` local avec ID temporaire (`post-${Date.now()}`)
2. Met à jour l'état local immédiatement (`setPosts([newPost, ...posts])`) - **optimiste**
3. Appelle `api.posts.create()` avec format aligné : `media` en tableau d'objets
4. En cas de succès, recharge la liste depuis l'API pour synchroniser
5. En cas d'échec, log l'erreur mais conserve l'état local

### API Client ([`src/services/api.ts:333-368`](src/services/api.ts:333-368))
- Transforme correctement `mediaUrl/mediaType` ou `media[]` vers le format attendu par le backend
- Envoie en JSON avec `credentials: 'include'`

### Backend ([`server/controllers/post.controller.ts:145-270`](server/controllers/post.controller.ts:145-270))
1. Vérifie la connexion DB via `getPrismaClient()` - retourne 503 si non connecté
2. Vérifie l'authentification (`req.user` requis) - 401 sinon
3. Valide les champs obligatoires (communityId, content non vide)
4. Vérifie les droits d'écriture via `resolveWritableCommunity()` - sécurité stricte (Chantier 5)
5. Crée le post dans une transaction Prisma avec ses médias
6. Retourne le post créé

## 3. Points bloquants identifiés

### A. Problème d'authentification / session
**Critique**
- Le backend exige `requireAuth` pour `POST /api/posts` ([`server/routes/post.routes.ts:14`](server/routes/post.routes.ts:14))
- L'authentification repose sur des cookies HTTPOnly JWT ([`server/middleware/auth.ts`](server/middleware/auth.ts))
- Si l'utilisateur n'est pas authentifié ou si les cookies ne sont pas envoyés correctement, la création échouera avec 401
- **Le frontend fait des mises à jour optimistes même sans être connecté** - les posts apparaissent localement mais ne sont jamais sauvegardés en DB

### B. Droits d'écriture sur le cercle communautaire
**Critique**
- `resolveWritableCommunity()` vérifie que l'utilisateur est membre actif du cercle et que le cercle est actif
- Si l'utilisateur n'est pas membre du cercle cible, la création est refusée (403/404 selon le cas)
- Le frontend utilise `activeCommunity` ou la communauté sélectionnée, mais l'utilisateur doit effectivement en être membre en base de données
- **C'est une mesure de sécurité (Chantier 5) qui peut bloquer la création si les adhésions ne sont pas synchronisées**

### C. Format de réponse API
**Partiellement corrigé**
- L'API client extrait maintenant `res.data` de manière flexible
- Le backend `sendSuccess()` envoie les données dans le corps de réponse - le format dépend de `sendSuccess`
- Il faut s'assurer que le parsing côté frontend correspond bien au format réel

### D. Synchronisation des médias
**Corrigé**
- Alignement fait entre frontend et backend pour le format `media[]`
- Le backend crée les entrées `PostMedia` dans la transaction

### E. Chargement initial des publications
**Ajouté**
- Chargement depuis l'API au démarrage ([`src/App.tsx:672-706`](src/App.tsx:672-706))
- Fusion avec l'état local pour éviter les doublons

## 4. Causes probables de l'échec persistant

| Cause | Probabilité | Explication |
|-------|-------------|-------------|
| **Non authentifié** | Très élevée | Si `req.user` est undefined, `createPost` retourne 401. L'utilisateur doit être connecté avec un compte valide en base. |
| **Pas membre du cercle** | Très élevée | `resolveWritableCommunity` refuse si l'utilisateur n'est pas membre actif. Beaucoup d'utilisateurs de démo peuvent ne pas avoir d'adhésion enregistrée. |
| **Base de données non connectée** | Moyenne | `getPrismaClient()` retourne null en environnement sans DB configurée → 503. Vérifier la config DB. |
| **Cookies non envoyés** | Moyenne | Sur certains déploiements (CORS/proxy), les cookies HTTPOnly ne sont pas transmis correctement. |
| **Erreur silencieuse côté frontend** | Moyenne | Le frontend fait un `catch` et log en console mais l'utilisateur ne voit pas l'erreur. |

## 5. Solutions proposées

### Solution immédiate (diagnostic)
1. **Vérifier l'authentification** : S'assurer que l'utilisateur est connecté et que les cookies sont présents
2. **Vérifier l'adhésion au cercle** : L'utilisateur doit être membre du `communityId` visé
3. **Activer les logs** : Examiner les erreurs console réseau (onglet Network) pour voir la réponse exacte de l'API

### Solution technique
1. **Améliorer le feedback utilisateur** : Afficher un message d'erreur si la création échoue au lieu de juste logger
2. **Vérifier les adhésions** : S'assurer que les utilisateurs de démo ont bien des entrées dans `CommunityMember`
3. **Gérer les erreurs de manière plus explicite** : Dans le frontend, alerter l'utilisateur en cas d'échec de persistance
4. **Mode dégradé plus clair** : Indiquer clairement quand on est en mode local uniquement

### Corrections à appliquer
```typescript
// Dans App.tsx handleCreatePost - améliorer le feedback
api.posts.create({...})
  .then((res) => {
    if (!res.success) {
      alert(`Erreur: ${res.error || 'Impossible de sauvegarder la publication'}`);
      // Optionnel: retirer le post optimiste ou le marquer
    } else {
      // recharger...
    }
  })
  .catch((err) => {
    alert('Erreur réseau lors de la sauvegarde de la publication');
    console.error(err);
  });
```

## 6. Recommandations

**Priorité 1 - Immédiate :**
- Tester la création de publication en environnement local avec un utilisateur authentifié et membre d'un cercle
- Vérifier les logs du serveur pour voir les erreurs exactes retournées par `createPost`
- S'assurer que la base de données est bien connectée (`checkDatabaseHealth()`)

**Priorité 2 - Court terme :**
- Ajouter un indicateur visuel quand une publication n'est pas synchronisée avec le serveur
- Améliorer la gestion d'erreurs pour informer l'utilisateur
- Vérifier les adhésions des comptes de démo dans la base

**Priorité 3 - Moyen terme :**
- Ajouter des tests d'intégration pour le flux de création de publication
- Mettre en place un système de retry pour les publications en échec
- Améliorer la résilience avec un mode hors-ligne plus explicite

## Conclusion

Le code côté frontend et backend est correctement aligné maintenant (format media, chargement depuis API). La principale cause probable est **l'autorisation** : soit l'utilisateur n'est pas authentifié, soit il n'est pas membre actif du cercle ciblé. Ces vérifications sont intentionnelles pour des raisons de sécurité (Chantier 5). L'application fonctionne en mode optimiste (affichage local) même en cas d'échec de persistance, ce qui donne l'impression que ça fonctionne mais que rien n'est enregistré en base de données.
