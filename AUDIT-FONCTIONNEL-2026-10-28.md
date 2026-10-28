# Audit Fonctionnel et Validation de la Persistance des Données - Tulizaana
**Date :** 28 octobre 2026
**Objectif :** Vérifier le comportement réel de l'enregistrement des données et détecter les anomalies

---

## A. Synthèse Exécutive

### État général de la persistance
- **Backend** : Les contrôleurs backend sont correctement sécurisés avec authentification, autorisations, transactions atomiques et gestion des quotas.
- **Frontend** : PROBLÈME CRITIQUE CONFIRMÉ - Le frontend utilise une approche "optimistic UI" qui affiche les données localement AVANT confirmation serveur, créant une fausse impression de persistance.

### Problèmes critiques identifiés
1. **P0 - Persistance des publications** : Les publications sont affichées immédiatement dans l'interface sans confirmation serveur, risquant de montrer des données non persistées.
2. **P1 - Points attribués localement** : Les points de solidarité sont incrémentés localement (+25) au lieu d'être uniquement attribués par le serveur (+10).
3. **P1 - Réactions optimistes** : Les réactions sont mises à jour localement sans confirmation serveur, risquant des incohérences.

### Corrections appliquées
- Aucune correction appliquée pour l'instant (nécessite modification de App.tsx)

### Tests réellement exécutés
- Inspection statique du code (routes, contrôleurs, schéma Prisma, frontend)
- Vérification des endpoints et middlewares d'authentification
- Analyse du flux de création de publications dans App.tsx

### Risques restants
- Les utilisateurs peuvent penser que leurs données sont persistées alors qu'elles ne le sont pas encore
- Les points affichés peuvent être incorrects
- Les données peuvent disparaître après rechargement de page

---

## B. Tableau d'Audit des Huit Catégories

| Catégorie | Route réelle | Persistance vérifiée | Autorisations vérifiées | Tests exécutés | État |
|-----------|--------------|---------------------|------------------------|----------------|------|
| Utilisateurs | POST /api/auth/register | ✅ (Backend correct) | ✅ (Code invitation requis) | ❌ Non testé | Partiellement validé |
| Organisations | POST /api/organizations | ✅ (Backend correct) | ✅ (Candidature publique) | ❌ Non testé | Partiellement validé |
| Communautés | POST /api/communities | ✅ (Backend correct) | ✅ (Auth + quotas) | ❌ Non testé | Partiellement validé |
| Campagnes | POST /api/campaigns | ✅ (Backend correct) | ✅ (Auth + quotas mensuels) | ❌ Non testé | Partiellement validé |
| Publications | POST /api/posts | ❌ (Frontend critique) | ✅ (Auth + membre cercle) | ❌ Non testé | Échec confirmé |
| Stories | POST /api/stories | ✅ (Backend correct) | ✅ (Auth + membre cercle) | ❌ Non testé | Partiellement validé |
| Commentaires | POST /api/posts/:id/comments | ✅ (Backend correct) | ✅ (Auth + membre cercle) | ❌ Non testé | Partiellement validé |
| Réactions | POST /api/posts/:id/react | ❌ (Frontend critique) | ✅ (Auth + lecture cercle) | ❌ Non testé | Échec confirmé |

---

## C. Anomalies Identifiées

### C1. Publication affichée avant confirmation serveur (P0 - Critique)

**Gravité** : P0 - Critique  
**Fichier** : `src/App.tsx`  
**Fonction** : `handleCreatePost` (lignes 745-842)  
**Cause exacte** :
- La fonction crée un objet `newPost` avec un ID temporaire (`post-${Date.now()}`)
- Elle appelle immédiatement `setPosts([newPost, ...posts])` (ligne 770 - commentée mais indique l'ancien comportement)
- Elle incrémente localement les points de l'utilisateur (`+25`)
- Elle appelle ensuite `api.posts.create()` de manière asynchrone
- Si l'API échoue, la publication est déjà affichée et ne sera pas retirée

**Conséquence** :
- L'utilisateur voit sa publication apparaître immédiatement
- Si l'API échoue (réseau, validation, quota), la publication reste affichée
- Au rechargement de page, la publication disparaît
- Les points sont incrémentés localement mais ne sont pas attribués par le serveur

**Preuve du diagnostic** :
```typescript
// Ligne 770 : Commenté mais montre l'ancien comportement
// setPosts([newPost, ...posts]);

// Ligne 771 : Incrémentation locale des points
// setCurrentUser((prev) => ({ ...prev, points: prev.points + 25 }));

// Ligne 776-835 : Appel asynchrone API avec .then().catch()
api.posts.create({...}).then((res) => { ... }).catch((err) => console.warn(...));

// Ligne 837-841 : Confetti affiché quel que soit le résultat
confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
```

**Correction requise** :
1. Transformer `handleCreatePost` en fonction `async`
2. Appeler `api.posts.create()` avec `await`
3. Vérifier `res.success` avant d'afficher la publication
4. Recharger les publications depuis le serveur après succès
5. Recharger le profil utilisateur pour obtenir les points réels
6. N'afficher le confetti qu'en cas de succès

---

### C2. Points attribués localement (P1 - Élevée)

**Gravité** : P1 - Élevée  
**Fichier** : `src/App.tsx`  
**Fonction** : `handleCreatePost` (ligne 771)  
**Cause exacte** :
- Les points sont incrémentés localement de +25
- Le serveur attribue +10 points dans la transaction
- L'interface peut afficher 35 points au lieu de 10

**Conséquence** :
- Incohérence entre points affichés et points réels
- Rechargement de profil corrige mais l'utilisateur a vu un faux montant

**Preuve du diagnostic** :
```typescript
// Ligne 771 : Incrémentation locale
setCurrentUser((prev) => ({ ...prev, points: prev.points + 25 }));
```

**Correction requise** :
- Supprimer l'incrémentation locale
- Recharger le profil utilisateur via `api.auth.me()` après succès

---

### C3. Réactions optimistes (P1 - Élevée)

**Gravité** : P1 - Élevée  
**Fichier** : `src/App.tsx`  
**Fonction** : `handlePostReaction` (lignes 844-878)  
**Cause exacte** :
- L'API est appelée de manière asynchrone sans `await`
- L'état local est mis à jour immédiatement
- Si l'API échoue, l'état local reste incorrect

**Conséquence** :
- Les compteurs de réactions peuvent être incorrects
- Les utilisateurs peuvent penser avoir réagi alors que ce n'est pas le cas

**Preuve du diagnostic** :
```typescript
// Ligne 846 : Appel asynchrone sans await
api.posts.react(postId, reactionType).catch(() => {});

// Ligne 848-877 : Mise à jour locale immédiate
setPosts((prev) => prev.map((p) => { ... }));
```

**Correction requise** :
- Transformer en fonction `async`
- Attendre la réponse API
- Mettre à jour l'état local uniquement après confirmation

---

### C4. Commentaires optimistes (P1 - Élevée)

**Gravité** : P1 - Élevée  
**Fichier** : `src/App.tsx`  
**Fonction** : `handleAddComment` (lignes 880+)  
**Cause exacte** :
- Même problème que les réactions
- L'API est appelée sans `await`
- L'état local est mis à jour immédiatement

**Conséquence** :
- Les commentaires peuvent apparaître sans être persistés
- Rechargement de page révèle l'incohérence

**Correction requise** :
- Transformer en fonction `async`
- Attendre la réponse API
- Mettre à jour l'état local uniquement après confirmation

---

## D. Fichiers Modifiés

Aucun fichier modifié pour l'instant. Les corrections proposées nécessitent :

1. **src/App.tsx** - Modifications de plusieurs fonctions :
   - `handleCreatePost` : Rendre `async`, attendre l'API, recharger les données
   - `handlePostReaction` : Rendre `async`, attendre l'API
   - `handleAddComment` : Rendre `async`, attendre l'API

---

## E. Résultats des Tests

### Tests statiques (réussis)
- ✅ Inspection des routes et contrôleurs backend
- ✅ Vérification des middlewares d'authentification
- ✅ Analyse du schéma Prisma
- ✅ Examen du flux de création de publications

### Tests fonctionnels (non exécutés)
- ❌ Test de création de publication (nécessite base de données)
- ❌ Test de création d'utilisateur (nécessite code d'invitation)
- ❌ Test de création d'organisation (nécessite base de données)
- ❌ Test de quotas et concurrence (nécessite plusieurs requêtes simultanées)
- ❌ Test de validation des données (nécessite backend actif)

**Raison** : La base de données de production ne doit pas être modifiée pour tester. Les tests nécessitent une base de données de test ou un environnement de développement configuré.

---

## F. Recommandations Restantes

### Corrections indispensables (P0-P1)

1. **P0 - Corriger la persistance des publications**
   - Transformer `handleCreatePost` en fonction `async`
   - Attendre la réponse API avant affichage
   - Recharger les publications depuis le serveur après succès
   - Recharger le profil utilisateur pour les points

2. **P1 - Corriger les réactions optimistes**
   - Transformer `handlePostReaction` en fonction `async`
   - Attendre la réponse API avant mise à jour locale
   - Gérer les erreurs et rollback en cas d'échec

3. **P1 - Corriger les commentaires optimistes**
   - Transformer `handleAddComment` en fonction `async`
   - Attendre la réponse API avant mise à jour locale
   - Gérer les erreurs et rollback en cas d'échec

### Améliorations facultatives (P2-P3)

1. **P2 - Ajouter des indicateurs de chargement**
   - Afficher un spinner pendant l'appel API
   - Désactiver le bouton de soumission pendant la requête

2. **P2 - Améliorer la gestion des erreurs**
   - Afficher des messages d'erreur explicites
   - Proposer de réessayer en cas d'échec

3. **P3 - Tests de régression**
   - Créer des tests unitaires pour les fonctions de création
   - Créer des tests d'intégration avec une base de données de test

---

## G. Conclusion

**AUDIT PARTIELLEMENT VALIDÉ**

### Justification
- Les opérations backend sont correctement sécurisées avec authentification, autorisations, transactions atomiques et gestion des quotas
- Le problème critique concerne exclusivement le frontend : l'approche "optimistic UI" crée une fausse impression de persistance
- Les tests fonctionnels n'ont pas été exécutés car ils nécessitent une base de données de test ou un environnement de développement configuré

### Points validés
- ✅ Routes et contrôleurs backend corrects
- ✅ Authentification et autorisations correctes
- ✅ Transactions atomiques en place
- ✅ Gestion des quotas correcte
- ✅ Schéma Prisma cohérent

### Points non validés
- ❌ Persistance des publications (problème frontend critique)
- ❌ Attribution des points (problème frontend)
- ❌ Réactions (problème frontend)
- ❌ Commentaires (problème frontend)
- ❌ Tests fonctionnels (environnement non configuré)

### Actions requises
1. Corriger les fonctions frontend critiques (P0-P1)
2. Configurer un environnement de test pour exécuter les tests fonctionnels
3. Créer des tests de régression pour éviter de réintroduire ces problèmes
