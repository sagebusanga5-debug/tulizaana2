import React from 'react';
import {
  Plus,
  Home,
  Users,
  Trophy,
  MessageSquare,
  User,
} from 'lucide-react';
import { Language } from '../../types';
import { t } from '../../translations';

interface UserSidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  unreadMessagesCount: number;
  onOpenSOS?: () => void;
  onOpenProfile: () => void;
  onOpenInviteGate?: () => void;
  onOpenCreatePost: () => void;
  language?: Language;
}

export const UserSidebar: React.FC<UserSidebarProps> = ({
  activeTab,
  onSelectTab,
  unreadMessagesCount,
  onOpenProfile,
  onOpenCreatePost,
  language = 'fr',
}) => {
  const currentLang = t[language] || t.fr;

  return (
    <aside className="sticky top-20 h-[calc(100vh-6rem)] hidden md:flex flex-col items-center justify-between w-20 py-4 bg-[#111827]/95 backdrop-blur-md rounded-3xl border border-slate-800/80 shadow-2xl transition-all shrink-0">
      
      {/* Top Stack: '+' Create Button */}
      <div className="flex flex-col items-center gap-3 w-full px-2">
        <button
          id="btn-create-content"
          onClick={onOpenCreatePost}
          title={currentLang.nav?.create || "Créer une publication ou un témoignage"}
          className="w-12 h-12 rounded-2xl bg-linear-to-tr from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 flex items-center justify-center font-extrabold shadow-lg shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Center Navigation Icons: Accueil, Communautés, Campagnes, Chats */}
      <nav className="flex flex-col items-center gap-3 w-full px-2 my-auto">
        
        {/* 1. Accueil */}
        <button
          id="nav-feed"
          onClick={() => onSelectTab('feed')}
          title={currentLang.nav?.feed || "Accueil"}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative ${
            activeTab === 'feed'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Home className="w-5 h-5" />
        </button>

        {/* 2. Communautés */}
        <button
          id="nav-communities"
          onClick={() => onSelectTab('communities')}
          title={currentLang.nav?.communities || "Communautés"}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative ${
            activeTab === 'communities'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-5 h-5" />
        </button>

        {/* 3. Campagnes */}
        <button
          id="nav-campaigns"
          onClick={() => onSelectTab('campaigns')}
          title={currentLang.nav?.campaigns || "Campagnes"}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative ${
            activeTab === 'campaigns'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Trophy className="w-5 h-5" />
        </button>

        {/* 4. Messages */}
        <button
          id="nav-messages"
          onClick={() => onSelectTab('messages')}
          title={currentLang.nav?.messages || "Messagerie"}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative ${
            activeTab === 'messages'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          {unreadMessagesCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-extrabold text-[9px] flex items-center justify-center shadow-md">
              {unreadMessagesCount}
            </span>
          )}
        </button>
      </nav>

      {/* Bottom Profile button */}
      <div className="w-full px-2 flex flex-col items-center">
        <button
          id="nav-profile"
          onClick={onOpenProfile}
          title={currentLang.nav?.profile || "Mon Profil"}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative ${
            activeTab === 'profile'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <User className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};
