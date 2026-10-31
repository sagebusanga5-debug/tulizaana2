import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  KeyRound,
  AlertCircle,
  ArrowRight,
  Lock,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';

interface PartnerFinalizationScreenProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const PartnerFinalizationScreen: React.FC<PartnerFinalizationScreenProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!code.trim() || !email.trim()) {
      setErrorMsg('Veuillez renseigner le code et l\'adresse e-mail');
      return;
    }

    setIsVerifying(true);

    try {
      const res = await api.partnerFinalization.validateCode(code.trim(), email.trim());

      if (!res.success) {
        setErrorMsg(res.error || 'Code invalide');
        setIsVerifying(false);
        return;
      }

      setIsCodeValid(true);
      setOrganizationName(res.data?.organization?.name || null);
      setSuccessMsg('Code validé ! Vous pouvez maintenant finaliser votre compte.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur lors de la validation du code');
      setIsVerifying(false);
    }
  };

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isCodeValid) {
      setErrorMsg('Veuillez d\'abord valider votre code');
      return;
    }

    setIsFinalizing(true);

    try {
      const res = await api.partnerFinalization.finalizeAccount(code.trim(), email.trim());

      if (!res.success) {
        setErrorMsg(res.error || 'Erreur lors de la finalisation');
        setIsFinalizing(false);
        return;
      }

      setSuccessMsg('Votre compte partenaire est prêt !');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur lors de la finalisation');
      setIsFinalizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col">
      <div className="flex-1 max-w-xl w-full mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-bold text-purple-400">Finalisation</span>
          </div>
        </div>

        {/* Main card */}
        <div className="rounded-3xl bg-[#111422] border border-purple-500/30 p-6 sm:p-8 shadow-2xl">
          {!isCodeValid ? (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">Finalisez votre compte partenaire</h1>
                <p className="text-sm text-slate-300">
                  Saisissez le code reçu par e-mail après l'approbation de votre demande pour activer votre compte.
                </p>
              </div>

              <form onSubmit={handleValidateCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Code d'invitation
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="Ex : TLZ-FINAL-XXXXXXXXXXXX"
                      className="w-full bg-[#080d16] border border-slate-700 focus:border-purple-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono uppercase focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Adresse e-mail associée à la demande
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre.email@exemple.com"
                      className="w-full bg-[#080d16] border border-slate-700 focus:border-purple-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-hidden"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-3 px-6 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
                >
                  {isVerifying ? (
                    <span>Vérification en cours...</span>
                  ) : (
                    <>
                      <span>Vérifier mon code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Code validé !</h1>
                <p className="text-sm text-slate-300">
                  {organizationName && (
                    <span className="block mb-2">Organisation : {organizationName}</span>
                  )}
                  Vous pouvez maintenant finaliser la création de votre compte partenaire.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 mb-6">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Lock className="w-4 h-4 text-purple-400" />
                  <span>
                    Le mot de passe que vous avez choisi lors de la demande sera automatiquement associé à votre compte.
                  </span>
                </div>
              </div>

              {successMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs mb-4">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleFinalize} className="space-y-4">
                <button
                  type="submit"
                  disabled={isFinalizing}
                  className="w-full py-3 px-6 rounded-xl bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
                >
                  {isFinalizing ? (
                    <span>Finalisation en cours...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Finaliser mon compte partenaire</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
