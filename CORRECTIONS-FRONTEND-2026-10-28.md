# Corrections Frontend - Tulizaana
**Date :** 28 octobre 2026
**Basé sur :** AUDIT-FONCTIONNEL-2026-10-28.md

---

## Résumé

Ce document contient les corrections proposées pour les problèmes critiques identifiés lors de l'audit fonctionnel.

---

## Correction C1 : Publication affichée avant confirmation serveur (P0)

### Fichier
`src/App.tsx` - Fonction `handleCreatePost` (lignes 745-842)

### Correction proposée

```typescript
// Avant (PROBLÈME CRITIQUE)
const handleCreatePost = (newPostData: Partial<Post>) => {
  const newPost: Post = { ... };
  setPosts([newPost, ...posts]); // Affiché immédiatement
  setCurrentUser((prev) => ({ ...prev, points: prev.points + 25 })); // Points locaux
  
  api.posts.create({...}).then((res) => {
    // Recharge les publications après succès
  }).catch((err) => console.warn(...));
  
  confetti({ ... }); // Affiché même en cas d'échec
};

// Après (CORRECT)
const handleCreatePost = async (newPostData: Partial<Post>) => {
  const targetComm = (communities || []).find((c) => c.id === newPostData.communityId) || activeCommunity;
  const isAnon = Boolean(newPostData.isAnonymous || currentUser.isAnonymous);

  // Validation avant envoi
  if (!newPostData.content?.trim() && !newPostData.media?.length) {
    alert('Le contenu de la publication est requis.');
    return;
  }

  // Persistance synchrone sur l'API PostgreSQL D'ABORD
  const res = await api.posts.create({
    communityId: newPostData.communityId || activeCommunity?.id || 'comm-drepano',
    content: newPostData.content || '',
    title: newPostData.title,
    type: newPostData.type || 'question',
    tags: newPostData.tags || [],
    isAnonymous: isAnon,
    media: newPostData.media?.map((m: any) => ({
      type: m.type || "image",
      url: m.url,
      secureUrl: m.url,
    })) || [],
  });

  if (!res.success) {
    alert(`Erreur lors de la création de la publication: ${res.error || 'Erreur inconnue'}`);
    return;
  }

  // Succès : Recharger les publications depuis le serveur pour refléter la persistance
  const listRes = await api.posts.list();
  if (listRes.success && listRes.data) {
    const data = listRes.data;
    const list = Array.isArray(data)
      ? data
      : Array.isArray((data as any)?.posts)
      ? (data as any).posts
      : Array.isArray((listRes as any)?.posts)
      ? (listRes as any).posts
      : [];

    const apiPosts = list.map((p: any) => ({
      id: p.id,
      authorId: p.authorId || currentUser?.id || 'unknown',
      authorName: p.isAnonymous ? 'Anonyme' : p.authorName || currentUser?.name || 'Membre',
      authorAvatar: p.isAnonymous
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        : p.authorAvatar || currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      authorStatus: currentUser?.status || 'member',
      isAnonymous: !!p.isAnonymous,
      communityId: p.communityId,
      communityName: p.communityName,
      type: p.type || 'discussion',
      title: p.title || '',
      content: p.content || '',
      media: Array.isArray(p.media)
        ? p.media.map((m: any) => ({ id: m.id, type: m.type, url: m.url, thumbnailUrl: m.thumbnailUrl }))
        : [],
      tags: Array.isArray(p.tags) ? p.tags : [],
      timestamp: p.createdAt ? new Date(p.createdAt).toLocaleString('fr-FR') : "A l'instant",
      reactions: p.reactions || { support: 0, understand: 0, courage: 0, bravo: 0 },
      commentsCount: p.commentsCount || 0,
      comments: [],
    }));
    setPosts(apiPosts);

    // Recharger le profil utilisateur pour mettre à jour les points (attribués par le serveur)
    const meRes = await api.auth.me();
    if (meRes.success && meRes.data) {
      setCurrentUser((prev) => ({ ...prev, points: meRes.data.points || prev.points }));
    }

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });
  } else {
    alert('Erreur lors du rechargement des publications.');
  }
};
```

### Changements clés
1. Transformé en fonction `async`
2. Supprimé la création d'objet `newPost` temporaire
3. Supprimé l'affichage immédiat avec `setPosts`
4. Supprimé l'incrémentation locale des points
5. Ajouté `await` avant `api.posts.create()`
6. Vérification de `res.success` avant de continuer
7. Rechargement des publications depuis le serveur après succès
8. Rechargement du profil utilisateur pour les points réels
9. Confetti affiché uniquement en cas de succès

---

## Correction C2 : Réactions optimistes (P1)

### Fichier
`src/App.tsx` - Fonction `handlePostReaction` (lignes 844-878)

### Correction proposée

```typescript
// Avant (PROBLÈME)
const handlePostReaction = (postId: string, reactionType: 'support' | 'understand' | 'courage' | 'bravo') => {
  api.posts.react(postId, reactionType).catch(() => {}); // Pas d'await
  
  setPosts((prev) => prev.map((p) => { ... })); // Mise à jour immédiate
};

// Après (CORRECT)
const handlePostReaction = async (postId: string, reactionType: 'support' | 'understand' | 'courage' | 'bravo') => {
  const res = await api.posts.react(postId, reactionType);
  
  if (!res.success) {
    alert(`Erreur lors de la réaction: ${res.error || 'Erreur inconnue'}`);
    return;
  }

  // Mise à jour locale uniquement après confirmation serveur
  setPosts((prev) =>
    prev.map((p) => {
      if (p.id === postId) {
        const currentReactions = { ...p.reactions };
        const previousReaction = p.userReaction;

        if (previousReaction === reactionType) {
          // Toggle off
          currentReactions[reactionType] = Math.max(0, currentReactions[reactionType] - 1);
          return { ...p, reactions: currentReactions, userReaction: undefined };
        } else {
          // If already had another reaction, decrement it
          if (previousReaction) {
            currentReactions[previousReaction] = Math.max(0, currentReactions[previousReaction] - 1);
          }
          currentReactions[reactionType] = (currentReactions[reactionType] || 0) + 1;

          // Trigger slight haptic / visual celebration for supportive reactions
          confetti({
            particleCount: 20,
            spread: 40,
            origin: { y: 0.7 },
          });

          return { ...p, reactions: currentReactions, userReaction: reactionType };
        }
      }
      return p;
    })
  );
};
```

### Changements clés
1. Transformé en fonction `async`
2. Ajouté `await` avant `api.posts.react()`
3. Vérification de `res.success` avant mise à jour locale
4. Mise à jour locale uniquement après confirmation serveur

---

## Correction C3 : Commentaires optimistes (P1)

### Fichier
`src/App.tsx` - Fonction `handleAddComment` (lignes 880+)

### Correction proposée

```typescript
// Avant (PROBLÈME)
const handleAddComment = (postId: string, content: string, isAnonymous?: boolean) => {
  const isAnon = Boolean(isAnonymous || currentUser.isAnonymous);
  
  api.posts.comment(postId, content, isAnon).catch(() => {}); // Pas d'await
  
  setPosts((prev) => prev.map((p) => { ... })); // Mise à jour immédiate
};

// Après (CORRECT)
const handleAddComment = async (postId: string, content: string, isAnonymous?: boolean) => {
  const isAnon = Boolean(isAnonymous || currentUser.isAnonymous);

  const res = await api.posts.comment(postId, content, isAnon);
  
  if (!res.success) {
    alert(`Erreur lors de l'ajout du commentaire: ${res.error || 'Erreur inconnue'}`);
    return;
  }

  // Mise à jour locale uniquement après confirmation serveur
  setPosts((prev) =>
    prev.map((p) => {
      if (p.id === postId) {
        const newComment = {
          id: res.data?.id || `comm-${Date.now()}`,
          postId,
          authorId: currentUser.id,
          authorName: isAnon ? 'Anonyme' : currentUser.name,
          authorAvatar: isAnon
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            : currentUser.avatar,
          content,
          isAnonymous: isAnon,
          timestamp: 'À l’instant',
        };
        return {
          ...p,
          comments: [...(p.comments || []), newComment],
          commentsCount: (p.commentsCount || 0) + 1,
        };
      }
      return p;
    })
  );
};
```

### Changements clés
1. Transformé en fonction `async`
2. Ajouté `await` avant `api.posts.comment()`
3. Vérification de `res.success` avant mise à jour locale
4. Mise à jour locale uniquement après confirmation serveur

---

## Étapes d'application

1. Ouvrir `src/App.tsx`
2. Localiser la fonction `handleCreatePost` (lignes 745-842)
3. Remplacer par la version corrigée proposée
4. Localiser la fonction `handlePostReaction` (lignes 844-878)
5. Remplacer par la version corrigée proposée
6. Localiser la fonction `handleAddComment` (lignes 880+)
7. Remplacer par la version corrigée proposée
8. Exécuter `npm run typecheck` pour vérifier TypeScript
9. Tester manuellement dans l'interface utilisateur
10. Commiter et pousser les changements

---

## Validation après correction

Après application des corrections, vérifier :

1. **Publications**
   - Créer une publication
   - Vérifier qu'elle n'apparaît pas immédiatement
   - Vérifier qu'elle apparaît après confirmation serveur
   - Recharger la page et vérifier qu'elle persiste
   - Vérifier que les points sont corrects (10, pas 25)

2. **Réactions**
   - Cliquer sur une réaction
   - Vérifier qu'elle se met à jour après confirmation serveur
   - Tester le toggle (cliquer à nouveau)
   - Recharger la page et vérifier la persistance

3. **Commentaires**
   - Ajouter un commentaire
   - Vérifier qu'il apparaît après confirmation serveur
   - Recharger la page et vérifier la persistance

---

## Risques et atténuations

### Risques
- L'interface peut sembler moins réactive (plus lente)
- Les utilisateurs peuvent penser que quelque chose ne fonctionne pas

### Atténuations
- Ajouter un indicateur de chargement (spinner) pendant l'appel API
- Désactiver le bouton de soumission pendant la requête
- Afficher un message explicite "Publication en cours..."
