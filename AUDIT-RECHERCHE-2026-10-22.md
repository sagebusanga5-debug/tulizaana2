# Audit de l'Onglet Recherche - Tulizaana
**Date :** 22 octobre 2026
**Composant :** `GlobalSearchView.tsx`
**Objectif :** Rendre la recherche intuitive, ergonomique et fluide comme les réseaux sociaux modernes

---

## 1. État Actuel

### Fonctionnalités Existantes
- ✅ Recherche manuelle via formulaire
- ✅ Minimum 2 caractères requis
- ✅ Résultats groupés par type (organisations, communautés, campagnes, posts, users)
- ✅ Affichage avec icônes et descriptions
- ✅ Compteur de résultats total
- ✅ Indicateur de chargement
- ✅ Messages d'erreur vides

### Structure des Résultats
```
Organisations (X)
├── Carte avec image + titre + description + contexte
Communautés (Y)
├── Carte avec image + titre + description + contexte
Campagnes (Z)
├── Carte avec image + titre + description + contexte
Posts (W)
├── Carte avec image + titre + description + contexte
Membres (V)
├── Carte avec image + titre + description + contexte
```

---

## 2. Problèmes UX Identifiés

### 2.1. Absence de Recherche en Temps Réel
**Problème :** L'utilisateur doit cliquer sur "Rechercher" pour voir les résultats.
**Impact :** Frustrant, demande plus d'effort, moins fluide.
**Référence :** Instagram, Twitter, Facebook font tous la recherche en temps réel avec debounce.

### 2.2. Pas de Suggestions Pendant la Frappe
**Problème :** Aucune suggestion n'apparaît pendant que l'utilisateur tape.
**Impact :** L'utilisateur ne sait pas si sa requête donnera des résultats.
**Référence :** LinkedIn montre des suggestions de profils pendant la frappe.

### 2.3. Pas d'Historique de Recherche
**Problème :** Impossible de revoir les recherches précédentes.
**Impact :** Perd du temps à retaper les mêmes recherches.
**Référence :** Twitter, Instagram gardent un historique de recherche.

### 2.4. Pas de Recherche Récente
**Problème :** Aucune section "Recherches récentes" s'affiche quand le champ est vide.
**Impact :** Manque de découverte et de facilité d'accès.
**Référence :** Facebook montre les recherches récentes quand on clique sur la barre de recherche.

### 2.5. Pas de Filtres par Type
**Problème :** Impossible de filtrer par type de résultat (ex: seulement les organisations).
**Impact :** Difficile de trouver un type spécifique de contenu.
**Référence :** LinkedIn permet de filtrer par "Personnes", "Entreprises", "Postes", etc.

### 2.6. Pas de Tendances/Tags Populaires
**Problème :** Aucune section "Tendances" ou "Tags populaires".
**Impact :** Manque de découverte de contenu populaire.
**Référence :** Twitter/X montre les tendances mondiales.

### 2.7. Pas de Mise en Surbrillance des Termes
**Problème :** Les termes recherchés ne sont pas mis en évidence dans les résultats.
**Impact :** Difficile de voir pourquoi un résultat correspond.
**Référence :** Google met en surbrillance les termes recherchés.

### 2.8. Pas de Pagination ou Infinite Scroll
**Problème :** Limité à 20 résultats par type.
**Impact :** Peut rater des résultats pertinents.
**Référence :** Instagram utilise l'infinite scroll pour les résultats.

### 2.9. Pas de Tri des Résultats
**Problème :** Aucun contrôle sur l'ordre des résultats (pertinence, date, popularité).
**Impact :** Résultats peut-être moins pertinents.
**Référence :** Facebook permet de trier par "Plus récents", "Plus pertinents".

### 2.10. Pas de Recherche Vocale
**Problème :** Aucune option de recherche vocale.
**Impact :** Moins accessible sur mobile.
**Référence :** Google et Instagram ont la recherche vocale.

### 2.11. Pas de Suggestions de Comptes à Suivre
**Problème :** Aucune suggestion de profils basée sur l'historique ou les intérêts.
**Impact :** Manque d'engagement et de découverte.
**Référence :** Twitter suggère des comptes à suivre.

### 2.12. Design Basique
**Problème :** Le design est fonctionnel mais peu engageant.
**Impact :** Moins motivant à utiliser la recherche.
**Référence :** Les réseaux sociaux ont des designs plus visuels et attractifs.

---

## 3. Propositions d'Amélioration

### 3.1. Priorité Haute (À implémenter immédiatement)

#### A. Recherche en Temps Réel avec Debounce
```typescript
const [debouncedQuery, setDebouncedQuery] = useState('');
const [isDebouncing, setIsDebouncing] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(query);
    setIsDebouncing(false);
  }, 300); // 300ms debounce

  setIsDebouncing(true);
  return () => clearTimeout(timer);
}, [query]);

useEffect(() => {
  if (debouncedQuery.length >= 2) {
    performSearch(debouncedQuery);
  }
}, [debouncedQuery]);
```

**Avantages :**
- Expérience fluide
- Résultats automatiques
- Parallèle avec les réseaux sociaux

#### B. Historique de Recherche (LocalStorage)
```typescript
const HISTORY_KEY = 'tlz_search_history';
const MAX_HISTORY = 10;

const addToHistory = (query: string) => {
  const history = getHistory();
  const newHistory = [query, ...history.filter(q => q !== query)].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
};

const getHistory = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
};
```

**Avantages :**
- Retrouver facilement les recherches
- Gain de temps
- Personnalisation

#### C. Filtres par Type avec Tabs
```tsx
<div className="flex gap-2 border-b border-slate-800 pb-2">
  {['all', 'organizations', 'communities', 'campaigns', 'posts', 'users'].map(type => (
    <button
      key={type}
      onClick={() => setSelectedType(type)}
      className={`px-4 py-2 rounded-lg text-sm font-semibold ${
        selectedType === type
          ? 'bg-cyan-500 text-slate-950'
          : 'text-slate-400 hover:text-white'
      }`}
    >
      {type === 'all' ? 'Tout' : TYPE_META[type].label}
    </button>
  ))}
</div>
```

**Avantages :**
- Filtrage rapide
- Navigation intuitive
- Contrôle utilisateur

#### D. Section "Recherches Récentes"
```tsx
{!query && recentSearches.length > 0 && (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-bold text-slate-200">Recherches récentes</h3>
      <button onClick={clearHistory} className="text-xs text-cyan-400">Effacer</button>
    </div>
    <div className="flex flex-wrap gap-2">
      {recentSearches.map(search => (
        <button
          key={search}
          onClick={() => setQuery(search)}
          className="px-3 py-1.5 rounded-full bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
        >
          {search}
        </button>
      ))}
    </div>
  </div>
)}
```

**Avantages :**
- Découverte facile
- Rappel des recherches
- Engagement

---

### 3.2. Priorité Moyenne (À implémenter ensuite)

#### E. Tendances et Tags Populaires
```tsx
<div className="space-y-3">
  <h3 className="text-sm font-bold text-slate-200">Tendances</h3>
  <div className="space-y-2">
    {trends.map(trend => (
      <button
        key={trend.id}
        onClick={() => setQuery(trend.tag)}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800"
      >
        <div className="text-left">
          <p className="text-sm font-bold text-white">{trend.tag}</p>
          <p className="text-xs text-slate-400">{trend.count} publications</p>
        </div>
        <TrendingUp className="w-4 h-4 text-cyan-400" />
      </button>
    ))}
  </div>
</div>
```

**Avantages :**
- Découverte de contenu
- Engagement accru
- Viralité potentielle

#### F. Mise en Surbrillance des Termes
```typescript
const highlightText = (text: string, query: string) => {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark class="bg-cyan-500/30 text-white">$1</mark>');
};
```

**Avantages :**
- Visibilité améliorée
- Compréhension rapide
- UX améliorée

#### G. Pagination ou Infinite Scroll
```typescript
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

const loadMore = async () => {
  const newPage = page + 1;
  const result = await api.search(query, { limit: 20, page: newPage });
  if (result.data) {
    setResponse(prev => ({
      ...prev,
      results: mergeResults(prev.results, result.data.results)
    }));
    setPage(newPage);
    setHasMore(result.data.hasMore);
  }
};
```

**Avantages :**
- Accès à plus de résultats
- Meilleure découverte
- Expérience continue

#### H. Tri des Résultats
```tsx
<select
  value={sortBy}
  onChange={(e) => setSortBy(e.target.value)}
  className="px-3 py-2 rounded-lg bg-slate-800 text-sm text-white"
>
  <option value="relevance">Pertinence</option>
  <option value="recent">Plus récents</option>
  <option value="popular">Plus populaires</option>
</select>
```

**Avantages :**
- Contrôle utilisateur
- Pertinence personnalisée
- Flexibilité

---

### 3.3. Priorité Basse (Améliorations futures)

#### I. Recherche Vocale
```tsx
<button
  onClick={startVoiceSearch}
  className="p-2 rounded-lg hover:bg-slate-800"
>
  <Mic className="w-5 h-5 text-slate-400" />
</button>
```

**Avantages :**
- Accessibilité mobile
- Frappe plus rapide
- Innovation

#### J. Suggestions de Comptes à Suivre
```tsx
<div className="space-y-3">
  <h3 className="text-sm font-bold text-slate-200">Suggéré pour vous</h3>
  <div className="space-y-2">
    {suggestedUsers.map(user => (
      <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
        <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" />
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{user.name}</p>
          <p className="text-xs text-slate-400">{user.pseudonym}</p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-cyan-500 text-xs font-bold text-slate-950">
          Suivre
        </button>
      </div>
    ))}
  </div>
</div>
```

**Avantages :**
- Engagement accru
- Découverte de profils
- Communauté plus active

#### K. Design Amélioré
- Animations fluides (fade-in, slide-up)
- Skeleton loading au lieu d'un spinner
- Micro-interactions (hover effects, active states)
- Responsive design amélioré
- Dark mode par défaut avec palette de couleurs cohérente

---

## 4. Roadmap d'Implémentation

### Phase 1 (Semaine 1)
- ✅ Recherche en temps réel avec debounce
- ✅ Historique de recherche (localStorage)
- ✅ Section "Recherches récentes"
- ✅ Filtrage par type avec tabs

### Phase 2 (Semaine 2)
- ✅ Tendances et tags populaires
- ✅ Mise en surbrillance des termes
- ✅ Pagination des résultats
- ✅ Tri des résultats

### Phase 3 (Semaine 3)
- ✅ Recherche vocale (Web Speech API)
- ✅ Suggestions de comptes à suivre
- ✅ Design amélioré avec animations
- ✅ Skeleton loading

---

## 5. Recommandations Techniques

### 5.1. Performance
- Utiliser `debounce` pour éviter trop de requêtes API
- Implémenter `memo` pour les composants de résultats
- Utiliser `virtualization` pour les longues listes (react-window)
- Cache des résultats en mémoire pour les recherches répétées

### 5.2. Accessibilité
- Labels ARIA pour les inputs
- Navigation au clavier
- Support lecteur d'écran
- Contraste suffisant

### 5.3. Analytics
- Tracer les recherches les plus populaires
- Mesurer le taux de clic sur les résultats
- Analyser les types de résultats les plus consultés
- Suivre le temps passé sur la recherche

---

## 6. Conclusion

L'onglet recherche actuel est fonctionnel mais loin des standards des réseaux sociaux modernes. Les améliorations proposées rendront l'expérience :

1. **Plus fluide** : Recherche en temps réel, débouncing intelligent
2. **Plus intuitive** : Historique, suggestions, filtres
3. **Plus engageante** : Tendances, suggestions de profils
4. **Plus accessible** : Recherche vocale, accessibilité
5. **Plus performante** : Cache, virtualization, optimisations

L'implémentation prioritaire (Phase 1) apportera déjà une amélioration significative de l'UX avec un effort de développement raisonnable.
