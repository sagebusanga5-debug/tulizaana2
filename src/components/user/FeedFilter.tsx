import React from 'react';
import { HelpCircle, Trophy } from 'lucide-react';

interface FeedFilterProps {
  activeFilter: 'questions' | 'campaigns' | string;
  onChangeFilter?: (filter: 'questions' | 'campaigns') => void;
  onSelectFilter?: (filter: any) => void;
  itemsCount?: number;
  onOpenCreatePost?: () => void;
}

export const FeedFilter: React.FC<FeedFilterProps> = ({
  activeFilter = 'questions',
  onChangeFilter,
  onSelectFilter,
}) => {
  const handleSelect = (filterKey: 'questions' | 'campaigns') => {
    if (onChangeFilter) onChangeFilter(filterKey);
    if (onSelectFilter) onSelectFilter(filterKey);
  };

  return (
    <div className="w-full bg-[#111827]/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800/80 shadow-sm flex items-center justify-start">
      {/* 2 Minimalist Filter Tabs: Questions & Campagnes */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/70 border border-slate-800/60 w-full sm:w-auto">
        {/* Filter 1: Questions */}
        <button
          id="btn-filter-questions"
          onClick={() => handleSelect('questions')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'questions'
              ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Questions</span>
        </button>

        {/* Filter 2: Campagnes */}
        <button
          id="btn-filter-campaigns"
          onClick={() => handleSelect('campaigns')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'campaigns'
              ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Campagnes</span>
        </button>
      </div>
    </div>
  );
};


