import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, Share2, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';
import { api } from '../../services/api';

interface PartnerLoginScreenProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const PartnerLoginScreen: React.FC<PartnerLoginScreenProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Veuillez renseigner votre adresse e-mail et votre mot de passe.');
      return;
    }

    setIsLoggingIn(true);

    try {
      const res = await api.auth.login({
        identifier: email.trim(),
        password: password.trim(),
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Identifiants invalides.');
        setIsLoggingIn(false);
        return;
      }

      setSuccessMsg('Connexion réussie !');
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur lors de la connexion.');
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsLoggingIn(true);

    try {
      const res = await api.auth.googleLogin({ idToken: '' });

      if (!res.success) {
        setErrorMsg(res.error || 'Connexion Google échouée.');
        setIsLoggingIn(false);
        return;
      }

      setSuccessMsg('Connexion Google réussie !');
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur lors de la connexion Google.');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col">
      <div className="flex-1 max-w-md w-full mx-auto px-4 py-8">
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
            <Building2 className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-bold text-purple-400">Connexion</span>
          </div>
        </div>

        <div className="rounded-3xl bg-[#111422] border border-purple-500/30 p-6 sm:p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-2">Connexion partenaire</h1>
          <p className="text-sm text-slate-300 mb-8">
            Connectez-vous avec votre adresse e-mail et le mot de passe choisi lors de votre demande d'invitation.
          </p>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full py-3 px-4 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200 font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 mb-4"
          >
            <Share2 className="w-4 h-4" />
            <span>Se connecter avec Google</span>
          </button>

          {/* Separateur */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider bg-[#070b12] px-3">
                ou
              </span>
            </div>
            <div className="border-t border-slate-800 w-full" />
          </div>

          {/* Form email/mot de passe */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                Adresse e-mail
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

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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

            {successMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 px-6 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
            >
              {isLoggingIn ? (
                <span>Connexion en cours...</span>
              ) : (
                <>
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
