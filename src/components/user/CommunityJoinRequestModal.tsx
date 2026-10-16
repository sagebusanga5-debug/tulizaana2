import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  MessageSquare,
  Phone,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Building2,
  HeartHandshake,
  ExternalLink,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { Community, Organization, UserProfile } from '../../types';
import confetti from 'canvas-confetti';

interface CommunityJoinRequestModalProps {
  community: Community;
  organization?: Organization;
  currentUser: UserProfile;
  onClose: () => void;
  onSubmitRequest: (params: {
    communityId: string;
    pseudonym: string;
    deliveryChannel: 'chat' | 'whatsapp';
    whatsappNumber?: string;
    reason?: string;
  }) => { code?: string; pending?: boolean } | void;
  onOpenChat?: () => void;
  onDirectJoinAndOpenProfile?: (communityId: string) => void;
}

export const CommunityJoinRequestModal: React.FC<CommunityJoinRequestModalProps> = ({
  community,
  organization,
  currentUser,
  onClose,
  onSubmitRequest,
  onOpenChat,
  onDirectJoinAndOpenProfile,
}) => {
  const [pseudonym, setPseudonym] = useState(
    currentUser?.pseudonym || currentUser?.name || 'Membre_Confidentiel'
  );
  const [deliveryChannel, setDeliveryChannel] = useState<'chat' | 'whatsapp'>('chat');
  const [whatsappNumber, setWhatsappNumber] = useState(currentUser?.phone || '+243 ');
  const [reason, setReason] = useState('');
  const [acceptedCharter, setAcceptedCharter] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const orgName = community.organizationName || organization?.name || 'Organisation Partenaire';
  const orgLead = organization?.responsibleName || 'Équipe d’écoute médicale & psychosociale';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!pseudonym.trim()) {
      setErrorMessage('Veuillez indiquer un prénom ou pseudonyme.');
      return;
    }

    if (deliveryChannel === 'whatsapp' && whatsappNumber.trim().length < 8) {
      setErrorMessage('Veuillez renseigner un numéro WhatsApp valide.');
      return;
    }

    if (!acceptedCharter) {
      setErrorMessage('Veuillez accepter l’engagement de confidentialité pour continuer.');
      return;
    }

    setIsSubmitting(true);

    // Envoi de la demande d'invitation à l'organisation
    setTimeout(() => {
      onSubmitRequest({
        communityId: community.id,
        pseudonym: pseudonym.trim(),
        deliveryChannel,
        whatsappNumber: deliveryChannel === 'whatsapp' ? whatsappNumber.trim() : undefined,
        reason: reason.trim(),
      });

      setIsSubmitting(false);
      setIsSubmitted(true);

      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.6 },
      });
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#0e1626] border border-slate-700/80 rounded-[32px] overflow-hidden shadow-2xl my-8">
        
        {/* TOP BANNER */}
        <div className="relative h-28 sm:h-32 bg-slate-900 overflow-hidden">
          <img
            src={community.coverImage || community.image}
            alt={community.name}
            className="w-full h-full object-cover opacity-40 blur-xs scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-b from-[#0e1626]/60 via-[#0e1626]/80 to-[#0e1626]" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-slate-300 hover:text-white flex items-center justify-center border border-white/10 transition-all cursor-pointer z-10"
          >
            ✕
          </button>

          {/* Organization badge */}
          <div className="absolute bottom-3 left-6 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#090f1a] border-2 border-teal-400/80 p-0.5 overflow-hidden shadow-lg shrink-0">
              <img
                src={community.image || organization?.logo}
                alt={orgName}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                  Communauté Protégée
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight font-display drop-shadow-md">
                {community.name}
              </h2>
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="p-6 sm:p-7 space-y-6">

          {/* 1. CONFIRMATION VIEW (PENDING REVIEW BY ORGANIZATION) */}
          {isSubmitted ? (
            <div className="space-y-6 text-center animate-fadeIn py-2">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400/80 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-500/20">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Demande transmise à l'organisation</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white font-display">
                  Candidature en cours d'examen
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  Votre demande pour rejoindre le cercle fermé <strong className="text-white">« {community.name} »</strong> a bien été transmise aux coordinateurs de <strong className="text-cyan-300">{orgName}</strong>.
                </p>
              </div>

              {/* DETAILS CARD */}
              <div className="p-5 rounded-2xl bg-[#090f1a] border border-amber-500/30 text-left space-y-3.5 shadow-inner">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Statut de la demande :</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-[11px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    En attente de validation (sous 24h)
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800/60 text-xs">
                  <span className="text-slate-400">Supervision :</span>
                  <span className="font-bold text-slate-200">{orgLead}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800/60 text-xs">
                  <span className="text-slate-400">Canal d'expédition choisi :</span>
                  <span className="font-bold text-emerald-300">
                    {deliveryChannel === 'whatsapp' ? `WhatsApp (${whatsappNumber})` : 'Messagerie Tulizaana'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                  🛡️ <strong>Protocole de sécurité :</strong> Pour préserver la sécurité psychologique et le respect mutuel des membres, les coordinateurs de {orgName} valident chaque profil avant de délivrer un code d'invitation sécurisé unique.
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3.5 px-6 rounded-2xl bg-linear-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 text-sm font-black shadow-lg shadow-teal-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>J'ai compris (Fermer)</span>
                </button>

                {deliveryChannel === 'chat' && onOpenChat && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChat();
                      onClose();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span>Consulter le suivi dans ma messagerie</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* 2. JOIN REQUEST FORM */
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Context Explanation */}
              <div className="p-4 rounded-2xl bg-[#090f1a] border border-slate-800 text-xs text-slate-300 space-y-1.5 leading-relaxed">
                <div className="flex items-center gap-2 text-teal-300 font-bold">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>Cercle fermé à supervision sécurisée</span>
                </div>
                <p>
                  Pour préserver la sécurité et l'intimité des témoignages, l'accès à cette communauté est validé par <strong className="text-white">{orgName}</strong>. Remplissez ce formulaire pour recevoir votre code d'invitation confidentiel.
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Field 1: Pseudonym / Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Votre pseudonyme ou prénom (pour l’organisation)
                </label>
                <input
                  type="text"
                  value={pseudonym}
                  onChange={(e) => setPseudonym(e.target.value)}
                  placeholder="Ex : Marie_Espoir, Samuel_243..."
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400 transition-colors"
                />
                <span className="text-[10px] text-slate-500 block">
                  Votre anonymat est protégé. Vous pouvez utiliser un pseudonyme.
                </span>
              </div>

              {/* Field 2: Delivery Channel Selector (Chat vs WhatsApp) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Où souhaitez-vous recevoir votre code d'invitation ?
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Channel: Chat Tulizaana */}
                  <div
                    onClick={() => setDeliveryChannel('chat')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      deliveryChannel === 'chat'
                        ? 'bg-cyan-950/30 border-cyan-400/80 shadow-md shadow-cyan-950/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black text-white">Dans le Chat</span>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                        Instantané
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      Un message privé de l'organisation arrive directement dans votre boîte de discussion.
                    </p>
                  </div>

                  {/* Channel: WhatsApp */}
                  <div
                    onClick={() => setDeliveryChannel('whatsapp')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      deliveryChannel === 'whatsapp'
                        ? 'bg-emerald-950/30 border-emerald-400/80 shadow-md shadow-emerald-950/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Phone className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black text-white">Sur WhatsApp</span>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                        Mobile
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      L'équipe d'écoute vous transmet le code sur votre numéro WhatsApp.
                    </p>
                  </div>

                </div>
              </div>

              {/* Conditional Field: WhatsApp Number */}
              {deliveryChannel === 'whatsapp' && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2 animate-fadeIn">
                  <label className="block text-xs font-bold text-emerald-300">
                    Votre numéro de téléphone WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+243 89 000 0000"
                    required={deliveryChannel === 'whatsapp'}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-400 font-mono"
                  />
                  <span className="text-[10px] text-emerald-400/80 block">
                    Votre numéro restera strictement confidentiel et sera uniquement utilisé pour la transmission de votre accès.
                  </span>
                </div>
              )}

              {/* Field 3: Reason / Motivation (Optional) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Pourquoi souhaitez-vous rejoindre ce cercle ? (Facultatif)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex : Je cherche du soutien, des conseils sur mon traitement ou des témoignages de personnes vivant la même situation..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400 resize-none"
                />
              </div>

              {/* Field 4: Charter Checkbox */}
              <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={acceptedCharter}
                  onChange={(e) => setAcceptedCharter(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-teal-400 focus:ring-teal-500 bg-slate-900 border-slate-700"
                />
                <span className="text-xs text-slate-300 leading-snug">
                  Je m'engage à respecter la charte de <strong className="text-white">confidentialité</strong>, la bienveillance et le secret des témoignages partagés au sein de cette communauté.
                </span>
              </label>

              {/* SUBMIT BUTTON */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs sm:text-sm font-bold transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-2xl bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Transmission en cours...</span>
                  ) : (
                    <>
                      <span>Envoyer la demande à l'organisation</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
