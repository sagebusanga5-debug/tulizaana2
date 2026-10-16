import React, { useState } from 'react';
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Trophy,
  HeartHandshake,
  MessageSquare,
  Plus,
  BookOpen,
  CheckCircle2,
  Lock,
  Search,
  ExternalLink,
  ChevronRight,
  Clock,
  Play,
  Heart,
} from 'lucide-react';
import {
  Community,
  Organization,
  StoryTestimonial,
  Post,
  Campaign,
  UserProfile,
  Language,
} from '../../types';
import { PostDetailModal } from './PostDetailModal';
import { CommunityRulesModal } from './CommunityRulesModal';
import { TranslateButton } from '../common/TranslateButton';
import { t } from '../../translations';

interface CommunityProfileViewProps {
  community: Community;
  organization?: Organization;
  currentUser: UserProfile;
  stories: StoryTestimonial[];
  posts: Post[];
  campaigns: Campaign[];
  language?: Language;
  onBack: () => void;
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

export const CommunityProfileView: React.FC<CommunityProfileViewProps> = ({
  community,
  organization,
  currentUser,
  stories = [],
  posts = [],
  campaigns = [],
  language = 'fr',
  onBack,
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
  const [activeTab, setActiveTab] = useState<'questions' | 'campaigns'>('questions');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [headerTranslation, setHeaderTranslation] = useState<{
    translated: boolean;
    name?: string;
    description?: string;
  }>({ translated: false });
  const [translatedCampCards, setTranslatedCampCards] = useState<
    Record<string, { translated: boolean; title?: string; desc: string }>
  >({});

  const orgName = community.organizationName || organization?.name || 'ONG Partenaire';

  // Filter stories specific to this community
  const communityStories = stories.filter(
    (s) => s.communityId === community.id || s.communityName?.toLowerCase() === community.name?.toLowerCase()
  );

  // Fallback: if no stories match specifically, pick first 4 stories so UI remains rich and lively
  const displayStories = communityStories.length > 0 ? communityStories : stories.slice(0, 4);

  // Filter posts/questions for this community
  const communityPosts = posts.filter(
    (p) => p.communityId === community.id || p.communityName?.toLowerCase() === community.name?.toLowerCase()
  );
  const displayPosts = communityPosts.length > 0 ? communityPosts : posts.slice(0, 6);

  const filteredPosts = displayPosts.filter(
    (p) =>
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter campaigns for this community
  const communityCampaigns = campaigns.filter(
    (c) => c.communityId === community.id || c.communityName?.toLowerCase() === community.name?.toLowerCase()
  );
  const displayCampaigns = communityCampaigns.length > 0 ? communityCampaigns : campaigns.slice(0, 3);

  const filteredCampaigns = displayCampaigns.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoryLabels: Record<string, string> = {
    chronic_disease: 'Maladies Chroniques & Drépanocytose',
    infectious: 'Sensibilisation & Suivi ARV',
    trauma_gbv: 'Trauma, VBG & Sororité',
    mental_health: 'Santé Mentale & Résilience',
    disability: 'Handicap & Inclusion',
    caregivers: 'Proches Aidants',
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* 1. TOP NAVIGATION / BACK BUTTON */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-bold transition-all cursor-pointer shadow-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-cyan-400" />
          <span>Retour aux communautés</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Inscription validée par l'organisation</span>
          </span>
          
          <button
            onClick={() => setShowRulesModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Règles de la communauté</span>
          </button>
        </div>
      </div>

      {/* 2. COMMUNITY HEADER BANNER (Full-width card layout matching brand aesthetic) */}
      <div className="relative rounded-[28px] overflow-hidden bg-[#0e1626] border border-slate-800 shadow-2xl">
        
        {/* Cover image with dark gradient */}
        <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-slate-950">
          <img
            src={community.coverImage || community.image}
            alt={community.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#0e1626] via-[#0e1626]/75 to-black/40" />

          {/* Top-Left Organization overlay (Clickable to view full organization profile) */}
          <button
            type="button"
            onClick={() => {
              if (onOpenOrganizationProfile) {
                const targetOrg = organization || {
                  id: community.organizationId,
                  name: orgName,
                  description: `Organisation responsable et animatrice de la communauté ${community.name}`,
                  type: 'ong' as const,
                  logo: community.image,
                  coverImage: community.coverImage,
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
            className="absolute top-4 left-5 sm:left-7 flex items-center gap-2.5 bg-black/60 hover:bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer group/org"
          >
            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20 shrink-0 bg-slate-800 group-hover/org:scale-105 transition-transform">
              <img
                src={community.image || organization?.logo}
                alt={orgName}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs font-bold text-white group-hover/org:text-cyan-300 transition-colors truncate max-w-[200px] sm:max-w-none">
              {orgName}
            </span>
          </button>
        </div>

        {/* Header content */}
        <div className="px-6 sm:px-8 pt-2 pb-6 space-y-4 relative">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-teal-400 font-mono">
                {categoryLabels[community.category] || 'COMMUNAUTÉ & RÉSILIENCE'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
                {headerTranslation.translated && headerTranslation.name
                  ? headerTranslation.name
                  : community.name}
              </h1>
            </div>

            {/* Actions: Post Question */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  if (onOpenCreatePost) onOpenCreatePost(community.id);
                }}
                className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Poser une question</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {headerTranslation.translated && headerTranslation.description
                ? headerTranslation.description
                : community.description}
            </p>

            <div className="pt-0.5">
              <TranslateButton
                originalPost={{
                  title: community.name,
                  content: community.description,
                }}
                targetLanguage={language}
                onTogglePostTranslation={(active, trans) => {
                  setHeaderTranslation({
                    translated: active,
                    name: trans.title,
                    description: trans.content,
                  });
                }}
              />
            </div>
          </div>

          {/* Stats Bar */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white">{community.membersCount}</span>
              <span className="text-slate-400">membres</span>
            </div>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-teal-400" />
              <span className="font-bold text-white">{displayPosts.length}</span>
              <span className="text-slate-400">questions & partages</span>
            </div>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white">{displayCampaigns.length}</span>
              <span className="text-slate-400">campagnes actives</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TÉMOIGNAGES DES MEMBRES (Stories en fil horizontal) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#0e1626] border border-slate-800 space-y-3.5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm sm:text-base font-bold text-white font-display">
              Témoignages des membres (Stories)
            </h2>
          </div>

          {onAddStory && (
            <button
              onClick={onAddStory}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Partager un témoignage</span>
            </button>
          )}
        </div>

        {/* Stories Horizontal Strip */}
        <div className="flex items-center gap-4 overflow-x-auto pb-2 pt-1 custom-scrollbar">
          {/* Add story button tile */}
          {onAddStory && (
            <div
              onClick={onAddStory}
              className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
            >
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-dashed border-cyan-500/50 hover:border-cyan-400 bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-all">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold text-slate-300 group-hover:text-cyan-300">
                + Témoigner
              </span>
            </div>
          )}

          {displayStories.map((story) => (
            <div
              key={story.id}
              onClick={() => onOpenStory && onOpenStory(story)}
              className="relative flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
            >
              {/* Glowing Story Ring */}
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full p-1 bg-linear-to-tr from-cyan-400 via-teal-400 to-indigo-500 shadow-md group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 border-2 border-[#0e1626]">
                  {story.mediaUrl ? (
                    <img
                      src={story.mediaUrl}
                      alt={story.caption}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-cyan-400 text-xs font-bold p-1 text-center bg-slate-900">
                      {story.caption.substring(0, 15)}...
                    </div>
                  )}
                </div>
              </div>
              
              <span className="text-[11px] font-semibold text-slate-300 group-hover:text-cyan-300 max-w-[76px] truncate text-center">
                {story.authorName}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. TABS: QUESTIONS (3-COLUMN GRID) & CAMPAGNES (3-COLUMN GRID) */}
      <div className="space-y-4">
        
        {/* Segmented Control & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0e1626] p-2.5 sm:p-3 rounded-2xl border border-slate-800">
          
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800/80 shrink-0">
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'questions'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Questions & Discussions ({displayPosts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'campaigns'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Campagnes disponibles ({displayCampaigns.length})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'questions' ? 'Rechercher une question...' : 'Rechercher une campagne...'}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400"
            />
          </div>
        </div>

        {/* TAB CONTENT 1: QUESTIONS EN GRILLE 3 COLONNES (comme sur les profils des membres) */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            {filteredPosts.length > 0 ? (
              <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl">
                <div className="grid grid-cols-3 gap-px bg-slate-800">
                  {filteredPosts.map((post) => {
                    const hasMedia = post.media && post.media.length > 0;
                    const courageReactions = post.reactions?.courage || (post.reactions?.support ?? 0) || 0;
                    const repliesCount = post.comments?.length || post.commentsCount || 0;

                    return (
                      <div
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className="relative aspect-square overflow-hidden bg-slate-950 transition-all cursor-pointer group select-none"
                      >
                        {/* Media or Text preview */}
                        {hasMedia ? (
                          <img
                            src={post.media![0].url}
                            alt={post.title || post.content}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full p-3 sm:p-4 bg-linear-to-br from-slate-900 via-[#0d1625] to-[#111e33] flex flex-col justify-between">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400/80 font-mono">
                              Question
                            </span>
                            <p className="text-[11px] sm:text-xs text-slate-100 line-clamp-3 font-semibold leading-tight">
                              {post.title || post.content}
                            </p>
                            <div className="text-[10px] text-slate-400 truncate font-medium">
                              {post.authorName} • {post.timestamp}
                            </div>
                          </div>
                        )}

                        {/* Dark Hover Overlay with Courage & Responses count */}
                        <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white p-2 backdrop-blur-[1px]">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300">
                            <HeartHandshake className="w-4 h-4" />
                            <span>{courageReactions}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                            <MessageSquare className="w-4 h-4" />
                            <span>{repliesCount}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-10 rounded-3xl bg-[#0e1626] border border-slate-800 text-center space-y-3">
                <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
                <h3 className="text-sm font-bold text-white">Aucune question trouvée</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Soyez le premier à poser une question bienveillante dans cette communauté.
                </p>
                {onOpenCreatePost && (
                  <button
                    onClick={() => onOpenCreatePost(community.id)}
                    className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition-all cursor-pointer"
                  >
                    Poser une question
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT 2: CAMPAGNES DISPONIBLES EN GRILLE 3 COLONNES */}
        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            {filteredCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCampaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="rounded-3xl bg-[#0e1626] border border-slate-800/90 overflow-hidden flex flex-col justify-between shadow-xl hover:border-cyan-500/40 transition-all group"
                  >
                    {/* Campaign Cover */}
                    <div className="relative h-36 w-full overflow-hidden bg-slate-900">
                      <img
                        src={camp.image}
                        alt={camp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-[#0e1626] via-[#0e1626]/60 to-transparent" />
                      
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-black text-amber-300 border border-amber-400/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>+{camp.rewards.points} pts</span>
                      </div>

                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black border border-cyan-500/40">
                        {camp.durationDays} jours
                      </div>
                    </div>

                    {/* Campaign Content */}
                    <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <h3 className="text-sm sm:text-base font-bold text-white font-display group-hover:text-cyan-300 transition-colors line-clamp-2">
                          {translatedCampCards[camp.id]?.translated && translatedCampCards[camp.id].title
                            ? translatedCampCards[camp.id].title
                            : camp.title}
                        </h3>
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {translatedCampCards[camp.id]?.translated
                            ? translatedCampCards[camp.id].desc
                            : camp.description}
                        </p>
                        <div className="pt-0.5">
                          <TranslateButton
                            compact
                            originalPost={{
                              title: camp.title,
                              content: camp.description,
                            }}
                            targetLanguage={language}
                            onTogglePostTranslation={(active, trans) => {
                              setTranslatedCampCards((prev) => ({
                                ...prev,
                                [camp.id]: {
                                  translated: active,
                                  title: trans.title,
                                  desc: trans.content,
                                },
                              }));
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                        {/* Progress or Participant count */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{camp.participantsCount} participants</span>
                          </span>
                          <span className="font-semibold text-emerald-400">
                            {camp.userProgressPercent || 0}% complété
                          </span>
                        </div>

                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${camp.userProgressPercent || 0}%` }}
                            className="h-full bg-linear-to-r from-cyan-400 to-teal-400"
                          />
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => {
                            if (onParticipateCampaign) onParticipateCampaign(camp.id);
                          }}
                          className={`w-full py-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            camp.isUserParticipating
                              ? 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40'
                              : 'bg-teal-400 hover:bg-teal-300 text-slate-950 shadow-md shadow-teal-500/20 active:scale-95'
                          }`}
                        >
                          <Trophy className="w-3.5 h-3.5" />
                          <span>{camp.isUserParticipating ? 'Continuer le parcours' : 'Participer au parcours'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 rounded-3xl bg-[#0e1626] border border-slate-800 text-center space-y-3">
                <Trophy className="w-8 h-8 text-slate-500 mx-auto" />
                <h3 className="text-sm font-bold text-white">Aucune campagne disponible</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  L'organisation partenaire prépare de nouveaux parcours d'apaisement.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Community Rules Modal */}
      {showRulesModal && (
        <CommunityRulesModal
          community={community}
          organization={organization}
          isJoined={true}
          language={language}
          onClose={() => setShowRulesModal(false)}
          onJoin={() => {}}
          onOpenProfile={() => setShowRulesModal(false)}
        />
      )}

      {/* Post Detail Modal (when clicked from 3-column grid) */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          currentUser={currentUser}
          language={language}
          onClose={() => setSelectedPost(null)}
          onReact={(postId, reaction) => {
            if (onReactPost) onReactPost(postId, reaction);
            setSelectedPost((prev) =>
              prev
                ? {
                    ...prev,
                    reactions: {
                      ...prev.reactions,
                      [reaction]: (prev.reactions?.[reaction] || 0) + 1,
                    },
                  }
                : null
            );
          }}
          onAddComment={(postId, comment) => {
            if (onAddPostComment) onAddPostComment(postId, comment);
            setSelectedPost((prev) =>
              prev
                ? {
                    ...prev,
                    commentsCount: prev.commentsCount + 1,
                    comments: [
                      ...prev.comments,
                      {
                        id: `comm-${Date.now()}`,
                        postId,
                        authorId: currentUser.id,
                        authorName: currentUser.name,
                        authorAvatar: currentUser.avatar,
                        authorStatus: currentUser.status,
                        content: comment,
                        timestamp: 'À l’instant',
                        reactions: { support: 0, understand: 0, courage: 1, bravo: 0 },
                      },
                    ],
                  }
                : null
            );
          }}
          onOpenUserProfile={onOpenUserProfile}
          onSavePost={onSavePost}
          onFollowAuthor={onFollowAuthor}
          onDeletePost={(postId) => {
            if (onDeletePost) onDeletePost(postId);
            setSelectedPost(null);
          }}
          onEditPost={(postId, updated) => {
            if (onEditPost) onEditPost(postId, updated);
            setSelectedPost((prev) =>
              prev
                ? {
                    ...prev,
                    title: updated.title !== undefined ? updated.title : prev.title,
                    content: updated.content !== undefined ? updated.content : prev.content,
                    tags: updated.tags !== undefined ? updated.tags : prev.tags,
                  }
                : null
            );
          }}
        />
      )}
    </div>
  );
};
