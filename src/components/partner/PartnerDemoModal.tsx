import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Users,
  Trophy,
  FileText,
  Zap,
  Clock,
  ArrowRight,
  X,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Organization, Language } from '../../types';
import { t } from '../../translations';

interface PartnerDemoModalProps {
  organization: Organization;
  language: Language;
  onActivate: () => void;
  onClose: () => void;
  isOpen: boolean;
}

const DEMO_KEY = 'tulizaana_partner_demo_activated';
const DEMO_EXPIRY_KEY = 'tulizaana_partner_demo_expires_at';
const DEMO_DAYS = 30;

const isDemoActivated = (): boolean => {
  try {
    const activated = localStorage.getItem(DEMO_KEY);
    const expiresAt = localStorage.getItem(DEMO_EXPIRY_KEY);
    if (!activated || !expiresAt) return false;
    return new Date() < new Date(expiresAt);
  } catch {
    return false;
  }
};

const getDemoDaysRemaining = (): number => {
  try {
    const expiresAt = localStorage.getItem(DEMO_EXPIRY_KEY);
    if (!expiresAt) return 0;
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
};

const activateDemo = (): void => {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + DEMO_DAYS * 24 * 60 * 60 * 1000);
    localStorage.setItem(DEMO_KEY, 'true');
    localStorage.setItem(DEMO_EXPIRY_KEY, expiresAt.toISOString());
  } catch {}
};

export const PartnerDemoModal: React.FC<PartnerDemoModalProps> = ({
  organization,
  language,
  onActivate,
  onClose,
  isOpen,
}) => {
  const [isActivating, setIsActivating] = useState(false);
  const strings = t[language]?.partnerPortal || t.fr.partnerPortal;
  const demoStrings: Record<string, string> = (t[language] as any)?.partnerDemo || (t.fr as any)?.partnerDemo || {};

  const handleActivate = async () => {
    setIsActivating(true);
    activateDemo();
    setTimeout(() => {
      setIsActivating(false);
      onActivate();
    }, 800);
  };

  if (!isOpen) return null;

  const daysRemaining = getDemoDaysRemaining();

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#111827] border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden animate-scale-up my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-purple-500/30 bg-slate-950/80">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display">
              {demoStrings?.title || 'Activer votre démo 30 jours'}
            </h2>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {demoStrings?.subtitle ||
              `Testez Tulizaana gratuitement pendant 30 jours avant de décider de passer à un abonnement payant.`}
          </p>
        </div>

        {/* Benefits */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {demoStrings?.benefit1Title || '1 Communauté fermée'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {demoStrings?.benefit1Desc ||
                  'Créez votre premier cercle de parole sécurisé et accueillez vos membres.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {demoStrings?.benefit2Title || 'Jusqu\'à 20 membres'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {demoStrings?.benefit2Desc ||
                  'Accueillez jusqu\'à 20 bénéficiaires dans votre communauté pendant la démo.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {demoStrings?.benefit3Title || '1 Campagne gratuite'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {demoStrings?.benefit3Desc ||
                  'Organisez une campagne de collecte de fonds ou de sensibilisation sans frais.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {demoStrings?.benefit4Title || 'Rapport de fin de démo'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {demoStrings?.benefit4Desc ||
                  'Recevez un rapport d\'impact détaillé à la fin des 30 jours.'}
              </p>
            </div>
          </div>

          {/* No payment notice */}
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  {demoStrings?.noPaymentTitle || '100% gratuit'}
                </h4>
                <p className="text-[11px] text-emerald-200 leading-relaxed">
                  {demoStrings?.noPaymentDesc ||
                    'Aucun paiement requis. Aucune carte bancaire. Aucune coordonnée Mobile Money. Aucune information financière demandée.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Days remaining badge (if already activated) */}
        {daysRemaining > 0 && (
          <div className="px-6 sm:p-8 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between px-2 py-3 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-purple-400" />
                {demoStrings?.daysRemaining || 'Jours restants'}
              </span>
              <span className="text-sm font-black text-purple-400 bg-purple-500/10 px-2 py-1 rounded-lg">
                {daysRemaining} j
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 sm:p-8 border-t border-slate-800 bg-slate-950/50">
          <button
            onClick={handleActivate}
            disabled={isActivating}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isActivating ? (
              <>
                <ArrowRight className="w-4 h-4 animate-spin" />
                <span>Activation en cours...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>{demoStrings?.activateBtn || 'Activer ma démo gratuite'}</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full mt-3 py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm border border-slate-700 transition-all cursor-pointer"
          >
            {demoStrings?.laterBtn || 'Plus tard'}
          </button>
        </div>
      </div>
    </div>
  );
};

export { isDemoActivated, getDemoDaysRemaining, activateDemo, DEMO_DAYS };
