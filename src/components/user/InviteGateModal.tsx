import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  ArrowRight,
  User,
  MapPin,
  Globe,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { InvitationCode, Language, UserProfile } from '../../types';
import { TulizaanaIcon } from '../brand/TulizaanaBrand';

interface InviteGateModalProps {
  invitations: InvitationCode[];
  language?: Language;
  onClose: () => void;
  onRegisterWithInvite?: (
    invitation: InvitationCode,
    profileData: {
      name: string;
      pseudonym?: string;
      country: string;
      language: Language;
      bio: string;
    }
  ) => void;
  onSuccessJoin?: (communityId: string) => void;
}

export const InviteGateModal: React.FC<InviteGateModalProps> = ({
  invitations = [],
  language: initialLang = 'fr',
  onClose,
  onRegisterWithInvite,
  onSuccessJoin,
}) => {
  const [step, setStep] = useState<'code' | 'profile'>('code');
  const [enteredCode, setEnteredCode] = useState('');
  const [matchedInvitation, setMatchedInvitation] = useState<InvitationCode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Profile form state
  const [name, setName] = useState('');
  const [pseudonym, setPseudonym] = useState('');
  const [country, setCountry] = useState('RDC (Kinshasa)');
  const [language, setLanguage] = useState<Language>(initialLang);
  const [bio, setBio] = useState('');

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const found = (invitations || []).find(
      (inv) =>
        inv.code.toUpperCase() === enteredCode.trim().toUpperCase() &&
        inv.status === 'active'
    );

    if (found) {
      setMatchedInvitation(found);
      if (onSuccessJoin && !onRegisterWithInvite) {
        onSuccessJoin(found.communityId);
        return;
      }
      setStep('profile');
    } else {
      setErrorMessage(
        'Code d’invitation invalide, utilisé ou expiré. Tulizaana est un cercle strictement fermé.'
      );
    }
  };

  const handleCompleteRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedInvitation) return;
    if (!name.trim() || !bio.trim()) {
      setErrorMessage('Le nom et la courte bio d’expérience sont obligatoires.');
      return;
    }

    if (onRegisterWithInvite) {
      onRegisterWithInvite(matchedInvitation, {
        name: name.trim(),
        pseudonym: pseudonym.trim() || undefined,
        country,
        language,
        bio: bio.trim(),
      });
    }

    if (onSuccessJoin) {
      onSuccessJoin(matchedInvitation.communityId);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#182231] rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-[#0e1626] border border-cyan-500/40">
              <TulizaanaIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">
                Portail d'Accès Sécurisé
              </h2>
              <p className="text-xs text-slate-400">
                Plateforme privée panafricaine en cercle fermé
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: VERIFY INVITATION CODE */}
        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="p-6 sm:p-8 space-y-6">
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 space-y-2 text-xs text-slate-200">
              <div className="flex items-center gap-2 font-bold text-cyan-300">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Règle absolue : Inscription sur invitation uniquement</span>
              </div>
              <p className="leading-relaxed">
                Sans code d’invitation valide émis par une ONG partenaire, aucun compte ne peut être créé.
              </p>
            </div>

            {/* Input Code */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Entrez votre code d'invitation personnel :
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value)}
                  placeholder="EX : TLZ-DREPANO-77"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 font-mono text-sm font-bold text-white placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-400 uppercase"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-linear-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm shadow-xl shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Vérifier le code et continuer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: COMPLETE MANDATORY PROFILE */}
        {step === 'profile' && matchedInvitation && (
          <form onSubmit={handleCompleteRegistration} className="p-6 sm:p-8 space-y-4">
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center gap-3 text-xs text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold block">Invitation validée !</span>
                <span>
                  Vous rejoignez la communauté : <strong>{matchedInvitation.communityName}</strong>
                </span>
              </div>
            </div>

            {/* Name / Pseudo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nom ou prénom réel :
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Amina K."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Pseudonyme (facultatif) :
                </label>
                <input
                  type="text"
                  value={pseudonym}
                  onChange={(e) => setPseudonym(e.target.value)}
                  placeholder="Ex : Espoir24"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Country & Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Pays :
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Langue principale :
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="ar">العربية (Arabe)</option>
                  <option value="pt">Português (Portugais)</option>
                </select>
              </div>
            </div>

            {/* MANDATORY 2-LINE BIO */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span>Courte bio d’expérience (Obligatoire ~2 lignes) :</span>
                <span className="text-cyan-400 text-[10px]">Votre vécu</span>
              </label>
              <textarea
                required
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ex : Je vis avec une maladie chronique depuis plusieurs années. J’apprends aujourd’hui à vivre pleinement malgré elle."
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400 resize-none"
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-linear-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm shadow-xl shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
            >
              Créer mon profil et entrer dans la communauté
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
