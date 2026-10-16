import React, { useState, useRef, useEffect } from 'react';
import {
  HeartHandshake,
  MessageSquare,
  Volume2,
  VolumeX,
  Lock,
  Users,
  Eye,
  Send,
  Film,
  Camera,
  Mic,
  Flag,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Pencil,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CampaignContribution, UserProfile, MemberStatus, Language } from '../../../types';
import { TranslateButton } from '../../common/TranslateButton';

interface CampaignWallCardProps {
  contribution: CampaignContribution;
  currentUser?: UserProfile;
  language?: Language;
  onReaction?: (contributionId: string, reactionType: string) => void;
  onAddComment?: (contributionId: string, text: string) => void;
  onReport?: (contributionId: string) => void;
  onDeleteContribution?: (contributionId: string) => void;
  onEditContribution?: (
    contributionId: string,
    updatedData: {
      content: string;
      caption?: string;
      visibility: 'campaign_members' | 'community_members' | 'private';
    }
  ) => void;
}

export const CampaignWallCard: React.FC<CampaignWallCardProps> = ({
  contribution,
  currentUser,
  language = 'fr',
  onReaction,
  onAddComment,
  onReport,
  onDeleteContribution,
  onEditContribution,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [localComments, setLocalComments] = useState(contribution.comments || []);
  const [isSaved, setIsSaved] = useState(false);
  const [reportedToast, setReportedToast] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Dynamic Content Translation States
  const [isContribTranslated, setIsContribTranslated] = useState(false);
  const [translatedActivityTitle, setTranslatedActivityTitle] = useState<string | null>(null);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [translatedCaption, setTranslatedCaption] = useState<string | null>(null);
  const [commentTranslations, setCommentTranslations] = useState<Record<string, { translated: boolean; text: string }>>({});

  useEffect(() => {
    setIsContribTranslated(false);
    setTranslatedActivityTitle(null);
    setTranslatedContent(null);
    setTranslatedCaption(null);
  }, [language, contribution.id]);

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

  // Edit & Delete states
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentContent, setCurrentContent] = useState(contribution.content);
  const [currentCaption, setCurrentCaption] = useState(contribution.caption || '');
  const [currentVisibility, setCurrentVisibility] = useState(contribution.visibility);
  const [editContent, setEditContent] = useState(contribution.content);
  const [editCaption, setEditCaption] = useState(contribution.caption || '');
  const [editVisibility, setEditVisibility] = useState(contribution.visibility);

  // Reaction state aligned with the feed's Courage button
  const initialCourageCount =
    (contribution.reactions?.courage ?? 0) ||
    (contribution.reactions?.support ?? 0) ||
    1;
  const [courageCount, setCourageCount] = useState(initialCourageCount);
  const [isCouraged, setIsCouraged] = useState(
    contribution.userReaction === 'courage' || contribution.userReaction === 'support'
  );

  const statusBadges: Record<MemberStatus, { label: string; color: string; icon: string }> = {
    new_member: { label: 'Nouveau Membre', color: 'bg-slate-800 text-slate-300 border-slate-700', icon: '🌱' },
    member: { label: 'Membre', color: 'bg-slate-800 text-slate-300 border-slate-700', icon: '🌱' },
    active_participant: { label: 'Participant', color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30', icon: '🤝' },
    contributor: { label: 'Contributeur', color: 'bg-teal-500/10 text-teal-300 border-teal-500/30', icon: '⭐' },
    ambassador: { label: 'Ambassadeur', color: 'bg-amber-500/10 text-amber-300 border-amber-500/30', icon: '🫂' },
    mentor: { label: 'Mentor', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', icon: '🌍' },
  };

  const isAuthorCurrentUser = Boolean(
    currentUser &&
      (contribution.authorId === currentUser.id ||
        contribution.authorName === currentUser.name ||
        contribution.authorName === currentUser.pseudonym)
  );
  const isEffectivelyAnonymous = Boolean(
    contribution.isAnonymous || (isAuthorCurrentUser && currentUser?.isAnonymous)
  );
  const displayedAuthorName = isEffectivelyAnonymous ? 'Anonyme' : contribution.authorName;
  const authorInitial = isEffectivelyAnonymous ? 'A' : (contribution.authorName?.charAt(0).toUpperCase() || 'M');
  const currentBadge = statusBadges[contribution.authorStatus] || statusBadges.member;

  const handleCourageClick = () => {
    if (isCouraged) {
      setIsCouraged(false);
      setCourageCount((prev) => Math.max(0, prev - 1));
    } else {
      setIsCouraged(true);
      setCourageCount((prev) => prev + 1);
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.8 },
        colors: ['#06b6d4', '#14b8a6', '#10b981', '#38bdf8'],
      });
    }

    if (onReaction) {
      onReaction(contribution.id, 'courage');
    }
  };

  const handleReportClick = () => {
    if (onReport) onReport(contribution.id);
    setReportedToast(true);
    setTimeout(() => setReportedToast(false), 2500);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const newComment = {
      id: `cc-${Date.now()}`,
      authorId: currentUser?.id || 'me',
      authorName: currentUser?.name || 'Moi',
      authorAvatar:
        currentUser?.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      content: commentInput.trim(),
      timestamp: 'À l’instant',
    };

    setLocalComments((prev) => [...prev, newComment]);
    setCommentInput('');

    if (onAddComment) {
      onAddComment(contribution.id, newComment.content);
    }
  };

  const toggleAudio = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        const textTitle = (isContribTranslated && translatedActivityTitle ? translatedActivityTitle : contribution.activityTitle) || '';
        const textBody = (isContribTranslated && translatedContent ? translatedContent : currentContent) || '';
        const textToRead = `${textTitle ? textTitle + '. ' : ''}${textBody}`;
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = language === 'sw' ? 'sw' : language === 'en' ? 'en-US' : language === 'pt' ? 'pt-PT' : language === 'ar' ? 'ar-SA' : 'fr-FR';
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    }
  };

  return (
    <article
      id={`campaign-contrib-${contribution.id}`}
      className="w-full bg-[#111827] rounded-3xl border border-slate-800/90 shadow-xl overflow-hidden transition-all hover:border-slate-700/80"
    >
      {/* 1. HEADER: Author info & Top Right Controls (Matching feed PostCard) */}
      <div className="p-4 sm:p-5 pb-3 flex items-start justify-between gap-3">
        {/* Author Avatar + Name + Day Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-linear-to-tr from-cyan-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shrink-0 overflow-hidden ring-2 ring-cyan-500/40">
            {isEffectivelyAnonymous ? (
              <span className="text-xs font-bold text-slate-200">A</span>
            ) : (
              <img
                src={contribution.authorAvatar}
                alt={displayedAuthorName}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm sm:text-base truncate">
                {displayedAuthorName}
              </span>

              {!isEffectivelyAnonymous && (
                <span
                  className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${currentBadge.color} shrink-0`}
                >
                  {currentBadge.icon} {currentBadge.label}
                </span>
              )}

              {isEffectivelyAnonymous && (
                <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30 shrink-0">
                  Anonyme
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-semibold mt-0.5 truncate">
              <span className="truncate">Jour {contribution.dayNumber} : {contribution.activityTitle}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 font-normal shrink-0">{contribution.createdAt}</span>
            </div>
          </div>
        </div>

        {/* Top Right Controls: Read Aloud + Visibility Tag + Bookmark */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Read Aloud */}
          <button
            onClick={toggleAudio}
            title={isPlayingAudio ? 'Arrêter la lecture' : 'Écouter la publication'}
            className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isPlayingAudio
                ? 'bg-teal-500/20 border-teal-400 text-teal-300 animate-pulse'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-300'
            }`}
          >
            {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Visibility indicator tag */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
            {currentVisibility === 'campaign_members' && (
              <>
                <Users className="w-3 h-3 text-cyan-400" />
                <span>Participants</span>
              </>
            )}
            {currentVisibility === 'community_members' && (
              <>
                <Eye className="w-3 h-3 text-emerald-400" />
                <span>Communauté</span>
              </>
            )}
            {currentVisibility === 'private' && (
              <>
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Privé</span>
              </>
            )}
          </div>

          {/* Options Menu (Trois points: Enregistrer, Modifier, Supprimer, etc.) */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              title="Options de la contribution"
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
                      setIsSaved(!isSaved);
                      setShowMenu(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer"
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? 'text-cyan-400 fill-cyan-400' : 'text-slate-400'}`} />
                    <span>{isSaved ? 'Enregistré (Retirer)' : 'Enregistrer'}</span>
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
                      <span>{isEditing ? 'Fermer la modification' : 'Modifier'}</span>
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
                      <span>Supprimer</span>
                    </button>
                  </div>
                )}

                {/* Option Signaler (si pas auteur) */}
                {!isAuthorCurrentUser && onReport && (
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
                      <span>Signaler la publication</span>
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
            Supprimer définitivement cette contribution ?
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 font-bold cursor-pointer transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                if (onDeleteContribution) onDeleteContribution(contribution.id);
                setShowDeleteConfirm(false);
              }}
              className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer transition-colors shadow-md"
            >
              Supprimer
            </button>
          </div>
        </div>
      )}

      {/* Inline Edit Form */}
      {isEditing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!editContent.trim()) return;
            const updated = {
              content: editContent.trim(),
              caption: editCaption.trim(),
              visibility: editVisibility,
            };
            setCurrentContent(updated.content);
            setCurrentCaption(updated.caption);
            setCurrentVisibility(updated.visibility);
            if (onEditContribution) {
              onEditContribution(contribution.id, updated);
            }
            setIsEditing(false);
          }}
          className="px-4 sm:px-5 pb-4 space-y-3 bg-slate-900/40 border-y border-slate-800/80 pt-3"
        >
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-cyan-300">Texte de la contribution</label>
            <textarea
              rows={3}
              required
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400 resize-none leading-relaxed"
              placeholder="Modifier votre texte de contribution..."
            />
          </div>

          {(contribution.mediaType === 'photo' || contribution.mediaType === 'video' || editCaption) && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Légende du média</label>
              <input
                type="text"
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400"
                placeholder="Légende ou note..."
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400">Visibilité</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setEditVisibility('campaign_members')}
                className={`p-2 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  editVisibility === 'campaign_members'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span className="truncate">Participants</span>
              </button>
              <button
                type="button"
                onClick={() => setEditVisibility('community_members')}
                className={`p-2 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  editVisibility === 'community_members'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="truncate">Communauté</span>
              </button>
              <button
                type="button"
                onClick={() => setEditVisibility('private')}
                className={`p-2 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  editVisibility === 'private'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="truncate">Privé</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setEditContent(currentContent);
                setEditCaption(currentCaption);
                setEditVisibility(currentVisibility);
                setIsEditing(false);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!editContent.trim()}
              className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-40"
            >
              Enregistrer
            </button>
          </div>
        </form>
      )}

      {/* 2. TITLE / ACTIVITY TITLE (placed right before media) */}
      {contribution.activityTitle && (
        <div className="px-4 sm:px-5 pb-2">
          <h3 className="text-base sm:text-lg font-bold text-white font-display leading-snug">
            {isContribTranslated && translatedActivityTitle
              ? translatedActivityTitle
              : contribution.activityTitle}
          </h3>
        </div>
      )}

      {/* 3. MEDIA (Photos, Videos, Audios) - PLACED DIRECTLY AFTER TITLE */}
      {contribution.mediaUrl && (contribution.mediaType === 'photo' || contribution.mediaType === 'video') && (
        <div className="px-4 sm:px-5 pb-3">
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 select-none shadow-md group">
            {contribution.mediaType === 'photo' ? (
              <div className="w-full h-64 sm:h-80 md:h-96 relative flex items-center justify-center overflow-hidden">
                <img
                  src={contribution.mediaUrl}
                  alt="Partage photo"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden bg-black flex items-center justify-center">
                <video
                  src={contribution.mediaUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain bg-black"
                />
              </div>
            )}
            {(isContribTranslated && translatedCaption ? translatedCaption : currentCaption) && (
              <div className="p-2.5 bg-slate-950/90 text-xs text-slate-300 italic border-t border-slate-800">
                {isContribTranslated && translatedCaption ? translatedCaption : currentCaption}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audio Capsule Player if mediaType is audio */}
      {contribution.mediaType === 'audio' && (
        <div className="px-4 sm:px-5 pb-3">
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className="w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-md shadow-cyan-500/20"
              >
                {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Capsule vocale</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {isPlayingAudio ? 'Lecture en cours...' : contribution.audioDuration || '0:45'}
                </span>
              </div>
            </div>
            {/* Ambient waveform illustration */}
            <div className="flex items-center gap-1">
              {[4, 12, 8, 16, 20, 14, 8, 18, 10, 6, 14, 8].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}px` }}
                  className={`w-1 rounded-full transition-all duration-300 ${
                    isPlayingAudio ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. TEXT CONTENT - PLACED BELOW THE MEDIA */}
      {currentContent && !isEditing && (
        <div className="px-4 sm:px-5 pb-3 space-y-2">
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
            {isContribTranslated && translatedContent ? translatedContent : currentContent}
          </p>
          <div className="pt-0.5">
            <TranslateButton
              originalPost={{
                title: contribution.activityTitle,
                content: currentContent,
                objective: currentCaption,
              }}
              targetLanguage={language}
              onTogglePostTranslation={(active, trans) => {
                setIsContribTranslated(active);
                setTranslatedActivityTitle(trans.title || null);
                setTranslatedContent(trans.content || null);
                setTranslatedCaption(trans.objective || null);
              }}
            />
          </div>
        </div>
      )}

      {/* 5. REACTIONS BAR: COURAGE + RÉPONSES on left, SIGNALER on the OPPOSITE side (Strictly identical to Feed PostCard) */}
      <div className="px-4 sm:px-5 py-2.5 bg-[#0d131f] border-t border-slate-800/80 flex items-center justify-between gap-3">
        {/* Left Side: Courage & Réponses */}
        <div className="flex items-center gap-2">
          {/* COURAGE BUTTON with HeartHandshake icon */}
          <button
            id={`btn-courage-${contribution.id}`}
            onClick={handleCourageClick}
            title="Courage"
            className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              isCouraged
                ? 'bg-linear-to-r from-teal-500/25 to-cyan-500/25 text-teal-300 border border-teal-400/60 shadow-md shadow-teal-500/20'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-teal-300 border border-slate-800'
            }`}
          >
            <HeartHandshake
              className={`w-4 h-4 ${
                isCouraged ? 'text-teal-300 stroke-[2.5]' : 'text-teal-400 group-hover:scale-110 transition-transform'
              }`}
            />
            <span className="text-[11px] font-extrabold text-teal-400/90 tracking-tight">
              {courageCount}
            </span>
            <span className="hidden group-hover:inline-block text-[11px] text-teal-300 font-semibold pl-0.5 animate-fade-in transition-all">
              Courage
            </span>
          </button>

          {/* RÉPONSES BUTTON */}
          <button
            onClick={() => setShowComments(!showComments)}
            title="Réponses"
            className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-cyan-300 border border-slate-800 text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            <MessageSquare className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-extrabold text-cyan-400/90 tracking-tight">
              {localComments.length}
            </span>
            <span className="hidden group-hover:inline-block text-[11px] text-cyan-300 font-semibold pl-0.5 animate-fade-in transition-all">
              Réponses
            </span>
          </button>
        </div>

        {/* Right Side (Opposite): SIGNALER */}
        <button
          onClick={handleReportClick}
          title="Signaler cette publication"
          className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-slate-900/60 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800/80 hover:border-rose-800/60 text-xs font-semibold transition-colors cursor-pointer"
        >
          <Flag className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span className="hidden group-hover:inline-block text-[11px] text-rose-300 font-semibold pl-0.5 animate-fade-in">
            Signaler
          </span>
        </button>
      </div>

      {/* Reported Toast Feedback */}
      {reportedToast && (
        <div className="px-4 py-2 bg-rose-950/80 border-t border-rose-800/80 text-rose-300 text-xs font-semibold text-center animate-fade-in">
          Publication signalée aux modérateurs avec succès.
        </div>
      )}

      {/* 6. COMMENTS / RESPONSES DRAWER */}
      {showComments && (
        <div className="p-4 sm:p-5 bg-slate-950/90 border-t border-slate-800/90 space-y-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
            <span>Réponses de la communauté ({localComments.length})</span>
          </div>

          {/* Comments list */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {localComments.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center">
                Aucune réponse pour le moment. Soyez le premier à apporter votre éclairage ou votre courage !
              </p>
            ) : (
              localComments.map((comment) => {
                const isCommentAuthorCurrentUser = Boolean(
                  currentUser &&
                    (comment.authorId === currentUser.id ||
                      comment.authorName === currentUser.name ||
                      comment.authorName === currentUser.pseudonym)
                );
                const isCommentAnon = Boolean(
                  comment.isAnonymous || (isCommentAuthorCurrentUser && currentUser?.isAnonymous)
                );
                const commentAuthorName = isCommentAnon ? 'Anonyme' : comment.authorName;

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
                        className="w-8 h-8 rounded-full object-cover border border-cyan-400/60 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-xs font-bold text-white truncate">
                            {commentAuthorName}
                          </span>
                          {isCommentAnon && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold shrink-0">
                              Anonyme
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">{comment.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                        {commentTranslations[comment.id]?.translated
                          ? commentTranslations[comment.id].text
                          : comment.content}
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
          <form onSubmit={handleSendComment} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Apporter votre réponse ou mot de soutien..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={!commentInput.trim()}
              className="px-4 py-2.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-950 text-xs font-extrabold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-md shadow-cyan-400/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Répondre</span>
            </button>
          </form>
        </div>
      )}
    </article>
  );
};
