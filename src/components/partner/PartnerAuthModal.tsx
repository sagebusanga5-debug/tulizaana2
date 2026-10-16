import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Building2,
  X,
  AlertCircle,
} from 'lucide-react';
import { Language } from '../../types';
import {
  api,
  PARTNER_ERROR_LABELS,
  type PartnerManagedOrganization,
} from '../../services/api';

interface PartnerAuthModalProps {
  isOpen?: boolean;
  language?: Language;
  onClose: () => void;
  /**
   * Appele UNIQUEMENT apres reponse serveur favorable.
   *
   * L'organisation est celle que le serveur a resolue depuis `OrganizationAdmin` :
   * elle n'est jamais choisie ni declaree par le client.
   */
  onSuccessAuth: (organizationId: string, managed: PartnerManagedOrganization[]) => void;
}

const COPY = {
  fr: {
    title: 'Acces Espace Partenaire',
    subtitle:
      "Authentification requise pour les referents, equipes d'ONG et coordinateurs afin d'assurer la confidentialite des cercles.",
    emailLabel: 'Adresse e-mail professionnelle',
    emailPlaceholder: 'referent@organisation.org',
    pwdLabel: 'Mot de passe',
    errorEmpty: 'Veuillez saisir votre adresse e-mail et votre mot de passe.',
    errorEmptyOrg: "Aucune organisation partenaire n'est associee a ce compte.",
    errorMultiOrg: 'Ce compte gere plusieurs organisations. Choisissez celle a ouvrir.',
    errorInvalid: 'Identifiants invalides. Verifiez votre e-mail et votre mot de passe.',
    verifying: 'Verification de votre session...',
    unlockBtn: "Ouvrir l'Espace Partenaire",
    selectOrgLabel: 'Organisation a ouvrir',
    networkError: 'Le serveur est injoignable. Verifiez votre connexion.',
  },
  en: {
    title: 'Partner Space Access',
    subtitle:
      'Authentication required for referents, NGO teams and coordinators to ensure circle confidentiality.',
    emailLabel: 'Professional email address',
    emailPlaceholder: 'referent@organisation.org',
    pwdLabel: 'Password',
    errorEmpty: 'Please enter your email address and password.',
    errorEmptyOrg: 'No partner organization is linked to this account.',
    errorMultiOrg: 'This account manages several organizations. Choose the one to open.',
    errorInvalid: 'Invalid credentials. Check your email and password.',
    verifying: 'Verifying your session...',
    unlockBtn: 'Open Partner Space',
    selectOrgLabel: 'Organization to open',
    networkError: 'Server unreachable. Check your connection.',
  },
};

/**
 * Chantier 4 - Authentification reelle du portail partenaire.
 *
 * Avant : la validation etait integralement cote client. Toute chaine de
 * longueur >= 4 passait, un code de demonstration etait accepte, et
 * l'organisation etait CHOISIE dans une liste deroulante puis transmise a
 * `onSuccessAuth`. Aucun serveur n'etait consulte.
 *
 * Apres : `POST /api/auth/login` verifie le mot de passe en base, puis
 * `GET /api/organizations/mine` retourne les organisations issues de la table
 * `OrganizationAdmin`. L'organisation est donc resolue par le serveur, et le
 * client ne fait que choisir parmi celles que le serveur a listees.
 */
export const PartnerAuthModal: React.FC<PartnerAuthModalProps> = ({
  isOpen = true,
  language = 'fr',
  onClose,
  onSuccessAuth,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [managed, setManaged] = useState<PartnerManagedOrganization[]>([]);

  if (!isOpen) return null;

  const texts = COPY[language as 'fr' | 'en'] ?? COPY.fr;

  const handleAuthenticate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError(texts.errorEmpty);
      return;
    }

    setIsLoading(true);

    try {
      const login = await api.partner.login({ email: trimmedEmail, password });

      if (!login.success) {
        setError(texts.errorInvalid);
        setIsLoading(false);
        return;
      }

      const organizations = await api.partner.managedOrganizations();

      if (!organizations.success || !organizations.data) {
        setError(texts.networkError);
        setIsLoading(false);
        return;
      }

      if (organizations.data.length === 0) {
        setError(texts.errorEmptyOrg);
        setIsLoading(false);
        return;
      }

      setManaged(organizations.data);
      setIsLoading(false);

      // Une seule organisation : ouverture directe, sans choix possible.
      if (organizations.data.length === 1) {
        onSuccessAuth(organizations.data[0].id, organizations.data);
        return;
      }

      // Plusieurs organisations : l'utilisateur choisit PARMI CELLES QUE LE
      // SERVEUR A LISTEES. Ce n'est pas une declaration d'identite : le serveur
      // reverifie le choix a chaque mutation.
      setError(null);
    } catch {
      setError(texts.networkError);
      setIsLoading(false);
    }
  };

  const handleSelectOrganization = (organizationId: string) => {
    const chosen = managed.find((org) => org.id === organizationId);
    if (!chosen) return;
    onSuccessAuth(chosen.id, managed);
  };

  const handleBack = () => {
    setManaged([]);
    setPassword('');
  };

  // --- Etape 2 : selection parmi les organisations listees par le serveur ---
  if (managed.length > 1) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-[#111827] border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white font-display tracking-tight">
              {texts.selectOrgLabel}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">{texts.errorMultiOrg}</p>
          </div>

          <div className="space-y-2">
            {managed.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => handleSelectOrganization(org.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-colors cursor-pointer text-left"
              >
                {org.logo ? (
                  <img src={org.logo} alt="" className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{org.name}</p>
                  <p className="text-xs text-slate-400">
                    {org.subscriptionPlan} · {org.quotas.communities.used}/{org.quotas.communities.max}{' '}
                    communaute(s)
                  </p>
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleBack}
            className="w-full py-3 rounded-2xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Changer de compte
          </button>
        </div>
      </div>
    );
  }

  // --- Etape 1 : identifiants reels ---
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-white font-display tracking-tight">
            {texts.title}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">{texts.subtitle}</p>
        </div>

        <form onSubmit={handleAuthenticate} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              {texts.emailLabel}
            </label>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={texts.emailPlaceholder}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              {texts.pwdLabel}
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-black text-sm transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            {isLoading ? texts.verifying : texts.unlockBtn}
          </button>
        </form>

        <p className="text-[11px] text-slate-500 leading-relaxed text-center">
          Identite verifiee par le serveur. Votre organisation est deduite de vos
          acces, elle ne peut pas etre choisie ni declaree.
        </p>
      </div>
    </div>
  );
};

/** Reexport pour que l'interface puisse typer les messages issus des codes metier. */
export { PARTNER_ERROR_LABELS };