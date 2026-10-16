import React, { FormEvent, useState } from 'react';
import {
  Building2,
  ChevronRight,
  FileText,
  Loader2,
  Search,
  Trophy,
  User,
  Users,
} from 'lucide-react';
import { api } from '../../services/api';
import type { SearchResponse, SearchResult, SearchResultType } from '../../types';

interface GlobalSearchViewProps {
  onOpenResult: (result: SearchResult) => void;
}

const TYPE_META: Record<SearchResultType, { label: string; icon: typeof Search }> = {
  organizations: { label: 'Organisations', icon: Building2 },
  communities: { label: 'Communautés', icon: Users },
  campaigns: { label: 'Campagnes', icon: Trophy },
  posts: { label: 'Publications', icon: FileText },
  users: { label: 'Membres', icon: User },
};

const SEARCH_ORDER: SearchResultType[] = ['organizations', 'communities', 'campaigns', 'posts', 'users'];

/** Interface de recherche globale : toutes les donnees viennent exclusivement de api.search(). */
export const GlobalSearchView: React.FC<GlobalSearchViewProps> = ({ onOpenResult }) => {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedQuery = query.trim();
    setSubmittedQuery(normalizedQuery || null);
    setResponse(null);
    setError(null);

    if (normalizedQuery.length < 2) return;

    setLoading(true);
    const result = await api.search(normalizedQuery, { limit: 20 });
    setLoading(false);

    if (!result.success || !result.data) {
      setError('La recherche est indisponible pour le moment. Réessayez dans quelques instants.');
      return;
    }
    setResponse(result.data);
  };

  const total = response
    ? SEARCH_ORDER.reduce((count, type) => count + (response.results[type]?.total || 0), 0)
    : 0;

  return (
    <section className="space-y-6 animate-fadeIn pb-10" aria-labelledby="global-search-title">
      <div className="rounded-3xl border border-slate-800 bg-[#182231]/80 p-5 sm:p-8 shadow-xl">
        <div className="max-w-3xl space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">Découvrir Tulizaana</p>
            <h1 id="global-search-title" className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
              Recherche globale
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Retrouvez des organisations, communautés, campagnes, publications et membres accessibles.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row" noValidate>
            <label className="relative flex-1">
              <span className="sr-only">Rechercher sur Tulizaana</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ex. soutien, drépanocytose, Panzi…"
                className="w-full rounded-2xl border border-slate-700 bg-[#0e1626] py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-cyan-400"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-extrabold text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Rechercher
            </button>
          </form>

          {submittedQuery !== null && submittedQuery.length < 2 && (
            <p role="status" className="text-sm text-amber-300">Saisissez au moins 2 caractères pour lancer la recherche.</p>
          )}
          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        </div>
      </div>

      {!submittedQuery && !loading && (
        <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center text-sm text-slate-400">
          Saisissez un mot-clé pour explorer les espaces qui vous sont accessibles.
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-3xl border border-slate-800 bg-slate-900/40 p-10 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-400" /> Recherche en cours…
        </div>
      )}

      {response && !loading && total === 0 && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 text-center text-sm text-slate-400">
          Aucun résultat accessible pour « {response.query} ».
        </div>
      )}

      {response && !loading && total > 0 && (
        <div className="space-y-6">
          <p className="text-sm text-slate-400">{total} résultat{total > 1 ? 's' : ''} pour « {response.query} »</p>
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
                      onClick={() => onOpenResult(item)}
                      className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-800 bg-[#111827]/80 p-4 text-left transition-colors hover:border-cyan-500/50 hover:bg-slate-800/80"
                    >
                      {item.image ? (
                        <img src={item.image} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                          <TypeIcon className="h-5 w-5" />
                        </div>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-white group-hover:text-cyan-300">{item.title}</span>
                        {item.description && <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-slate-400">{item.description}</span>}
                        {item.context && <span className="mt-1 block truncate text-[11px] text-slate-500">{item.context.name}</span>}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-400" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
