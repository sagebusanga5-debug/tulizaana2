import React from 'react';
import {
  Bell,
  Globe,
  LogOut,
  Sparkles,
  ShieldCheck,
  Building2,
  User,
  KeyRound,
  Search,
} from 'lucide-react';
import { Language, InterfaceMode, UserProfile, AppNotification } from '../../types';
import { t } from '../../translations';
import { TulizaanaLogo } from '../brand/TulizaanaBrand';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface UserNavbarProps {
  currentInterface?: InterfaceMode;
  activeTab?: string;
  onSelectInterface?: (mode: InterfaceMode) => void;
  currentUser: UserProfile;
  activeCommunity?: { id: string; name: string };
  language: Language;
  onSelectLanguage?: (lang: Language) => void;
  setLanguage?: (lang: Language) => void;
  notifications?: AppNotification[];
  notificationsCount?: number;
  onOpenNotifications: () => void;
  onOpenInviteModal?: () => void;
  onOpenProfile: () => void;
  onOpenSearch: () => void;
  onOpenSOS?: () => void;
  onSwitchToPartner?: () => void;
  onLogout?: () => void;
  onOpenOrganizationProfile?: () => void;
}

export const UserNavbar: React.FC<UserNavbarProps> = ({
  currentInterface = 'user',
  activeTab,
  onSelectInterface,
  currentUser,
  activeCommunity,
  language = 'fr',
  onSelectLanguage,
  setLanguage,
  notifications = [],
  notificationsCount,
  onOpenNotifications,
  onOpenInviteModal,
  onOpenProfile,
  onOpenSearch,
  onOpenSOS,
  onSwitchToPartner,
  onLogout,
  onOpenOrganizationProfile,
}) => {
  const currentLang = t[language] || t.fr;
  const unreadCount =
    notificationsCount !== undefined
      ? notificationsCount
      : (notifications || []).filter((n) => !n.isRead).length;

  const handleLanguageChange = (lang: Language) => {
    if (onSelectLanguage) onSelectLanguage(lang);
    if (setLanguage) setLanguage(lang);
  };

  const handleInterfaceChange = (mode: InterfaceMode) => {
    if (mode === 'partner') {
      if (onSwitchToPartner) {
        onSwitchToPartner();
      } else if (onSelectInterface) {
        onSelectInterface(mode);
      }
    } else {
      if (onSelectInterface) onSelectInterface(mode);
    }
  };

  return (
    <header className="h-14 sm:h-16 w-full max-w-full bg-[#0B0F14]/80 backdrop-blur-md border-b border-slate-800/60 px-2 sm:px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 pt-safe">
      
      {/* Left Logo with official Icon and Wordmark */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <div
          onClick={() => handleInterfaceChange('user')}
          className="cursor-pointer group hover:opacity-95 transition-opacity shrink-0"
        >
          <TulizaanaLogo size="sm" iconClassName="w-7 h-7 sm:w-8 sm:h-8 group-hover:scale-105 transition-transform" />
        </div>

        {/* Closed Circle Status Badge - Clickable to open organization profile */}
        <button
          type="button"
          onClick={onOpenOrganizationProfile}
          title={currentLang.communitiesView?.aboutCommunity || "Consulter l'organisation"}
          className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-medium cursor-pointer transition-all group/circle"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 group-hover/circle:scale-110 transition-transform" />
          <span className="group-hover/circle:text-cyan-300 transition-colors">{activeCommunity?.name || currentLang.app?.closedCircle || 'Cercle Privé Fermé'}</span>
        </button>
      </div>

      {/* Center/Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onOpenSearch}
          title="Recherche globale"
          className={`hidden md:flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-bold transition-colors ${
            activeTab === 'search'
              ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
              : 'border-slate-800 bg-slate-900/90 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300'
          }`}
        >
          <Search className="h-4 w-4" />
          <span className="hidden lg:inline">Recherche</span>
        </button>
        
        {/* Interface Switcher */}
        <div className="flex items-center p-0.5 sm:p-1 rounded-2xl bg-[#111827] border border-slate-800 text-xs font-semibold shrink-0">
          <button
            onClick={() => handleInterfaceChange('user')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all cursor-pointer ${
              currentInterface === 'user'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
            title={currentLang.app?.memberPortal || "Espace Social Membre"}
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{currentLang.common?.member || "Membre"}</span>
          </button>

          <button
            onClick={() => handleInterfaceChange('partner')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all cursor-pointer ${
              currentInterface === 'partner'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
            title={currentLang.app?.partnerPortal || "Portail Partenaire ONG"}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{currentLang.common?.partner || "Partenaire"}</span>
          </button>
        </div>

        {/* PWA Install Button (Responsive: Full on desktop/tablet, compact icon on small mobile) */}
        <PWAInstallButton language={language} variant="button" className="hidden sm:flex" />
        <PWAInstallButton language={language} variant="compact" className="sm:hidden" />

        {/* Global Language Selector (hidden on mobile, visible on sm and up) */}
        <div
          id="navbar-language-switcher"
          className="hidden sm:flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 shadow-sm"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            aria-label={currentLang.auth?.changeLanguage || "Changer de langue"}
            className="bg-transparent text-slate-200 font-bold focus:outline-hidden cursor-pointer text-xs"
          >
            <option value="en" className="bg-slate-900 text-white">EN</option>
            <option value="fr" className="bg-slate-900 text-white">FR</option>
            <option value="ar" className="bg-slate-900 text-white">AR</option>
            <option value="pt" className="bg-slate-900 text-white">PT</option>
            <option value="sw" className="bg-slate-900 text-white">SW</option>
          </select>
        </div>

        {/* User Mini Avatar (Access to Profile with language, Notifications & Logout) */}
        <div
          onClick={onOpenProfile}
          title={currentUser.name}
          className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-800 overflow-hidden border-2 border-cyan-500/60 shadow-md cursor-pointer hover:scale-105 transition-transform shrink-0"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-full h-full object-cover"
          />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#0B0F14]" />
          )}
        </div>
      </div>
    </header>
  );
};
