import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone, Monitor } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Language } from '../../types';

interface PWAInstallButtonProps {
  language?: Language;
  variant?: 'button' | 'compact' | 'card';
  className?: string;
}

const installTexts = {
  fr: {
    installApp: "Installer l'app",
    installDesktop: "Installer sur PC / Mobile",
    installDesc: "Accès instantané, icône sur l'écran d'accueil et fonctionnement hors-ligne.",
    iosTitle: "Installer Tulizaana sur iPhone / iPad",
    iosStep1: "Dans Safari, appuyez sur le bouton",
    iosShare: "Partager",
    iosStep2: "Faites défiler vers le bas et sélectionnez",
    iosAddToHome: "Sur l'écran d'accueil",
    iosStep3: "Appuyez sur",
    iosAdd: "Ajouter",
    iosConfirm: "en haut à droite.",
    close: "Fermer",
    installed: "Application installée",
  },
  en: {
    installApp: "Install app",
    installDesktop: "Install on PC / Mobile",
    installDesc: "Instant access, home screen icon and offline support.",
    iosTitle: "Install Tulizaana on iPhone / iPad",
    iosStep1: "In Safari, tap the",
    iosShare: "Share",
    iosStep2: "Scroll down and select",
    iosAddToHome: "Add to Home Screen",
    iosStep3: "Tap",
    iosAdd: "Add",
    iosConfirm: "at the top right.",
    close: "Close",
    installed: "App installed",
  },
  ar: {
    installApp: "تثبيت التطبيق",
    installDesktop: "التثبيت على الحاسوب / الهاتف",
    installDesc: "وصول فوري، أيقونة الشاشة الرئيسية والعمل دون اتصال.",
    iosTitle: "تثبيت Tulizaana على iPhone / iPad",
    iosStep1: "في متصفح Safari، اضغط على زر",
    iosShare: "المشاركة",
    iosStep2: "مرر لأسفل واختر",
    iosAddToHome: "إضافة إلى الصفحة الرئيسية",
    iosStep3: "اضغط على",
    iosAdd: "إضافة",
    iosConfirm: "في أعلى اليمين.",
    close: "إغلاق",
    installed: "تم تثبيت التطبيق",
  },
  pt: {
    installApp: "Instalar app",
    installDesktop: "Instalar no PC / Celular",
    installDesc: "Acesso instantâneo, ícone na tela inicial e suporte offline.",
    iosTitle: "Instalar Tulizaana no iPhone / iPad",
    iosStep1: "No Safari, toque no botão",
    iosShare: "Compartilhar",
    iosStep2: "Role para baixo e selecione",
    iosAddToHome: "Adicionar à Tela de Início",
    iosStep3: "Toque em",
    iosAdd: "Adicionar",
    iosConfirm: "no canto superior direito.",
    close: "Fechar",
    installed: "Aplicativo instalado",
  },
  sw: {
    installApp: "Sakinisha programu",
    installDesktop: "Sakinisha kwenye Kompyuta / Simu",
    installDesc: "Ufikiaji wa haraka, aikoni kwenye skrini ya mwanzo na matumizi bila mtandao.",
    iosTitle: "Sakinisha Tulizaana kwenye iPhone / iPad",
    iosStep1: "Kwenye Safari, bonyeza kitufe cha",
    iosShare: "Shiriki",
    iosStep2: "Sogeza chini kisha chagua",
    iosAddToHome: "Ongeza kwenye Skrini ya Kwanza",
    iosStep3: "Bonyeza",
    iosAdd: "Ongeza",
    iosConfirm: "juu kulia.",
    close: "Funga",
    installed: "Programu imesakinishwa",
  },
};

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  language = 'fr',
  variant = 'button',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  const t = installTexts[language] || installTexts.fr;

  // If already installed and running standalone, do not render
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // In Chromium / desktop where beforeinstallprompt may not have fired yet
      // or browser shows install in URL bar
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {variant === 'compact' && (
        <button
          onClick={handleClick}
          title={t.installApp}
          aria-label={t.installApp}
          className={`flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${className}`}
        >
          <Download className="w-4 h-4" />
        </button>
      )}

      {variant === 'button' && (
        <button
          onClick={handleClick}
          className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${className}`}
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="whitespace-nowrap">{t.installApp}</span>
        </button>
      )}

      {variant === 'card' && (
        <div className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-[#131c2e] to-slate-900 border border-cyan-500/30 shadow-xl space-y-3 ${className}`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{t.installDesktop}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold">PWA</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {t.installDesc}
              </p>
            </div>
          </div>
          <button
            onClick={handleClick}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>{t.installApp}</span>
          </button>
        </div>
      )}

      {/* MODAL GUIDE FOR IOS OR BROWSERS WITHOUT DIRECT PROMPT */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#141c2c] border border-cyan-500/30 p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/pwa-192x192.png"
                  alt="Tulizaana"
                  className="w-12 h-12 rounded-2xl shadow-lg border border-cyan-500/40"
                />
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    {isIOS ? t.iosTitle : t.installDesktop}
                  </h3>
                  <p className="text-xs text-cyan-400 font-medium">Tulizaana PWA</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3.5 bg-slate-900/70 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-black flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <p className="pt-0.5">
                    {t.iosStep1}{' '}
                    <span className="inline-flex items-center gap-1 font-bold text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                      <Share2 className="w-3.5 h-3.5 inline" /> {t.iosShare}
                    </span>
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-black flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <p className="pt-0.5">
                    {t.iosStep2}{' '}
                    <span className="inline-flex items-center gap-1 font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                      <PlusSquare className="w-3.5 h-3.5 inline text-cyan-400" /> {t.iosAddToHome}
                    </span>
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-black flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <p className="pt-0.5">
                    {t.iosStep3} <strong className="text-white">« {t.iosAdd} »</strong> {t.iosConfirm}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 bg-slate-900/70 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                  <Monitor className="w-4 h-4 text-cyan-400" />
                  <span>Sur Chrome, Edge ou Brave (PC / Mac / Android) :</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Cliquez sur l'icône d'installation dans la barre d'adresse de votre navigateur (icône d'écran ou « + »), ou ouvrez le menu du navigateur (⋮) et cliquez sur <strong>« Installer Tulizaana »</strong>.
                </p>
              </div>
            )}

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
