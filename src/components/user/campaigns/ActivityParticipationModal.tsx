import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  Camera,
  Film,
  FileText,
  Lock,
  Globe,
  CheckCircle2,
  Square,
  Sparkles,
  UserCheck,
  UserX,
  Upload,
  Trash2,
  Play,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Campaign, CampaignActivity, CampaignContribution, ContributionVisibility, UserProfile } from '../../../types';

interface ActivityParticipationModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  activity: CampaignActivity;
  currentUser?: UserProfile;
  initialContribution?: CampaignContribution | null;
  onSubmitContribution: (
    campaignId: string,
    activityId: string,
    contribution: Omit<CampaignContribution, 'id' | 'createdAt' | 'reactions' | 'commentsCount'>
  ) => void;
  onDeleteContribution?: (contributionId: string) => void;
  onEditContribution?: (
    contributionId: string,
    updatedData: {
      content: string;
      caption?: string;
      visibility: ContributionVisibility;
      mediaUrl?: string;
      mediaType?: 'text' | 'audio' | 'photo' | 'video' | 'interaction';
    }
  ) => void;
}

export const ActivityParticipationModal: React.FC<ActivityParticipationModalProps> = ({
  isOpen,
  onClose,
  campaign,
  activity,
  currentUser,
  initialContribution,
  onSubmitContribution,
  onDeleteContribution,
  onEditContribution,
}) => {
  const [selectedMediaType, setSelectedMediaType] = useState<'text' | 'audio' | 'photo' | 'video'>(
    activity.expectedOutput === 'video'
      ? 'video'
      : activity.expectedOutput === 'photo'
      ? 'photo'
      : activity.expectedOutput === 'audio'
      ? 'audio'
      : 'text'
  );

  const [textContent, setTextContent] = useState('');
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [hasRecordedAudio, setHasRecordedAudio] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const isGloballyAnonymous = Boolean(currentUser?.isAnonymous);
  const [visibility, setVisibility] = useState<ContributionVisibility>('campaign_members');
  const [isAnonymous, setIsAnonymous] = useState(isGloballyAnonymous);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const effectiveIsAnonymous = isAnonymous || isGloballyAnonymous;

  useEffect(() => {
    if (initialContribution) {
      setSelectedMediaType(
        (initialContribution.mediaType === 'interaction' ? 'text' : initialContribution.mediaType) || 'text'
      );
      setTextContent(initialContribution.content || '');
      setPhotoUrl(initialContribution.mediaType === 'photo' ? (initialContribution.mediaUrl || '') : '');
      setVideoUrl(initialContribution.mediaType === 'video' ? (initialContribution.mediaUrl || '') : '');
      setVisibility(initialContribution.visibility || 'campaign_members');
      setIsAnonymous(Boolean(initialContribution.isAnonymous));
    } else {
      setSelectedMediaType(
        activity.expectedOutput === 'video'
          ? 'video'
          : activity.expectedOutput === 'photo'
          ? 'photo'
          : activity.expectedOutput === 'audio'
          ? 'audio'
          : 'text'
      );
      setTextContent('');
      setPhotoUrl('');
      setVideoUrl('');
      setVisibility('campaign_members');
      setIsAnonymous(isGloballyAnonymous);
    }
    setShowDeleteConfirm(false);
  }, [isOpen, initialContribution, activity, isGloballyAnonymous]);

  const handlePhotoFile = (file: File) => {
    setIsUploadingMedia(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoUrl(e.target?.result as string);
      setIsUploadingMedia(false);
    };
    reader.onerror = () => setIsUploadingMedia(false);
    reader.readAsDataURL(file);
  };

  const handleVideoFile = (file: File) => {
    setIsUploadingMedia(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setVideoUrl(e.target?.result as string);
      setIsUploadingMedia(false);
    };
    reader.onerror = () => setIsUploadingMedia(false);
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isOpen) {
      setIsAnonymous(Boolean(currentUser?.isAnonymous));
    }
  }, [isOpen, currentUser?.isAnonymous]);

  useEffect(() => {
    let timer: any;
    if (isRecordingAudio) {
      timer = setInterval(() => {
        setAudioDuration((d) => d + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecordingAudio]);

  if (!isOpen) return null;

  const handleStopRecording = () => {
    setIsRecordingAudio(false);
    setHasRecordedAudio(true);
  };

  const handleStartRecording = () => {
    setAudioDuration(0);
    setIsRecordingAudio(true);
    setHasRecordedAudio(false);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const effectiveIsAnonymous = isAnonymous || isGloballyAnonymous;
    const authorName = effectiveIsAnonymous ? 'Anonyme' : currentUser?.name || 'Moi';
    const authorAvatar = effectiveIsAnonymous
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      : currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    const newContribData: Omit<CampaignContribution, 'id' | 'createdAt' | 'reactions' | 'commentsCount'> = {
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      activityId: activity.id,
      dayNumber: activity.dayNumber,
      activityTitle: activity.title.replace(/^Jour \d+\s*:\s*/, ''),
      authorId: currentUser?.id || 'me',
      authorName,
      authorAvatar,
      authorStatus: currentUser?.role === 'partner' ? 'mentor' : 'active_participant',
      isAnonymous: effectiveIsAnonymous,
      mediaType: selectedMediaType,
      content: textContent.trim() || (selectedMediaType === 'audio' ? 'Message vocal d’encouragement' : ''),
      mediaUrl:
        selectedMediaType === 'photo'
          ? (photoUrl || undefined)
          : selectedMediaType === 'video'
          ? (videoUrl || undefined)
          : undefined,
      audioDuration: selectedMediaType === 'audio' ? formatSeconds(audioDuration || 35) : undefined,
      visibility,
      comments: [],
    };

    if (initialContribution && onEditContribution) {
      setTimeout(() => {
        onEditContribution(initialContribution.id, {
          content: textContent.trim() || (selectedMediaType === 'audio' ? 'Message vocal d’encouragement' : ''),
          caption: textContent.trim(),
          visibility,
          mediaType: selectedMediaType,
          mediaUrl:
            selectedMediaType === 'photo'
              ? (photoUrl || undefined)
              : selectedMediaType === 'video'
              ? (videoUrl || undefined)
              : undefined,
        });
        setIsSubmitting(false);
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#10b981', '#fbbf24', '#a855f7'],
        });
        onClose();
      }, 300);
      return;
    }

    setTimeout(() => {
      onSubmitContribution(campaign.id, activity.id, newContribData);
      setIsSubmitting(false);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#10b981', '#fbbf24', '#a855f7'],
      });
      onClose();
    }, 300);
  };

  const isFormValid =
    (selectedMediaType === 'text' && textContent.trim().length > 0) ||
    (selectedMediaType === 'audio' && (hasRecordedAudio || textContent.trim().length > 0)) ||
    (selectedMediaType === 'photo' && (photoUrl.trim().length > 0 || textContent.trim().length > 0)) ||
    (selectedMediaType === 'video' && (videoUrl.trim().length > 0 || textContent.trim().length > 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b1329] border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Clean Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-cyan-500 text-slate-950 shrink-0">
              Jour {activity.dayNumber}
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-[220px] sm:max-w-xs">
              {initialContribution ? 'Modifier ma contribution' : activity.title.replace(/^Jour \d+\s*:\s*/, '')}
            </h2>
          </div>

          <button
            type="button"
            id="btn-close-contribution"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* Subtle Prompt Quote */}
          {activity.promptText && (
            <div className="px-3.5 py-2.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-200 italic">
              « {activity.promptText} »
            </div>
          )}

          {/* Text Area */}
          <div className="space-y-1">
            <textarea
              id="input-contribution-text"
              rows={4}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Partagez votre ressenti, votre pensée ou votre avancée..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400 leading-relaxed resize-none"
              autoFocus
            />
          </div>

          {/* Audio Input Component if Audio Selected */}
          {selectedMediaType === 'audio' && (
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${isRecordingAudio ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-800 text-cyan-400'}`}>
                  <Mic className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">
                    {isRecordingAudio ? `Enregistrement (${formatSeconds(audioDuration)})` : hasRecordedAudio ? `Message prêt (${formatSeconds(audioDuration || 35)})` : 'Prêt à enregistrer'}
                  </p>
                  <p className="text-[11px] text-slate-400">Micro ouvert pour votre partage</p>
                </div>
              </div>

              {isRecordingAudio ? (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Arrêter</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{hasRecordedAudio ? 'Réenregistrer' : 'Enregistrer'}</span>
                </button>
              )}
            </div>
          )}

          {/* Hidden inputs for device files */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handlePhotoFile(e.target.files[0]);
              e.target.value = '';
            }}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleVideoFile(e.target.files[0]);
              e.target.value = '';
            }}
          />

          {/* Photo Device Upload Component if Photo Selected */}
          {selectedMediaType === 'photo' && (
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              {photoUrl ? (
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden border border-cyan-500/40 bg-slate-950 max-h-52 flex items-center justify-center">
                    <img
                      src={photoUrl}
                      alt="Aperçu photo téléversée"
                      className="w-full max-h-52 object-contain"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-cyan-300 text-xs font-bold flex items-center gap-1 border border-cyan-500/30 cursor-pointer shadow-md"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Changer</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-rose-900/80 text-rose-300 text-xs border border-rose-500/30 cursor-pointer shadow-md"
                        title="Supprimer la photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-cyan-400/80 font-medium text-center">
                    ✓ Photo téléversée depuis votre appareil
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full py-6 px-4 rounded-2xl border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-slate-950/60 hover:bg-slate-950 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                      Téléverser une photo depuis votre appareil
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Appuyez pour ouvrir la galerie ou l’appareil photo
                    </p>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Video Device Upload Component if Video Selected */}
          {selectedMediaType === 'video' && (
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              {videoUrl ? (
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden border border-teal-500/40 bg-slate-950 max-h-52">
                    <video
                      src={videoUrl}
                      controls
                      playsInline
                      className="w-full max-h-52 object-contain bg-black"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-teal-300 text-xs font-bold flex items-center gap-1 border border-teal-500/30 cursor-pointer shadow-md"
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>Changer</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoUrl('')}
                        className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-rose-900/80 text-rose-300 text-xs border border-rose-500/30 cursor-pointer shadow-md"
                        title="Supprimer la vidéo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-teal-400/80 font-medium text-center">
                    ✓ Vidéo téléversée depuis votre appareil
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full py-6 px-4 rounded-2xl border-2 border-dashed border-teal-500/40 hover:border-teal-400 bg-slate-950/60 hover:bg-slate-950 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Film className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                      Téléverser une vidéo depuis votre appareil
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Appuyez pour choisir un fichier vidéo (MP4, MOV, WebM)
                    </p>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Media Format Selector Icons Row */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                title="Texte"
                onClick={() => setSelectedMediaType('text')}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  selectedMediaType === 'text'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Texte</span>
              </button>

              <button
                type="button"
                title="Vocal"
                onClick={() => setSelectedMediaType('audio')}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  selectedMediaType === 'audio'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span className="hidden sm:inline">Vocal</span>
              </button>

              <button
                type="button"
                title="Photo"
                onClick={() => setSelectedMediaType('photo')}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  selectedMediaType === 'photo'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Photo</span>
              </button>

              <button
                type="button"
                title="Vidéo"
                onClick={() => setSelectedMediaType('video')}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  selectedMediaType === 'video'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Film className="w-4 h-4" />
                <span className="hidden sm:inline">Vidéo</span>
              </button>
            </div>

            {/* Quick Anonymous Pill Toggle */}
            <button
              type="button"
              onClick={() => {
                if (!isGloballyAnonymous) {
                  setIsAnonymous(!isAnonymous);
                }
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                effectiveIsAnonymous
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer'
              } ${isGloballyAnonymous ? 'cursor-default' : 'cursor-pointer'}`}
              title={isGloballyAnonymous ? 'Mode anonymat activé dans vos paramètres de profil' : undefined}
            >
              {effectiveIsAnonymous ? <UserX className="w-3.5 h-3.5 text-amber-300" /> : <UserCheck className="w-3.5 h-3.5" />}
              <span>{effectiveIsAnonymous ? 'Anonyme' : 'Public'}</span>
              {isGloballyAnonymous && <Lock className="w-2.5 h-2.5 text-amber-400" />}
            </button>
          </div>

          {/* Quick Visibility Setting */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Visibilité :</span>
            </span>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as ContributionVisibility)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
            >
              <option value="campaign_members">Participants du parcours</option>
              <option value="community_members">Toute la communauté</option>
              <option value="private">Privé (Moi seul)</option>
            </select>
          </div>

          {/* Delete Confirmation Banner inside modal */}
          {showDeleteConfirm && (
            <div className="p-3 bg-rose-950/70 border border-rose-500/40 rounded-2xl flex items-center justify-between gap-3 text-xs animate-fade-in shadow-lg">
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
                    if (initialContribution && onDeleteContribution) {
                      onDeleteContribution(initialContribution.id);
                    }
                    onClose();
                  }}
                  className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer transition-colors shadow-md"
                >
                  Supprimer
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            {initialContribution && onDeleteContribution && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                title="Supprimer la contribution"
                className="py-3 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Supprimer</span>
              </button>
            )}
            <button
              type="submit"
              id="btn-submit-contribution"
              disabled={isSubmitting || !isFormValid}
              className="flex-1 py-3 px-5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-950 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-cyan-400/20 transition-all active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Enregistrement...'
                  : initialContribution
                  ? 'Enregistrer les modifications'
                  : 'Publier ma contribution'}
              </span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
