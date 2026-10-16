import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Building2,
  Lock,
} from 'lucide-react';
import { api, PARTNER_ERROR_LABELS, type PartnerErrorCode } from '../../services/api';

interface CreateCommunityModalProps {
  isOpen: boolean;
  /** Organisation choisie, issue de la liste renvoyee par le serveur. */
  organizationId: string;
  organizationName: string;
  language?: string;
  onClose: () => void;
  onCreated: (community: { id: string; name: string }) => void;
}

interface CommunityOption {
  id: string;
  name: string;
}

/**
 * Bouton d'action et formulaire de creation d'un cercle.
 *
 * Remplace definitivement « Creer un profil organisation » dans le portail
 * partenaire : une organisation partner ne cree plus d'organisation, elle
 * cree des cercles au sein de la sienne.
 *
 * Regles :
 *  - le bouton est visible quand l'action a du sens ;
 *  - il est visuellement desactive quand le quota est atteint, et affiche la
 *    raison lue dans le `code` metier renvoye par le serveur ;
 *  - le backend refait TOUJOURS la verification. Le desactivage visuel n'est
 *    qu'un confort d'affichage et ne constitue en aucun cas une autorisation.
 */
export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({
  isOpen,
  organizationId,
  organizationName,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mission, setMission] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorCode, setErrorCode] = useState<PartnerErrorCode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Etat de droits et de quotas, relu depuis le serveur.
  const [blockedBy, setBlockedBy] = useState<PartnerErrorCode | null>(null);
  const [quota, setQuota] = useState<{ used: number; max: number; exceeded: boolean } | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoadingRights, setIsLoadingRights] = useState(true);

  const [communities, setCommunities] = useState<CommunityOption[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setIsLoadingRights(true);
    setErrorCode(null);
    setErrorMessage(null);

    void (async () => {
      const manage = await api.partner.organizationManage(organizationId);
      if (cancelled) return;

      if (manage.success && manage.data) {
        setBlockedBy(manage.data.blockedBy);
        setQuota(manage.data.quotas.communities);
        setExpiresAt(manage.data.subscription.expiresAt);
      } else {
        setBlockedBy((manage.code as PartnerErrorCode) ?? 'PARTNER_NO_ORGANIZATION');
      }

      const list = await api.communities.list();
      if (cancelled) return;
      if (list.success && Array.isArray(list.data)) {
        setCommunities(
          list.data
            .filter((c: any) => c.organizationId === organizationId)
            .map((c: any) => ({ id: c.id, name: c.name }))
        );
      }

      setIsLoadingRights(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, organizationId]);

  const blockedLabel = useMemo(() => {
    if (!blockedBy) return null;
    return PARTNER_ERROR_LABELS[blockedBy] ?? "Action indisponible pour le moment.";
  }, [blockedBy]);

  const quotaLabel = quota
    ? `${quota.used}/${quota.max} communaute${quota.max > 1 ? 's' : ''}`
    : null;

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const isBlocked = blockedBy !== null || quota?.exceeded === true || isLoadingRights;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isBlocked) return;

    setIsSubmitting(true);
    setErrorCode(null);
    setErrorMessage(null);

    // Le client attend la reponse serveur avant de modifier quoi que ce soit.
    const res = await api.partner.createCommunity({
      name,
      description: description || undefined,
      mission: mission || undefined,
      isPrivate,
    });

    setIsSubmitting(false);

    if (!res.success) {
      const code = res.code as PartnerErrorCode | undefined;
      setErrorCode(code ?? null);
      setErrorMessage(
        code && PARTNER_ERROR_LABELS[code]
          ? PARTNER_ERROR_LABELS[code]
          : res.error || "La creation du cercle a echoue."
      );
      // Les quotas et l'etat d'abonnement sont rafraichis : c'est la seule
      // source de verite pour l'affichage.
      const manage = await api.partner.organizationManage(organizationId);
      if (manage.success && manage.data) {
        setBlockedBy(manage.data.blockedBy);
        setQuota(manage.data.quotas.communities);
      }
      return;
    }

    onCreated({ id: res.data?.id ?? '', name });
    setName('');
    setDescription('');
    setMission('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <span aria-hidden="true">&times;</span>
        </button>

        <div className="space-y-3 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white font-display tracking-tight">
            Creer une communaute
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Cercle de soutien prive rattache a{' '}
            <span className="text-cyan-400 font-bold">{organizationName}</span>.
          </p>
        </div>

        {/* Etats de droits, lus depuis le serveur */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="px-4 py-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Quota</p>
            <p className="text-sm font-black text-white mt-1 flex items-center gap-2">
              {isLoadingRights ? (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              ) : quota?.exceeded ? (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              {quotaLabel ?? '—'}
            </p>
          </div>
          <div className="px-4 py-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
              Abonnement
            </p>
            <p className="text-sm font-black text-white mt-1">
              {expiryLabel ? `Jusqu'au ${expiryLabel}` : 'Aucune echeance'}
            </p>
          </div>
        </div>

        {blockedLabel && (
          <div
            role="alert"
            className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm"
          >
            <Lock className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              {blockedLabel}
              {quota?.exceeded && ' Quota de communautes atteint.'}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Nom du cercle
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isBlocked}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isBlocked}
              rows={3}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50 resize-y"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Mission
            </label>
            <textarea
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              disabled={isBlocked}
              rows={2}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50 resize-y"
            />
          </div>

          <label className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              disabled={isBlocked}
              className="w-4 h-4 accent-cyan-500"
            />
            Communaute privee (acces par invitation uniquement)
          </label>

          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                {errorMessage}
                {errorCode ? ` (${errorCode})` : ''}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={isBlocked || isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-sm transition-colors cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Building2 className="w-4 h-4" />
            )}
            {isSubmitting ? 'Creation en cours...' : 'Creer la communaute'}
          </button>

          {communities.length > 0 && (
            <p className="text-[11px] text-slate-500">
              {communities.length} communaute(s) rattachee(s) a votre organisation.
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateCommunityModal;