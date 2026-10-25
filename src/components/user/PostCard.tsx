import React, { useState, useRef, useEffect } from 'react';
import {
  HeartHandshake,
  MessageSquare,
  Flag,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  UserCheck,
  Send,
  Bookmark,
  Volume2,
  VolumeX,
  Pencil,
  Trash2,
  Check,
  X,
  MoreVertical,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Post, UserProfile, PostReaction, Language } from '../../types';
import { t } from '../../translations';
import { TranslateButton } from '../common/TranslateButton';
import { localizeTimestamp } from '../../data/localizedMockData';

interface PostCardProps {
  post: Post;
  currentUser: UserProfile;
  language?: Language;
  onOpenUserProfile?: (userId: string) => void;
  onFollowAuthor?: (authorId: string) => void;
  onSavePost?: (postId: string) => void;
  onAddComment?: (postId: string, content: string, isAnonymous?: boolean) => void;
  onReaction?: (postId: string, reactionType: keyof PostReaction) => void;
  onReact?: (postId: string, reactionType: keyof PostReaction) => void;
  onReportPost?: (postId: string, reason?: string) => void;
  onReport?: (postId: string, reason?: string) => void;
  onDeletePost?: (postId: string) => void;
  onEditPost?: (
    postId: string,
    updatedData: { title?: string; content?: string; tags?: string[] }
  ) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUser,
  language = 'fr',
  onOpenUserProfile,
  onFollowAuthor,
  onSavePost,
  onAddComment,
  onReaction,
  onReact,
  onReportPost,
  onReport,
  onDeletePost,
  onEditPost,
}) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const isSaved = (currentUser?.savedPostIds || []).includes(post.id);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [reportedToast, setReportedToast] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Dynamic Content Translation States
  const [isPostTranslated, setIsPostTranslated] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [translatedTags, setTranslatedTags] = useState<string[] | null>(null);
  const [commentTranslations, setCommentTranslations] = useState<Record<string, { translated: boolean; text: string }>>({});

  const strings = t[language] || t.fr;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Reset local translation override when global language or post changes
  useEffect(() => {
    setIsPostTranslated(false);
    setTranslatedTitle(null);
    setTranslatedContent(null);
    setTranslatedTags(null);
  }, [language, post.id]);

  const handleSaveToggle = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onSavePost) {
      onSavePost(post.id);
    }
    const nextSaved = !isSaved;
    setSavedToast(
      nextSaved
        ? (strings.profileView?.savedToast || 'Publication enregistrée dans votre profil')
        : (strings.profileView?.unsavedToast || 'Publication retirée de vos enregistrements')
    );
    setTimeout(() => {
      setSavedToast(null);
    }, 2500);
  };

  // Edit and Delete States
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || '');
  const [editContent, setEditContent] = useState(post.content || '');
  const [editTags, setEditTags] = useState(post.tags ? post.tags.join(' ') : '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isFollowing = currentUser?.followingUserIds?.includes(post.authorId);
  const isPostAuthorCurrentUser = Boolean(
    currentUser && (post.authorId === currentUser.id || post.authorName === currentUser.name)
  );
  const isEffectivelyAnonymous = Boolean(
    post.isAnonymous || (isPostAuthorCurrentUser && currentUser?.isAnonymous)
  );
  const displayedAuthorName = isEffectivelyAnonymous ? strings.common.anonymous : post.authorName;
  const authorInitial = isEffectivelyAnonymous ? 'A' : (post.authorName?.charAt(0).toUpperCase() || 'M');
  const courageCount = post.reactions?.courage || (post.reactions?.support ?? 0) || 0;
  const isCouraged = post.userReaction === 'courage' || post.userReaction === 'support';

  const handlePrevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex((i) => i - 1);
    }
  };

  const handleNextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.media && currentMediaIndex < post.media.length - 1) {
      setCurrentMediaIndex((i) => i + 1);
    }
  };

  const handleCourageClick = () => {
    if (onReaction) onReaction(post.id, 'courage');
    else if (onReact) onReact(post.id, 'courage');

    confetti({
      particleCount: 25,
      spread: 45,
      origin: { y: 0.8 },
      colors: ['#06b6d4', '#14b8a6', '#10b981', '#38bdf8'],
    });
  };

  const handleReportClick = () => {
    if (onReportPost) onReportPost(post.id, 'Contenu signalé');
    else if (onReport) onReport(post.id, 'Contenu signalé');

    setReportedToast(true);
    setTimeout(() => setReportedToast(false), 2500);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !onAddComment) return;
    onAddComment(post.id, commentInput.trim(), currentUser?.isAnonymous || false);
    setCommentInput('');
  };

  const toggleAudio = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        const titleToRead = isPostTranslated && translatedTitle ? translatedTitle : post.title;
        const contentToRead = isPostTranslated && translatedContent ? translatedContent : post.content;
        const textToRead = `${titleToRead ? titleToRead + '. ' : ''}${contentToRead}`;
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = language === 'sw' ? 'sw' : language === 'en' ? 'en-US' : language === 'ar' ? 'ar-SA' : language === 'pt' ? 'pt-PT' : 'fr-FR';
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    }
  };

  return (
    <article
      id={`post-${post.id}`}
      className="w-full bg-[#0f1623] rounded-2xl border border-slate-800/60 overflow-hidden transition-colors hover:border-slate-700/70"
    >
      {/* 1. HEADER: Author info & Top Right Controls */}
      <div className="p-4 sm:p-5 pb-3 flex items-start justify-between gap-3">
        
        {/* Author Avatar + Name + Community */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            onClick={() => {
              if (!isEffectivelyAnonymous && onOpenUserProfile) {
                onOpenUserProfile(post.authorId);
              }
            }}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-linear-to-tr from-cyan-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shrink-0 overflow-hidden ring-2 ring-cyan-500/40 ${
              !isEffectivelyAnonymous ? 'cursor-pointer hover:scale-105 transition-transform' : ''
            }`}
          >
            {isEffectivelyAnonymous ? (
              <span className="text-xs font-bold text-slate-200">A</span>
            ) : (
              <img
                src={post.authorAvatar}
                alt={displayedAuthorName}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                onClick={() => {
                  if (!isEffectivelyAnonymous && onOpenUserProfile) {
                    onOpenUserProfile(post.authorId);
                  }
                }}
                className={`font-bold text-white text-sm sm:text-base truncate transition-colors ${
                  !isEffectivelyAnonymous ? 'hover:text-cyan-300 cursor-pointer' : ''
                }`}
              >
                {displayedAuthorName}
              </span>

              {isFollowing && !isEffectivelyAnonymous && (
                <span className="px-2 py-0.2 rounded-md bg-teal-500/20 text-teal-300 text-[10px] font-bold border border-teal-500/30 shrink-0">
                  {strings.feed.following}
                </span>
              )}

              {isEffectivelyAnonymous && (
                <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30 shrink-0">
                  {strings.common.anonymous}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-semibold mt-0.5 truncate">
              <span className="truncate">{post.communityName}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 font-normal shrink-0">{post.timestamp}</span>
            </div>
          </div>
        </div>

        {/* Top Right Controls (Voice Read + Follow/Bookmark + Author Actions) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Read Aloud */}
          <button
            onClick={toggleAudio}
            title={isPlayingAudio ? (language === 'sw' ? 'Acha kusoma' : language === 'en' ? 'Stop reading' : language === 'ar' ? 'إيقاف القراءة' : language === 'pt' ? 'Parar leitura' : 'Arrêter la lecture') : (language === 'sw' ? 'Sikiliza chapisho' : language === 'en' ? 'Listen to post' : language === 'ar' ? 'الاستماع إلى المنشور' : language === 'pt' ? 'Ouvir publicação' : 'Écouter la publication')}
            className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isPlayingAudio
                ? 'bg-teal-500/20 border-teal-400 text-teal-300 animate-pulse'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-300'
            }`}
          >
            {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Follow Button */}
          {currentUser && post.authorId !== currentUser.id && onFollowAuthor && (
            <button
              onClick={() => onFollowAuthor(post.authorId)}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isFollowing
                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                  : 'bg-teal-950/60 hover:bg-teal-900/60 text-teal-300 border border-teal-500/40'
              }`}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-3 h-3 text-teal-400" />
                  <span>{strings.feed.following}</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3 h-3" />
                  <span>{strings.feed.follow}</span>
                </>
              )}
            </button>
          )}

          {/* Options Menu (Trois points: Enregistrer, Modifier, Supprimer, etc.) */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              title={strings.postCard?.options || "Options de la publication"}
              className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                showMenu
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10'
                  : isSaved
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:border-cyan-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl z-30 py-1 overflow-hidden animate-fade-in divide-y divide-slate-800/80">
                <div className="py-1">
                  {/* Option Enregistrer */}
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveToggle();
                      setShowMenu(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer"
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? 'text-cyan-400 fill-cyan-400' : 'text-slate-400'}`} />
                    <span>{isSaved ? strings.postCard?.saved || 'Enregistré (Retirer)' : strings.postCard?.save || 'Enregistrer'}</span>
                  </button>
                </div>

                {/* Options Auteur: Modifier & Supprimer */}
                {isPostAuthorCurrentUser && (
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(!isEditing);
                        setShowMenu(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/70 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4 text-cyan-400" />
                      <span>{isEditing ? strings.postCard?.closeEdit || 'Fermer la modification' : strings.postCard?.edit || 'Modifier'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      <span>{strings.postCard?.delete || 'Supprimer'}</span>
                    </button>
                  </div>
                )}

                {/* Option Signaler (si pas auteur) */}
                {!isPostAuthorCurrentUser && (onReportPost || onReport) && (
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleReportClick();
                        setShowMenu(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/70 transition-colors cursor-pointer"
                    >
                      <Flag className="w-4 h-4 text-slate-400" />
                      <span>{strings.postCard?.report || 'Signaler la publication'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Banner */}
      {showDeleteConfirm && (
        <div className="mx-4 sm:mx-5 mb-3 p-3 bg-rose-950/70 border border-rose-500/40 rounded-2xl flex items-center justify-between gap-3 text-xs animate-fade-in shadow-lg">
          <span className="text-rose-200 font-semibold">
            {strings.postCard?.deleteConfirm || 'Supprimer définitivement cette publication ?'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 font-bold cursor-pointer transition-colors"
            >
              {strings.common?.cancel || 'Annuler'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (onDeletePost) onDeletePost(post.id);
                setShowDeleteConfirm(false);
              }}
              className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer transition-colors shadow-md"
            >
              {strings.postCard?.delete || 'Supprimer'}
            </button>
          </div>
        </div>
      )}

      {/* Inline Edit Form */}
      {isEditing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!editContent.trim()) return;
            const parsedTags = editTags
              .split(/[ ,#]+/)
              .filter(Boolean)
              .map((t) => (t.startsWith('#') ? t : `#${t}`));
            if (onEditPost) {
              onEditPost(post.id, {
                title: editTitle.trim(),
                content: editContent.trim(),
                tags: parsedTags,
              });
            }
            setIsEditing(false);
          }}
          className="px-4 sm:px-5 pb-4 space-y-3 bg-slate-900/40 border-y border-slate-800/80 pt-3"
        >
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-cyan-300">{strings.postCard?.editTitle || 'Titre'}</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400 font-bold"
              placeholder={strings.postCard?.editTitlePlaceholder || "Modifier le titre..."}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-cyan-300">{strings.postCard?.editContent || 'Contenu'}</label>
            <textarea
              rows={3}
              required
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400 resize-none leading-relaxed"
              placeholder={strings.postCard?.editContentPlaceholder || "Modifier le contenu..."}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400">{strings.postCard?.editTags || 'Tags'}</label>
            <input
              type="text"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400"
              placeholder={strings.postCard?.editTagsPlaceholder || "ex: #santé #drépanocytose"}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setEditTitle(post.title || '');
                setEditContent(post.content || '');
                setEditTags(post.tags ? post.tags.join(' ') : '');
                setIsEditing(false);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              {strings.common?.cancel || 'Annuler'}
            </button>
            <button
              type="submit"
              disabled={!editContent.trim()}
              className="px-4 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-cyan-400/20 disabled:opacity-40"
            >
              {strings.common?.save || 'Enregistrer'}
            </button>
          </div>
        </form>
      ) : null}

      {/* 2. TITLE (placed right before media) */}
      {post.title && !isEditing && (
        <div className="px-4 sm:px-5 pb-2">
          <h3 className="text-base sm:text-lg font-bold text-white font-display leading-snug">
            {isPostTranslated && translatedTitle ? translatedTitle : post.title}
          </h3>
        </div>
      )}

      {/* 3. MEDIA (Images & Videos with Video Player) - PLACED DIRECTLY AFTER TITLE */}
      {post.media && post.media.length > 0 && (
        <div className="px-4 sm:px-5 pb-3">
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 select-none shadow-md group">
            <div className="w-full h-64 sm:h-80 md:h-96 relative flex items-center justify-center overflow-hidden bg-black">
              {post.media[currentMediaIndex].type === 'video' ||
              post.media[currentMediaIndex].url.startsWith('data:video') ||
              post.media[currentMediaIndex].url.endsWith('.mp4') ||
              post.media[currentMediaIndex].url.endsWith('.webm') ||
              post.media[currentMediaIndex].url.includes('video') ? (
                <video
                  src={post.media[currentMediaIndex].url}
                  controls
                  playsInline
                  className="w-full h-full object-contain bg-black"
                />
              ) : (
                <img
                  src={post.media[currentMediaIndex].url}
                  alt={post.title || 'Illustration publication'}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {currentMediaIndex > 0 && (
              <button
                onClick={handlePrevMedia}
                aria-label={strings.postCard?.prevMedia || "Média précédent"}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/80 hover:bg-slate-900 text-white flex items-center justify-center border border-slate-700 shadow-xl cursor-pointer transition-transform active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {currentMediaIndex < post.media.length - 1 && (
              <button
                onClick={handleNextMedia}
                aria-label={strings.postCard?.nextMedia || "Média suivant"}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/80 hover:bg-slate-900 text-white flex items-center justify-center border border-slate-700 shadow-xl cursor-pointer transition-transform active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {post.media.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/60 shadow-lg">
                {post.media.map((_, idx) => (
                  <div
                    key={idx}
                    className={`transition-all ${
                      idx === currentMediaIndex
                        ? 'w-6 h-1.5 rounded-full bg-cyan-400'
                        : 'w-1.5 h-1.5 rounded-full bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. TEXT CONTENT - PLACED BELOW THE MEDIA */}
      {!isEditing && (
        <div className="px-4 sm:px-5 pb-3 space-y-2.5">
          <div className="space-y-2">
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {isPostTranslated && translatedContent ? translatedContent : post.content}
            </p>
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <TranslateButton
                originalPost={{
                  title: post.title,
                  content: post.content,
                  tags: post.tags,
                }}
                targetLanguage={language}
                onTogglePostTranslation={(active, trans) => {
                  setIsPostTranslated(active);
                  setTranslatedTitle(trans.title || null);
                  setTranslatedContent(trans.content || null);
                  setTranslatedTags(trans.tags || null);
                }}
              />
            </div>
          </div>

          {/* Hashtags */}
          {((isPostTranslated && translatedTags ? translatedTags : post.tags) || []).length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {(isPostTranslated && translatedTags ? translatedTags : post.tags)!.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-lg bg-slate-900/80 text-cyan-400 text-[11px] font-semibold border border-slate-800"
                >
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. REACTIONS BAR: COURAGE + RÉPONSES on left, SIGNALER on the OPPOSITE side */}
      <div className="px-4 sm:px-5 py-2.5 bg-[#0d131f] border-t border-slate-800/80 flex items-center justify-between gap-3">
        
        {/* Left Side: Courage & Réponses (Icon + small number by default, label on hover) */}
        <div className="flex items-center gap-2">
          
          {/* COURAGE BUTTON with HeartHandshake icon */}
          <button
            id={`btn-courage-${post.id}`}
            onClick={handleCourageClick}
            title={strings.postCard?.courage || strings.reactions?.courage || 'Courage'}
            className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              isCouraged
                ? 'bg-linear-to-r from-teal-500/25 to-cyan-500/25 text-teal-300 border border-teal-400/60 shadow-md shadow-teal-500/20'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-teal-300 border border-slate-800'
            }`}
          >
            <HeartHandshake className={`w-4 h-4 ${isCouraged ? 'text-teal-300 stroke-[2.5]' : 'text-teal-400 group-hover:scale-110 transition-transform'}`} />
            <span className="text-[11px] font-extrabold text-teal-400/90 tracking-tight">
              {courageCount}
            </span>
            <span className="hidden group-hover:inline-block text-[11px] text-teal-300 font-semibold pl-0.5 animate-fade-in transition-all">
              {strings.postCard?.courage || strings.reactions?.courage || 'Courage'}
            </span>
          </button>

          {/* RÉPONSES BUTTON */}
          <button
            onClick={() => setShowComments(!showComments)}
            title={strings.feed.comments}
            className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-cyan-300 border border-slate-800 text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            <MessageSquare className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-extrabold text-cyan-400/90 tracking-tight">
              {post.comments?.length || post.commentsCount || 0}
            </span>
            <span className="hidden group-hover:inline-block text-[11px] text-cyan-300 font-semibold pl-0.5 animate-fade-in transition-all">
              {strings.feed.comments}
            </span>
          </button>

          {/* ENREGISTRER (BOOKMARK) BUTTON */}
          <button
            onClick={handleSaveToggle}
            title={isSaved ? (strings.profileView?.savedPost || 'Enregistré (Retirer)') : (strings.profileView?.savePost || 'Enregistrer')}
            className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              isSaved
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-cyan-300 border border-slate-800'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'text-cyan-300 fill-cyan-300' : 'text-slate-400 group-hover:scale-110 transition-transform'}`} />
            <span className="hidden group-hover:inline-block text-[11px] text-cyan-300 font-semibold pl-0.5 animate-fade-in transition-all">
              {isSaved ? (strings.profileView?.savedPost || 'Enregistré') : (strings.profileView?.savePost || 'Enregistrer')}
            </span>
          </button>
        </div>

        {/* Right Side (Opposite): SIGNALER */}
        <button
          onClick={handleReportClick}
          title={strings.feed.report}
          className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-slate-900/60 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800/80 hover:border-rose-800/60 text-xs font-semibold transition-colors cursor-pointer"
        >
          <Flag className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span className="hidden group-hover:inline-block text-[11px] text-rose-300 font-semibold pl-0.5 animate-fade-in">
            {strings.feed.report}
          </span>
        </button>
      </div>

      {/* Saved / Unsaved Toast Feedback */}
      {savedToast && (
        <div className="px-4 py-2 bg-cyan-950/80 border-t border-cyan-800/80 text-cyan-300 text-xs font-semibold text-center animate-fade-in">
          {savedToast}
        </div>
      )}

      {/* Reported Toast Feedback */}
      {reportedToast && (
        <div className="px-4 py-2 bg-rose-950/80 border-t border-rose-800/80 text-rose-300 text-xs font-semibold text-center animate-fade-in">
          {strings.postCard?.reportedToast || 'Publication signalée aux modérateurs avec bienveillance.'}
        </div>
      )}

      {/* 6. COMMENTS / RESPONSES DRAWER */}
      {showComments && (
        <div className="p-4 sm:p-5 bg-slate-950/90 border-t border-slate-800/90 space-y-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
            <span>
              {language === 'sw'
                ? `Majibu ya jamii (${post.comments?.length || 0})`
                : language === 'en'
                ? `Community replies (${post.comments?.length || 0})`
                : language === 'ar'
                ? `ردود المجتمع (${post.comments?.length || 0})`
                : language === 'pt'
                ? `Respostas da comunidade (${post.comments?.length || 0})`
                : `Réponses de la communauté (${post.comments?.length || 0})`}
            </span>
          </div>

          {/* Comments list */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {!post.comments || post.comments.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center">
                {language === 'sw'
                  ? 'Hakuna majibu kwa sasa. Kuwa wa kwanza kutoa ujasiri au maoni!'
                  : language === 'en'
                  ? 'No replies yet. Be the first to share support or insights!'
                  : language === 'ar'
                  ? 'لا توجد ردود حتى الآن. كن أول من يشارك الدعم أو الرأي!'
                  : language === 'pt'
                  ? 'Sem respostas ainda. Seja o primeiro a apoiar!'
                  : 'Aucune réponse pour le moment. Soyez le premier à apporter votre éclairage ou votre courage !'}
              </p>
            ) : (
              post.comments.map((comment) => {
                const isCommentAuthorCurrentUser = Boolean(
                  currentUser &&
                    (comment.authorId === currentUser.id ||
                      comment.authorName === currentUser.name ||
                      comment.authorName === currentUser.pseudonym)
                );
                const isCommentAnon = Boolean(
                  comment.isAnonymous || (isCommentAuthorCurrentUser && currentUser?.isAnonymous)
                );
                const commentAuthorName = isCommentAnon ? strings.common.anonymous : comment.authorName;
                const commentTrans = commentTranslations[comment.id];

                return (
                  <div
                    key={comment.id}
                    className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex items-start gap-2.5"
                  >
                    {isCommentAnon ? (
                      <div className="w-8 h-8 rounded-full bg-linear-to-tr from-cyan-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 border border-amber-400/40">
                        A
                      </div>
                    ) : (
                      <img
                        src={comment.authorAvatar}
                        alt={commentAuthorName}
                        onClick={() => onOpenUserProfile && onOpenUserProfile(comment.authorId)}
                        className="w-8 h-8 rounded-full object-cover border border-cyan-400/60 cursor-pointer shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            onClick={() => {
                              if (!isCommentAnon && onOpenUserProfile) {
                                onOpenUserProfile(comment.authorId);
                              }
                            }}
                            className={`text-xs font-bold text-white truncate ${
                              !isCommentAnon ? 'hover:text-cyan-300 cursor-pointer' : ''
                            }`}
                          >
                            {commentAuthorName}
                          </span>
                          {isCommentAnon && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold shrink-0">
                              {strings.common.anonymous}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">{localizeTimestamp(comment.timestamp, (language || 'fr') as Language)}</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {commentTrans?.translated ? commentTrans.text : comment.content}
                      </p>
                      <div className="pt-0.5">
                        <TranslateButton
                          compact
                          originalText={comment.content}
                          targetLanguage={language}
                          onToggleTranslation={(active, text) => {
                            setCommentTranslations((prev) => ({
                              ...prev,
                              [comment.id]: { translated: active, text },
                            }));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Reply Form */}
          <form onSubmit={handleSubmitComment} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder={strings.feed.writeComment}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={!commentInput.trim()}
              className="px-4 py-2.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-950 text-xs font-extrabold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-md shadow-cyan-400/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{strings.feed.reply}</span>
            </button>
          </form>
        </div>
      )}
    </article>
  );
};
