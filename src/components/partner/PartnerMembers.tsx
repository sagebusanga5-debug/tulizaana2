import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  Award,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Trophy,
  MoreVertical,
  Mail,
  Building2,
  Inbox,
  UserCheck,
  UserX,
  Send,
  KeyRound,
  Check,
  Copy,
  Clock,
  Phone,
  MessageCircle,
  FileText,
  X,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Smartphone,
  Info,
  CheckCircle,
  Plus,
} from 'lucide-react';
import { Community, MemberInvitationRequest, InvitationCode, Organization, UserProfile } from '../../types';

interface PartnerMembersProps {
  organization: Organization;
  communities?: Community[];
  members?: UserProfile[];
  invitationRequests?: MemberInvitationRequest[];
  invitations?: InvitationCode[];
  onUpdateMemberStatus: (userId: string, newStatus: UserProfile['status']) => void;
  onWarnMember: (userId: string, reason: string) => void;
  onAcceptInvitationRequest?: (
    requestId: string,
    code: string,
    dispatchMethod: 'whatsapp' | 'tulizaana_chat',
    deliveryMessage?: string
  ) => void;
  onDeleteInvitationRequest?: (requestId: string) => void;
  onCreateInvitationRequest?: (request: MemberInvitationRequest) => void;
}

export const PartnerMembers: React.FC<PartnerMembersProps> = ({
  organization,
  communities = [],
  members = [],
  invitationRequests = [],
  invitations = [],
  onUpdateMemberStatus,
  onWarnMember,
  onAcceptInvitationRequest,
  onDeleteInvitationRequest,
  onCreateInvitationRequest,
}) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'members'>('requests');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCommunityFilter, setSelectedCommunityFilter] = useState('all');

  // Accept Modal State
  const [selectedRequestToAccept, setSelectedRequestToAccept] = useState<MemberInvitationRequest | null>(null);
  const [chosenCode, setChosenCode] = useState('');
  const [customWelcomeNote, setCustomWelcomeNote] = useState('');
  const [copiedCodeSuccess, setCopiedCodeSuccess] = useState(false);
  const [copiedMessageSuccess, setCopiedMessageSuccess] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);
  const [dispatchedChannel, setDispatchedChannel] = useState<'whatsapp' | 'tulizaana_chat'>('whatsapp');

  // Simulation Modal State (To test pending member requests workflow)
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simCandidateName, setSimCandidateName] = useState('Grace Furaha');
  const [simContactPhone, setSimContactPhone] = useState('+243 89 234 5678');
  const [simContactEmail, setSimContactEmail] = useState('grace.furaha@gmail.com');
  const [simCommunityId, setSimCommunityId] = useState(
    communities.find((c) => c.organizationId === organization.id)?.id || communities[0]?.id || 'comm-drepano'
  );
  const [simSituation, setSimSituation] = useState(
    'Jeune adulte diagnostiquée Drépanocytose SS à Goma, en quête de partage et de soutien'
  );
  const [simMotivation, setSimMotivation] = useState(
    'Je souhaite échanger en toute confiance avec d’autres guerriers sur la gestion quotidienne des crises douloureuses, trouver du réconfort et partager mes astuces d’hydratation.'
  );
  const [simIsFirstRequest, setSimIsFirstRequest] = useState(true);
  const [simExistingCommunity, setSimExistingCommunity] = useState('Santé Mentale & Esprit Serein');

  // Check if candidate is on their first request or already joined a community before
  const isCandidateFirstRequest = (req: MemberInvitationRequest): boolean => {
    if (req.isFirstRequestOnTulizaana === false) return false;
    if (req.existingCommunitiesJoined && req.existingCommunitiesJoined.length > 0) return false;

    // Cross-check with members directory
    const existingMember = members.find(
      (m) =>
        (req.contactPhone && m.phone && m.phone.replace(/\D/g, '') === req.contactPhone.replace(/\D/g, '')) ||
        (req.contactEmail && m.email && m.email.toLowerCase() === req.contactEmail.toLowerCase()) ||
        (m.name.toLowerCase() === req.candidateName.toLowerCase() && m.joinedCommunities && m.joinedCommunities.length > 0)
    );

    if (existingMember && existingMember.joinedCommunities && existingMember.joinedCommunities.length > 0) {
      return false;
    }
    return true;
  };

  const getCandidateExistingCommunities = (req: MemberInvitationRequest): string[] => {
    if (req.existingCommunitiesJoined && req.existingCommunitiesJoined.length > 0) {
      return req.existingCommunitiesJoined;
    }
    const existingMember = members.find(
      (m) =>
        (req.contactPhone && m.phone && m.phone.replace(/\D/g, '') === req.contactPhone.replace(/\D/g, '')) ||
        (req.contactEmail && m.email && m.email.toLowerCase() === req.contactEmail.toLowerCase()) ||
        (m.name.toLowerCase() === req.candidateName.toLowerCase())
    );
    if (existingMember && existingMember.joinedCommunities) {
      return existingMember.joinedCommunities.map((cId) => {
        const found = communities.find((c) => c.id === cId);
        return found ? found.name : cId;
      });
    }
    return [];
  };

  // Communities for this organization
  const organizationCommunities = communities.filter((c) => c.organizationId === organization.id);
  const organizationCommunityIds = new Set(organizationCommunities.map((c) => c.id));

  // Filter requests for current org
  const orgRequests = invitationRequests.filter((r) => {
    const matchesOrg =
      !r.organizationId ||
      r.organizationId === organization.id ||
      (r.communityId && organizationCommunityIds.has(r.communityId));
    const matchesComm =
      selectedCommunityFilter === 'all' || r.communityId === selectedCommunityFilter;
    const matchesSearch =
      (r.candidateName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.motivation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.situation || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesOrg && matchesComm && matchesSearch;
  });

  const pendingRequestsCount = invitationRequests.filter((r) => {
    const matchesOrg =
      !r.organizationId ||
      r.organizationId === organization.id ||
      (r.communityId && organizationCommunityIds.has(r.communityId));
    return matchesOrg && r.status === 'pending';
  }).length;

  const filteredMembers = (members || []).filter((m) => {
    const matchesSearch =
      (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.bio || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesComm =
      selectedCommunityFilter === 'all' ||
      (m.joinedCommunities || []).includes(selectedCommunityFilter);
    return matchesSearch && matchesComm;
  });

  const getStatusBadge = (status: UserProfile['status']) => {
    switch (status) {
      case 'new_member':
        return { label: '🌱 Nouveau membre', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'active_participant':
        return { label: '🤝 Participant actif', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      case 'ambassador':
        return { label: '⭐ Ambassadeur', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'mentor':
        return { label: '🌍 Mentor', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
    }
  };

  const handleOpenAcceptModal = (req: MemberInvitationRequest) => {
    setSelectedRequestToAccept(req);
    // Find an existing active code for this community or generate a clean code
    const existingCode = invitations.find(
      (inv) => inv.communityId === req.communityId && inv.status === 'active'
    )?.code;
    const cleanAcronym = (organization.acronym || 'ONG').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 5);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = existingCode || `TLZ-${cleanAcronym}-${randomSuffix}`;
    setChosenCode(code);

    const isFirst = isCandidateFirstRequest(req);
    const channel = isFirst ? 'whatsapp' : 'tulizaana_chat';
    setDispatchedChannel(channel);

    if (isFirst) {
      setCustomWelcomeNote(
        `Bonjour ${req.candidateName},\n\nL'équipe de modération de ${organization.name} a examiné votre demande et a le plaisir de vous accueillir dans le cercle fermé "${req.communityName}" sur Tulizaana.\n\n🔑 VOTRE CODE D'INVITATION PERSONNEL :\n${code}\n\nPour rejoindre le cercle :\n1. Rendez-vous sur https://tulizaana.org\n2. Renseignez votre code d'accès sécurisé : ${code}\n\nBienvenue dans cet espace d'écoute et de bienveillance.`
      );
    } else {
      setCustomWelcomeNote(
        `Félicitations ${req.candidateName} ! Votre demande pour rejoindre le cercle "${req.communityName}" a été validée par la modération de ${organization.name}.\n\n🔑 Votre code d'invitation exclusif : ${code}\n\nVous pouvez désormais accéder à ce cercle directement depuis votre application Tulizaana.`
      );
    }

    setCopiedCodeSuccess(false);
    setCopiedMessageSuccess(false);
    setDispatchSuccess(false);
  };

  const handleConfirmAccept = (forcedMethod?: 'whatsapp' | 'tulizaana_chat') => {
    if (!selectedRequestToAccept) return;
    const isFirst = isCandidateFirstRequest(selectedRequestToAccept);
    const method = forcedMethod || (isFirst ? 'whatsapp' : 'tulizaana_chat');
    const code = chosenCode.trim() || `TLZ-ACC-${Math.floor(1000 + Math.random() * 9000)}`;

    setDispatchedChannel(method);

    if (onAcceptInvitationRequest) {
      onAcceptInvitationRequest(selectedRequestToAccept.id, code, method, customWelcomeNote);
    }
    setDispatchSuccess(true);
    setTimeout(() => {
      setSelectedRequestToAccept(null);
      setDispatchSuccess(false);
    }, 2000);
  };

  const handleOpenWhatsAppDirect = () => {
    if (!selectedRequestToAccept) return;
    const phone = selectedRequestToAccept.contactPhone || '';
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customWelcomeNote)}`;
    window.open(url, '_blank');
    handleConfirmAccept('whatsapp');
  };

  const handleCopyCodeText = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeSuccess(true);
    setTimeout(() => setCopiedCodeSuccess(false), 2000);
  };

  const handleCopyMessageText = () => {
    navigator.clipboard.writeText(customWelcomeNote);
    setCopiedMessageSuccess(true);
    setTimeout(() => setCopiedMessageSuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight">
              Gestion des Membres & Invitations
            </h1>
            {pendingRequestsCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 animate-pulse">
                {pendingRequestsCount} en attente
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Recevez et évaluez les demandes d'accès aux cercles fermés, transmettez les codes d'invitation et animez les rôles de résilience.
          </p>
        </div>

        {/* SUBTABS SWITCHER */}
        <div className="flex items-center p-1 rounded-2xl bg-[#111827] border border-slate-800 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Demandes d'adhésion</span>
            {pendingRequestsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'requests' ? 'bg-slate-950 text-cyan-400' : 'bg-amber-500 text-slate-950'
              }`}>
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'members'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Membres du cercle ({filteredMembers.length})</span>
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#111827] border border-slate-800/80 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'requests'
                ? "Rechercher une demande par nom, situation ou motivation..."
                : "Rechercher un membre par nom ou biographie..."
            }
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedCommunityFilter}
            onChange={(e) => setSelectedCommunityFilter(e.target.value)}
            className="w-full sm:w-60 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
          >
            <option value="all">Toutes les communautés</option>
            {communities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB 1: INVITATION REQUESTS MANAGEMENT */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-1">
                <span className="font-bold text-white block">
                  Filtrage éthique des bénéficiaires pour les cercles de parole fermés
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Les candidats ci-dessous ont formulé une demande d'accès en motivant leur démarche. En tant qu'organisation référente, vous pouvez vérifier leur profil, puis transmettez-leur le code d'invitation (par WhatsApp pour une 1ère demande, ou par Chat Tulizaana s'ils sont déjà membres).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSimulateModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shrink-0 shadow-md shadow-cyan-500/20 cursor-pointer self-start md:self-auto transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Simuler une Demande</span>
            </button>
          </div>

          {orgRequests.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#111827] border border-slate-800/80 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-slate-500 flex items-center justify-center mx-auto">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">
                Aucune demande d'invitation en attente
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Toutes les demandes ont été traitées. Vous pouvez en simuler une pour tester le workflow de validation et d'envoi du code.
              </p>
              <button
                type="button"
                onClick={() => setShowSimulateModal(true)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Créer une demande de test</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {orgRequests.map((req) => {
                const isPending = req.status === 'pending';
                const isAccepted = req.status === 'accepted';
                const isRejected = req.status === 'rejected';
                const isFirst = isCandidateFirstRequest(req);
                const existingComms = getCandidateExistingCommunities(req);

                return (
                  <div
                    key={req.id}
                    className={`p-5 sm:p-6 rounded-3xl border transition-all space-y-4 ${
                      isPending
                        ? 'bg-[#111827] border-slate-800 hover:border-slate-700'
                        : isAccepted
                        ? 'bg-emerald-950/15 border-emerald-500/30'
                        : 'bg-rose-950/15 border-rose-500/30 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      
                      {/* Candidate Avatar & Info */}
                      <div className="flex items-start gap-3.5">
                        <div className="relative shrink-0">
                          <img
                            src={req.candidateAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={req.candidateName}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
                          />
                          <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-cyan-500 text-slate-950">
                            <Clock className="w-3 h-3" />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm sm:text-base font-bold text-white font-display">
                              {req.candidateName}
                            </h3>
                            <span className="text-[11px] text-slate-400 font-normal">
                              • {req.requestedAt}
                            </span>

                            {/* History Badge: First request on Tulizaana vs Already Member */}
                            {isFirst ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                                <Smartphone className="w-3 h-3 text-emerald-400" />
                                <span>1ère Demande Tulizaana • Envoi WhatsApp</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold flex items-center gap-1">
                                <MessageSquare className="w-3 h-3 text-cyan-400" />
                                <span>Déjà Membre Tulizaana • Envoi Chat</span>
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/20 flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {req.communityName}
                            </span>
                            {req.contactEmail && (
                              <span className="text-slate-400 flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-500" />
                                {req.contactEmail}
                              </span>
                            )}
                            {req.contactPhone && (
                              <span className="text-slate-400 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-500" />
                                {req.contactPhone}
                              </span>
                            )}
                          </div>

                          {/* Existing communities badge if already member */}
                          {!isFirst && existingComms.length > 0 && (
                            <p className="text-[11px] text-cyan-400/90 font-medium">
                              Déjà membre de : <span className="underline decoration-cyan-500/40">{existingComms.join(', ')}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        {isPending && (
                          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>En attente de validation</span>
                          </span>
                        )}
                        {isAccepted && (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              Acceptée • Code {req.dispatchedVia === 'whatsapp' ? 'WhatsApp' : 'Chat Tulizaana'}
                            </span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/40 flex items-center gap-1">
                            <UserX className="w-3.5 h-3.5" />
                            <span>Demande rejetée</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Données récoltées par le formulaire de demande d'invitation */}
                    <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
                          Situation vécue déclarée par le candidat :
                        </span>
                        <p className="text-cyan-300 font-medium mt-0.5">
                          {req.situation}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
                          Motivation & Attentes formulées dans le formulaire :
                        </span>
                        <p className="text-slate-300 italic mt-0.5 leading-relaxed">
                          "{req.motivation}"
                        </p>
                      </div>

                      {req.assignedCode && (
                        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-slate-400">Code d'accès confidentiel transmis :</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
                              {req.assignedCode}
                            </span>
                            {req.dispatchedVia && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300">
                                via {req.dispatchedVia === 'whatsapp' ? 'WhatsApp' : 'Chat Tulizaana'}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>
                          {isFirst
                            ? 'Transmission obligatoire par WhatsApp (1er accès Tulizaana)'
                            : 'Transmission directe dans le Chat privé Tulizaana'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPending ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onDeleteInvitationRequest && onDeleteInvitationRequest(req.id)}
                              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 text-xs font-semibold border border-slate-800 hover:border-rose-500/40 flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Supprimer la demande</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenAcceptModal(req)}
                              className={`px-5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95 ${
                                isFirst
                                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                              }`}
                            >
                              {isFirst ? (
                                <>
                                  <Smartphone className="w-4 h-4" />
                                  <span>Valider & Envoyer WhatsApp</span>
                                </>
                              ) : (
                                <>
                                  <MessageSquare className="w-4 h-4" />
                                  <span>Valider & Envoyer sur Chat</span>
                                </>
                              )}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onDeleteInvitationRequest && onDeleteInvitationRequest(req.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-300 text-xs font-medium border border-slate-800 transition-colors cursor-pointer"
                          >
                            Retirer de l'historique
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE MEMBERS TABLE */}
      {activeTab === 'members' && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#111827] border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-display">
              Répertoire des membres du cercle ({filteredMembers.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3 rounded-l-lg">Membre</th>
                  <th className="p-3">Pays & Langue</th>
                  <th className="p-3">Points & Parcours</th>
                  <th className="p-3">Statut de Résilience</th>
                  <th className="p-3 text-right rounded-r-lg">Attribuer Rôle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMembers.map((member) => {
                  const statusBadge = getStatusBadge(member.status);

                  return (
                    <tr key={member.id} className="hover:bg-slate-900/30">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-semibold text-white block truncate">
                              {member.name}
                            </span>
                            <span className="text-[11px] text-slate-400 line-clamp-1 italic max-w-xs">
                              "{member.bio}"
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-slate-300">
                        <div>{member.country}</div>
                        <span className="text-[10px] text-slate-500 uppercase">
                          {member.language}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-amber-400">
                          {member.points} pts
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {member.completedCampaignsCount} terminées
                        </span>
                      </td>

                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <select
                          value={member.status}
                          onChange={(e) =>
                            onUpdateMemberStatus(member.id, e.target.value as any)
                          }
                          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium text-cyan-300 focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                        >
                          <option value="new_member">🌱 Nouveau</option>
                          <option value="active_participant">🤝 Participant</option>
                          <option value="ambassador">⭐ Ambassadeur</option>
                          <option value="mentor">🌍 Mentor</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ACCEPT & TRANSMIT INVITATION CODE MODAL */}
      {selectedRequestToAccept && (() => {
        const isFirst = isCandidateFirstRequest(selectedRequestToAccept);
        const existingComms = getCandidateExistingCommunities(selectedRequestToAccept);

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-[#11192b] rounded-3xl border border-slate-700 p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl ${isFirst ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}`}>
                    {isFirst ? <Smartphone className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white font-display">
                      Validation de la demande d'adhésion
                    </h3>
                    <p className="text-xs text-slate-400">
                      {selectedRequestToAccept.candidateName} • {selectedRequestToAccept.communityName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRequestToAccept(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {dispatchSuccess ? (
                <div className="p-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 animate-bounce">
                    <Check className="w-7 h-7" />
                  </div>
                  <h4 className="text-lg font-bold text-white font-display">
                    Adhésion validée avec succès !
                  </h4>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    Le code d'accès <span className="font-mono text-cyan-300 font-bold">{chosenCode}</span> a été validé et transmis à{' '}
                    <strong className="text-white">{selectedRequestToAccept.candidateName}</strong> via{' '}
                    <span className="text-emerald-400 font-semibold">
                      {dispatchedChannel === 'whatsapp' ? 'WhatsApp (+ direct)' : 'le Chat Privé Tulizaana'}
                    </span>.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Données récoltées par le formulaire de demande d'invitation */}
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Données transmises dans le formulaire de demande :
                    </span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block">Téléphone / WhatsApp :</span>
                        <span className="font-medium text-white flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          {selectedRequestToAccept.contactPhone || 'Non spécifié'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block">Courriel de contact :</span>
                        <span className="font-medium text-white flex items-center gap-1.5 mt-0.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-cyan-400" />
                          {selectedRequestToAccept.contactEmail || 'Non spécifié'}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 pt-1">
                      <span className="text-[10px] text-slate-500 block">Situation vécue déclarée :</span>
                      <p className="text-cyan-300 font-medium bg-cyan-950/20 p-2 rounded-xl border border-cyan-500/20">
                        {selectedRequestToAccept.situation}
                      </p>
                    </div>

                    <div className="text-xs space-y-1">
                      <span className="text-[10px] text-slate-500 block">Motivation formulée :</span>
                      <p className="text-slate-300 italic bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                        "{selectedRequestToAccept.motivation}"
                      </p>
                    </div>
                  </div>

                  {/* Channel Rule Notice */}
                  {isFirst ? (
                    <div className="p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/40 space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-emerald-300 font-bold">
                        <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>1ère Demande sur Tulizaana • Envoi Requis par WhatsApp</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        Ce candidat n'a pas encore de compte utilisateur actif sur Tulizaana. Le code d'invitation doit <strong>obligatoirement être transmis sur son WhatsApp</strong> afin qu'il puisse déverrouiller son premier cercle de parole.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-cyan-950/25 border border-cyan-500/40 space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-cyan-300 font-bold">
                        <MessageSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>Déjà Membre Tulizaana • Envoi Direct sur le Chat Tulizaana</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        Ce membre possède déjà un profil vérifié sur Tulizaana et participe déjà à d'autres cercles ({existingComms.join(', ') || 'un autre cercle'}). Le code d'accès lui sera <strong>directement délivré dans sa messagerie instantanée Tulizaana</strong>.
                      </p>
                    </div>
                  )}

                  {/* Generated or Selected Code */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Code d'accès exclusif à assigner :
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={chosenCode}
                        onChange={(e) => setChosenCode(e.target.value.toUpperCase())}
                        className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono font-bold text-cyan-400 focus:outline-hidden focus:border-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyCodeText(chosenCode)}
                        className="px-3.5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        {copiedCodeSuccess ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Copier</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Notification Message */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        {isFirst ? 'Message d’accueil WhatsApp :' : 'Message privé dans le Chat Tulizaana :'}
                      </label>
                      <button
                        type="button"
                        onClick={handleCopyMessageText}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        {copiedMessageSuccess ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Texte copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copier le message</span>
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={customWelcomeNote}
                      onChange={(e) => setCustomWelcomeNote(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400 resize-none font-sans leading-relaxed"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSelectedRequestToAccept(null)}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      {isFirst ? (
                        <>
                          {selectedRequestToAccept.contactPhone && (
                            <button
                              type="button"
                              onClick={handleOpenWhatsAppDirect}
                              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Ouvrir WhatsApp & Envoyer</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleConfirmAccept('whatsapp')}
                            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                          >
                            <Check className="w-4 h-4" />
                            <span>Valider l'adhésion</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConfirmAccept('tulizaana_chat')}
                          className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Envoyer sur le Chat Tulizaana & Valider</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
      {/* SIMULATE / CREATE INVITATION REQUEST MODAL */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#11192b] rounded-3xl border border-slate-700 p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 text-cyan-400 border border-cyan-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    Simuler une demande d'adhésion
                  </h3>
                  <p className="text-xs text-slate-400">
                    Générez une demande candidate pour tester la validation et l'envoi du code
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSimulateModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Charger un profil test prêt à l'emploi :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSimCandidateName('Espérance Mwamba');
                    setSimContactPhone('+243 99 876 5432');
                    setSimContactEmail('esperance.mwamba@gmail.com');
                    setSimSituation('Guerrière drépanocytaire SS à Kinshasa');
                    setSimMotivation('Je cherche un cercle bienveillant pour rompre la solitude des crises et partager nos astuces d’hydratation.');
                    setSimIsFirstRequest(true);
                  }}
                  className="p-2.5 rounded-xl bg-emerald-950/30 hover:bg-emerald-950/60 border border-emerald-500/30 text-left cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Cas 1 : 1ère demande</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Nouveau sur Tulizaana → Envoi WhatsApp
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSimCandidateName('Clémentine Nabintu');
                    setSimContactPhone('+243 85 123 4567');
                    setSimContactEmail('clementina.bintu@yahoo.fr');
                    setSimSituation('Maman d’un enfant de 5 ans diagnostiqué drépanocytaire SS');
                    setSimMotivation('Je participe déjà au cercle Santé Mentale et souhaite maintenant rejoindre ce cercle spécialisé pour des conseils concrets.');
                    setSimIsFirstRequest(false);
                    setSimExistingCommunity('Santé Mentale & Esprit Serein');
                  }}
                  className="p-2.5 rounded-xl bg-cyan-950/30 hover:bg-cyan-950/60 border border-cyan-500/30 text-left cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Cas 2 : Déjà Membre</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Déjà inscrit → Envoi Chat Tulizaana
                  </span>
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Nom du candidat *
                  </label>
                  <input
                    type="text"
                    value={simCandidateName}
                    onChange={(e) => setSimCandidateName(e.target.value)}
                    placeholder="Ex: Grace Furaha"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Téléphone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    value={simContactPhone}
                    onChange={(e) => setSimContactPhone(e.target.value)}
                    placeholder="Ex: +243 89 234 5678"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Email de contact
                  </label>
                  <input
                    type="email"
                    value={simContactEmail}
                    onChange={(e) => setSimContactEmail(e.target.value)}
                    placeholder="candidat@email.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Communauté demandée *
                  </label>
                  <select
                    value={simCommunityId}
                    onChange={(e) => setSimCommunityId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                  >
                    {communities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status on Tulizaana */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                <label className="text-[11px] font-bold text-white block">
                  Historique du membre sur Tulizaana :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${simIsFirstRequest ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300' : 'bg-slate-950/40 border-slate-800 text-slate-400'}`}>
                    <input
                      type="radio"
                      name="isFirst"
                      checked={simIsFirstRequest}
                      onChange={() => setSimIsFirstRequest(true)}
                      className="text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="font-semibold text-xs">Première demande</span>
                  </label>

                  <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${!simIsFirstRequest ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300' : 'bg-slate-950/40 border-slate-800 text-slate-400'}`}>
                    <input
                      type="radio"
                      name="isFirst"
                      checked={!simIsFirstRequest}
                      onChange={() => setSimIsFirstRequest(false)}
                      className="text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="font-semibold text-xs">Déjà membre actif</span>
                  </label>
                </div>

                {!simIsFirstRequest && (
                  <div className="pt-1.5 space-y-1 animate-in fade-in">
                    <span className="text-[10px] text-slate-400 block">
                      Nom du cercle déjà rejoint par ce membre :
                    </span>
                    <input
                      type="text"
                      value={simExistingCommunity}
                      onChange={(e) => setSimExistingCommunity(e.target.value)}
                      placeholder="Ex: Santé Mentale & Esprit Serein"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-cyan-400"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Situation vécue déclarée *
                </label>
                <input
                  type="text"
                  value={simSituation}
                  onChange={(e) => setSimSituation(e.target.value)}
                  placeholder="Ex: Patient drépanocytaire SS à Kinshasa"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Motivation formulée *
                </label>
                <textarea
                  rows={2}
                  value={simMotivation}
                  onChange={(e) => setSimMotivation(e.target.value)}
                  placeholder="Ex: Pourquoi le candidat souhaite intégrer ce cercle..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-cyan-400 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSimulateModal(false)}
                className="px-4 py-2 rounded-xl hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!simCandidateName.trim()) {
                    alert('Veuillez renseigner le nom du candidat');
                    return;
                  }
                  const targetComm = communities.find((c) => c.id === simCommunityId) || communities[0];
                  const newRequest: MemberInvitationRequest = {
                    id: `req-${Date.now()}`,
                    candidateName: simCandidateName,
                    candidateAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                    contactEmail: simContactEmail,
                    contactPhone: simContactPhone,
                    communityId: targetComm?.id || 'comm-drepano',
                    communityName: targetComm?.name || 'Communauté',
                    organizationId: organization.id,
                    situation: simSituation,
                    motivation: simMotivation,
                    isFirstRequestOnTulizaana: simIsFirstRequest,
                    existingCommunitiesJoined: simIsFirstRequest ? [] : [simExistingCommunity || 'Santé Mentale & Esprit Serein'],
                    requestedAt: 'À l’instant',
                    status: 'pending',
                  };

                  if (onCreateInvitationRequest) {
                    onCreateInvitationRequest(newRequest);
                  }
                  setShowSimulateModal(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Créer la Demande en Attente</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
