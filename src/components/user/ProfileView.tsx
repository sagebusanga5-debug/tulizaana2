import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  UserCheck,
  MessageSquare,
  Lock,
  ArrowLeft,
  Sparkles,
  HeartHandshake,
  HelpCircle,
  Plus,
  Bookmark,
  Share2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { UserProfile, StoryTestimonial, Post, Community, Language } from '../../types';
import { t } from '../../translations';
import { EditProfileModal } from './EditProfileModal';
import { PostDetailModal } from './PostDetailModal';

interface ProfileViewProps {
  user: UserProfile;
  currentUser: UserProfile;
  stories: StoryTestimonial[];
  posts: Post[];
  communities?: Community[];
  language?: Language;
  onSelectLanguage?: (lang: Language) => void;
  onLogout?: () => void;
  onFollowToggle?: (userId: string) => void;
  onStartMessage?: (userId: string) => void;
  onUpdateProfile?: (updatedData: {
    name: string;
    pseudonym: string;
    bio: string;
    avatar: string;
    isAnonymous: boolean;
  }) => void;
  onToggleAnonymousMode?: () => void;
  onOpenStory?: (story: StoryTestimonial) => void;
  onAddStory?: () => void;
  onReactPost?: (postId: string, reactionType: 'courage' | 'support' | 'understand' | 'bravo') => void;
  onAddPostComment?: (postId: string, content: string, isAnonymous?: boolean) => void;
  onBackToFeed?: () => void;
  onOpenUserProfile?: (userId: string) => void;
  onDeletePost?: (postId: string) => void;
  onEditPost?: (postId: string, updatedData: { title?: string; content?: string; tags?: string[] }) => void;
  onSavePost?: (postId: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  currentUser,
  stories,
  posts,
  communities,
  language = 'fr',
  onSelectLanguage,
  onLogout,
  onFollowToggle,
  onStartMessage,
  onUpdateProfile,
  onToggleAnonymousMode,
  onOpenStory,
  onAddStory,
  onReactPost,
  onAddPostComment,
  onBackToFeed,
  onOpenUserProfile,
  onDeletePost,
  onEditPost,
  onSavePost,
}) => {
  const strings = t[language] || t.fr;
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [activeTab, setActiveTab] = useState<'questions' | 'following' | 'saved'>('questions');
  const storiesScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollStoriesLeft, setCanScrollStoriesLeft] = useState(false);
  const [canScrollStoriesRight, setCanScrollStoriesRight] = useState(false);

  const checkStoriesScroll = () => {
    if (storiesScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = storiesScrollRef.current;
      setCanScrollStoriesLeft(scrollLeft > 10);
      setCanScrollStoriesRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkStoriesScroll();
    window.addEventListener('resize', checkStoriesScroll);
    return () => window.removeEventListener('resize', checkStoriesScroll);
  }, [stories, user.id]);

  const handleScrollStories = (direction: 'left' | 'right') => {
    if (storiesScrollRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      storiesScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkStoriesScroll, 300);
    }
  };

  const isOwnProfile = user.id === currentUser.id;
  const isFollowing = currentUser?.followingUserIds?.includes(user.id);

  // User's stories (Témoignages à la une)
  const userStories = stories.filter((s) => s.authorId === user.id);

  // 1. Questions du membre
  const memberQuestions = posts.filter((p) => p.authorId === user.id);

  // 2. Questions des personnes auxquelles le membre s'est abonné
  const memberFollowedUserIds = isOwnProfile
    ? (currentUser.followingUserIds || [])
    : (user.followingUserIds || []);
  const followingQuestions = posts.filter((p) => memberFollowedUserIds.includes(p.authorId));

  // 3. Questions enregistrées par le membre
  const memberSavedPostIds = isOwnProfile
    ? (currentUser.savedPostIds || [])
    : (user.savedPostIds || []);
  const savedQuestions = posts.filter((p) => memberSavedPostIds.includes(p.id));

  // Current posts for the active tab (all displayed in 3-column grid)
  const currentGridPosts =
    activeTab === 'questions'
      ? memberQuestions
      : activeTab === 'following'
      ? followingQuestions
      : savedQuestions;

  // Fallback handle if not explicitly set
  const userHandle = user.pseudonym
    ? user.pseudonym.replace(/^@/, '')
    : user.name.toLowerCase().replace(/\s+/g, '_');

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      
      {/* Top Bar with Return Button if viewing someone else */}
      {!isOwnProfile && onBackToFeed && (
        <button
          onClick={onBackToFeed}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#111827] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{strings.profileView?.backToFeed || 'Retour au fil'}</span>
        </button>
      )}

      {/* 1. MAIN PROFILE CARD (exact replica of screenshots image.png & image.png) */}
      <div className="rounded-3xl bg-[#111827] border border-slate-800/90 p-5 sm:p-7 shadow-2xl space-y-5">
        
        {/* Profile Info Header */}
        <div className="flex items-start gap-4 sm:gap-6">
          
          {/* Avatar with Neon Glowing Ring + Security Badge */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-cyan-400 shadow-xl shadow-cyan-500/10 ring-4 ring-cyan-500/30">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Small Shield Security Badge */}
            <div
              title={strings.profileView?.verifiedProfile || "Profil Vérifié et Sécurisé"}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#0a0f18] border border-teal-400 flex items-center justify-center shadow-lg"
            >
              <ShieldCheck className="w-4 h-4 text-teal-400" />
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0 space-y-2">
            
            {/* Name */}
            <h1 className="text-lg sm:text-2xl font-extrabold text-white font-display tracking-tight truncate">
              {user.name}
            </h1>

            {/* @handle pill */}
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#042f2e]/90 border border-[#134e4a] text-[#2dd4bf] text-xs font-semibold font-mono shadow-xs">
                @{userHandle}
              </span>
            </div>

            {/* Member Since Date */}
            <p className="text-xs sm:text-sm font-semibold text-[#2dd4bf]">
              {strings.profileView?.memberSince || 'Membre depuis Janvier 2026'}
            </p>

            {/* Bio in quotes and italic */}
            <p className="text-xs sm:text-sm text-slate-200 italic font-medium leading-relaxed pt-1">
              "{user.bio || "Membre actif de la communauté Tulizaana, engagé(e) pour le soutien mutuel et la sensibilisation."}"
            </p>
          </div>
        </div>

        {/* Action Buttons Below Bio */}
        <div className="pt-2">
          {!isOwnProfile ? (
            /* Someone Else's Profile: [Suivre] & [Contacter] */
            <div className="flex items-center gap-3">
              <button
                onClick={() => onFollowToggle && onFollowToggle(user.id)}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-7 py-3 rounded-2xl text-xs font-extrabold transition-all shadow-md active:scale-95 cursor-pointer ${
                  isFollowing
                    ? 'bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/40'
                    : 'bg-[#14b8a6] hover:bg-[#2dd4bf] text-slate-950 shadow-teal-500/25'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4 text-teal-400 stroke-[2.5]" />
                    <span>{strings.profileView?.following || 'Abonné'}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 stroke-[2.5]" />
                    <span>{strings.profileView?.follow || 'Suivre'}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onStartMessage && onStartMessage(user.id)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-[#0d9488] hover:bg-[#14b8a6] text-slate-950 text-xs font-extrabold transition-all shadow-md shadow-teal-600/25 active:scale-95 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 stroke-[2.5]" />
                <span>{strings.profileView?.contact || 'Contacter'}</span>
              </button>
            </div>
          ) : (
            /* My Own Profile: [Paramètres du profil] */
            <div className="space-y-3">
              <button
                type="button"
                id="btn-profile-settings"
                onClick={() => setShowEditModal(true)}
                className="w-full flex items-center justify-center py-3.5 px-4 rounded-2xl bg-[#2dd4bf] hover:bg-[#5eead4] text-slate-950 font-black text-xs sm:text-sm tracking-tight transition-all shadow-lg shadow-teal-400/20 active:scale-98 cursor-pointer text-center"
              >
                {strings.profileView?.profileSettings || 'Paramètres du profil'}
              </button>

              {currentUser.isAnonymous && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-300">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="flex-1 text-[11px] leading-snug">
                    <strong>Mode Anonymat actif :</strong> Votre nom et votre photo sont masqués sur toutes vos publications et contributions (affiché uniquement sous « Anonyme »).
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. TÉMOIGNAGES À LA UNE (Featured Stories / Highlights) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm sm:text-base font-bold text-white font-display">
            {strings.profileView?.featuredStories || 'Témoignages à la une'}
          </h3>

          {isOwnProfile && onAddStory && (
            <button
              onClick={onAddStory}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{strings.profileView?.newStory || 'Nouveau témoignage'}</span>
            </button>
          )}
        </div>

        {userStories.length > 0 ? (
          <div className="relative group/stories w-full">
            {/* Left Scroll Navigation Button */}
            {canScrollStoriesLeft && (
              <button
                onClick={() => handleScrollStories('left')}
                aria-label={strings.profileView?.prevStory || "Témoignage précédent"}
                title={strings.profileView?.prevStory || "Précédent"}
                className="absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/95 hover:bg-slate-800 text-slate-200 hover:text-cyan-400 border border-cyan-500/40 shadow-xl shadow-slate-950/60 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}

            {/* Right Scroll Navigation Button */}
            {canScrollStoriesRight && (
              <button
                onClick={() => handleScrollStories('right')}
                aria-label={strings.profileView?.nextStory || "Témoignage suivant"}
                title={strings.profileView?.nextStory || "Suivant"}
                className="absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/95 hover:bg-slate-800 text-slate-200 hover:text-cyan-400 border border-cyan-500/40 shadow-xl shadow-slate-950/60 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}

            <div
              ref={storiesScrollRef}
              onScroll={checkStoriesScroll}
              className="flex items-center gap-4 overflow-x-auto scroll-smooth pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {userStories.map((story) => (
                <div
                  key={story.id}
                  onClick={() => onOpenStory && onOpenStory(story)}
                  className="relative flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
                >
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full p-1 bg-linear-to-tr from-cyan-400 via-teal-400 to-indigo-500 shadow-md group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 border-2 border-[#111827]">
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
                  <span className="text-[11px] font-semibold text-slate-300 group-hover:text-cyan-300 max-w-[82px] truncate text-center">
                    {story.caption || 'Témoignage'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-[#111827]/70 border border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-400 italic">
              {isOwnProfile
                ? (strings.profileView?.noStories || "Vous n'avez pas encore partagé de témoignage à la une.")
                : (strings.profileView?.noStoriesOther || "Aucun témoignage à la une pour le moment.")}
            </p>
            {isOwnProfile && onAddStory && (
              <button
                onClick={onAddStory}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 border border-cyan-500/40 transition-all cursor-pointer"
              >
                {strings.createPost?.shareStoryTab || 'Publier un témoignage'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. PUBLICATIONS DE L'UTILISATEUR: TROIS ONGLETS (Questions, Abonnements, Enregistrements) */}
      <div className="space-y-4">
        {/* Navigation des 3 Onglets (100% responsive, garanti sans débordement ni coupure) */}
        <div className="border-b border-slate-800/90 w-full">
          <div className="grid grid-cols-3 w-full">
            {/* Onglet 1: Questions */}
            <button
              type="button"
              id="tab-profile-questions"
              onClick={() => setActiveTab('questions')}
              className={`flex items-center justify-center gap-1 sm:gap-2 py-3 px-1 sm:px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer min-w-0 ${
                activeTab === 'questions'
                  ? 'border-cyan-400 text-cyan-400 shadow-xs'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">{strings.profileView?.tabQuestions || 'Questions'}</span>
              <span
                className={`text-[10px] sm:text-[11px] font-mono px-1 sm:px-1.5 py-0.5 rounded-full shrink-0 ${
                  activeTab === 'questions' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800/80 text-slate-400'
                }`}
              >
                {memberQuestions.length}
              </span>
            </button>

            {/* Onglet 2: Abonnements */}
            <button
              type="button"
              id="tab-profile-following"
              onClick={() => setActiveTab('following')}
              className={`flex items-center justify-center gap-1 sm:gap-2 py-3 px-1 sm:px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer min-w-0 ${
                activeTab === 'following'
                  ? 'border-cyan-400 text-cyan-400 shadow-xs'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">{strings.profileView?.tabFollowing || 'Abonnements'}</span>
              <span
                className={`text-[10px] sm:text-[11px] font-mono px-1 sm:px-1.5 py-0.5 rounded-full shrink-0 ${
                  activeTab === 'following' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800/80 text-slate-400'
                }`}
              >
                {followingQuestions.length}
              </span>
            </button>

            {/* Onglet 3: Enregistrements */}
            <button
              type="button"
              id="tab-profile-saved"
              onClick={() => setActiveTab('saved')}
              className={`flex items-center justify-center gap-1 sm:gap-2 py-3 px-1 sm:px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer min-w-0 ${
                activeTab === 'saved'
                  ? 'border-cyan-400 text-cyan-400 shadow-xs'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">{strings.profileView?.tabSaved || 'Enregistrements'}</span>
              <span
                className={`text-[10px] sm:text-[11px] font-mono px-1 sm:px-1.5 py-0.5 rounded-full shrink-0 ${
                  activeTab === 'saved' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800/80 text-slate-400'
                }`}
              >
                {savedQuestions.length}
              </span>
            </button>
          </div>
        </div>

        {/* Grille uniforme de 3 colonnes séparée par des lignes droites (style galerie sans bordures arrondies intérieures) */}
        {currentGridPosts.length > 0 ? (
          <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-900 shadow-xl">
            <div className="grid grid-cols-3 gap-px bg-slate-800">
              {currentGridPosts.map((post) => {
                const hasMedia = post.media && post.media.length > 0;
                const courageReactions = post.reactions?.courage || (post.reactions?.support ?? 0) || 0;
                const repliesCount = post.comments?.length || post.commentsCount || 0;
                const isPostSavedByMe = (currentUser?.savedPostIds || []).includes(post.id);

                return (
                  <div
                    key={post.id}
                    onClick={() => handlePostClick(post)}
                    className="relative aspect-square overflow-hidden bg-slate-950 hover:bg-slate-900 transition-colors cursor-pointer group select-none"
                  >
                    {/* Media or Text representation */}
                    {hasMedia ? (
                      <img
                        src={post.media![0].url}
                        alt={post.title || post.content}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full p-2.5 sm:p-4 bg-linear-to-br from-slate-900/90 via-[#0d1625] to-[#101c30] flex flex-col justify-between group-hover:from-slate-850 group-hover:to-[#13223a] transition-all">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-cyan-400/90 font-mono truncate">
                            {post.communityName || strings.createPost?.askQuestionTab || 'Question'}
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-100 line-clamp-3 font-semibold leading-snug">
                          {post.title || post.content}
                        </p>
                        <div className="text-[9px] sm:text-[10px] text-slate-400 truncate font-medium">
                          {post.timestamp}
                        </div>
                      </div>
                    )}

                    {/* Badge Bookmark discret en haut à droite si la question est enregistrée */}
                    {isPostSavedByMe && (
                      <div
                        title="Question enregistrée"
                        className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center text-cyan-400 border border-cyan-500/40 shadow-xs"
                      >
                        <Bookmark className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-cyan-400" />
                      </div>
                    )}

                    {/* Dark Hover Overlay with Courage & Responses count */}
                    <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 sm:gap-4 text-white p-2 backdrop-blur-[1px]">
                      <div className="flex items-center gap-1 sm:gap-1.5 text-xs font-bold text-teal-300">
                        <HeartHandshake className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>{courageReactions}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5 text-xs font-bold text-cyan-300">
                        <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>{repliesCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* État vide spécifique à chaque onglet */
          <div className="p-8 sm:p-10 rounded-3xl bg-[#111827]/70 border border-slate-800 text-center space-y-3 animate-fade-in">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400">
              {activeTab === 'questions' && <HelpCircle className="w-6 h-6 text-cyan-400" />}
              {activeTab === 'following' && <UserCheck className="w-6 h-6 text-teal-400" />}
              {activeTab === 'saved' && <Bookmark className="w-6 h-6 text-cyan-400" />}
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              {activeTab === 'questions' && (
                isOwnProfile
                  ? (strings.profileView?.noQuestionsSelf || "Vous n’avez pas encore posé de question ou publié de contenu.")
                  : (strings.profileView?.noQuestionsOther || "Cet utilisateur n’a pas encore publié de questions.")
              )}
              {activeTab === 'following' && (
                isOwnProfile
                  ? (strings.profileView?.noFollowingSelf || "Vous ne suivez pas encore de membres ou vos abonnements n’ont pas encore publié de questions.")
                  : (strings.profileView?.noFollowingOther || "Ce membre n’a pas encore d’abonnements avec des questions publiées.")
              )}
              {activeTab === 'saved' && (
                isOwnProfile
                  ? (strings.profileView?.noSavedSelf || "Vous n’avez pas encore enregistré de publications. Cliquez sur l’icône de signet sur une publication pour la retrouver ici.")
                  : (strings.profileView?.noSavedOther || "Aucune publication enregistrée par ce membre pour le moment.")
              )}
            </p>

            {isOwnProfile && activeTab === 'questions' && onAddStory && (
              <button
                type="button"
                onClick={onAddStory}
                className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                {strings.profileView?.askFirstQuestion || 'Poser une question'}
              </button>
            )}

            {isOwnProfile && activeTab === 'following' && onBackToFeed && (
              <button
                type="button"
                onClick={onBackToFeed}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                {strings.profileView?.exploreCommunities || 'Explorer le fil'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          user={currentUser}
          language={language}
          onSelectLanguage={onSelectLanguage}
          onLogout={onLogout}
          onClose={() => setShowEditModal(false)}
          onSave={(updatedData) => {
            if (onUpdateProfile) onUpdateProfile(updatedData);
          }}
          onToggleAnonymousMode={onToggleAnonymousMode}
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
            // Update local post state in modal
            setSelectedPost((prev) =>
              prev
                ? {
                    ...prev,
                    userReaction: reaction,
                    reactions: {
                      ...prev.reactions,
                      courage: (prev.reactions?.courage || 0) + 1,
                    },
                  }
                : null
            );
          }}
          onAddComment={(postId, content, isAnon) => {
            if (onAddPostComment) onAddPostComment(postId, content, isAnon);
            const newComment = {
              id: `comm-${Date.now()}`,
              postId,
              authorId: currentUser.id,
              authorName: isAnon ? 'Membre Anonyme' : currentUser.name,
              authorAvatar: isAnon
                ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                : currentUser.avatar,
              authorStatus: currentUser.status,
              isAnonymous: isAnon,
              content,
              timestamp: 'À l’instant',
              reactions: { support: 1, understand: 0, courage: 1, bravo: 0 },
            };
            setSelectedPost((prev) =>
              prev
                ? {
                    ...prev,
                    commentsCount: (prev.commentsCount || 0) + 1,
                    comments: [...(prev.comments || []), newComment],
                  }
                : null
            );
          }}
          onOpenUserProfile={onOpenUserProfile}
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
          onSavePost={onSavePost}
          onFollowAuthor={onFollowToggle}
        />
      )}
    </div>
  );
};
