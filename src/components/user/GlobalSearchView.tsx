import React, { FormEvent, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2,
  ChevronRight,
  FileText,
  Loader2,
  Search,
  Trophy,
  User,
  Users,
  BookOpen,
  MessageSquare,
  TrendingUp,
  Clock,
  X,
  MapPin,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { api } from '../../services/api';
import type { SearchResponse, SearchResult, SearchResultType } from '../../types';
import { SearchCategorySkeleton } from '../common/SkeletonLoading';

interface GlobalSearchViewProps {
  onOpenResult: (result: SearchResult) => void;
}

const TYPE_META: Record<SearchResultType, { label: string; icon: typeof Search }> = {
  organizations: { label: 'Organisations', icon: Building2 },
  communities: { label: 'Communautés', icon: Users },
  campaigns: { label: 'Campagnes', icon: Trophy },
  posts: { label: 'Publications', icon: FileText },
  stories: { label: 'Récits', icon: BookOpen },
  comments: { label: 'Commentaires', icon: MessageSquare },
  users: { label: 'Membres', icon: User },
};

const SEARCH_ORDER: SearchResultType[] = ['organizations', 'communities', 'campaigns', 'posts', 'stories', 'comments', 'users'];

const SEARCH_HISTORY_KEY = 'tlz_search_history';
const MAX_HISTORY = 10;

// Mock trends pour la démo - à remplacer par une vraie API
const MOCK_TRENDS = [
  { id: '1', tag: 'drépanocytose', count: 234 },
  { id: '2', tag: 'soutien psychologique', count: 189 },
  { id: '3', tag: 'Panzi', count: 156 },
  { id: '4', tag: ' santé mentale', count: 142 },
  { id: '5', tag: ' résilience', count: 98 },
];

/** Interface de recherche globale améliorée */
export const GlobalSearchView: React.FC<GlobalSearchViewProps> = ({ onOpenResult }) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [selectedType, setSelectedType] = useState<SearchResultType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'recent' | 'popular'>('relevance');
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(true);

  // Charger l'historique de recherche
  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
      setSearchHistory(history);
    } catch {
      setSearchHistory([]);
    }
  }, []);

  // Debounce de la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setIsDebouncing(false);
    }, 300);

    setIsDebouncing(true);
    return () => clearTimeout(timer);
  }, [query]);

  // Effectuer la recherche quand le query debounced change
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery.length < 2) {
        setResponse(null);
        setError(null);
        setPage(1);
        setHasMore(false);
        return;
      }

      setLoading(true);
      setError(null);
      setPage(1);

      try {
        const result = await api.search(debouncedQuery, { 
          types: selectedType === 'all' ? undefined : [selectedType],
          limit: 20,
          page: 1,
        });

        if (!result.success || !result.data) {
          setError('La recherche est indisponible pour le moment. Réessayez dans quelques instants.');
          setResponse(null);
          setHasMore(false);
          return;
        }

        setResponse(result.data);
        
        // Calculer si plus de résultats
        const totalResults = SEARCH_ORDER.reduce((count, type) => count + (result.data.results[type]?.total || 0), 0);
        setHasMore(totalResults > 20);

        // Ajouter à l'historique si ce n'est pas déjà là
        if (debouncedQuery.length >= 2 && !searchHistory.includes(debouncedQuery)) {
          const newHistory = [debouncedQuery, ...searchHistory].slice(0, MAX_HISTORY);
          setSearchHistory(newHistory);
          localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
        }
      } catch (err) {
        setError('Erreur lors de la recherche. Veuillez réessayer.');
        setResponse(null);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, selectedType]);

  // Charger plus de résultats
  const loadMore = async () => {
    if (!response || loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const result = await api.search(debouncedQuery, { 
        types: selectedType === 'all' ? undefined : [selectedType],
        limit: 20,
        page: nextPage,
      });

      if (result.success && result.data) {
        // Fusionner les résultats
        const mergedResults = { ...response.results };
        SEARCH_ORDER.forEach((type) => {
          if (result.data.results[type]) {
            if (mergedResults[type]) {
              mergedResults[type] = {
                total: result.data.results[type].total,
                items: [...mergedResults[type].items, ...result.data.results[type].items],
              };
            } else {
              mergedResults[type] = result.data.results[type];
            }
          }
        });

        setResponse({
          ...response,
          results: mergedResults,
        });
        setPage(nextPage);
        
        // Recalculer hasMore
        const currentTotal = SEARCH_ORDER.reduce((count, type) => count + (mergedResults[type]?.items.length || 0), 0);
        const totalResults = SEARCH_ORDER.reduce((count, type) => count + (result.data.results[type]?.total || 0), 0);
        setHasMore(currentTotal < totalResults);
      }
    } catch (err) {
      console.error('Erreur lors du chargement de plus de résultats:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Calculer le total de résultats
  const total = useMemo(() => {
    if (!response) return 0;
    return SEARCH_ORDER.reduce((count, type) => count + (response.results[type]?.total || 0), 0);
  }, [response]);

  // Gérer la soumission du formulaire
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // La recherche est déjà déclenchée par le debounce
  };

  // Gérer le clic sur un résultat
  const handleResultClick = (result: SearchResult) => {
    onOpenResult(result);
  };

  // Gérer le clic sur une recherche récente
  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    setShowHistory(false);
  };

  // Effacer l'historique
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  // Gérer le clic sur une tendance
  const handleTrendClick = (tag: string) => {
    setQuery(tag);
    setShowHistory(false);
  };

  // Mettre en surbrillance le texte recherché
  const highlightText = (text: string, query: string) => {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-cyan-500/30 text-white px-0.5 rounded">$1</mark>');
  };

  return (
    <section className="space-y-6 animate-fadeIn pb-10" aria-labelledby="global-search-title">
      {/* Header avec titre et filtres */}
      <div className="rounded-3xl border border-slate-800 bg-[#182231]/80 p-5 sm:p-8 shadow-xl">
        <div className="max-w-3xl space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">Découvrir Tulizaana</p>
            <h1 id="global-search-title" className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
              Recherche globale
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Retrouvez des organisations, communautés, campagnes, publications, récits, commentaires et membres accessibles.
            </p>
          </div>

          {/* Barre de recherche avec filtres */}
          <div className="space-y-3">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row" noValidate>
              <label className="relative flex-1">
                <span className="sr-only">Rechercher sur Tulizaana</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setShowHistory(false);
                  }}
                  placeholder="Ex. soutien, drépanocytose, Panzi…"
                  className="w-full rounded-2xl border border-slate-700 bg-[#0e1626] py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-cyan-400"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-700"
                  >
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                )}
              </label>
              <button
                type="submit"
                disabled={loading || query.length < 2}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-extrabold text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-wait disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Rechercher
              </button>
            </form>

            {/* Filtres par type */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedType === 'all'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                Tout
              </button>
              {SEARCH_ORDER.map((type) => {
                const meta = TYPE_META[type];
                const TypeIcon = meta.icon;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      selectedType === type
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <TypeIcon className="w-3.5 h-3.5" />
                    {meta.label}
                  </button>
                );
              })}
            </div>

            {/* Tri */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'relevance' | 'recent' | 'popular')}
                className="bg-transparent text-xs text-slate-400 outline-none cursor-pointer"
              >
                <option value="relevance">Pertinence</option>
                <option value="recent">Plus récents</option>
                <option value="popular">Plus populaires</option>
              </select>
            </div>
          </div>

          {query.length > 0 && query.length < 2 && (
            <p role="status" className="text-sm text-amber-300">Saisissez au moins 2 caractères pour lancer la recherche.</p>
          )}
          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        </div>
      </div>

      {/* État vide avec suggestions */}
      {!query && showHistory && (
        <div className="space-y-6">
          {/* Recherches récentes */}
          {searchHistory.length > 0 && (
            <div className="rounded-3xl border border-slate-800 bg-[#182231]/80 p-5 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-slate-200">Recherches récentes</h3>
                </div>
                <button
                  onClick={clearHistory}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Effacer tout
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((historyQuery) => (
                  <button
                    key={historyQuery}
                    onClick={() => handleHistoryClick(historyQuery)}
                    className="px-3 py-1.5 rounded-full bg-slate-800 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Clock className="w-3 h-3" />
                    {historyQuery}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tendances */}
          <div className="rounded-3xl border border-slate-800 bg-[#182231]/80 p-5 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-200">Tendances</h3>
            </div>
            <div className="space-y-2">
              {MOCK_TRENDS.map((trend) => (
                <button
                  key={trend.id}
                  onClick={() => handleTrendClick(trend.tag)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                >
                  <div className="text-left">
                    <p className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {trend.tag}
                    </p>
                    <p className="text-xs text-slate-400">{trend.count} publications</p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      // Indicateur de chargement */}
      {loading && (
        <div className="space-y-6">
          {SEARCH_ORDER.map((type) => (
            <SearchCategorySkeleton key={type} />
          ))}
        </div>
      )}

      {/* Aucun résultat */}
      {response && !loading && total === 0 && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 text-center text-sm text-slate-400">
          Aucun résultat accessible pour « {response.query} ».
          <p className="mt-2 text-xs text-slate-500">Essayez d'autres mots-clés ou modifiez les filtres.</p>
        </div>
      )}

      {/* Résultats */}
      {response && !loading && total > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">{total} résultat{total > 1 ? 's' : ''} pour « {response.query} »</p>
            {isDebouncing && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Mise à jour...
              </span>
            )}
          </div>
          {SEARCH_ORDER.map((type) => {
            const page = response.results[type];
            if (!page || page.items.length === 0) return null;
            const meta = TYPE_META[type];
            const TypeIcon = meta.icon;
            return (
              <div key={type} className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                  <TypeIcon className="h-4 w-4 text-cyan-400" />
                  {meta.label} <span className="text-slate-500">({page.total})</span>
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {page.items.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={() => handleResultClick(item)}
                      className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-800 bg-[#111827]/80 p-4 text-left transition-all hover:border-cyan-500/50 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-cyan-500/10"
                    >
                      {item.image ? (
                        <img src={item.image} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                          <TypeIcon className="h-5 w-5" />
                        </div>
                      )}
                      <span className="min-w-0 flex-1">
                        <span 
                          className="block truncate text-sm font-bold text-white group-hover:text-cyan-300"
                          dangerouslySetInnerHTML={{ __html: highlightText(item.title, response.query) }}
                        />
                        {item.description && (
                          <span 
                            className="mt-1 block line-clamp-2 text-xs leading-relaxed text-slate-400"
                            dangerouslySetInnerHTML={{ __html: highlightText(item.description, response.query) }}
                          />
                        )}
                        {item.context && (
                          <span className="mt-1 block truncate text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {item.context.name}
                          </span>
                        )}
                        {item.tags && item.tags.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {item.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-700 text-[10px] text-slate-300">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-400" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          
          {/* Bouton Charger plus */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:cursor-wait disabled:opacity-70"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    Charger plus de résultats
                    <ChevronRightIcon className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
