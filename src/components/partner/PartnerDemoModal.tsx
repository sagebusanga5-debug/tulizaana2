import React, { useState } from 'react';
import { Zap, Clock, ArrowRight, X } from 'lucide-react';
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
  const d = t[language]?.partnerDemo || (t.fr as any)?.partnerDemo || {};

  const handleActivate = async () => {
    setIsActivating(true);
    activateDemo();
    setTimeout(() => {
      setIsActivating(false);
      onActivate();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-[#111827] border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden animate-scale-up my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-purple-500/20 bg-slate-950/60">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-black text-white font-display">
              {d?.title || 'Démo gratuite 30 jours'}
            </h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {d?.subtitle || 'Testez Tulizaana gratuitement avant de décider de passer à un abonnement.'}
          </p>
        </div>

        {/* Benefits ultra courts */}
        <div className="p-5 sm:p-6 space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
              <Zap className="w-3 h-3" />
            </div>
            <div className="text-[11px] text-slate-300 leading-relaxed">
              {d?.benefits || '1 communauté • jusqu\'à 20 membres • 1 campagne gratuite • rapport d\'impact en fin de démo'}
            </div>
          </div>

          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
            <div className="flex items-start gap-1.5">
              <Zap className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-emerald-200 leading-relaxed">
                {d?.noPayment || '100% gratuit — aucune carte bancaire, aucun Mobile Money, aucune donnée financière'}
              </div>
            </div>
          </div>
        </div>

        {/* Actions ultra minimalistes */}
        <div className="p-5 sm:p-6 border-t border-slate-800 bg-slate-950/40">
          <button
            onClick={handleActivate}
            disabled={isActivating}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isActivating ? (
              <ArrowRight className="w-3 h-3 animate-spin" />
            ) : (
              <Zap className="w-3 h-3" />
            )}
            <span>{d?.activateBtn || 'Activer ma démo'}</span>
          </button>

          <button
            onClick={onClose}
            className="w-full mt-2 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-semibold text-xs sm:text-sm border border-slate-700 transition-all cursor-pointer"
          >
            {d?.laterBtn || 'Plus tard'}
          </button>
        </div>
      </div>
    </div>
  );
};

export { isDemoActivated, getDemoDaysRemaining, activateDemo, DEMO_DAYS };
