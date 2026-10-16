import React, { useState, useRef } from 'react';
import {
  X,
  Image,
  Video,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Hash,
  Upload,
  Camera,
  Film,
  Play,
} from 'lucide-react';
import { Community, UserProfile, PostMedia, Language } from '../../types';
import { t } from '../../translations';
import { uploadMediaToCloudinary } from '../../services/cloudinaryService';

interface CreatePostModalProps {
  currentUser: UserProfile;
  userCommunities?: Community[];
  communities?: Community[];
  language?: Language;
  onClose: () => void;
  onSubmitPost?: (postData: {
    communityId: string;
    type: 'question' | 'discussion' | 'testimony';
    title: string;
    content: string;
    tags: string[];
    isAnonymous: boolean;
    media: PostMedia[];
  }) => void;
  onCreatePost?: (postData: any) => void;
  onSubmitStory?: (storyData: {
    communityId: string;
    type: 'photo' | 'audio' | 'text';
    caption: string;
    mediaUrl?: string;
  }) => void;
  onCreateStory?: (storyData: any) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  currentUser,
  userCommunities,
  communities,
  language = 'fr',
  onClose,
  onSubmitPost,
  onCreatePost,
  onSubmitStory,
  onCreateStory,
}) => {
  const strings = t[language] || t.fr;
  const availableCommunities =
    userCommunities && userCommunities.length > 0
      ? userCommunities
      : communities && communities.length > 0
      ? communities
      : [];

  const isGloballyAnonymous = Boolean(currentUser?.isAnonymous);
  const [publishType, setPublishType] = useState<'question' | 'story'>('question');
  const [selectedCommunityId, setSelectedCommunityId] = useState(
    availableCommunities[0]?.id || ''
  );
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(isGloballyAnonymous);
  const [uploadedMedia, setUploadedMedia] = useState<PostMedia[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    const fileList = Array.from(files);

    for (const file of fileList) {
      const isVideo = file.type.startsWith('video');
      const mediaType = isVideo ? ('video' as const) : ('image' as const);

      try {
        // Envoi vers Cloudinary via le service unifié
        const result = await uploadMediaToCloudinary(file, 'image', 'posts');
        setUploadedMedia((prev) => [
          ...prev,
          {
            id: result.publicId || `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            type: mediaType,
            url: result.url,
          },
        ]);
      } catch (err) {
        console.warn('Fallback direct data URL:', err);
        const reader = new FileReader();
        reader.onload = (event) => {
          const resultUrl = event.target?.result as string;
          if (resultUrl) {
            setUploadedMedia((prev) => [
              ...prev,
              {
                id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                type: mediaType,
                url: resultUrl,
              },
            ]);
          }
        };
        reader.readAsDataURL(file);
      }
    }

    setIsUploading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && uploadedMedia.length === 0) return;

    if (publishType === 'story') {
      const firstMedia = uploadedMedia[0];
      const storyType = firstMedia
        ? firstMedia.type === 'video'
          ? ('video' as const)
          : ('photo' as const)
        : ('text' as const);

      const storyPayload = {
        communityId: selectedCommunityId || availableCommunities[0]?.id || 'comm-drepano',
        type: storyType,
        caption: content.trim(),
        mediaUrl: firstMedia?.url,
      };
      if (onSubmitStory) onSubmitStory(storyPayload);
      if (onCreateStory) onCreateStory(storyPayload);
    } else {
      const tags = tagsInput
        .split(/[ ,#]+/)
        .filter(Boolean)
        .map((t) => (t.startsWith('#') ? t : `#${t}`));

      const postPayload = {
        communityId: selectedCommunityId || availableCommunities[0]?.id || 'comm-drepano',
        type: 'question' as const,
        title: title.trim(),
        content: content.trim(),
        tags: tags.length > 0 ? tags : ['#question', '#santé'],
        isAnonymous,
        media: uploadedMedia,
      };
      if (onSubmitPost) onSubmitPost(postPayload);
      if (onCreatePost) onCreatePost(postPayload);
    }
    onClose();
  };

  const currentCommunity =
    availableCommunities.find((c) => c.id === selectedCommunityId) ||
    availableCommunities[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4">
      <div className="w-full sm:max-w-lg bg-[#0e1624] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]">
        
        {/* Header with Type Toggle */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          {/* Segmented Control */}
          <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setPublishType('question')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                publishType === 'question'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {strings.createPost?.askQuestionTab || 'Question'}
            </button>
            <button
              type="button"
              onClick={() => setPublishType('story')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                publishType === 'story'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {strings.createPost?.shareStoryTab || 'Témoignage'}
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label={strings.common?.close || "Fermer"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Composer Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-4 space-y-3.5">
            
            {/* User Info & Community selector */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <img
                  src={
                    isAnonymous
                      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                      : currentUser.avatar
                  }
                  alt={currentUser.name}
                  className={`w-9 h-9 rounded-full object-cover border ${
                    isAnonymous ? 'border-amber-400/80 opacity-80' : 'border-cyan-400/80'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">
                      {isAnonymous ? strings.common?.anonymous || 'Membre Anonyme' : currentUser.name}
                    </span>
                    {isAnonymous && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                        {strings.common?.anonymous || 'Secret'}
                      </span>
                    )}
                  </div>

                  {/* Community dropdown chip */}
                  <div className="flex items-center gap-1 text-[10px] text-cyan-400/90 font-medium">
                    <Lock className="w-2.5 h-2.5 shrink-0" />
                    <select
                      value={selectedCommunityId}
                      onChange={(e) => setSelectedCommunityId(e.target.value)}
                      className="bg-transparent border-none text-[11px] text-cyan-400 font-medium focus:outline-hidden cursor-pointer"
                    >
                      {availableCommunities.map((c) => (
                        <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Anonymous quick switch (for question) */}
              {publishType === 'question' && (
                <button
                  type="button"
                  onClick={() => {
                    if (!isGloballyAnonymous) {
                      setIsAnonymous(!isAnonymous);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                    isAnonymous || isGloballyAnonymous
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer'
                  } ${isGloballyAnonymous ? 'cursor-default' : 'cursor-pointer'}`}
                  title={isGloballyAnonymous ? (strings.createPost?.anonymousHelp || 'Mode anonymat activé') : undefined}
                >
                  {isAnonymous || isGloballyAnonymous ? (
                    <EyeOff className="w-3 h-3 text-amber-300" />
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                  <span>{isAnonymous || isGloballyAnonymous ? (strings.common?.anonymous || 'Anonyme') : 'Public'}</span>
                  {isGloballyAnonymous && (
                    <Lock className="w-2.5 h-2.5 text-amber-400" />
                  )}
                </button>
              )}
            </div>

            {/* Title Input */}
            {publishType === 'question' && (
              <div className="space-y-1">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={strings.createPost?.questionTitlePlaceholder || "Titre de votre question..."}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm font-bold text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400 transition-colors"
                  autoFocus
                />
              </div>
            )}

            {/* Input Textarea */}
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                publishType === 'question'
                  ? (strings.createPost?.contentPlaceholder || 'Posez votre question...')
                  : (strings.createPost?.storyCaptionPlaceholder || 'Racontez votre témoignage...')
              }
              className="w-full bg-slate-900/40 p-3 rounded-2xl text-sm text-white placeholder:text-slate-500 border border-slate-800/80 focus:outline-hidden focus:border-cyan-400 resize-none leading-relaxed"
            />

            {/* Media previews */}
            {uploadedMedia.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-cyan-300 flex items-center gap-1">
                    <Upload className="w-3 h-3" /> {strings.createPost?.addMedia || 'Fichiers'} ({uploadedMedia.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setUploadedMedia([])}
                    className="text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                  >
                    {strings.messaging?.removeFile || 'Tout retirer'}
                  </button>
                </div>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5">
                  {uploadedMedia.map((m, idx) => (
                    <div
                      key={m.id}
                      className={`relative w-24 h-24 rounded-2xl overflow-hidden border shrink-0 group ${
                        m.type === 'video' ? 'border-teal-400/80 bg-slate-950' : 'border-cyan-400/80 bg-slate-900'
                      }`}
                    >
                      {m.type === 'video' ? (
                        <div className="relative w-full h-full">
                          <video src={m.url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                            <div className="w-7 h-7 rounded-full bg-teal-500/80 text-white flex items-center justify-center">
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            </div>
                          </div>
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-black/80 text-teal-300 text-[9px] font-bold flex items-center gap-0.5">
                            <Film className="w-2.5 h-2.5" /> {strings.messaging?.video || 'Vidéo'}
                          </span>
                        </div>
                      ) : (
                        <div className="relative w-full h-full">
                          <img src={m.url} alt="Aperçu" className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-black/80 text-cyan-300 text-[9px] font-bold flex items-center gap-0.5">
                            <Camera className="w-2.5 h-2.5" /> {strings.messaging?.photo || 'Photo'}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setUploadedMedia((prev) => prev.filter((_, i) => i !== idx))
                        }
                        title={strings.messaging?.removeFile || "Retirer ce fichier"}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/80 hover:bg-rose-600 text-white flex items-center justify-center text-xs transition-colors cursor-pointer shadow-md"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hidden file inputs for direct device selection */}
            <input
              ref={photoFileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleProcessFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <input
              ref={videoFileInputRef}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleProcessFiles(e.target.files);
                e.target.value = '';
              }}
            />

            {/* Tags input (optional for questions) */}
            {publishType === 'question' && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder={strings.createPost?.tagsPlaceholder || "Tags (ex: #santé #drépanocytose)"}
                  className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 border-none focus:outline-hidden"
                />
              </div>
            )}
          </div>

          {/* Bottom Actions Bar */}
          <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-[#0b101b] flex items-center justify-between mt-auto">
            {/* Direct Device Attachment Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => photoFileInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer hover:border-cyan-400 active:scale-95 disabled:opacity-50"
                title={strings.createPost?.addMedia || "Photo"}
              >
                <Camera className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px]">{strings.messaging?.photo || "Photo"}</span>
              </button>

              <button
                type="button"
                disabled={isUploading}
                onClick={() => videoFileInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer hover:border-teal-400 active:scale-95 disabled:opacity-50"
                title={strings.createPost?.addMedia || "Vidéo"}
              >
                <Film className="w-4 h-4 text-teal-400" />
                <span className="text-[11px]">{strings.messaging?.video || "Vidéo"}</span>
              </button>
            </div>

            {/* Submit Pill */}
            <button
              type="submit"
              disabled={!content.trim() && uploadedMedia.length === 0}
              className="px-6 py-2.5 rounded-full bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-950 font-extrabold text-xs tracking-tight transition-all active:scale-95 shadow-md shadow-cyan-400/20 cursor-pointer"
            >
              {isUploading
                ? (strings.createPost?.publishing || 'Chargement...')
                : publishType === 'question'
                ? (strings.createPost?.submitQuestion || 'Publier')
                : (strings.createPost?.submitStory || 'Publier le Témoignage')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
