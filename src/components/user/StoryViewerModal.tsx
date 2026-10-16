import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Handshake,
  HeartHandshake,
  Sprout,
  Award,
  Send,
  MessageSquare,
  Bookmark,
  Flag,
  Volume2,
  VolumeX,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Language, StoryTestimonial, UserProfile } from '../../types';
import { t } from '../../translations';

interface StoryViewerModalProps {
  stories?: StoryTestimonial[];
  story?: StoryTestimonial;
  initialIndex?: number;
  currentUser?: UserProfile;
  language?: Language;
  onClose: () => void;
  onOpenUserProfile?: (userId: string) => void;
  onStartMessage?: (userId: string) => void;
  onToggleFeatured?: (storyId: string) => void;
  onReact?: (storyId: string, reaction: 'support' | 'understand' | 'courage' | 'bravo') => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  stories,
  story,
  initialIndex = 0,
  currentUser,
  language = 'fr',
  onClose,
  onOpenUserProfile,
  onStartMessage,
  onToggleFeatured,
  onReact,
}) => {
  const effectiveStories = (stories && stories.length > 0)
    ? stories
    : (story ? [story] : []);

  const startingIndex = Math.min(
    Math.max(0, initialIndex ?? (story ? effectiveStories.findIndex((s) => s.id === story.id) : 0)),
    Math.max(0, effectiveStories.length - 1)
  );

  const [currentIndex, setCurrentIndex] = useState(startingIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [reactionGiven, setReactionGiven] = useState<string | null>(null);

  const currentStory = effectiveStories[currentIndex] || effectiveStories[0];
  const duration = 6000; // 6 seconds per story

  useEffect(() => {
    setProgress(0);
    setReactionGiven(null);
  }, [currentIndex]);

  useEffect(() => {
    if (isPaused || effectiveStories.length === 0) return;

    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < effectiveStories.length - 1) {
            setCurrentIndex((i) => i + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, effectiveStories.length, onClose]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < effectiveStories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onClose();
    }
  };

  const handleReaction = (type: 'support' | 'understand' | 'courage' | 'bravo') => {
    setReactionGiven(type);
    if (currentStory && onReact) {
      onReact(currentStory.id, type);
    }
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#06b6d4', '#10b981', '#f43f5e', '#fbbf24'],
    });
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentStory) return;
    if (onStartMessage) {
      onStartMessage(currentStory.authorId);
    }
    setReplyText('');
    onClose();
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4">
      
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
        aria-label="Fermer"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Container */}
      <div
        className="relative w-full max-w-md h-[88vh] sm:h-[84vh] bg-[#111827] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between select-none"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Background Visual Layer */}
        {((currentStory.type as string) === 'video' ||
          (currentStory.mediaUrl &&
            (currentStory.mediaUrl.startsWith('data:video') ||
              currentStory.mediaUrl.endsWith('.mp4') ||
              currentStory.mediaUrl.endsWith('.webm')))) &&
        currentStory.mediaUrl ? (
          <video
            src={currentStory.mediaUrl}
            autoPlay
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover brightness-90"
          />
        ) : currentStory.type === 'photo' && currentStory.mediaUrl ? (
          <img
            src={currentStory.mediaUrl}
            alt={currentStory.caption}
            className="absolute inset-0 w-full h-full object-cover brightness-75"
          />
        ) : null}

        {currentStory.type === 'text' && (
          <div className="absolute inset-0 bg-linear-to-b from-slate-900 via-[#182231] to-slate-950 flex items-center justify-center p-8 text-center" />
        )}

        {currentStory.type === 'audio' && (
          <div className="absolute inset-0 bg-linear-to-br from-cyan-950 via-[#111827] to-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 animate-pulse">
              <Volume2 className="w-10 h-10" />
            </div>
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Témoignage Audio ({currentStory.audioDuration || '0:45'})
            </div>
            {/* Waveform graphic */}
            <div className="flex items-center gap-1.5 h-12">
              {[40, 65, 80, 50, 90, 70, 45, 85, 95, 60, 75, 40, 90, 55, 30].map((h, idx) => (
                <div
                  key={idx}
                  style={{ height: `${h}%` }}
                  className="w-1.5 bg-cyan-400 rounded-full animate-pulse"
                />
              ))}
            </div>
          </div>
        )}

        {/* Gradient overlays for readibility */}
        <div className="absolute inset-0 bg-linear-to-b from-slate-950/80 via-transparent to-slate-950/90 pointer-events-none" />

        {/* TOP CONTROLS */}
        <div className="relative z-20 p-4 space-y-3">
          
          {/* Progress Indicators Bar */}
          <div className="flex items-center gap-1.5 w-full">
            {stories.map((s, idx) => {
              let fillPercent = 0;
              if (idx < currentIndex) fillPercent = 100;
              if (idx === currentIndex) fillPercent = progress;
              return (
                <div key={s.id} className="flex-1 bg-white/20 h-1 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${fillPercent}%` }}
                    className="bg-cyan-400 h-full transition-all duration-75"
                  />
                </div>
              );
            })}
          </div>

          {/* Author Header */}
          <div className="flex items-center justify-between">
            <div
              onClick={() => onOpenUserProfile(currentStory.authorId)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <img
                src={currentStory.authorAvatar}
                alt={currentStory.authorName}
                className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400 shadow-md group-hover:scale-105 transition-transform"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white group-hover:text-cyan-300">
                    {currentStory.authorName}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                    {currentStory.communityName}
                  </span>
                </div>
                <span className="text-[11px] text-slate-300">
                  {currentStory.timestamp}
                </span>
              </div>
            </div>

            {/* Top Right Story Actions */}
            <div className="flex items-center gap-2">
              {currentStory.authorId === currentUser.id && (
                <button
                  onClick={() => onToggleFeatured(currentStory.id)}
                  title="Ajouter à la une de mon profil"
                  className={`p-2 rounded-full border transition-all ${
                    currentStory.isFeaturedOnProfile
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-900/60 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => onStartMessage(currentStory.authorId)}
                title="Message privé"
                className="p-2 rounded-full bg-slate-900/60 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* TAP ZONES FOR PREVIOUS / NEXT */}
        <div className="absolute inset-y-24 inset-x-0 flex z-10">
          <div
            onClick={handlePrev}
            className="w-1/3 h-full cursor-pointer opacity-0 hover:opacity-100 flex items-center pl-2 transition-opacity"
          >
            {currentIndex > 0 && (
              <ChevronLeft className="w-8 h-8 text-white/70 bg-slate-950/40 rounded-full p-1" />
            )}
          </div>
          <div className="w-1/3 h-full" />
          <div
            onClick={handleNext}
            className="w-1/3 h-full cursor-pointer opacity-0 hover:opacity-100 flex items-center justify-end pr-2 transition-opacity"
          >
            <ChevronRight className="w-8 h-8 text-white/70 bg-slate-950/40 rounded-full p-1" />
          </div>
        </div>

        {/* BOTTOM CONTENT & INTERACTIONS */}
        <div className="relative z-20 p-5 space-y-4">
          
          {/* Caption text */}
          <div className="bg-slate-950/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80">
            <p className="text-sm sm:text-base text-white leading-relaxed font-medium">
              "{currentStory.caption}"
            </p>
          </div>

          {/* Supportive Reactions Bar */}
          <div className="flex items-center justify-center gap-3 px-1">
            <button
              onClick={() => handleReaction('courage')}
              title={t[language]?.reactions?.courage || 'Courage'}
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                reactionGiven === 'courage'
                  ? 'bg-linear-to-r from-teal-500 to-cyan-500 text-slate-950 scale-105 shadow-md shadow-teal-500/20'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-teal-300 border border-slate-700/60'
              }`}
            >
              <HeartHandshake className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-extrabold tracking-tight">
                {(currentStory.reactions?.courage || 0) + (reactionGiven === 'courage' ? 1 : 0)}
              </span>
              <span className="hidden group-hover:inline-block text-[11px] text-teal-300 font-semibold pl-0.5 animate-fade-in">
                {t[language]?.reactions?.courage || 'Courage'}
              </span>
            </button>

            <button
              onClick={() => handleReaction('support')}
              title={t[language]?.reactions?.support || 'Soutien'}
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                reactionGiven === 'support'
                  ? 'bg-rose-500 text-white scale-105 shadow-md shadow-rose-500/20'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-rose-400 border border-slate-700/60'
              }`}
            >
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-extrabold tracking-tight">
                {(currentStory.reactions?.support || 0) + (reactionGiven === 'support' ? 1 : 0)}
              </span>
              <span className="hidden group-hover:inline-block text-[11px] text-rose-300 font-semibold pl-0.5 animate-fade-in">
                {t[language]?.reactions?.support || 'Soutien'}
              </span>
            </button>

            <button
              onClick={() => handleReaction('understand')}
              title={t[language]?.reactions?.understand || 'Je comprends'}
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                reactionGiven === 'understand'
                  ? 'bg-cyan-500 text-slate-950 scale-105 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-slate-700/60'
              }`}
            >
              <Handshake className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-extrabold tracking-tight">
                {(currentStory.reactions?.understand || 0) + (reactionGiven === 'understand' ? 1 : 0)}
              </span>
              <span className="hidden group-hover:inline-block text-[11px] text-cyan-300 font-semibold pl-0.5 animate-fade-in">
                {t[language]?.reactions?.understand || 'Je comprends'}
              </span>
            </button>
          </div>

          {/* Quick Reply Form */}
          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={t[language]?.story?.replyPlaceholder || 'Envoyer un mot de réconfort...'}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-white placeholder:text-slate-400 focus:outline-hidden focus:border-cyan-400"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-transform active:scale-95 cursor-pointer"
              title={t[language]?.story?.send || 'Envoyer'}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
