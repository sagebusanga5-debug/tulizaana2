import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, X, ArrowRight, Sparkles } from 'lucide-react';
import { TulizaanaLogo } from '../brand/TulizaanaBrand';
import { signInAdmin, type AdminSession } from './adminAuth';

import { Language } from '../../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  language?: Language;
  onClose: () => void;
  onSuccess: (session: AdminSession) => void;
}

/**
 * Connexion au Back Office central.
 *
 * La verification se fait exclusivement sur le serveur, via `POST /api/auth/login`
 * puis `GET /api/auth/me` : ce composant ne compare aucun mot de passe et ne
 * conserve aucun identifiant dans le navigateur.
 */
export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  language = 'fr',
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const adminTexts = {
    fr: {
      title: 'Back Office Tulizaana',
      subtitle: 'Console d’administration globale réservée à l’équipe centrale Tulizaana.',
      emailLabel: 'Email Administrateur',
      pwdLabel: 'Mot de passe Maître',
      encryptedAccess: 'Accès chiffré',
      verifying: 'Vérification sécurisée...',
      unlockConsole: 'Déverrouiller la Console Centrale',
      errorMissing: 'Veuillez renseigner votre adresse email et votre mot de passe.',
      errorInvalid: 'Identifiants invalides. Vérifiez l’adresse email et le mot de passe maître.',
      sessionNote: 'Session vérifiée par le serveur',
    },
    sw: {
      title: 'Usimamizi Mkuu wa Tulizaana',
      subtitle: 'Dashibodi ya usimamizi mkuu inayotengwa kwa timu ya kiini ya Tulizaana.',
      emailLabel: 'Barua Pepe ya Msimamizi',
      pwdLabel: 'Nenosiri Kuu',
      encryptedAccess: 'Ufikiaji uliolindwa',
      verifying: 'Inathibitisha kwa usalama...',
      unlockConsole: 'Fungua Dashibodi Kuu',
      errorMissing: 'Tafuta barua pepe na nenosiri.',
      errorInvalid: 'Vitambulisho si sahihi. Angalia barua pepe na nenosiri kuu.',
      sessionNote: 'Kifasi imethibitishwa na seva',
    },
    en: {
      title: 'Tulizaana Central Back Office',
      subtitle: 'Global administrative dashboard restricted to core Tulizaana leadership.',
      emailLabel: 'Admin Email',
      pwdLabel: 'Master Password',
      encryptedAccess: 'Encrypted Access',
      verifying: 'Verifying securely...',
      unlockConsole: 'Unlock Central Console',
      errorMissing: 'Please enter your email address and password.',
      errorInvalid: 'Invalid credentials. Please verify your email and master password.',
      sessionNote: 'Session verified by the server',
    },
    ar: {
      title: 'المكتب الإداري المركزي لتوليزانا',
      subtitle: 'لوحة التحكم الإدارية العامة المخصصة للإدارة المركزية لتوليزانا.',
      emailLabel: 'البريد الإلكتروني للمسؤول',
      pwdLabel: 'كلمة المرور الرئيسية',
      encryptedAccess: 'وصول مشفر',
      verifying: 'جارٍ التحقق بأمان...',
      unlockConsole: 'فتح لوحة التحكم المركزية',
      errorMissing: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.',
      errorInvalid: 'بيانات الاعتماد غير صالحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور.',
      sessionNote: 'تم التحقق من الجلسة عبر الخادم',
    },
    pt: {
      title: 'Back Office Central Tulizaana',
      subtitle: 'Painel de administração global reservado à equipa central da Tulizaana.',
      emailLabel: 'Email de Administrador',
      pwdLabel: 'Palavra-passe Mestre',
      encryptedAccess: 'Acesso encriptado',
      verifying: 'A verificar em segurança...',
      unlockConsole: 'Desbloquear Consola Central',
      errorMissing: 'Introduza o email e a palavra-passe.',
      errorInvalid: 'Credenciais inválidas. Verifique o email e a palavra-passe mestre.',
      sessionNote: 'Sessão verificada pelo servidor',
    },
  }[language] || {
    title: 'Back Office Tulizaana',
    subtitle: 'Console d’administration globale réservée à l’équipe centrale Tulizaana.',
    emailLabel: 'Email Administrateur',
    pwdLabel: 'Mot de passe Maître',
    encryptedAccess: 'Accès chiffré',
    verifying: 'Vérification sécurisée...',
    unlockConsole: 'Déverrouiller la Console Centrale',
    errorMissing: 'Veuillez renseigner votre adresse email et votre mot de passe.',
    errorInvalid: 'Identifiants invalides. Vérifiez l’adresse email et le mot de passe maître.',
    sessionNote: 'Session vérifiée par le serveur',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError(adminTexts.errorMissing);
      return;
    }

    setIsLoading(true);
    const result = await signInAdmin(email, password);
    setIsLoading(false);

    if ('error' in result) {
      setError(result.error);
      return;
    }

    setPassword('');
    onSuccess(result.session);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0d131f] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/40 text-slate-100 overflow-hidden">
        {/* Subtle Ambient Background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Fermer la console"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="relative">
            <TulizaanaLogo size="md" iconClassName="w-12 h-12" />
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-black tracking-widest uppercase">
              Admin
            </span>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
              <span>{adminTexts.title}</span>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {adminTexts.subtitle}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {adminTexts.emailLabel}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={adminTexts.emailLabel}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-cyan-500 focus:outline-hidden text-sm text-white placeholder:text-slate-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {adminTexts.pwdLabel}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-cyan-500 focus:outline-hidden text-sm text-white placeholder:text-slate-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Security notice */}
          <div className="flex items-center justify-end pt-1">
            <span className="text-[10px] text-slate-500">{adminTexts.sessionNote}</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-linear-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>{adminTexts.verifying}</span>
              </span>
            ) : (
              <>
                <span>{adminTexts.unlockConsole}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Footer Note */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{adminTexts.encryptedAccess}</span>
          </div>
          <span className="font-mono text-[10px]">v2.6.4-sec</span>
        </div>
      </div>
    </div>
  );
};