import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  HeartHandshake,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Send,
  Flag,
  Share2,
  Bookmark,
  Pencil,
  Trash2,
  MoreVertical,
  UserPlus,
  UserCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Post, UserProfile, Language } from '../../types';
import { t } from '../../translations';
import { TranslateButton } from '../common/TranslateButton';

interface PostDetailModalProps {
  post: Post;
  currentUser: UserProfile;
  language?: Language;
  onClose: () => void;
  onReact: (postId: string, reactionType: 'courage' | 'support' | 'understand' | 'bravo') => void;
  onAddComment: (postId: string, content: string, isAnonymous?: boolean) => void;
  onOpenUserProfile?: (userId: string) => void;
  onDeletePost?: (postId: string) => void;
  onEditPost?: (
    postId: string,
    updatedData: { title?: string; content?: string; tags?: string[] }
  ) => void;
  onSavePost?: (postId: string) => void;
  onFollowAuthor?: (authorId: string) => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  currentUser,
  language = 'fr',
  onClose,
  onReact,
  onAddComment,
  onOpenUserProfile,
  onDeletePost,
  onEditPost,
  onSavePost,
  onFollowAuthor,
}) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [commentInput, setCommentInput] = useState('');
  const [reportedToast, setReportedToast] = useState(false);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const isSaved = (currentUser?.savedPostIds || []).includes(post.id);
  const isFollowing = (currentUser?.followingUserIds || []).includes(post.authorId);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSaveToggle = () => {
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

  // Dynamic Content Translation
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

  // Edit / Delete states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || '');
  const [editContent, setEditContent] = useState(post.content || '');
  const [editTags, setEditTags] = useState(post.tags ? post.tags.join(' ') : '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const courageCount = post.reactions?.courage || (post.reactions?.support ?? 0) || 0;
  const isCouraged = post.userReaction === 'courage' || post.userReaction === 'support';

  const handleCourageClick = () => {
    onReact(post.id, 'courage');
    confetti({
      particleCount: 25,
      spread: 45,
      origin: { y: 0.7 },
      colors: ['#06b6d4', '#14b8a6', '#10b981'],
    });
  };

  const handlePrevMedia = () => {
    if (currentMediaIndex > 0) setCurrentMediaIndex((i) => i - 1);
  };

  const handleNextMedia = () => {
    if (post.media && currentMediaIndex < post.media.length - 1) {
      setCurrentMediaIndex((i) => i + 1);
    }
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onAddComment(post.id, commentInput.trim(), currentUser?.isAnonymous || false);
    setCommentInput('');
  };

  const isAuthorCurrentUser = Boolean(
    currentUser &&
      (post.authorId === currentUser.id ||
        post.authorName === currentUser.name ||
        post.authorName === currentUser.pseudonym)
  );
  const isEffectivelyAnonymous = Boolean(
    post.isAnonymous || (isAuthorCurrentUser && currentUser?.isAnonymous)
  );
  const displayedAuthorName = isEffectivelyAnonymous ? 'Anonyme' : post.authorName;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#111827] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEffectivelyAnonymous ? (
              <div className="w-10 h-10 rounded-full bg-linear-to-tr from-cyan-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm border-2 border-amber-400/40 shrink-0">
                A
              </div>
            ) : (
              <img
                src={post.authorAvatar}
                alt={displayedAuthorName}
                onClick={() => {
                  if (onOpenUserProfile) {
                    onClose();
                    onOpenUserProfile(post.authorId);
                  }
                }}
                className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400 cursor-pointer"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span
                  onClick={() => {
                    if (!isEffectivelyAnonymous && onOpenUserProfile) {
                      onClose();
                      onOpenUserProfile(post.authorId);
                    }
                  }}
                  className={`font-bold text-sm text-white ${
                    !isEffectivelyAnonymous ? 'hover:text-cyan-300 cursor-pointer' : ''
                  }`}
                >
                  {displayedAuthorName}
                </span>
                {isEffectivelyAnonymous && (
                  <span className="px-2 py-0.2 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    Anonyme
                  </span>
                )}
                {/* Follow / Abonné Button */}
                {currentUser && post.authorId !== currentUser.id && onFollowAuthor && (
                  <button
                    type="button"
                    onClick={() => onFollowAuthor(post.authorId)}
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isFollowing
                        ? 'bg-slate-800 text-slate-300 border border-slate-700'
                        : 'bg-teal-950/60 hover:bg-teal-900/60 text-teal-300 border border-teal-500/40'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-3 h-3 text-teal-400" />
                        <span>{strings.feed?.following || 'Abonné(e)'}</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3" />
                        <span>{strings.feed?.follow || 'Suivre'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <span className="text-[11px] text-cyan-400">{post.communityName} • {post.timestamp}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Direct Bookmark Action Button */}
            <button
              type="button"
              onClick={handleSaveToggle}
              title={isSaved ? (strings.profileView?.savedPost || 'Enregistré (Retirer)') : (strings.profileView?.savePost || 'Enregistrer')}
              className={`p-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isSaved
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'text-cyan-400 fill-cyan-400' : 'text-slate-400'}`} />
            </button>

            {/* Options Menu (Trois points: Enregistrer, Modifier, Supprimer) */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                title={strings.postCard?.options || "Options de la publication"}
                className={`p-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  showMenu
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : isSaved
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:border-cyan-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <MoreVertical className="w-4 h-4" />
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
                  {isAuthorCurrentUser && (
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
                  {!isAuthorCurrentUser && (
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setReportedToast(true);
                          setTimeout(() => setReportedToast(false), 2500);
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

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Banner */}
        {showDeleteConfirm && (
          <div className="mx-4 my-2 p-3 bg-rose-950/70 border border-rose-500/40 rounded-2xl flex items-center justify-between gap-3 text-xs animate-fade-in shadow-lg">
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
                  onClose();
                }}
                className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer transition-colors shadow-md"
              >
                {strings.postCard?.delete || 'Supprimer'}
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
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
              className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-700/80 space-y-3"
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

          {/* Post Title */}
          {post.title && !isEditing && (
            <h3 className="text-lg font-bold text-white font-display">
              {isPostTranslated && translatedTitle ? translatedTitle : post.title}
            </h3>
          )}

          {/* Media (Images & Videos with Video Player) right after title */}
          {post.media && post.media.length > 0 && (
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
              <div className="w-full h-64 sm:h-80 flex items-center justify-center overflow-hidden bg-black">
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
                    alt={post.title || "Publication média"}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {currentMediaIndex > 0 && (
                <button
                  onClick={handlePrevMedia}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              {currentMediaIndex < post.media.length - 1 && (
                <button
                  onClick={handleNextMedia}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Text Content */}
          <div className="space-y-2">
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {isPostTranslated && translatedContent ? translatedContent : post.content}
            </p>
            <div className="pt-0.5">
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

          {/* Tags */}
          {((isPostTranslated && translatedTags ? translatedTags : post.tags) || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(isPostTranslated && translatedTags ? translatedTags : post.tags)!.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-cyan-400 text-xs font-semibold border border-slate-800"
                >
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          )}

          {/* Reactions bar */}
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <button
              onClick={handleCourageClick}
              title={language === 'sw' ? 'Ujasiri' : language === 'en' ? 'Courage' : 'Courage'}
              className={`group flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isCouraged
                  ? 'bg-linear-to-r from-teal-500/25 to-cyan-500/25 text-teal-300 border border-teal-400/60 shadow-sm'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800'
              }`}
            >
              <HeartHandshake className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-extrabold text-teal-400/90 tracking-tight">
                {courageCount}
              </span>
              <span className="hidden group-hover:inline-block text-[11px] text-teal-300 font-semibold pl-0.5 animate-fade-in">
                {language === 'sw' ? 'Ujasiri' : language === 'en' ? 'Courage' : 'Courage'}
              </span>
            </button>

            <div className="flex items-center gap-2">
              <div
                title={strings.feed.comments}
                className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 font-semibold"
              >
                <MessageSquare className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-extrabold text-cyan-400/90 tracking-tight">
                  {post.comments?.length || post.commentsCount || 0}
                </span>
                <span className="hidden group-hover:inline-block text-[11px] text-cyan-300 font-semibold pl-0.5 animate-fade-in">
                  {strings.feed.comments}
                </span>
              </div>

              {/* Bookmark / Enregistrer Button */}
              <button
                type="button"
                onClick={handleSaveToggle}
                title={isSaved ? (strings.profileView?.savedPost || 'Enregistré (Retirer)') : (strings.profileView?.savePost || 'Enregistrer')}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSaved
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-sm'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'text-cyan-300 fill-cyan-300' : 'text-slate-400 group-hover:scale-110 transition-transform'}`} />
                <span className="text-[11px] font-semibold text-cyan-300">
                  {isSaved ? (strings.profileView?.savedPost || 'Enregistré') : (strings.profileView?.savePost || 'Enregistrer')}
                </span>
              </button>
            </div>
          </div>

          {/* Saved / Unsaved Toast */}
          {savedToast && (
            <div className="px-4 py-2 bg-cyan-950/80 border border-cyan-800/80 rounded-xl text-cyan-300 text-xs font-semibold text-center animate-fade-in">
              {savedToast}
            </div>
          )}

          {/* Responses Thread */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {language === 'sw'
                ? `Majibu ya jamii (${post.comments?.length || 0})`
                : language === 'en'
                ? `Community replies (${post.comments?.length || 0})`
                : `Réponses de la communauté (${post.comments?.length || 0})`}
            </h4>

            {(!post.comments || post.comments.length === 0) ? (
              <p className="text-xs text-slate-400 italic py-3 text-center">
                {language === 'sw'
                  ? 'Hakuna majibu kwa sasa.'
                  : language === 'en'
                  ? 'No replies yet.'
                  : 'Aucune réponse pour le moment.'}
              </p>
            ) : (
              <div className="space-y-2.5">
                {post.comments.map((comment) => {
                  const isCommentCurrentUser = Boolean(
                    currentUser &&
                      (comment.authorId === currentUser.id ||
                        comment.authorName === currentUser.name ||
                        comment.authorName === currentUser.pseudonym)
                  );
                  const isCommentAnon = Boolean(
                    comment.isAnonymous || (isCommentCurrentUser && currentUser?.isAnonymous)
                  );
                  const commentAuthorName = isCommentAnon ? strings.common.anonymous : comment.authorName;
                  const commentTrans = commentTranslations[comment.id];

                  return (
                    <div
                      key={comment.id}
                      className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3"
                    >
                      {isCommentAnon ? (
                        <div className="w-8 h-8 rounded-full bg-linear-to-tr from-cyan-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 border border-amber-400/40">
                          A
                        </div>
                      ) : (
                        <img
                          src={comment.authorAvatar}
                          alt={commentAuthorName}
                          className="w-8 h-8 rounded-full object-cover border border-cyan-400/60 shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs font-bold text-white">
                              {commentAuthorName}
                            </span>
                            {isCommentAnon && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold shrink-0">
                                {strings.common.anonymous}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500">{comment.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
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
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Reply Form */}
        <form onSubmit={handleSendComment} className="p-3 sm:p-4 border-t border-slate-800 bg-[#0d131f] flex items-center gap-2">
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
            className="px-5 py-2.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-950 font-extrabold text-xs transition-all shadow-md shadow-cyan-400/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{strings.feed.reply}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
