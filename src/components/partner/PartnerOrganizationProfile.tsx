import React, { useState, useRef } from 'react';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  Eye,
  Target,
  Compass,
  Heart,
  Users,
  Trophy,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  PlusCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Edit3,
  X,
  Globe,
  Share2,
  FileCheck,
  Upload,
  Trash2,
  Download,
  AlertCircle,
  FileText,
  Plus,
} from 'lucide-react';
import { Community, LegalDocument, Organization, OrganizationTeamMember, PartnerTab, Language } from '../../types';
import { t } from '../../translations';

interface PartnerOrganizationProfileProps {
  organization: Organization;
  communities?: Community[];
  isPartnerAdminView?: boolean;
  language?: Language;
  onSelectLanguage?: (lang: Language) => void;
  onNavigateTab?: (tab: PartnerTab) => void;
  onSelectCommunity?: (communityId: string) => void;
  onContactTeamMember?: (member: OrganizationTeamMember) => void;
  onClose?: () => void;
  onUpdateOrganization?: (updated: Partial<Organization>) => void;
  onOpenCreateCommunity?: () => void;
}

const AFRICAN_COUNTRIES = [
  'République Démocratique du Congo (RDC)',
  'Sénégal',
  'Côte d’Ivoire',
  'Cameroun',
  'Rwanda',
  'Burundi',
  'Guinée',
  'Mali',
  'Bénin',
  'Togo',
  'Burkina Faso',
  'Congo-Brazzaville',
  'Gabon',
  'Tchad',
  'Madagascar',
  'Niger',
  'Centrafrique',
  'Autre pays africain',
];

const SUGGESTED_DOMAINS = [
  'Santé mentale & Dépression',
  'Drépanocytose (SS / SC)',
  'Traumatismes & VSBG',
  'Cercles de parole & Écoute active',
  'Maladies chroniques & Diabète',
  'VIH / Sida & Soutien fraternel',
  'Santé maternelle & Enfance',
  'Accompagnants & Aidants familiaux',
  'Réinsertion & Résilience communautaire',
  'Handicap & Inclusion sociale',
];

export const PartnerOrganizationProfile: React.FC<PartnerOrganizationProfileProps> = ({
  organization,
  communities = [],
  isPartnerAdminView = false,
  language = 'fr',
  onSelectLanguage,
  onNavigateTab,
  onSelectCommunity,
  onContactTeamMember,
  onClose,
  onUpdateOrganization,
  onOpenCreateCommunity,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit form states
  const [editCountry, setEditCountry] = useState(organization.country || 'République Démocratique du Congo');
  const [editCity, setEditCity] = useState(organization.city || 'Bukavu');
  const [editDesc, setEditDesc] = useState(organization.description || '');
  const [editVision, setEditVision] = useState(organization.vision || '');
  const [editMission, setEditMission] = useState(organization.mission || '');
  const [editDomains, setEditDomains] = useState<string[]>(
    organization.interventionDomains && organization.interventionDomains.length > 0
      ? organization.interventionDomains
      : ['Santé mentale & Dépression', 'Cercles de parole & Écoute active']
  );
  const [newDomainInput, setNewDomainInput] = useState('');
  const [editLegalDocs, setEditLegalDocs] = useState<LegalDocument[]>(organization.legalDocuments || []);
  const [newDocType, setNewDocType] = useState<LegalDocument['documentType']>('agrement_ministeriel');
  const [isDragging, setIsDragging] = useState(false);

  // Filter communities run by this organization
  const orgCommunities = communities.filter(
    (c) => c.organizationId === organization.id || c.organizationName?.toLowerCase() === organization.name?.toLowerCase()
  );

  const handleToggleDomain = (domain: string) => {
    if (editDomains.includes(domain)) {
      setEditDomains(editDomains.filter((d) => d !== domain));
    } else {
      setEditDomains([...editDomains, domain]);
    }
  };

  const handleAddDomain = () => {
    const trimmed = newDomainInput.trim();
    if (trimmed && !editDomains.includes(trimmed)) {
      setEditDomains([...editDomains, trimmed]);
      setNewDomainInput('');
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const typeLabels: Record<LegalDocument['documentType'], string> = {
      agrement_ministeriel: 'Agrément Ministériel Officiel',
      statuts_notaries: 'Statuts Notariés Enregistrés',
      f92_rccm: 'Certificat F92 / RCCM / NIF',
      attestation_siege: 'Attestation de Siège & Localisation',
      autre: 'Preuve Légale Complémentaire',
    };

    const newDoc: LegalDocument = {
      id: `doc-${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      documentType: newDocType,
      documentTypeLabel: typeLabels[newDocType] || 'Document Légal',
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: 'À l’instant',
      status: 'pending_review',
    };

    setEditLegalDocs((prev) => [...prev, newDoc]);
  };

  const handleRemoveDoc = (id: string) => {
    setEditLegalDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSaveEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateOrganization) {
      onUpdateOrganization({
        country: editCountry,
        city: editCity,
        description: editDesc,
        vision: editVision,
        mission: editMission,
        interventionDomains: editDomains,
        legalDocuments: editLegalDocs,
      });
    }
    setIsEditing(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const orgProfileText = t[language]?.orgProfile || t.fr.orgProfile;

  const orgTypeLabels: Record<string, string> = {
    ong: orgProfileText.orgTypes.ong,
    association: orgProfileText.orgTypes.association,
    institution: orgProfileText.orgTypes.autre,
    fondation: orgProfileText.orgTypes.fondation,
    hopital: orgProfileText.orgTypes.centre_sante,
    centre_sante: orgProfileText.orgTypes.centre_sante,
    cooperative: orgProfileText.orgTypes.cooperative,
    collectif: orgProfileText.orgTypes.collectif,
    autre: orgProfileText.orgTypes.autre,
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. TOP HEADER COVER & PROFILE PHOTO CARD */}
      <div className="relative rounded-3xl overflow-hidden bg-[#111827] border border-slate-800 shadow-xl">
        
        {/* Cover Photo Banner */}
        <div className="relative h-48 sm:h-64 w-full bg-slate-950 overflow-hidden">
          {organization.coverImage ? (
            <img
              src={organization.coverImage}
              alt={`Couverture ${organization.name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-r from-cyan-950/50 via-slate-900 to-indigo-950/50" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-[#111827] via-[#111827]/60 to-transparent" />

          {/* Top Bar Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {/* Bouton Changer de langue (English, Français, Arabe, Portugais) */}
            <div
              id="org-profile-language-switcher"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 hover:bg-black/85 text-white backdrop-blur-md border border-white/15 shadow-md transition-all text-xs font-semibold"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <select
                value={language}
                onChange={(e) => onSelectLanguage && onSelectLanguage(e.target.value as Language)}
                aria-label={orgProfileText.changeLanguage}
                title={orgProfileText.changeLanguage}
                className="bg-transparent text-white font-medium focus:outline-hidden cursor-pointer text-xs pr-1"
              >
                <option value="en" className="bg-slate-900 text-white">English (EN)</option>
                <option value="fr" className="bg-slate-900 text-white">Français (FR)</option>
                <option value="ar" className="bg-slate-900 text-white">العربية (AR)</option>
                <option value="pt" className="bg-slate-900 text-white">Português (PT)</option>
                <option value="sw" className="bg-slate-900 text-white">Kiswahili (SW)</option>
              </select>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                title="Fermer"
                className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Profile Info Bar */}
        <div className="px-6 sm:px-8 pb-6 pt-0 relative">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            
            {/* Logo as Profile Avatar */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-[#0B0F14] border-4 border-[#111827] shadow-2xl overflow-hidden shrink-0 group">
              <img
                src={organization.logo}
                alt={organization.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-1 p-1 rounded-lg bg-cyan-500 text-slate-950 shadow-md">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Action Badges / Status */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{orgProfileText.tulizaanaVerified}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Org Name & Meta */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
                {organization.name}
              </h1>
              {organization.acronym && (
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-bold">
                  {organization.acronym}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-cyan-400 font-medium">
                <Building2 className="w-3.5 h-3.5" />
                {orgTypeLabels[organization.type] || organization.type}
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{organization.city ? `${organization.city}, ` : ''}{organization.country}</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-slate-300">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                {orgCommunities.length} {orgProfileText.communitiesRunBy.toLowerCase()} ({orgCommunities.length})
              </span>
            </div>

            {/* Short Presentation */}
            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl pt-2">
              {organization.description}
            </p>

            {/* Action Bar for Partner Admin */}
            {isPartnerAdminView && (
              <div className="pt-4 border-t border-slate-800/80 mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 text-xs sm:text-sm font-bold transition-all text-center cursor-pointer shadow-md active:scale-[0.99]"
                >
                  {orgProfileText.editPresentation}
                </button>

                {onOpenCreateCommunity && (
                  <button
                    type="button"
                    onClick={onOpenCreateCommunity}
                    className="py-3 px-4 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 text-xs sm:text-sm font-bold transition-all text-center cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{orgProfileText.createCommunity}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. VISION, MISSION & VALEURS (Three Pillar Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Vision */}
        <div className="p-5 rounded-3xl bg-[#111827] border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-cyan-400">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <Eye className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
              {orgProfileText.ourVision}
            </h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {organization.vision || orgProfileText.defaultVision}
          </p>
        </div>

        {/* Mission */}
        <div className="p-5 rounded-3xl bg-[#111827] border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-teal-400">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
              <Target className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
              {orgProfileText.ourMission}
            </h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {organization.mission || orgProfileText.defaultMission}
          </p>
        </div>

        {/* Valeurs */}
        <div className="p-5 rounded-3xl bg-[#111827] border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-rose-400">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <Heart className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
              {orgProfileText.ourValues}
            </h2>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(organization.values && organization.values.length > 0
              ? organization.values
              : orgProfileText.defaultValues
            ).map((val, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700/80 text-[11px] font-semibold text-slate-300"
              >
                {val}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. DOMAINES D'INTERVENTIONS */}
      <div className="p-5 rounded-3xl bg-[#111827] border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
              {orgProfileText.interventionDomains}
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            {(organization.interventionDomains?.length || 0)} {orgProfileText.activeDomainsCount}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {(organization.interventionDomains && organization.interventionDomains.length > 0
            ? organization.interventionDomains
            : [
                'Santé mentale & Dépression',
                'Cercles de parole & Écoute active',
                'Maladies chroniques',
                'Résilience communautaire',
              ]
          ).map((domain, index) => (
            <span
              key={index}
              className="px-3 py-1.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-200 text-xs font-medium flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3 h-3 text-cyan-400" />
              <span>{domain}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 4. DOCUMENTS LÉGAUX & PREUVES D'EXISTENCE EN AFRIQUE */}
      <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-display">
                  {orgProfileText.legalDocumentsTitle}
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  {orgProfileText.tulizaanaVerified}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {orgProfileText.legalDocumentsDesc}
              </p>
            </div>
          </div>

          {isPartnerAdminView && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{orgProfileText.manageDocuments}</span>
            </button>
          )}
        </div>

        {/* Documents list */}
        {(!organization.legalDocuments || organization.legalDocuments.length === 0) ? (
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">
              {orgProfileText.noLegalDocuments}
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {orgProfileText.noLegalDocsSub}
            </p>
            {isPartnerAdminView && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{orgProfileText.uploadLegalDocs}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {organization.legalDocuments.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {doc.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <span className="text-cyan-400 font-medium">{doc.documentTypeLabel}</span>
                      <span>•</span>
                      <span>{doc.fileSize}</span>
                      <span>•</span>
                      <span>{doc.uploadedAt}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>{orgProfileText.existenceProofValidated}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => alert(`Téléchargement de la copie certifiée : ${doc.fileName}`)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                  title={orgProfileText.downloadCopy}
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. ÉQUIPE DISPONIBLE SUR TULIZAANA */}
      <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white font-display">
              {orgProfileText.teamTitle}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {orgProfileText.teamDesc}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
            {organization.teamMembers?.length || 3} {orgProfileText.activeReferentsCount}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(organization.teamMembers && organization.teamMembers.length > 0
            ? organization.teamMembers
            : [
                {
                  id: 'default-1',
                  name: organization.responsibleName || 'Dr. Référent',
                  role: 'Coordinateur / Médecin Référent',
                  specialty: organization.domain,
                  avatar: organization.logo,
                  status: 'available',
                  bio: 'Assure la supervision médicale et la sécurité bienveillante des cercles.',
                  email: organization.contactEmail,
                },
              ]
          ).map((member) => (
            <div
              key={member.id}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="relative w-12 h-12 rounded-2xl bg-slate-800 overflow-hidden border border-slate-700 shrink-0">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                  <span
                    className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                      member.status === 'available'
                        ? 'bg-emerald-400'
                        : member.status === 'active'
                        ? 'bg-cyan-400'
                        : 'bg-amber-400'
                    }`}
                    title={member.status === 'available' ? 'Disponible' : 'En ligne'}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white truncate">
                    {member.name}
                  </h4>
                  <p className="text-xs text-cyan-400 font-medium truncate">
                    {member.role}
                  </p>
                  {member.specialty && (
                    <p className="text-[11px] text-slate-400 truncate">
                      {member.specialty}
                    </p>
                  )}
                </div>
              </div>

              {member.bio && (
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {member.bio}
                </p>
              )}

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {member.status === 'available' ? orgProfileText.availableForExchange : orgProfileText.activeOnCommunity}
                </span>

                {onContactTeamMember && (
                  <button
                    onClick={() => onContactTeamMember(member)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 transition-colors cursor-pointer"
                    title={`${orgProfileText.contactMember} ${member.name}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. COMMUNAUTÉS ANIMÉES PAR L'ORGANISATION SUR TULIZAANA */}
      <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white font-display">
              {orgProfileText.communitiesRunBy} {organization.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {orgProfileText.communitiesRunDesc}
            </p>
          </div>

          {isPartnerAdminView && onNavigateTab && (
            <button
              onClick={() => onNavigateTab('communities')}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>{orgProfileText.manageCommunities}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {orgCommunities.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-2">
            <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">
              {orgProfileText.noActiveCommunities}
            </p>
            <p className="text-xs text-slate-500">
              {orgProfileText.noActiveCommunitiesDesc}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orgCommunities.map((community) => (
              <div
                key={community.id}
                onClick={() => onSelectCommunity && onSelectCommunity(community.id)}
                className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                    <img
                      src={community.image || organization.logo}
                      alt={community.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {community.name}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {community.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{community.membersCount || 0} {orgProfileText.membersCount}</span>
                  </span>

                  <span className="flex items-center gap-1 text-cyan-400 group-hover:translate-x-0.5 transition-transform font-bold text-[11px]">
                    <span>{orgProfileText.discover}</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. MODAL TO EDIT PRESENTATION (IF PARTNER ADMIN) */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto my-auto text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    {orgProfileText.editModalTitle}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {orgProfileText.editModalDesc}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdits} className="space-y-5 text-xs">
              {/* 1. Localisation (Pays et Ville) */}
              <div className="space-y-2.5">
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] text-teal-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{orgProfileText.locationInAfrica}</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">
                      {orgProfileText.countryLabel}
                    </label>
                    <select
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:border-cyan-400 focus:outline-none"
                    >
                      {AFRICAN_COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">
                      {orgProfileText.cityLabel}
                    </label>
                    <input
                      type="text"
                      required
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      placeholder="Ex : Bukavu, Kinshasa, Dakar..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Description */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] text-indigo-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{orgProfileText.descLabel}</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:border-cyan-400 focus:outline-none leading-relaxed"
                  placeholder="Description..."
                />
              </div>

              {/* 3. Vision & Mission */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5 text-cyan-400">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{orgProfileText.visionLabel}</span>
                  </label>
                  <textarea
                    rows={2}
                    value={editVision}
                    onChange={(e) => setEditVision(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5 text-teal-400">
                    <Target className="w-3.5 h-3.5" />
                    <span>{orgProfileText.missionLabel}</span>
                  </label>
                  <textarea
                    rows={2}
                    value={editMission}
                    onChange={(e) => setEditMission(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* 4. Domaines d'intervention */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{orgProfileText.domainsLabel}</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {editDomains.length}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_DOMAINS.map((domain) => {
                    const isSelected = editDomains.includes(domain);
                    return (
                      <button
                        key={domain}
                        type="button"
                        onClick={() => handleToggleDomain(domain)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/20'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3" />}
                        <span>{domain}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newDomainInput}
                    onChange={(e) => setNewDomainInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDomain();
                      }
                    }}
                    placeholder={orgProfileText.addOtherDomain}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:border-cyan-400 focus:outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddDomain}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer text-xs"
                  >
                    {orgProfileText.addBtn}
                  </button>
                </div>
              </div>

              {/* 5. Documents légaux (Preuves d'existence en Afrique) */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] text-rose-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{orgProfileText.legalDocsSection}</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {editLegalDocs.length}
                  </span>
                </div>

                {/* Upload sub-controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 text-[11px]">
                      {orgProfileText.docTypeSelect}
                    </label>
                    <select
                      value={newDocType}
                      onChange={(e) => setNewDocType(e.target.value as LegalDocument['documentType'])}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="agrement_ministeriel">{orgProfileText.docTypes.agrement_ministeriel}</option>
                      <option value="f92_rccm">{orgProfileText.docTypes.f92_rccm}</option>
                      <option value="statuts_notaries">{orgProfileText.docTypes.statuts_notaries}</option>
                      <option value="attestation_siege">{orgProfileText.docTypes.attestation_siege}</option>
                      <option value="autre">{orgProfileText.docTypes.autre}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1 text-[11px]">
                      {orgProfileText.addScannedDoc}
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleFileSelect(e.target.files)}
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-semibold flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{orgProfileText.uploadDocBtn}</span>
                    </button>
                  </div>
                </div>

                {/* Drag and Drop box */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFileSelect(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-3 rounded-xl border border-dashed transition-all cursor-pointer text-center text-[11px] ${
                    isDragging
                      ? 'border-cyan-400 bg-cyan-500/10'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {orgProfileText.dragDropHint}
                </div>

                {/* List of current legal docs with delete option */}
                {editLegalDocs.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {editLegalDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-200 truncate text-[11px]">
                              {doc.name}
                            </p>
                            <span className="text-[10px] text-cyan-400">{doc.documentTypeLabel}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(doc.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold cursor-pointer"
                >
                  {orgProfileText.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{orgProfileText.saveAllBtn}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
