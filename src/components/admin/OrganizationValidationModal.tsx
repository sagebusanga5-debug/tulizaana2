import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Send,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  AlertCircle,
  FileCheck,
  Award,
  Layers,
  Eye,
  FileSpreadsheet,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { Organization, LegalDocument } from '../../types';

interface OrganizationValidationModalProps {
  organization: Organization | null;
  isOpen?: boolean;
  initialTab?: 'identity' | 'contact' | 'documents' | 'plan' | 'email';
  onClose: () => void;
  onValidateAndSendEmail: (
    orgId: string,
    invitationCode: string,
    emailDetails?: { to: string; subject: string; body: string }
  ) => void;
  onPutUnderReview?: (orgId: string) => void;
}

export const OrganizationValidationModal: React.FC<OrganizationValidationModalProps> = ({
  organization,
  isOpen = true,
  initialTab,
  onClose,
  onValidateAndSendEmail,
  onPutUnderReview,
}) => {
  if (isOpen === false || !organization) return null;

  const [activeTab, setActiveTab] = useState<'identity' | 'contact' | 'documents' | 'plan' | 'email'>(
    initialTab || (organization.status === 'pending' || organization.status === 'under_review' ? 'email' : 'identity')
  );

  // Invitation code generation / customization
  const [invitationCode, setInvitationCode] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedDocPreview, setSelectedDocPreview] = useState<LegalDocument | null>(null);

  useEffect(() => {
    if (organization) {
      if (initialTab) {
        setActiveTab(initialTab);
      } else {
        setActiveTab(organization.status === 'pending' || organization.status === 'under_review' ? 'email' : 'identity');
      }

      const cleanAcronym = (organization.acronym || organization.name.split(' ')[0] || 'ORG')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 6);
      const code = organization.invitationCode || `TLZ-ORG-${cleanAcronym}-${Math.floor(1000 + Math.random() * 9000)}`;
      setInvitationCode(code);

      const subject = `[Tulizaana Écosystème] Agrément Officiel & Code d'Accès Partenaire - ${organization.name}`;
      setEmailSubject(subject);

      const body = `Bonjour ${organization.responsibleName},

Nous avons le grand plaisir de vous annoncer que le dossier d'agrément de votre organisation "${organization.name}" (${organization.acronym || (organization.type || '').toUpperCase()}) a été officiellement examiné et validé par l'équipe centrale de Tulizaana.

Votre profil organisation est désormais approuvé pour la création et l'animation de vos cercles de parole sécurisés, la distribution des clés d'accès aux bénéficiaires et le déploiement de vos parcours de résilience.

══════════════════════════════════════════════════════
VOTRE CODE D'INVITATION PARTENAIRE OFFICIEL :
${code}
══════════════════════════════════════════════════════

Détails de votre souscription validée :
• Formule : ${(organization.subscriptionPlan || '').toUpperCase()}
• Quota de communautés : jusqu'à ${organization.quotaCommunities?.max || 3} cercles fermés
• Capacité de membres : jusqu'à ${organization.quotaMembers?.max || 1000} bénéficiaires
• Campagnes de résilience : jusqu'à ${organization.quotaCampaignsPerMonth?.max || 5} par mois

Pour activer votre espace dès maintenant :
1. Rendez-vous sur la plateforme Tulizaana : https://tulizaana.org
2. Accédez à l'Espace Partenaire (ou cliquez sur "Tulizaana Ecosystem" dans le pied de page).
3. Connectez-vous avec votre adresse officielle (${organization.contactEmail}) ou renseignez votre code partenaire ${code}.

Nous vous remercions chaleureusement pour votre engagement au service de la santé communautaire et de la dignité humaine.

Bien fraternellement,
L'Équipe Centrale de Validation & Sécurité Tulizaana
support@tulizaana.org | Kinshasa • Goma • Dakar • Nairobi`;

      setEmailBody(body);
      setEmailSentSuccess(false);
    }
  }, [organization, initialTab]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(invitationCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleConfirmValidationAndEmail = () => {
    if (!invitationCode.trim()) return;

    setIsSendingEmail(true);

    // Simulate reliable dispatch with feedback
    setTimeout(() => {
      setIsSendingEmail(false);
      setEmailSentSuccess(true);
      onValidateAndSendEmail(organization.id, invitationCode.trim(), {
        to: organization.contactEmail,
        subject: emailSubject,
        body: emailBody,
      });
      setTimeout(() => {
        onClose();
      }, 2000);
    }, 1200);
  };

  const handleOpenMailto = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(organization.contactEmail)}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0d131f] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95">
        
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 bg-[#111928] border-b border-slate-800 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3.5">
            <img
              src={organization.logo || 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=150'}
              alt={organization.name}
              className="w-13 h-13 rounded-2xl object-cover border border-slate-700 shadow-md shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-display">
                  {organization.name}
                </h2>
                {organization.acronym && (
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/20">
                    {organization.acronym}
                  </span>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                    organization.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : organization.status === 'under_review'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                  }`}
                >
                  {organization.status === 'approved'
                    ? 'Validée & Active'
                    : organization.status === 'under_review'
                    ? 'En examen approfondi'
                    : 'En attente de validation'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {organization.country} {organization.city ? `• ${organization.city}` : ''}
                </span>
                <span className="capitalize px-2 py-0.2 rounded-md bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
                  {organization.type}
                </span>
                <span className="text-slate-500 text-[11px]">
                  Dossier soumis le {new Date(organization.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="px-5 sm:px-6 pt-3 bg-[#0d131f] border-b border-slate-800/80 flex items-center gap-1 sm:gap-2 overflow-x-auto text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'email'
                ? 'border-cyan-400 text-cyan-300 font-bold bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4 text-cyan-400" />
            <span>Validation & Envoi Mail</span>
            {organization.status === 'pending' && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('identity')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'identity'
                ? 'border-cyan-400 text-cyan-300 font-bold bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Identité & Missions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'contact'
                ? 'border-cyan-400 text-cyan-300 font-bold bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Représentant & Contact</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'documents'
                ? 'border-cyan-400 text-cyan-300 font-bold bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Pièces Légales ({organization.legalDocuments?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('plan')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'plan'
                ? 'border-cyan-400 text-cyan-300 font-bold bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Formule & Quotas</span>
          </button>
        </div>

        {/* BODY CONTENT SCROLLABLE */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* TAB: VALIDATION & EMAIL SENDING */}
          {activeTab === 'email' && (
            <div className="space-y-5">
              
              {/* Notice Banner */}
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="text-xs space-y-1">
                  <span className="font-bold text-white block text-sm">
                    Procédure de validation officielle par email
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    Conformément au protocole de gouvernance Tulizaana, la validation d'une organisation partenaire s'effectue par l'envoi officiel d'un courrier électronique adressé au responsable légal, comportant son <strong className="text-cyan-300">Code d'Invitation Partenaire unique</strong> et les instructions d'ouverture de ses cercles de soutien.
                  </p>
                </div>
              </div>

              {emailSentSuccess ? (
                <div className="p-8 text-center rounded-3xl bg-emerald-950/20 border border-emerald-500/40 space-y-3 animate-in fade-in">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Organisation Validée & Email Transmis avec Succès !
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    Le code d'accès <span className="font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded">{invitationCode}</span> et la notification officielle d'agrément ont été expédiés à <strong className="text-white">{organization.contactEmail}</strong>.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    L'organisation dispose maintenant des accès partenaires complets.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* INVITATION CODE CUSTOMIZER */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-cyan-400" />
                        <span>Code d'invitation officiel généré pour l'organisation :</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Copié' : 'Copier le code'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={invitationCode}
                        onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                        placeholder="Ex: TLZ-ORG-PANZI-2026"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono font-bold text-cyan-300 focus:outline-hidden focus:border-cyan-400 tracking-wider"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Ce code confidentiel sera transmis dans l'email ci-dessous et servira de sésame d'entrée pour la structure.
                    </p>
                  </div>

                  {/* EMAIL COMPOSER / PREVIEW */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-white">Courrier électronique de validation</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Destinataire : <strong className="text-cyan-300">{organization.contactEmail}</strong>
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Objet du message :
                      </label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Corps du mail officiel (personnalisable) :
                      </label>
                      <textarea
                        rows={10}
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-mono leading-relaxed focus:outline-hidden focus:border-cyan-400 resize-none"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleOpenMailto}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Ouvrir dans votre client de messagerie par défaut (Outlook, Thunderbird, Apple Mail)"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        <span>Ouvrir dans mon logiciel Mail</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {onPutUnderReview && organization.status !== 'under_review' && (
                          <button
                            type="button"
                            onClick={() => onPutUnderReview(organization.id)}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Mettre sous examen</span>
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isSendingEmail || !invitationCode.trim()}
                          onClick={handleConfirmValidationAndEmail}
                          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                        >
                          {isSendingEmail ? (
                            <>
                              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                              <span>Envoi du mail en cours...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Envoyer le Mail & Valider l'Organisation</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: IDENTITY & MISSION (Data harvested from creation form) */}
          {activeTab === 'identity' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-cyan-400" />
                    <span>Présentation & Identité Officielle</span>
                  </h3>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Nom légal déclaré :</span>
                    <p className="text-slate-100 font-semibold text-sm mt-0.5">{organization.name}</p>
                  </div>
                  {organization.acronym && (
                    <div>
                      <span className="text-slate-500 text-[11px] block">Sigle / Acronyme :</span>
                      <p className="font-mono text-cyan-300 font-bold">{organization.acronym}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 text-[11px] block">Statut juridique / Type d'entité :</span>
                    <span className="inline-block px-2.5 py-0.5 mt-0.5 rounded-md bg-slate-800 text-slate-200 font-semibold uppercase text-[10px]">
                      {organization.type}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Siège social / Pays d'action :</span>
                    <p className="text-slate-200 mt-0.5">{organization.country} {organization.city ? `(${organization.city})` : ''}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Domaine d'intervention pivot :</span>
                    <p className="text-cyan-300 font-medium mt-0.5">{organization.domain}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Domaines Ciblés & Valeurs Fondamentales</span>
                  </h3>
                  <div>
                    <span className="text-slate-500 text-[11px] block mb-1.5">Domaines d'action déclarés dans le formulaire :</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(organization.interventionDomains && organization.interventionDomains.length > 0
                        ? organization.interventionDomains
                        : [organization.domain]
                      ).map((dom, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium"
                        >
                          {dom}
                        </span>
                      ))}
                    </div>
                  </div>

                  {organization.values && organization.values.length > 0 && (
                    <div>
                      <span className="text-slate-500 text-[11px] block mb-1.5">Valeurs éthiques de l'organisation :</span>
                      <div className="flex flex-wrap gap-1.5">
                        {organization.values.map((val, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-medium"
                          >
                            ✓ {val}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description, Vision, Mission */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div>
                  <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block">
                    Description de présentation soumise :
                  </span>
                  <p className="text-slate-200 mt-1 leading-relaxed">
                    {organization.description}
                  </p>
                </div>

                {organization.vision && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block">
                      Vision d'impact sociétal :
                    </span>
                    <p className="text-slate-300 italic mt-1 leading-relaxed">
                      "{organization.vision}"
                    </p>
                  </div>
                )}

                {organization.mission && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block">
                      Mission communautaire sur Tulizaana :
                    </span>
                    <p className="text-slate-300 mt-1 leading-relaxed">
                      {organization.mission}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: REPRESENTATIVE & CONTACT DETAILS */}
          {activeTab === 'contact' && (
            <div className="space-y-4 text-xs">
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-sm">
                    Représentant Légal & Coordonnées Officielles
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[11px] block">Nom et prénom du responsable légal :</span>
                    <p className="text-white font-bold text-sm">{organization.responsibleName}</p>
                    <span className="text-[11px] text-cyan-400">Directeur / Coordinateur Mandaté</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[11px] block">Email officiel certifié :</span>
                    <p className="text-white font-mono font-semibold text-sm flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-cyan-400" />
                      {organization.contactEmail}
                    </p>
                    <span className="text-[10px] text-emerald-400">Canal de réception du code de validation</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[11px] block">Téléphone officiel / WhatsApp :</span>
                    <p className="text-white font-mono font-semibold text-sm flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      {organization.contactPhone}
                    </p>
                    <span className="text-[10px] text-slate-400">Ligne directe de permanence</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[11px] block">Statut d'approbation administrative :</span>
                    <p className="font-bold text-sm text-white">
                      {organization.status === 'approved' ? '✓ Agréée' : '⏳ En cours d’examen'}
                    </p>
                    {organization.validatedAt && (
                      <span className="text-[10px] text-slate-400">
                        Validée le {new Date(organization.validatedAt).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Declared Team Specialists */}
              {organization.teamMembers && organization.teamMembers.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <h4 className="font-bold text-white text-xs">
                    Équipe Médicale & Psychosociale Enregistrée ({organization.teamMembers.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {organization.teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3"
                      >
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                        />
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-bold text-white truncate">{member.name}</p>
                          <p className="text-cyan-400 text-[11px] truncate">{member.role}</p>
                          {member.specialty && (
                            <p className="text-slate-400 text-[10px] truncate">{member.specialty}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: LEGAL DOCUMENTS & VERIFICATION */}
          {activeTab === 'documents' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex items-start gap-3">
                <FileCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block text-sm">
                    Pièces justificatives & Conformité légale
                  </span>
                  <p className="text-slate-300 mt-0.5">
                    L'organisation a déposé les documents légaux ci-dessous lors du formulaire de création de son profil. Cliquez sur chaque document pour inspecter ses métadonnées ou vérifier sa validité.
                  </p>
                </div>
              </div>

              {(!organization.legalDocuments || organization.legalDocuments.length === 0) ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
                  <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-slate-300 font-medium">Aucun document téléversé dans ce dossier</p>
                  <p className="text-[11px] text-slate-500">
                    L'organisation peut être invitée par email à fournir son arrêté d'agrément ou ses statuts notariés.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {organization.legalDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-800 text-cyan-400 border border-slate-700 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-xs sm:text-sm">
                              {doc.name}
                            </h4>
                            <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 font-mono text-[10px] font-semibold border border-cyan-500/20">
                              {doc.documentTypeLabel || doc.documentType}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[11px]">
                            <span className="font-mono text-slate-300">{doc.fileName}</span>
                            <span>• {doc.fileSize}</span>
                            <span>• Uploadé le {doc.uploadedAt}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            doc.status === 'verified'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {doc.status === 'verified' ? '✓ Conforme & Vérifié' : '⏳ En cours de revue'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedDocPreview(doc)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Consulter</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* DOCUMENT PREVIEW MODAL */}
              {selectedDocPreview && (
                <div className="p-4 rounded-2xl bg-[#0a101b] border border-cyan-500/30 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-white text-xs">
                        Aperçu certificat : {selectedDocPreview.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedDocPreview(null)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <h5 className="text-sm font-bold text-white">{selectedDocPreview.fileName}</h5>
                    <p className="text-[11px] text-slate-400">
                      Document scellé et chiffré dans le registre central Tulizaana • Taille: {selectedDocPreview.fileSize}
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                      <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40">
                        SHA-256 Intégrité Vérifiée
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: PLAN & QUOTAS */}
          {activeTab === 'plan' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[11px] block">Formule Souscrite :</span>
                  <div className="text-xl font-black text-amber-400 uppercase">
                    {organization.subscriptionPlan}
                  </div>
                  <p className="text-[11px] text-slate-400">Adaptée à l'envergure de la structure</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[11px] block">Capacité Communautés :</span>
                  <div className="text-xl font-black text-cyan-400">
                    {organization.quotaCommunities?.used || 0} / {organization.quotaCommunities?.max || 3}
                  </div>
                  <p className="text-[11px] text-slate-400">Cercles fermés autorisés</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[11px] block">Capacité Membres :</span>
                  <div className="text-xl font-black text-purple-400">
                    {organization.quotaMembers?.used || 0} / {organization.quotaMembers?.max || 1000}
                  </div>
                  <p className="text-[11px] text-slate-400">Bénéficiaires encadrés</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Engagements de Sécurité & Secret Partagé</span>
                </h4>
                <ul className="space-y-1.5 text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Respect de l'anonymat et du pseudonymat des bénéficiaires des cercles fermés.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Modération active et bienveillante assurée par des professionnels de santé / pairs qualifiés.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Non-divulgation des données nominatives ou médicales à des tiers commerciaux.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 bg-[#111928] border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            {organization.status === 'approved' ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Organisation déjà validée dans l'écosystème
              </span>
            ) : (
              <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Action requise : validation par email avec code d'invitation
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Fermer
            </button>
            {activeTab !== 'email' && organization.status !== 'approved' && (
              <button
                type="button"
                onClick={() => setActiveTab('email')}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer shadow-md shadow-cyan-500/20"
              >
                Passer à la Validation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
