import React, { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Trophy,
  Users,
  ShieldAlert,
  BarChart3,
  FileText,
  CreditCard,
  User,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  Globe,
} from 'lucide-react';
import { Organization, PartnerTab, Language } from '../../types';
import { TulizaanaLogo } from '../brand/TulizaanaBrand';
import { t } from '../../translations';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface PartnerLayoutProps {
  organization: Organization;
  activeTab: PartnerTab;
  onSelectTab: (tab: PartnerTab) => void;
  onSwitchToUser: () => void;
  onLogout?: () => void;
  notificationsCount?: number;
  language?: Language;
  onSelectLanguage?: (lang: Language) => void;
  children: React.ReactNode;
}

interface MenuPageItem {
  id: PartnerTab;
  title: string;
  subtitle: string;
  badge?: string;
  icon: React.ReactNode;
}

export const PartnerLayout: React.FC<PartnerLayoutProps> = ({
  organization,
  activeTab,
  onSelectTab,
  onSwitchToUser,
  language = 'fr',
  onSelectLanguage,
  children,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const strings = t[language]?.partnerPortal || t.fr.partnerPortal;

  // Pages categorized inside the "Menu"
  const menuPages: MenuPageItem[] = [
    {
      id: 'communities',
      title: strings.communities,
      subtitle: strings.communitiesSub,
      icon: <Building2 className="w-5 h-5 text-cyan-400" />,
    },
    {
      id: 'campaigns',
      title: strings.campaigns,
      subtitle: strings.campaignsSub,
      icon: <Trophy className="w-5 h-5 text-teal-400" />,
    },
    {
      id: 'members',
      title: strings.members,
      subtitle: strings.membersSub,
      icon: <Users className="w-5 h-5 text-indigo-400" />,
    },
    {
      id: 'moderation',
      title: strings.moderation,
      subtitle: strings.moderationSub,
      icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
    },
    {
      id: 'analytics',
      title: strings.analytics,
      subtitle: strings.analyticsSub,
      icon: <BarChart3 className="w-5 h-5 text-amber-400" />,
    },
    {
      id: 'reports',
      title: strings.reports,
      subtitle: strings.reportsSub,
      icon: <FileText className="w-5 h-5 text-emerald-400" />,
    },
  ];

  const isMenuTabActive = menuPages.some((item) => item.id === activeTab);
  const activeMenuItem = menuPages.find((item) => item.id === activeTab);

  const handleSelectMenuPage = (tabId: PartnerTab) => {
    onSelectTab(tabId);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#0d131f] text-slate-100 flex flex-col font-sans">
      
      {/* 1. TOP HEADER (Harmonized with UserNavbar) */}
      <header className="h-16 sm:h-20 w-full max-w-full bg-[#0B0F14]/90 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        
        {/* Left: Logo Only */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div
            onClick={onSwitchToUser}
            className="cursor-pointer group hover:opacity-95 transition-opacity shrink-0"
            title="Tulizaana"
          >
            <TulizaanaLogo size="sm" iconClassName="w-7 h-7 sm:w-8 sm:h-8 group-hover:scale-105 transition-transform" />
          </div>
        </div>

        {/* Right: Interface Switcher & Organization Profile Photo */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* Global Language Selector in Partner Portal (hidden on mobile) */}
          {onSelectLanguage && (
            <div
              id="partner-navbar-language-switcher"
              className="hidden sm:flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 shadow-sm"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <select
                value={language}
                onChange={(e) => onSelectLanguage(e.target.value as Language)}
                className="bg-transparent text-xs text-slate-200 focus:outline-hidden cursor-pointer font-medium"
                title="Changer de langue / Change language / تغيير اللغة / Mudar de idioma"
              >
                <option value="en" className="bg-slate-900 text-slate-200">English (EN)</option>
                <option value="fr" className="bg-slate-900 text-slate-200">Français (FR)</option>
                <option value="ar" className="bg-slate-900 text-slate-200">العربية (AR)</option>
                <option value="pt" className="bg-slate-900 text-slate-200">Português (PT)</option>
                <option value="sw" className="bg-slate-900 text-slate-200">Kiswahili (SW)</option>
              </select>
            </div>
          )}

          {/* PWA Install Button in Partner Portal */}
          <PWAInstallButton language={language} variant="button" className="hidden sm:flex" />
          <PWAInstallButton language={language} variant="compact" className="sm:hidden" />

          {/* Interface Switcher [Membre | Partenaire] */}
          <div className="flex items-center p-0.5 sm:p-1 rounded-2xl bg-[#111827] border border-slate-800 text-xs font-semibold shrink-0">
            <button
              onClick={onSwitchToUser}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-white"
              title={language === 'sw' ? 'Nenda eneo la Membre' : language === 'en' ? 'Switch to Member space' : "Passer à l'espace Membre"}
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t[language]?.common?.member || "Membre"}</span>
            </button>

            <button
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all cursor-pointer bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
              title={language === 'sw' ? 'Eneo la Shirika linatumika' : language === 'en' ? 'Partner space active' : "Espace Partenaire actif"}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t[language]?.common?.partner || "Partenaire"}</span>
            </button>
          </div>

          {/* Organization Logo as Profile Picture (Identical layout to UserNavbar) */}
          <div
            onClick={() => onSelectTab('profile')}
            title={`Profil de l'organisation (${organization.name})`}
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-800 overflow-hidden border-2 border-cyan-500/60 shadow-md cursor-pointer hover:scale-105 transition-transform shrink-0"
          >
            <img
              src={organization.logo}
              alt={organization.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTAINER WITH SIDEBAR */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6 pb-24 md:pb-6 gap-6 min-w-0">
        
        {/* DESKTOP LEFT NAVIGATION SIDEBAR (Profile/Accueil, Dashboard, Abonnement, Menu) */}
        <aside
          aria-label="Navigation partenaire"
          className="sticky top-24 h-[calc(100vh-7.5rem)] hidden md:flex flex-col items-center justify-between w-20 py-4 bg-[#111827]/95 backdrop-blur-md rounded-3xl border border-slate-800/80 shadow-2xl transition-all shrink-0"
        >
          {/* Main Items: Profile, Dashboard, Abonnement, Menu */}
          <nav className="flex flex-col items-center gap-3 w-full px-2">
            
            {/* 0. Profil & Accueil Organisation */}
            <div className="relative group flex items-center justify-center">
              <button
                id="partner-nav-profile"
                onClick={() => onSelectTab('profile')}
                title={strings.overview}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative ${
                  activeTab === 'profile'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Building2 className="w-5 h-5" />
              </button>

              <div className="absolute left-16 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold whitespace-nowrap shadow-xl border border-slate-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {strings.overview}
              </div>
            </div>

            {/* 1. Dashboard */}
            <div className="relative group flex items-center justify-center">
              <button
                id="partner-nav-dashboard"
                onClick={() => onSelectTab('dashboard')}
                title={strings.dashboard}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative ${
                  activeTab === 'dashboard'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
              </button>

              <div className="absolute left-16 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold whitespace-nowrap shadow-xl border border-slate-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {strings.dashboard}
              </div>
            </div>

            {/* 2. Abonnement */}
            <div className="relative group flex items-center justify-center">
              <button
                id="partner-nav-subscription"
                onClick={() => onSelectTab('subscription')}
                title={strings.subscription}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative ${
                  activeTab === 'subscription'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <CreditCard className="w-5 h-5" />
              </button>

              <div className="absolute left-16 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold whitespace-nowrap shadow-xl border border-slate-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {strings.subscription}
              </div>
            </div>

            {/* Divider */}
            <div className="w-8 h-px bg-slate-800 my-1" />

            {/* 3. Bouton Menu (Ouvre toutes les autres pages) */}
            <div className="relative group flex items-center justify-center">
              <button
                id="partner-nav-menu"
                onClick={() => setIsMenuOpen(true)}
                title={strings.menu}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative ${
                  isMenuTabActive || isMenuOpen
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800/80'
                }`}
              >
                <Menu className="w-5 h-5" />
                {isMenuTabActive && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 ring-2 ring-slate-900 animate-pulse" />
                )}
              </button>

              <div className="absolute left-16 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold whitespace-nowrap shadow-xl border border-slate-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {strings.menu} ({activeMenuItem ? activeMenuItem.title : strings.menu})
              </div>
            </div>
          </nav>

          {/* Bottom Active Page Pill Indicator */}
          {activeMenuItem && (
            <div className="w-full px-2 flex flex-col items-center">
              <button
                onClick={() => setIsMenuOpen(true)}
                title={activeMenuItem.title}
                className="w-10 h-10 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-400 flex items-center justify-center cursor-pointer shadow-sm"
              >
                {activeMenuItem.icon}
              </button>
            </div>
          )}
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 min-w-0 space-y-6">
          {children}
        </main>
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION BAR (Profile, Dashboard, Abonnement, Menu) */}
      <nav
        aria-label="Navigation partenaire mobile"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0a0f18]/95 backdrop-blur-xl border-t border-slate-800/80 px-3 py-2 safe-area-pb shadow-2xl"
      >
        <div className="flex items-center justify-around gap-1">
          
          {/* Profil */}
          <button
            onClick={() => {
              onSelectTab('profile');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'text-cyan-400 font-bold bg-cyan-500/15 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-[11px] mt-1 tracking-tight font-medium">{strings.overview}</span>
          </button>

          {/* Dashboard */}
          <button
            onClick={() => {
              onSelectTab('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-cyan-400 font-bold bg-cyan-500/15 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[11px] mt-1 tracking-tight font-medium">{strings.dashboard}</span>
          </button>

          {/* Abonnement */}
          <button
            onClick={() => {
              onSelectTab('subscription');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'subscription'
                ? 'text-cyan-400 font-bold bg-cyan-500/15 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-[11px] mt-1 tracking-tight font-medium">{strings.subscription}</span>
          </button>

          {/* Menu Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer relative ${
              isMenuTabActive || isMenuOpen
                ? 'text-cyan-400 font-bold bg-cyan-500/15 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Menu className="w-5 h-5" />
              {isMenuTabActive && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight font-medium">
              {activeMenuItem ? activeMenuItem.title.split(' ')[0] : strings.menu}
            </span>
          </button>
        </div>
      </nav>

      {/* 4. MODALE DU MENU PARTENAIRE (Contenant toutes les autres pages) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in">
          <div
            className="w-full max-w-2xl bg-[#0f172a] rounded-3xl border border-slate-800/90 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header of Menu Modal */}
            <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                  <Menu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white font-display">
                    {strings.menuTitle}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {strings.menuDesc}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Menu Pages */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {menuPages.map((page) => {
                  const isSelected = activeTab === page.id;
                  return (
                    <button
                      key={page.id}
                      onClick={() => handleSelectMenuPage(page.id)}
                      className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-3.5 group ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/40'
                          : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-xl border shrink-0 transition-transform group-hover:scale-105 ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-500/40'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        {page.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-sm font-bold truncate ${
                              isSelected ? 'text-cyan-300 font-black' : 'text-white group-hover:text-cyan-300'
                            }`}
                          >
                            {page.title}
                          </span>
                          <ChevronRight
                            className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                              isSelected ? 'text-cyan-400' : 'text-slate-600'
                            }`}
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {page.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer with quick shortcut to Dashboard and Subscription */}
            <div className="p-4 sm:p-5 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 gap-3">
              <div className="flex items-center gap-2">
                <span>{strings.shortcuts}</span>
                <button
                  onClick={() => handleSelectMenuPage('dashboard')}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold border border-slate-800 hover:text-cyan-300 cursor-pointer"
                >
                  {strings.dashboard}
                </button>
                <button
                  onClick={() => handleSelectMenuPage('subscription')}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold border border-slate-800 hover:text-cyan-300 cursor-pointer"
                >
                  {strings.subscription}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold border border-slate-800 cursor-pointer"
              >
                {strings.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
