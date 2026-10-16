import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Award,
  Sparkles,
  Heart,
  HelpCircle,
  Trophy,
  MapPin,
  Bell,
  LogOut,
} from 'lucide-react';
import { UserProfile, StoryTestimonial, Post, Campaign, AppNotification, Language } from '../../types';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface UserProfileModalProps {
  user: UserProfile;
  isCurrentUser?: boolean;
  userStories?: StoryTestimonial[];
  stories?: StoryTestimonial[];
  userPosts?: Post[];
  posts?: Post[];
  userCampaigns?: Campaign[];
  campaigns?: Campaign[];
  notifications?: AppNotification[];
  unreadNotificationsCount?: number;
  language?: Language;
  onSelectLanguage?: (lang: Language) => void;
  onOpenNotifications?: () => void;
  onLogout?: () => void;
  onClose: () => void;
  onStartMessage?: (userId: string) => void;
  onEditBio?: (newBio: string) => void;
  onUpdateBio?: (newBio: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isCurrentUser = true,
  userStories,
  stories,
  userPosts,
  posts,
  userCampaigns,
  campaigns,
  notifications = [],
  unreadNotificationsCount = 0,
  language = 'fr',
  onSelectLanguage,
  onOpenNotifications,
  onLogout,
  onClose,
  onStartMessage,
  onEditBio,
  onUpdateBio,
}) => {
  const [activeTab, setActiveTab] = useState<'featured' | 'questions' | 'reactions' | 'campaigns' | 'badges' | 'notifications'>('featured');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(user.bio || '');
  const [currentLang, setCurrentLang] = useState<Language>(language || user.language || 'fr');

  const safeStories = userStories || stories || [];
  const safePosts = userPosts || posts || [];
  const safeCampaigns = userCampaigns || campaigns || [];

  const unreadCount = unreadNotificationsCount || notifications.filter(n => !n.isRead).length;

  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang);
    if (onSelectLanguage) {
      onSelectLanguage(lang);
    }
  };

  const texts = {
    fr: {
      newMember: '🌱 Nouveau membre',
      activeParticipant: '🤝 Participant actif',
      ambassador: '⭐ Ambassadeur',
      mentor: '🌍 Mentor',
      defaultMember: '🌱 Membre de la Communauté',
      experience: 'Expérience & Vécu :',
      editBio: 'Modifier ma bio',
      cancel: 'Annuler',
      saveBio: 'Enregistrer la bio',
      featured: 'À la une',
      questions: 'Questions',
      reactions: 'Réactions',
      campaigns: 'Campagnes',
      badges: 'Badges',
      notifications: 'Notifications',
      logout: 'Déconnexion',
      close: 'Fermer',
      message: 'Message',
      progress: 'Progression',
      days: 'jours',
      supportHeart: 'Soutiens ❤️',
      empathy: 'Empathie',
      courage: 'Courage',
      bravo: 'Bravo',
      noFeatured: 'Aucun témoignage mis à la une pour le moment.',
      noNotifications: 'Aucune notification pour le moment.',
      question: 'Question',
    },
    sw: {
      newMember: '🌱 Mwanachama mpya',
      activeParticipant: '🤝 Mshiriki hai',
      ambassador: '⭐ Balozi',
      mentor: '🌍 Mshauri',
      defaultMember: '🌱 Mwanachama wa Jamii',
      experience: 'Uzoefu & Maisha :',
      editBio: 'Badilisha wasifu wangu',
      cancel: 'Ghairi',
      saveBio: 'Hifadhi wasifu',
      featured: 'Iliyoangaziwa',
      questions: 'Maswali',
      reactions: 'Mwitikio',
      campaigns: 'Kampeni',
      badges: 'Beji',
      notifications: 'Taarifa',
      logout: 'Toka',
      close: 'Funga',
      message: 'Ujumbe',
      progress: 'Maendeleo',
      days: 'siku',
      supportHeart: 'Msaada ❤️',
      empathy: 'Huruma',
      courage: 'Ujasiri',
      bravo: 'Hongera',
      noFeatured: 'Hakuna ushuhuda ulioangaziwa kwa sasa.',
      noNotifications: 'Hakuna taarifa kwa sasa.',
      question: 'Swali',
    },
    en: {
      newMember: '🌱 New member',
      activeParticipant: '🤝 Active participant',
      ambassador: '⭐ Ambassador',
      mentor: '🌍 Mentor',
      defaultMember: '🌱 Community Member',
      experience: 'Experience & Life Journey:',
      editBio: 'Edit my bio',
      cancel: 'Cancel',
      saveBio: 'Save bio',
      featured: 'Featured',
      questions: 'Questions',
      reactions: 'Reactions',
      campaigns: 'Campaigns',
      badges: 'Badges',
      notifications: 'Notifications',
      logout: 'Log out',
      close: 'Close',
      message: 'Message',
      progress: 'Progress',
      days: 'days',
      supportHeart: 'Support ❤️',
      empathy: 'Empathy',
      courage: 'Courage',
      bravo: 'Well done',
      noFeatured: 'No featured testimonials yet.',
      noNotifications: 'No notifications at the moment.',
      question: 'Question',
    },
  }[currentLang] || {
    newMember: '🌱 Nouveau membre',
    activeParticipant: '🤝 Participant actif',
    ambassador: '⭐ Ambassadeur',
    mentor: '🌍 Mentor',
    defaultMember: '🌱 Membre de la Communauté',
    experience: 'Expérience & Vécu :',
    editBio: 'Modifier ma bio',
    cancel: 'Annuler',
    saveBio: 'Enregistrer la bio',
    featured: 'À la une',
    questions: 'Questions',
    reactions: 'Réactions',
    campaigns: 'Campagnes',
    badges: 'Badges',
    notifications: 'Notifications',
    logout: 'Déconnexion',
    close: 'Fermer',
    message: 'Message',
    progress: 'Progression',
    days: 'jours',
    supportHeart: 'Soutiens ❤️',
    empathy: 'Empathie',
    courage: 'Courage',
    bravo: 'Bravo',
    noFeatured: 'Aucun témoignage mis à la une pour le moment.',
    noNotifications: 'Aucune notification pour le moment.',
    question: 'Question',
  };

  const getStatusBadge = () => {
    switch (user.status) {
      case 'new_member':
        return { label: texts.newMember, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'active_participant':
        return { label: texts.activeParticipant, color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      case 'ambassador':
        return { label: texts.ambassador, color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'mentor':
        return { label: texts.mentor, color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      default:
        return { label: texts.defaultMember, color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const statusBadge = getStatusBadge();

  const handleSaveBio = () => {
    if (onEditBio) onEditBio(bioText);
    if (onUpdateBio) onUpdateBio(bioText);
    setIsEditingBio(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#182231] rounded-3xl border border-slate-700 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* TOP COVER & ACTION BUTTONS */}
        <div className="relative h-24 sm:h-28 bg-linear-to-r from-slate-900 via-cyan-950 to-slate-900 border-b border-slate-800 shrink-0 flex items-center justify-end px-4 gap-2">
          
          {/* Language Switcher in Profile */}
          {isCurrentUser && (
            <div className="flex items-center gap-1 p-1 rounded-full bg-slate-950/80 border border-slate-700/80 text-xs">
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`px-2 py-0.5 rounded-full font-bold text-[11px] transition-all cursor-pointer ${
                  currentLang === 'en'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('fr')}
                className={`px-2 py-0.5 rounded-full font-bold text-[11px] transition-all cursor-pointer ${
                  currentLang === 'fr'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Français"
              >
                FR
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('ar')}
                className={`px-2 py-0.5 rounded-full font-bold text-[11px] transition-all cursor-pointer ${
                  currentLang === 'ar'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="العربية"
              >
                AR
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('pt')}
                className={`px-2 py-0.5 rounded-full font-bold text-[11px] transition-all cursor-pointer ${
                  currentLang === 'pt'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Português"
              >
                PT
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('sw')}
                className={`px-2 py-0.5 rounded-full font-bold text-[11px] transition-all cursor-pointer ${
                  currentLang === 'sw'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Kiswahili"
              >
                SW
              </button>
            </div>
          )}

          {/* Notifications Button (for current user) */}
          {isCurrentUser && (
            <button
              onClick={() => {
                if (onOpenNotifications) {
                  onOpenNotifications();
                } else {
                  setActiveTab('notifications');
                }
              }}
              title={texts.notifications}
              className="relative p-2 rounded-full bg-slate-950/70 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-md">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Logout Button (for current user) */}
          {isCurrentUser && onLogout && (
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              title={texts.logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{texts.logout}</span>
            </button>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            title={texts.close}
            className="p-2 rounded-full bg-slate-950/70 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PROFILE HEADER */}
        <div className="px-5 sm:px-6 pb-3 -mt-10 sm:-mt-12 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 shrink-0">
          
          {/* Avatar + Name + Status */}
          <div className="flex items-end gap-3.5">
            <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-slate-900 border-4 border-[#182231] overflow-hidden shadow-xl shrink-0">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-0.5 mb-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="text-lg sm:text-xl font-extrabold text-white font-display">
                  {user.name}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  {user.country}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  {user.points || 0} pts
                </span>
              </div>
            </div>
          </div>

          {/* Action: "Message" button */}
          {!isCurrentUser && onStartMessage && (
            <button
              onClick={() => {
                onStartMessage(user.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{texts.message}</span>
            </button>
          )}
        </div>

        {/* BIO SECTION */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-900/60 border-y border-slate-800 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
              {texts.experience}
            </span>
            {isCurrentUser && (
              <button
                onClick={() => setIsEditingBio(!isEditingBio)}
                className="text-xs text-slate-400 hover:text-cyan-300 underline cursor-pointer"
              >
                {isEditingBio ? texts.cancel : texts.editBio}
              </button>
            )}
          </div>

          {isEditingBio ? (
            <div className="space-y-2 mt-2">
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400"
              />
              <button
                onClick={handleSaveBio}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs cursor-pointer"
              >
                {texts.saveBio}
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-200 leading-relaxed italic whitespace-pre-line">
              "{user.bio}"
            </p>
          )}
        </div>

        {/* PWA INSTALLATION PROMPT IN PROFILE (Automatically hides if already installed) */}
        {isCurrentUser && (
          <div className="px-5 sm:px-6 pt-3 pb-1">
            <PWAInstallButton language={currentLang} variant="card" />
          </div>
        )}

        {/* TABS NAVIGATION */}
        <div className="px-5 sm:px-6 pt-2 border-b border-slate-800 flex items-center gap-1 overflow-x-auto shrink-0">
          
          {/* Tab 1: À la une */}
          <button
            onClick={() => setActiveTab('featured')}
            className={`pb-2 px-2.5 text-xs font-bold flex items-center gap-1 transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'featured'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{texts.featured}</span>
          </button>

          {/* Tab 2: Questions */}
          <button
            onClick={() => setActiveTab('questions')}
            className={`pb-2 px-2.5 text-xs font-bold flex items-center gap-1 transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'questions'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{texts.questions} ({safePosts.filter((p) => p.type === 'question').length})</span>
          </button>

          {/* Tab 3: Réactions */}
          <button
            onClick={() => setActiveTab('reactions')}
            className={`pb-2 px-2.5 text-xs font-bold flex items-center gap-1 transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'reactions'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>{texts.reactions}</span>
          </button>

          {/* Tab 4: Campagnes */}
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`pb-2 px-2.5 text-xs font-bold flex items-center gap-1 transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'campaigns'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{texts.campaigns} ({safeCampaigns.length})</span>
          </button>

          {/* Tab 5: Badges */}
          <button
            onClick={() => setActiveTab('badges')}
            className={`pb-2 px-2.5 text-xs font-bold flex items-center gap-1 transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'badges'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>{texts.badges} ({(user.badges || []).length})</span>
          </button>

          {/* Tab 6: Notifications (for current user) */}
          {isCurrentUser && (
            <button
              onClick={() => setActiveTab('notifications')}
              className={`pb-2 px-2.5 text-xs font-bold flex items-center gap-1.5 transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'notifications'
                  ? 'text-cyan-400 border-cyan-400'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{texts.notifications}</span>
              {unreadCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* TAB CONTENTS */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1">
          
          {/* 1. À la une Tab */}
          {activeTab === 'featured' && (
            <div className="space-y-3">
              {safeStories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {safeStories.map((st) => (
                    <div
                      key={st.id}
                      className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 hover:border-cyan-500/40 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px] text-cyan-400 font-semibold">
                        <span>{st.communityName}</span>
                        <span className="text-slate-400">{st.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-200 italic leading-relaxed">
                        "{st.caption}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-xs text-slate-400">
                  {texts.noFeatured}
                </div>
              )}
            </div>
          )}

          {/* 2. Questions Tab */}
          {activeTab === 'questions' && (
            <div className="space-y-2.5">
              {safePosts.filter((p) => p.type === 'question').map((post) => (
                <div key={post.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{post.title || texts.question}</span>
                    <span className="text-slate-400">{post.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-300">{post.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* 3. Réactions Tab */}
          {activeTab === 'reactions' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <Heart className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                <div className="text-base font-extrabold text-white">142</div>
                <div className="text-[10px] text-slate-400">{texts.supportHeart}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <div className="text-lg mb-0.5">🤝</div>
                <div className="text-base font-extrabold text-white">88</div>
                <div className="text-[10px] text-slate-400">{texts.empathy}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <div className="text-lg mb-0.5">🌱</div>
                <div className="text-base font-extrabold text-white">96</div>
                <div className="text-[10px] text-slate-400">{texts.courage}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <div className="text-lg mb-0.5">👏</div>
                <div className="text-base font-extrabold text-white">64</div>
                <div className="text-[10px] text-slate-400">{texts.bravo}</div>
              </div>
            </div>
          )}

          {/* 4. Campagnes Tab */}
          {activeTab === 'campaigns' && (
            <div className="space-y-2.5">
              {safeCampaigns.map((camp) => (
                <div key={camp.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{camp.title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                      {camp.durationDays} {texts.days}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>{texts.progress}</span>
                      <span className="font-bold text-cyan-400">{camp.userProgressPercent || 40}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${camp.userProgressPercent || 40}%` }}
                        className="h-full bg-linear-to-r from-cyan-400 to-teal-400"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 5. Badges Tab */}
          {activeTab === 'badges' && (
            <div className="space-y-2.5">
              {(user.badges || []).map((badge) => (
                <div key={badge.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xl shrink-0">
                    {badge.icon}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{badge.title}</h5>
                    <p className="text-[11px] text-slate-300">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 6. Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-2">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-2xl border transition-colors flex items-start gap-3 ${
                      !n.isRead
                        ? 'bg-slate-900/90 border-cyan-500/40 text-white'
                        : 'bg-slate-900/40 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0 mt-0.5">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className="font-bold">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-300">{n.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-xs text-slate-400">
                  {texts.noNotifications}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
