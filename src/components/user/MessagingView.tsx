import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Lock,
  Flag,
  ArrowLeft,
  Play,
  Pause,
  Trash2,
  Square,
  CheckCheck,
  Search,
  Check,
  AlertCircle,
  PhoneCall,
  Heart,
  Camera,
  Film,
  Paperclip,
  FileText,
  Download,
  X,
} from 'lucide-react';
import { MessageThread, UserProfile, DirectMessage } from '../../types';
import { Language, t } from '../../translations';
import { TranslateButton } from '../common/TranslateButton';

interface MessagingViewProps {
  threads: MessageThread[];
  currentUser: UserProfile;
  activeThreadId?: string;
  language?: Language;
  onSendMessage: (
    threadId: string,
    content: string,
    type?: 'text' | 'audio' | 'image' | 'video' | 'file',
    audioDuration?: string,
    mediaUrl?: string,
    fileName?: string,
    fileSize?: string
  ) => void;
  onOpenUserProfile?: (userId: string) => void;
  onOpenSOS?: () => void;
}

export const MessagingView: React.FC<MessagingViewProps> = ({
  threads = [],
  currentUser,
  activeThreadId,
  language = 'fr',
  onSendMessage,
  onOpenUserProfile,
  onOpenSOS,
}) => {
  const strings = t[language]?.messaging || t.fr.messaging;
  const commonStrings = t[language]?.common || t.fr.common;
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, { translated: boolean; text: string }>>({});

  const [selectedThreadId, setSelectedThreadId] = useState<string>(
    activeThreadId || threads?.[0]?.id || ''
  );
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Audio Recording State
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Device Media Attachment State
  const [pendingMedia, setPendingMedia] = useState<{
    type: 'image' | 'video';
    url: string;
    name: string;
  } | null>(null);

  // Generic Document/File Attachment State
  const [pendingFile, setPendingFile] = useState<{
    name: string;
    size: string;
    url: string;
  } | null>(null);

  const chatPhotoInputRef = useRef<HTMLInputElement>(null);
  const chatVideoInputRef = useRef<HTMLInputElement>(null);
  const chatGenericFileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleChatFile = (file: File, type: 'image' | 'video') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      if (url) {
        setPendingMedia({ type, url, name: file.name });
        setPendingFile(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenericFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      if (url) {
        setPendingFile({
          name: file.name,
          size: formatFileSize(file.size),
          url,
        });
        setPendingMedia(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Audio Playback State
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<{ [msgId: string]: number }>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedThread =
    (threads || []).find((t) => t.id === selectedThreadId) || threads?.[0] || null;

  // Auto-scroll to bottom whenever thread or message list changes
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [selectedThreadId, showMobileChat]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom('smooth');
    }, 80);
    return () => clearTimeout(timer);
  }, [selectedThread?.messages?.length]);

  // Clean up audio playback & recorder on unmount
  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleSelectThread = (thread: MessageThread) => {
    setSelectedThreadId(thread.id);
    setShowMobileChat(true);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageText.trim() && !pendingMedia && !pendingFile) || !selectedThread) return;

    if (pendingFile) {
      onSendMessage(
        selectedThread.id,
        messageText.trim() || pendingFile.name,
        'file',
        undefined,
        pendingFile.url,
        pendingFile.name,
        pendingFile.size
      );
      setPendingFile(null);
    } else if (pendingMedia) {
      onSendMessage(
        selectedThread.id,
        messageText.trim(),
        pendingMedia.type,
        undefined,
        pendingMedia.url
      );
      setPendingMedia(null);
    } else {
      onSendMessage(selectedThread.id, messageText.trim(), 'text');
    }
    setMessageText('');
  };

  // Format seconds to mm:ss
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- AUDIO RECORDING ENGINE ---
  const startAudioRecording = async () => {
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Navigateur non compatible');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(100);
      setIsRecordingAudio(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone access fallback:', err);
      setIsRecordingAudio(true);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopAndSendAudioRecording = () => {
    if (!selectedThread) return;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    const durationSeconds = Math.max(1, recordingSeconds);
    const formattedDuration = formatDuration(durationSeconds);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        onSendMessage(
          selectedThread.id,
          'Message vocal partagé',
          'audio',
          formattedDuration,
          audioUrl
        );
        setIsRecordingAudio(false);
        setRecordingSeconds(0);
      };
      mediaRecorderRef.current.stop();
    } else {
      onSendMessage(
        selectedThread.id,
        'Message vocal d’apaisement',
        'audio',
        formattedDuration
      );
      setIsRecordingAudio(false);
      setRecordingSeconds(0);
    }
  };

  const cancelAudioRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingAudio(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  // --- AUDIO PLAYBACK ENGINE ---
  const togglePlayAudio = (msg: DirectMessage) => {
    if (playingMessageId === msg.id) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      setPlayingMessageId(null);
      return;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }

    setPlayingMessageId(msg.id);

    if (msg.mediaUrl) {
      const audio = new Audio(msg.mediaUrl);
      activeAudioRef.current = audio;

      audio.ontimeupdate = () => {
        if (audio.duration) {
          const progress = audio.currentTime / audio.duration;
          setPlaybackProgress((prev) => ({ ...prev, [msg.id]: progress }));
        }
      };

      audio.onended = () => {
        setPlayingMessageId(null);
        setPlaybackProgress((prev) => ({ ...prev, [msg.id]: 0 }));
      };

      audio.onerror = () => {
        fallbackPlaySynthAudio(msg);
      };

      audio.play().catch(() => {
        fallbackPlaySynthAudio(msg);
      });
    } else {
      fallbackPlaySynthAudio(msg);
    }
  };

  const fallbackPlaySynthAudio = (msg: DirectMessage) => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const tones = [432, 528, 639];
        tones.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.35);
          gain.gain.setValueAtTime(0.01, now + i * 0.35);
          gain.gain.linearRampToValueAtTime(0.2, now + i * 0.35 + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.35 + 1.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.35);
          osc.stop(now + i * 0.35 + 1.1);
        });
      }

      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 0.2;
        if (currentProgress >= 1) {
          clearInterval(interval);
          setPlayingMessageId(null);
          setPlaybackProgress((prev) => ({ ...prev, [msg.id]: 0 }));
        } else {
          setPlaybackProgress((prev) => ({ ...prev, [msg.id]: currentProgress }));
        }
      }, 400);
    } catch {
      setPlayingMessageId(null);
    }
  };

  const filteredThreads = threads.filter(
    (t) =>
      t.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.otherUser.sharedCommunityName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8.5rem)] sm:h-[calc(100vh-9.5rem)] min-h-[520px] max-h-[850px] rounded-3xl bg-[#182231] border border-slate-800 shadow-2xl flex overflow-hidden relative">
      
      {/* 1. THREADS LIST (LEFT PANE / MOBILE VIEW 1) */}
      <div
        className={`w-full sm:w-80 md:w-96 border-r border-slate-800 flex flex-col bg-[#111827] shrink-0 min-h-0 ${
          showMobileChat ? 'hidden sm:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-white text-base font-display">
              {strings.title || 'Messages'}
            </h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold">
            {threads.length} {strings.threads || 'discussions'}
          </span>
        </div>

        {/* Search threads */}
        <div className="p-3 border-b border-slate-800/80 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={strings.searchPlaceholder || 'Rechercher une discussion...'}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400/50"
            />
          </div>
        </div>

        {/* Closed circle notice */}
        <div className="px-4 py-1.5 bg-slate-900/40 border-b border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5 shrink-0">
          <Lock className="w-3 h-3 text-cyan-400 shrink-0" />
          <span>{strings.secureNotice || 'Échanges sécurisés et confidentiels'}</span>
        </div>

        {/* List of Threads */}
        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-800/60 no-scrollbar">
          {filteredThreads.map((thread) => {
            const isSelected = thread.id === selectedThread?.id;

            return (
              <div
                key={thread.id}
                onClick={() => handleSelectThread(thread)}
                className={`p-3.5 sm:p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#182231] sm:border-l-4 sm:border-cyan-400'
                    : 'hover:bg-slate-900/80'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={thread.otherUser.avatar}
                    alt={thread.otherUser.name}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-slate-700"
                  />
                  {thread.otherUser.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-xs sm:text-sm text-white truncate">
                        {thread.otherUser.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {thread.lastMessageTimestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 truncate mt-0.5">
                    {thread.lastMessage}
                  </p>

                  <span className="text-[10px] text-cyan-400/80 font-medium truncate block">
                    {thread.otherUser.sharedCommunityName}
                  </span>
                </div>

                {thread.unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                    {thread.unreadCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. ACTIVE CONVERSATION PANE (RIGHT / MOBILE VIEW 2) */}
      {selectedThread ? (
        <div
          className={`flex-1 min-w-0 min-h-0 flex flex-col bg-[#182231] relative ${
            showMobileChat ? 'flex' : 'hidden sm:flex'
          }`}
        >
          {/* Thread Header */}
          <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-[#182231]/95 backdrop-blur-sm shrink-0 z-10">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Back to thread list on mobile */}
              <button
                onClick={() => setShowMobileChat(false)}
                className="sm:hidden p-1.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800 cursor-pointer shrink-0"
                aria-label="Retour"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <img
                src={selectedThread.otherUser.avatar}
                alt={selectedThread.otherUser.name}
                onClick={() => onOpenUserProfile && onOpenUserProfile(selectedThread.otherUser.id)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-cyan-400 shadow-sm cursor-pointer shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    onClick={() => onOpenUserProfile && onOpenUserProfile(selectedThread.otherUser.id)}
                    className="text-xs sm:text-sm font-bold text-white hover:text-cyan-300 cursor-pointer truncate"
                  >
                    {selectedThread.otherUser.name}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 truncate block">
                  {selectedThread.otherUser.sharedCommunityName}
                </span>
              </div>
            </div>

            {/* HEADER ACTIONS */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-300 shrink-0">
              {onOpenSOS && (
                <button
                  onClick={onOpenSOS}
                  title="Ligne d’urgence SOS"
                  className="p-1.5 sm:p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 transition-colors cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4 text-rose-400" />
                </button>
              )}
              <button
                title="Signaler la conversation"
                className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <Flag className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream (Fluid and fully scrollable) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
            {selectedThread.messages.map((msg) => {
              const isMine = msg.senderId === currentUser?.id;
              const isAudio = msg.type === 'audio';
              const isPlaying = playingMessageId === msg.id;
              const progress = playbackProgress[msg.id] || 0;

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 sm:gap-2.5 ${
                    isMine ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!isMine && (
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0"
                    />
                  )}

                  <div
                    className={`max-w-[88%] sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                      isMine
                        ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-medium rounded-br-xs'
                        : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-xs'
                    }`}
                  >
                    {msg.mediaUrl && msg.type !== 'file' && (
                      <div className="mb-2 rounded-xl overflow-hidden border border-slate-700/50">
                        {msg.type === 'video' ? (
                          <video
                            src={msg.mediaUrl}
                            controls
                            playsInline
                            className="w-full max-h-60 rounded-xl object-contain bg-black"
                          />
                        ) : (
                          <img
                            src={msg.mediaUrl}
                            alt="Média partagé"
                            className="w-full max-h-60 rounded-xl object-cover"
                          />
                        )}
                      </div>
                    )}

                    {/* Generic File Attachment Rendering */}
                    {msg.type === 'file' && (
                      <div
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 mb-2 ${
                          isMine
                            ? 'bg-slate-950/20 border-slate-900/40 text-slate-950'
                            : 'bg-slate-800/90 border-slate-700 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              isMine ? 'bg-slate-950 text-cyan-300' : 'bg-cyan-500/20 text-cyan-400'
                            }`}
                          >
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate max-w-[180px] sm:max-w-[220px]">
                              {msg.fileName || msg.content || 'Fichier joint'}
                            </p>
                            {msg.fileSize && (
                              <p
                                className={`text-[10px] ${
                                  isMine ? 'text-slate-900/80 font-medium' : 'text-slate-400'
                                }`}
                              >
                                {msg.fileSize}
                              </p>
                            )}
                          </div>
                        </div>

                        {msg.mediaUrl && (
                          <a
                            href={msg.mediaUrl}
                            download={msg.fileName || 'document'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
                              isMine
                                ? 'bg-slate-950 text-white hover:bg-slate-900'
                                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                            }`}
                            title="Télécharger le fichier"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    )}

                    {isAudio ? (
                      /* INTERACTIVE VOICE MESSAGE PLAYER */
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          {/* Play/Pause Button */}
                          <button
                            type="button"
                            onClick={() => togglePlayAudio(msg)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-md ${
                              isMine
                                ? 'bg-slate-950 text-cyan-300 hover:bg-slate-900 active:scale-95'
                                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 active:scale-95'
                            }`}
                            title={isPlaying ? 'Pause' : 'Écouter le message vocal'}
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            )}
                          </button>

                          {/* Waveform & Info */}
                          <div className="flex-1 min-w-[140px] space-y-1.5">
                            <div className="flex items-center gap-1 h-6">
                              {[40, 75, 55, 90, 65, 80, 45, 95, 60, 85, 50, 70, 40, 60].map((h, i) => {
                                const barProgress = i / 14;
                                const isPassed = progress >= barProgress;
                                return (
                                  <span
                                    key={i}
                                    style={{ height: `${h}%` }}
                                    className={`w-1 rounded-full transition-all duration-200 ${
                                      isPlaying
                                        ? isPassed
                                          ? isMine
                                            ? 'bg-slate-950'
                                            : 'bg-cyan-400 animate-pulse'
                                          : isMine
                                          ? 'bg-slate-950/40'
                                          : 'bg-slate-700'
                                        : isMine
                                        ? 'bg-slate-950/60'
                                        : 'bg-slate-600'
                                    }`}
                                  />
                                );
                              })}
                            </div>

                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className={isMine ? 'text-slate-950/80' : 'text-cyan-300'}>
                                {isPlaying ? (strings.listening || 'Lecture en cours...') : (strings.voiceMessage || 'Message vocal')}
                              </span>
                              <span className={isMine ? 'text-slate-950/80' : 'text-slate-400'}>
                                {msg.audioDuration || '0:15'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="whitespace-pre-wrap">
                          {translatedMessages[msg.id]?.translated
                            ? translatedMessages[msg.id].text
                            : msg.content}
                        </p>
                        {!isMine && msg.content && (
                          <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                            <TranslateButton
                              compact
                              originalText={msg.content}
                              targetLanguage={language}
                              onToggleTranslation={(active, text) => {
                                setTranslatedMessages((prev) => ({
                                  ...prev,
                                  [msg.id]: { translated: active, text },
                                }));
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timestamp & Status */}
                    <div
                      className={`flex items-center justify-end gap-1 text-[10px] mt-1.5 ${
                        isMine ? 'text-slate-950/70' : 'text-slate-400'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {isMine && <CheckCheck className="w-3.5 h-3.5 text-slate-950/80" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Bottom Anchor for auto-scroll */}
            <div ref={messagesEndRef} className="h-4 shrink-0" />
          </div>

          {/* 3. MESSAGE INPUT BAR / LIVE VOICE RECORDING BAR */}
          <div className="p-2 sm:p-3 md:p-4 border-t border-slate-800 bg-[#111827] shrink-0 z-10 space-y-2 w-full min-w-0">
            {/* Hidden file inputs for device media & file upload */}
            <input
              ref={chatPhotoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleChatFile(e.target.files[0], 'image');
                e.target.value = '';
              }}
            />
            <input
              ref={chatVideoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleChatFile(e.target.files[0], 'video');
                e.target.value = '';
              }}
            />
            <input
              ref={chatGenericFileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleGenericFile(e.target.files[0]);
                e.target.value = '';
              }}
            />

            {/* Pending Generic File Preview */}
            {pendingFile && (
              <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-900 border border-teal-500/40 animate-fade-in shadow-md w-full min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] sm:text-xs font-bold text-teal-300 flex items-center gap-1.5 truncate">
                      <Paperclip className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Fichier prêt à l’envoi</span>
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 truncate">
                      <span className="truncate font-mono">{pendingFile.name}</span>
                      <span>•</span>
                      <span className="shrink-0">{pendingFile.size}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPendingFile(null)}
                  className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-colors cursor-pointer shrink-0 ml-1.5"
                  title="Retirer ce fichier"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            )}

            {/* Pending Media Preview from Device */}
            {pendingMedia && (
              <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-900 border border-cyan-500/40 animate-fade-in shadow-md w-full min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl overflow-hidden border border-cyan-400 bg-black shrink-0">
                    {pendingMedia.type === 'video' ? (
                      <video src={pendingMedia.url} className="w-full h-full object-cover" />
                    ) : (
                      <img
                        src={pendingMedia.url}
                        alt="Aperçu"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] sm:text-xs font-bold text-cyan-300 flex items-center gap-1.5 truncate">
                      {pendingMedia.type === 'video' ? (
                        <>
                          <Film className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                          <span className="truncate">Vidéo prête (Appareil)</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                          <span className="truncate">Photo prête (Appareil)</span>
                        </>
                      )}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 truncate block font-mono">
                      {pendingMedia.name}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPendingMedia(null)}
                  className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-colors cursor-pointer shrink-0 ml-1.5"
                  title="Retirer ce fichier"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            )}

            {isRecordingAudio ? (
              /* LIVE VOICE NOTE RECORDER BAR */
              <div className="flex items-center justify-between gap-2 sm:gap-3 bg-slate-900 border border-rose-500/40 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 px-2.5 sm:px-4 shadow-lg animate-fade-in w-full min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className="text-[11px] sm:text-xs md:text-sm font-bold text-rose-400 truncate">
                      {strings.recording || 'Enregistrement'} :
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-extrabold text-white shrink-0">
                      {formatDuration(recordingSeconds)}
                    </span>
                  </div>

                  <div className="hidden md:flex items-center gap-0.5 h-4">
                    {[60, 90, 40, 80, 50, 100, 70, 85].map((h, i) => (
                      <span
                        key={i}
                        style={{ height: `${h}%` }}
                        className="w-0.5 bg-rose-400 rounded-full animate-pulse"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={cancelAudioRecording}
                    className="p-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-slate-700"
                    title={strings.cancelRecording || commonStrings.cancel || 'Annuler'}
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{strings.cancelRecording || commonStrings.cancel || 'Annuler'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={stopAndSendAudioRecording}
                    className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 text-xs font-black transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-md shadow-cyan-500/20"
                    title={strings.sendVoiceNote || commonStrings.send || 'Envoyer'}
                  >
                    <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{commonStrings.send || 'Envoyer'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* STANDARD TEXT, MEDIA & AUDIO INPUT FORM */
              <form onSubmit={handleSend} className="w-full min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 w-full min-w-0">
                  {/* Responsive Media Buttons Toolbar (Audio, Photo, Video, File) */}
                  <div className="grid grid-cols-4 sm:flex items-center gap-1 sm:gap-1.5 bg-slate-900/90 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-800 shrink-0">
                    {/* Voice Note Button */}
                    <button
                      type="button"
                      onClick={startAudioRecording}
                      title={strings.voiceNote || 'Vocal'}
                      className="h-8 sm:h-9 px-1 sm:px-2.5 rounded-lg sm:rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1 text-xs font-semibold transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
                      <span className="text-[10px] sm:text-xs font-bold truncate">{strings.voiceNote || 'Vocal'}</span>
                    </button>

                    {/* Photo Upload from Device Button */}
                    <button
                      type="button"
                      onClick={() => chatPhotoInputRef.current?.click()}
                      title={strings.photo || 'Photo'}
                      className="h-8 sm:h-9 px-1 sm:px-2.5 rounded-lg sm:rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1 text-xs font-semibold transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
                      <span className="text-[10px] sm:text-xs font-bold truncate">{strings.photo || 'Photo'}</span>
                    </button>

                    {/* Video Upload from Device Button */}
                    <button
                      type="button"
                      onClick={() => chatVideoInputRef.current?.click()}
                      title={strings.video || 'Vidéo'}
                      className="h-8 sm:h-9 px-1 sm:px-2.5 rounded-lg sm:rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-teal-400 hover:text-teal-300 flex items-center justify-center gap-1 text-xs font-semibold transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400 shrink-0" />
                      <span className="text-[10px] sm:text-xs font-bold truncate">{strings.video || 'Vidéo'}</span>
                    </button>

                    {/* File / Document Upload Button */}
                    <button
                      type="button"
                      onClick={() => chatGenericFileInputRef.current?.click()}
                      title={strings.document || 'Fichier'}
                      className="h-8 sm:h-9 px-1 sm:px-2.5 rounded-lg sm:rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-teal-400 hover:text-teal-300 flex items-center justify-center gap-1 text-xs font-semibold transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400 shrink-0" />
                      <span className="text-[10px] sm:text-xs font-bold truncate">{strings.document || 'Fichier'}</span>
                    </button>
                  </div>

                  {/* Message Text Input + Send Button */}
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 w-full">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={
                        pendingFile
                          ? strings.noteWithFile || 'Note avec fichier...'
                          : pendingMedia
                          ? strings.caption || 'Légende...'
                          : strings.typeMessage || 'Écrivez votre message...'
                      }
                      className="min-w-0 flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400 transition-colors shadow-inner"
                    />

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={!messageText.trim() && !pendingMedia && !pendingFile}
                      title={commonStrings.send || 'Envoyer'}
                      className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-cyan-500 hover:bg-cyan-400 flex items-center justify-center gap-1.5 text-slate-950 font-bold shadow-md shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-40 cursor-pointer shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden xs:inline text-xs font-bold">{commonStrings.send || 'Envoyer'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden sm:flex items-center justify-center text-slate-400 text-xs">
          {strings.noConversationSelected || 'Sélectionnez une discussion pour commencer à échanger.'}
        </div>
      )}
    </div>
  );
};
