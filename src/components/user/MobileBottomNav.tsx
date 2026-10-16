import React from 'react';
import {
  Home,
  Users,
  Trophy,
  MessageSquare,
  Plus,
  Search,
  User,
} from 'lucide-react';
import { Language } from '../../types';
import { t } from '../../translations';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  unreadMessagesCount: number;
  onOpenCreatePost: () => void;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
  language?: Language;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  unreadMessagesCount,
  onOpenCreatePost,
  onOpenSearch,
  onOpenProfile,
  language = 'fr',
}) => {
  const currentLang = t[language] || t.fr;

  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0a0f18]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 safe-area-pb shadow-2xl"
    >
      <div className="flex items-center justify-between max-w-md mx-auto">
        
        {/* 1. Accueil */}
        <button
          onClick={() => onSelectTab('feed')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'feed'
              ? 'text-cyan-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-1 tracking-tight">{currentLang.nav?.feed || 'Accueil'}</span>
        </button>

        {/* 2. Communautés */}
        <button
          onClick={() => onSelectTab('communities')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'communities'
              ? 'text-cyan-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-1 tracking-tight">{currentLang.nav?.communities || 'Communautés'}</span>
        </button>

        {/* 3. Recherche */}
        <button
          onClick={onOpenSearch}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'search' ? 'text-cyan-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[9px] mt-1 tracking-tight">Recherche</span>
        </button>

        {/* 4. Center Highlight '+' Action Button */}
        <button
          onClick={onOpenCreatePost}
          aria-label="Publier une question ou un témoignage"
          className="flex flex-col items-center justify-center -mt-5 transition-transform active:scale-95 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-cyan-500 via-teal-400 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/40 flex items-center justify-center">
            <div className="w-full h-full bg-[#0d131f] rounded-[14px] flex items-center justify-center text-cyan-400 hover:bg-cyan-500/20 transition-colors">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>
          </div>
          <span className="text-[10px] font-bold text-cyan-300 mt-1">{currentLang.nav?.create || 'Publier'}</span>
        </button>

        {/* 5. Campagnes */}
        <button
          onClick={() => onSelectTab('campaigns')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'campaigns'
              ? 'text-cyan-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Trophy className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-1 tracking-tight">{currentLang.nav?.campaigns || 'Campagnes'}</span>
        </button>

        {/* 6. Chats */}
        <button
          onClick={() => onSelectTab('messages')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'messages'
              ? 'text-cyan-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-extrabold text-[9px] flex items-center justify-center shadow-md">
                {unreadMessagesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">{currentLang.nav?.messages || 'Chats'}</span>
        </button>

        {/* 7. Profil : ouvre toujours l'utilisateur de session via App.tsx. */}
        <button
          onClick={onOpenProfile}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'profile' ? 'text-cyan-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[9px] mt-1 tracking-tight">Profil</span>
        </button>
      </div>
    </nav>
  );
};
