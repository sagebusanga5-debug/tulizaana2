import React, { useState } from 'react';
import {
  Compass,
  Users,
  ShieldCheck,
  Search,
  BookOpen,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  KeyRound,
} from 'lucide-react';
import {
  Community,
  UserProfile,
  Organization,
  StoryTestimonial,
  Post,
  Campaign,
  MemberInvitationRequest,
  Language,
} from '../../types';
import { CommunityRulesModal } from './CommunityRulesModal';
import { CommunityProfileView } from './CommunityProfileView';
import { CommunityJoinRequestModal } from './CommunityJoinRequestModal';
import { t } from '../../translations';
import { TranslateButton } from '../common/TranslateButton';

interface CommunitiesViewProps {
  communities?: Community[];
  currentUser?: UserProfile;
  userJoinedCommunityIds?: string[];
  organizations?: Organization[];
  stories?: StoryTestimonial[];
  posts?: Post[];
  campaigns?: Campaign[];
  invitationRequests?: MemberInvitationRequest[];
  language?: Language;
  onJoinCommunity?: (communityId: string) => void;
  onJoinCommunityWithCode?: (code: string) => boolean;
  onRequestJoinCommunity?: (params: {
    communityId: string;
    pseudonym: string;
    deliveryChannel: 'chat' | 'whatsapp';
    whatsappNumber?: string;
    reason?: string;
  }) => { code?: string; pending?: boolean } | void;
  onOpenChat?: () => void;
  onSelectCommunityFeed?: (communityId: string) => void;
  onOpenStory?: (story: StoryTestimonial) => void;
  onAddStory?: () => void;
  onOpenCreatePost?: (communityId?: string) => void;
  onReactPost?: (postId: string, reaction: 'support' | 'understand' | 'courage' | 'bravo') => void;
  onAddPostComment?: (postId: string, comment: string) => void;
  onParticipateCampaign?: (campaignId: string) => void;
  onOpenUserProfile?: (userId: string) => void;
  onOpenOrganizationProfile?: (organization: Organization) => void;
  onSavePost?: (postId: string) => void;
  onFollowAuthor?: (authorId: string) => void;
  onDeletePost?: (postId: string) => void;
  onEditPost?: (postId: string, updatedData: { title?: string; content?: string; tags?: string[] }) => void;
}

export const CommunitiesView: React.FC<CommunitiesViewProps> = ({
  communities = [],
  currentUser,
  userJoinedCommunityIds,
  organizations = [],
  stories = [],
  posts = [],
  campaigns = [],
  invitationRequests = [],
  language = 'fr',
  onJoinCommunity,
  onJoinCommunityWithCode,
  onRequestJoinCommunity,
  onOpenChat,
  onSelectCommunityFeed,
  onOpenStory,
  onAddStory,
  onOpenCreatePost,
  onReactPost,
  onAddPostComment,
  onParticipateCampaign,
  onOpenUserProfile,
  onOpenOrganizationProfile,
  onSavePost,
  onFollowAuthor,
  onDeletePost,
  onEditPost,
}) => {
  // Navigation State
  const [viewMode, setViewMode] = useState<'discover' | 'joined'>('discover');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [inspectingRulesCommunity, setInspectingRulesCommunity] = useState<Community | null>(null);
  const [requestingCommunityModal, setRequestingCommunityModal] = useState<Community | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  // Local joined tracking
  const [localJoinedIds, setLocalJoinedIds] = useState<string[]>(
    userJoinedCommunityIds || currentUser?.joinedCommunities || []
  );
  const [translatedCommCards, setTranslatedCommCards] = useState<Record<string, { translated: boolean; name?: string; desc: string }>>({});

  const strings = t[language]?.communitiesView || t.fr.communitiesView;

  const effectiveJoinedIds = Array.from(
    new Set([...(userJoinedCommunityIds || currentUser?.joinedCommunities || []), ...localJoinedIds])
  );

  const handleDirectJoinAndOpen = (communityId: string) => {
    setLocalJoinedIds((prev) => Array.from(new Set([...prev, communityId])));
    if (onJoinCommunity) {
      onJoinCommunity(communityId);
    }
    const targetComm = communities.find((c) => c.id === communityId);
    setJoinSuccess(`Bienvenue dans le cercle fermé ${targetComm?.name || ''} ! Accès validé.`);
    setSelectedCommunityId(communityId);
  };

  // If a community is selected, render the detailed CommunityProfileView
  if (selectedCommunityId) {
    const selectedComm = communities.find((c) => c.id === selectedCommunityId);
    if (selectedComm) {
      const org = organizations.find((o) => o.id === selectedComm.organizationId);
      return (
        <div className="space-y-4">
          {joinSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{joinSuccess}</span>
              </div>
              <button
                onClick={() => setJoinSuccess(null)}
                className="text-xs text-emerald-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <CommunityProfileView
            community={selectedComm}
            organization={org}
            currentUser={currentUser || ({} as UserProfile)}
            stories={stories}
            posts={posts}
            campaigns={campaigns}
            language={language}
            onBack={() => setSelectedCommunityId(null)}
            onOpenStory={onOpenStory}
            onAddStory={onAddStory}
            onOpenCreatePost={onOpenCreatePost}
            onReactPost={onReactPost}
            onAddPostComment={onAddPostComment}
            onParticipateCampaign={onParticipateCampaign}
            onOpenUserProfile={onOpenUserProfile}
            onOpenOrganizationProfile={onOpenOrganizationProfile}
            onSavePost={onSavePost}
            onFollowAuthor={onFollowAuthor}
            onDeletePost={onDeletePost}
            onEditPost={onEditPost}
          />
        </div>
      );
    }
  }

  // Filter joined vs discoverable communities
  const joinedCommunities = communities.filter((c) => effectiveJoinedIds.includes(c.id));

  // Determine current active list
  const activeCommunitiesList = viewMode === 'discover' ? communities : joinedCommunities;

  // Filter by category and search
  const filteredCommunities = activeCommunitiesList.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.organizationName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categoryLabels: Record<string, string> = {
    chronic_disease: 'SENSIBILISATION & DRÉPANOCYTOSE',
    infectious: 'SENSIBILISATION & SUIVI ARV',
    trauma_gbv: 'TRAUMA, VBG & SORORITÉ',
    mental_health: 'SANTÉ MENTALE & SÉRÉNITÉ',
    disability: 'HANDICAP & INCLUSION',
    caregivers: 'PROCHES AIDANTS',
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* 1. TOP MINIMALIST TOGGLE (DÉCOUVRIR / MES COMMUNAUTÉS) */}
      <div className="flex items-center justify-between gap-4">
        
        {/* Toggle between Discover and My Communities */}
        <div className="p-1.5 rounded-2xl bg-[#0e1626] border border-slate-800 shadow-xl flex items-center gap-1.5">
          <button
            onClick={() => setViewMode('discover')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'discover'
                ? 'bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{strings.discover}</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-900/40 text-[11px] font-bold">
              {communities.length}
            </span>
          </button>

          <button
            onClick={() => setViewMode('joined')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'joined'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{strings.myCircles}</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-900/40 text-[11px] font-bold">
              {joinedCommunities.length}
            </span>
          </button>
        </div>
      </div>

      {/* Success alert */}
      {joinSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{joinSuccess}</span>
          </div>
          <button onClick={() => setJoinSuccess(null)} className="text-xs hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* 2. MINIMALIST SEARCH & CATEGORIES */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={strings.searchPlaceholder}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#0e1626] border border-slate-800 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400 shadow-md"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar shrink-0">
          {[
            { id: 'all', label: 'Toutes' },
            { id: 'infectious', label: 'VIH & Infectieux' },
            { id: 'chronic_disease', label: 'Drépanocytose' },
            { id: 'mental_health', label: 'Santé Mentale' },
            { id: 'trauma_gbv', label: 'Trauma & Sororité' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-[#0e1626] text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. CARD GRID */}
      {filteredCommunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCommunities.map((comm) => {
            const isJoined = effectiveJoinedIds.includes(comm.id);
            const org = organizations.find((o) => o.id === comm.organizationId);
            const orgName = comm.organizationName || org?.name || 'ONG Partenaire';

            const userRequest = (invitationRequests || []).find((r) => r.communityId === comm.id);
            const isPending = !isJoined && userRequest?.status === 'pending';
            const isAccepted = !isJoined && userRequest?.status === 'accepted';

            return (
              <div
                key={comm.id}
                className="bg-[#0e1626] border border-slate-800/80 hover:border-cyan-500/40 rounded-[28px] overflow-hidden transition-all duration-300 shadow-xl flex flex-col justify-between group"
              >
                {/* TOP COVER BANNER IMAGE WITH DARK FADE GRADIENT */}
                <div
                  onClick={() => {
                    if (isJoined) {
                      setSelectedCommunityId(comm.id);
                    } else {
                      setRequestingCommunityModal(comm);
                    }
                  }}
                  className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-900 cursor-pointer"
                >
                  <img
                    src={comm.coverImage || comm.image}
                    alt={comm.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Top-to-bottom dark gradient overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-[#0e1626] via-[#0e1626]/70 to-black/40" />

                  {/* Top-Left: Organization Avatar & Organization Name (Clickable) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenOrganizationProfile) {
                        const targetOrg = org || {
                          id: comm.organizationId,
                          name: orgName,
                          description: `Organisation coordinatrice de la communauté ${comm.name}`,
                          type: 'ong' as const,
                          logo: comm.image,
                          coverImage: comm.coverImage,
                          country: 'RDC',
                          communitiesCount: 1,
                          activeCampaignsCount: 1,
                          status: 'verified' as const,
                          responsibleName: 'Équipe psychosociale',
                          responsibleRole: 'Superviseur',
                          contactEmail: 'contact@tulizaana.org',
                          phone: '+243 000 000 000',
                          domain: 'Santé & Écoute',
                          joinedAt: '2024',
                          isVerified: true,
                        };
                        onOpenOrganizationProfile(targetOrg);
                      }
                    }}
                    title={`Consulter le profil officiel de ${orgName}`}
                    className="absolute top-4 left-5 flex items-center gap-2.5 bg-black/60 hover:bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 hover:border-cyan-500/50 max-w-[85%] transition-all cursor-pointer group/org"
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20 shrink-0 bg-slate-800 group-hover/org:scale-105 transition-transform">
                      <img
                        src={comm.image || org?.logo}
                        alt={orgName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs font-bold text-white/95 group-hover/org:text-cyan-300 truncate drop-shadow-sm transition-colors">
                      {orgName}
                    </span>
                  </button>

                  {/* Top-Right: Quick Rules Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectingRulesCommunity(comm);
                    }}
                    className="absolute top-4 right-5 p-2 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-slate-300 hover:text-cyan-300 border border-white/10 transition-all cursor-pointer"
                    title="Consulter les règles de la communauté"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>

                  {/* Status Overlay Badge if Pending or Accepted */}
                  {isPending && (
                    <div className="absolute bottom-3 left-5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/85 border border-amber-500/60 text-amber-300 text-[11px] font-bold backdrop-blur-md">
                      <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                      <span>Demande en cours d'examen par l'organisation</span>
                    </div>
                  )}
                  {isAccepted && (
                    <div className="absolute bottom-3 left-5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/85 border border-emerald-500/60 text-emerald-300 text-[11px] font-bold backdrop-blur-md">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Demande validée par l'ONG (Code : {userRequest?.assignedCode})</span>
                    </div>
                  )}
                </div>

                {/* CARD BODY: TITLE, SUBTITLE/TAG & DESCRIPTION */}
                <div
                  onClick={() => {
                    if (isJoined) {
                      setSelectedCommunityId(comm.id);
                    } else {
                      setRequestingCommunityModal(comm);
                    }
                  }}
                  className="px-5 sm:px-6 pt-2 pb-4 space-y-2 cursor-pointer flex-1"
                >
                  <h3 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight leading-tight group-hover:text-cyan-300 transition-colors">
                    {translatedCommCards[comm.id]?.translated && translatedCommCards[comm.id].name
                      ? translatedCommCards[comm.id].name
                      : comm.name}
                  </h3>

                  <div className="text-xs font-black uppercase tracking-wider text-teal-400 font-mono">
                    {categoryLabels[comm.category] || 'COMMUNAUTÉ & ENTRAIDE'}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed font-normal">
                    {translatedCommCards[comm.id]?.translated
                      ? translatedCommCards[comm.id].desc
                      : comm.description}
                  </p>

                  <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                    <TranslateButton
                      originalPost={{
                        title: comm.name,
                        content: comm.description,
                      }}
                      targetLanguage={language}
                      onTogglePostTranslation={(active, trans) => {
                        setTranslatedCommCards((prev) => ({
                          ...prev,
                          [comm.id]: {
                            translated: active,
                            name: trans.title,
                            desc: trans.content,
                          },
                        }));
                      }}
                    />
                  </div>
                </div>

                {/* BOTTOM FOOTER BAR: STATS ON LEFT, ACTION ON RIGHT */}
                <div className="px-5 sm:px-6 py-4 bg-[#090f1a]/90 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  
                  {/* Left Stats: 👥 1890  •  💬 430 */}
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span>👥</span>
                      <span>{comm.membersCount}</span>
                      <span className="text-[11px] text-slate-400 font-normal">{strings.members}</span>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1.5">
                      <span>💬</span>
                      <span>{comm.postsCount || 430}</span>
                      <span className="text-[11px] text-slate-400 font-normal">{strings.posts}</span>
                    </span>
                  </div>

                  {/* Right Action Button: "Voir le profil" if joined, "En attente" if pending, "Entrer" if accepted, "Rejoindre" otherwise */}
                  {isJoined ? (
                    <button
                      onClick={() => setSelectedCommunityId(comm.id)}
                      className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 text-xs sm:text-sm font-extrabold shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{strings.enter}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : isAccepted ? (
                    <button
                      onClick={() => {
                        if (userRequest?.assignedCode && onJoinCommunityWithCode) {
                          onJoinCommunityWithCode(userRequest.assignedCode);
                        } else {
                          handleDirectJoinAndOpen(comm.id);
                        }
                      }}
                      className="px-4 sm:px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-emerald-500/25 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>{language === 'sw' ? 'Fungua kwa nambari' : language === 'en' ? 'Unlock with code' : 'Déverrouiller avec mon code'}</span>
                    </button>
                  ) : isPending ? (
                    <button
                      onClick={() => setRequestingCommunityModal(comm)}
                      className="px-4 sm:px-5 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>{strings.pending}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setRequestingCommunityModal(comm)}
                      className="px-5 sm:px-6 py-2.5 rounded-2xl bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-teal-500/25 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{strings.requestJoin}</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 rounded-3xl bg-[#0e1626] border border-slate-800 text-center space-y-4 shadow-xl">
          <ShieldCheck className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white font-display">
            {viewMode === 'joined' ? 'Aucune communauté rejointe pour le moment' : 'Aucune communauté trouvée'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            {viewMode === 'joined'
              ? 'Explorez les communautés disponibles dans l’onglet "Découvrir" pour rejoindre une communauté protégée.'
              : 'Essayez un autre mot-clé ou réinitialisez vos filtres de recherche.'}
          </p>
          {viewMode === 'joined' && (
            <button
              onClick={() => setViewMode('discover')}
              className="px-5 py-2.5 rounded-2xl bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-black shadow-lg shadow-teal-500/20 cursor-pointer"
            >
              Découvrir les communautés
            </button>
          )}
        </div>
      )}

      {/* 4. MODAL: JOIN REQUEST & INVITATION CODE (CHAT / WHATSAPP) */}
      {requestingCommunityModal && (
        <CommunityJoinRequestModal
          community={requestingCommunityModal}
          organization={organizations.find((o) => o.id === requestingCommunityModal.organizationId)}
          currentUser={currentUser || ({} as UserProfile)}
          onClose={() => setRequestingCommunityModal(null)}
          onSubmitRequest={(params) => {
            if (onRequestJoinCommunity) {
              return onRequestJoinCommunity(params);
            } else {
              const code = `TLZ-${requestingCommunityModal.slug ? requestingCommunityModal.slug.toUpperCase().slice(0, 4) : 'SAN'}-${Math.floor(100 + Math.random() * 900)}`;
              return { code };
            }
          }}
          onOpenChat={onOpenChat}
          onDirectJoinAndOpenProfile={(commId) => {
            handleDirectJoinAndOpen(commId);
            setRequestingCommunityModal(null);
          }}
        />
      )}

      {/* 5. RULES MODAL (WHEN A USER CLICKS THE BOOK ICON) */}
      {inspectingRulesCommunity && (
        <CommunityRulesModal
          community={inspectingRulesCommunity}
          organization={organizations.find((o) => o.id === inspectingRulesCommunity.organizationId)}
          isJoined={effectiveJoinedIds.includes(inspectingRulesCommunity.id)}
          language={language}
          onClose={() => setInspectingRulesCommunity(null)}
          onJoin={(commId) => {
            setInspectingRulesCommunity(null);
            const target = communities.find((c) => c.id === commId);
            if (target) {
              setRequestingCommunityModal(target);
            }
          }}
          onOpenProfile={(commId) => {
            setSelectedCommunityId(commId);
            setInspectingRulesCommunity(null);
          }}
        />
      )}
    </div>
  );
};
