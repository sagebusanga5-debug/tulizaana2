import React, { useState } from 'react';
import {
  Users,
  Building2,
  ArrowRight,
  ArrowLeft,
  Globe,
  KeyRound,
} from 'lucide-react';
import { Language } from '../../types';
import { t } from '../../translations';
import { TulizaanaLogo } from '../brand/TulizaanaBrand';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { PartnerFinalizationScreen } from './PartnerFinalizationScreen';
import { PartnerRegistrationForm } from './PartnerRegistrationForm';

interface WelcomeScreenProps {
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  onSelectRole: (role: 'user' | 'partner') => void;
  onOpenAdminBackOffice?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  language,
  onSelectLanguage,
  onSelectRole,
  onOpenAdminBackOffice,
}) => {
  const [showFinalization, setShowFinalization] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showPartnerPortal, setShowPartnerPortal] = useState(false);

  const currentLang = t[language]?.welcome || t.fr.welcome;
  const commonLang = t[language]?.common || t.fr.common;

  if (showFinalization) {
    return (
      <PartnerFinalizationScreen
        onSuccess={() => {
          setShowFinalization(false);
          onSelectRole('partner');
        }}
        onCancel={() => setShowFinalization(false)}
      />
    );
  }

  if (showRegistration) {
    return (
      <PartnerRegistrationForm
        onSuccess={() => {
          setShowRegistration(false);
          onSelectRole('partner');
        }}
        onCancel={() => setShowRegistration(false)}
      />
    );
  }

  if (showPartnerPortal) {
    return (
      <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col">
        <div className="flex-1 max-w-xl w-full mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => setShowPartnerPortal(false)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-bold text-purple-400">Portail partenaire</span>
            </div>
          </div>

          <div className="rounded-3xl bg-[#111422] border border-purple-500/30 p-6 sm:p-8 shadow-2xl">
            <h1 className="text-2xl font-bold text-white mb-2">Accéder au portail partenaire</h1>
            <p className="text-sm text-slate-300 mb-8">
              Choisissez votre situation pour accéder à votre espace organisation.
            </p>

            {/* Option principale : connexion */}
            <button
              onClick={() => {
                setShowPartnerPortal(false);
                setShowFinalization(true);
              }}
              className="w-full py-4 px-6 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg shadow-purple-500/20 mb-6"
            >
              <KeyRound className="w-5 h-5" />
              <span>Se connecter avec mon code d'invitation</span>
            </button>

            {/* Separateur "ou" */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider bg-[#070b12] px-3">
                  ou
                </span>
              </div>
              <div className="border-t border-slate-800 w-full" />
            </div>

            {/* Options secondaires */}
            <button
              onClick={() => {
                setShowPartnerPortal(false);
                setShowRegistration(true);
              }}
              className="w-full py-4 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-sm flex items-center justify-center gap-3 transition-all cursor-pointer border border-purple-500/30 mb-4"
            >
              <Building2 className="w-5 h-5" />
              <span>Je suis déjà partenaire (connexion ultérieure)</span>
            </button>

            <button
              onClick={() => {
                setShowPartnerPortal(false);
                setShowRegistration(true);
              }}
              className="w-full py-4 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-sm flex items-center justify-center gap-3 transition-all cursor-pointer border border-purple-500/30"
            >
              <ArrowRight className="w-5 h-5" />
              <span>Demander une invitation (nouvelle organisation)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#080D14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* HEADER */}
      <header className="h-16 w-full max-w-full bg-[#0B111A]/90 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <TulizaanaLogo size="sm" iconClassName="w-6 h-6 sm:w-7 sm:h-7" />
        </div>

        {/* Controls: PWA Install + Language Switcher (replacing security badge) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PWA Install Button */}
          <PWAInstallButton language={language} variant="button" className="hidden sm:flex" />
          <PWAInstallButton language={language} variant="compact" className="sm:hidden" />

          {/* Language Switcher Button - Replaces the security badge */}
          <div
            id="welcome-language-switcher"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-slate-200 text-xs font-semibold shadow-xs transition-all"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <select
              value={language}
              onChange={(e) => onSelectLanguage(e.target.value as Language)}
              aria-label="Changer de langue"
              className="bg-transparent text-slate-100 font-bold focus:outline-hidden cursor-pointer text-xs pr-1"
            >
              <option value="fr" className="bg-slate-900 text-white">Français (FR)</option>
              <option value="sw" className="bg-slate-900 text-white">Kiswahili (SW)</option>
              <option value="en" className="bg-slate-900 text-white">English (EN)</option>
              <option value="ar" className="bg-slate-900 text-white">العربية (AR)</option>
              <option value="pt" className="bg-slate-900 text-white">Português (PT)</option>
            </select>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT - COMPACT & NO SCROLL REQUIRED */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8 flex flex-col justify-center min-w-0">
        
        {/* Minimalist Title */}
        <div className="text-center space-y-3 mb-6 sm:mb-8 max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
            {currentLang.tagline || 'Bienvenue sur Tulizaana'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            {currentLang.desc}
          </p>
        </div>

        {/* 2 DIRECT ACCESS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto w-full">
          
          {/* Card 1: Espace Membre */}
          <div
            onClick={() => onSelectRole('user')}
            className="rounded-2xl bg-[#101724] border border-cyan-500/30 hover:border-cyan-400 p-5 sm:p-6 flex flex-col justify-between shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer group active:scale-[0.99]"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {commonLang.beneficiaries || 'Bénéficiaires'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                {currentLang.userCardTitle}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {currentLang.userCardDesc}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectRole('user');
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{currentLang.userBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Espace Partenaire ONG */}
          <div
            onClick={() => setShowPartnerPortal(true)}
            className="rounded-2xl bg-[#131625] border border-purple-500/30 hover:border-purple-400 p-5 sm:p-6 flex flex-col justify-between shadow-lg hover:shadow-purple-500/10 transition-all cursor-pointer group active:scale-[0.99]"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  {commonLang.ngosDonors || 'ONG & Bailleurs'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                {currentLang.partnerCardTitle}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {currentLang.partnerCardDesc}
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPartnerPortal(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>{currentLang.partnerBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Minimalist footer with discrete Tulizaana Ecosystem Back Office link */}
        <div className="mt-8 text-center text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={onOpenAdminBackOffice}
              title="Tulizaana Ecosystem"
              className="font-extrabold text-cyan-400 font-display tracking-wider hover:text-cyan-300 hover:underline cursor-pointer transition-colors"
            >
              TULIZAANA ECOSYSTEM
            </button>
            <span className="text-slate-700">•</span>
            <span className="text-slate-400">Communauté & Résilience Holistique</span>
          </div>
          <p className="text-[10px] text-slate-600">
            {commonLang.securePlatform || 'Plateforme sécurisée & confidentielle • Tulizaana 2026'}
          </p>
        </div>
      </main>
    </div>
  );
};

