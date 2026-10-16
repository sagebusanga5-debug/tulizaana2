import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  Award,
  MessageSquare,
  Clock,
  PlusCircle,
  CheckCircle2,
  Users,
  Send,
  Lock,
} from 'lucide-react';
import { Campaign, CampaignActivity, CampaignContribution, UserProfile, Language } from '../../../types';
import { CampaignWallCard } from './CampaignWallCard';
import { ActivityParticipationModal } from './ActivityParticipationModal';
import { t } from '../../../translations';
import { TranslateButton } from '../../common/TranslateButton';

interface CampaignDetailViewProps {
  campaign: Campaign;
  currentUser?: UserProfile;
  language?: Language;
  onBack: () => void;
  onJoinCampaign?: (campaignId: string) => void;
  onOpenOrganizationProfile?: (orgId: string) => void;
  onSubmitContribution: (
    campaignId: string,
    activityId: string,
    contribution: Omit<CampaignContribution, 'id' | 'createdAt' | 'reactions' | 'commentsCount'>
  ) => void;
  onDeleteContribution?: (campaignId: string, contributionId: string) => void;
  onEditContribution?: (
    campaignId: string,
    contributionId: string,
    updatedData: {
      content: string;
      caption?: string;
      visibility: 'campaign_members' | 'community_members' | 'private';
      mediaUrl?: string;
      mediaType?: 'text' | 'audio' | 'photo' | 'video' | 'interaction';
    }
  ) => void;
}

export const CampaignDetailView: React.FC<CampaignDetailViewProps> = ({
  campaign,
  currentUser,
  language = 'fr',
  onBack,
  onJoinCampaign,
  onOpenOrganizationProfile,
  onSubmitContribution,
  onDeleteContribution,
  onEditContribution,
}) => {
  // Navigation: strictly 2 views (Mur Collectif & Mon Espace Personnel)
  const [activeTab, setActiveTab] = useState<'wall' | 'my_space'>('wall');

  const currentDay = campaign.currentDay || 8;
  // Start selected day on the active day
  const [selectedDay, setSelectedDay] = useState<number | 'all'>(currentDay);

  const [selectedActivityForModal, setSelectedActivityForModal] = useState<CampaignActivity | null>(null);

  const [campaignHeaderTranslation, setCampaignHeaderTranslation] = useState<{
    translated: boolean;
    title?: string;
  }>({ translated: false });

  const [activityTranslations, setActivityTranslations] = useState<
    Record<string, { translated: boolean; title?: string; desc: string; prompt?: string }>
  >({});

  const strings = t[language]?.campaignsView || t.fr.campaignsView;

  const detailTexts = {
    fr: {
      back: 'Retour',
      by: 'Par',
      day: 'Jour',
      today: "Aujourd'hui",
      allDays: 'Tous les jours',
      shares: 'partages',
      collectiveWall: 'Mur collectif',
      privateSpace: 'Espace Privé',
      activeStage: 'Étape Active',
      youContributed: 'Tu as contribué ✓',
      sendContribution: 'Envoyer ma contribution',
      updateContribution: 'Ajouter ou modifier ma contribution',
      noContributions: 'Aucune contribution pour cette sélection',
      noContribsDesc: 'Sois le premier membre à déposer ton partage pour inspirer les autres !',
      postFirstTestimony: 'Déposer le premier témoignage',
      myShares: 'Mes Partages dans cette Campagne',
      newShare: 'Nouveau partage',
      completedDays: 'Jours complétés',
      contributionsDeposited: 'Contributions déposées',
      noPersonalContribs: "Tu n'as pas encore déposé de contribution dans cette campagne",
      noPersonalDesc: 'Prends quelques instants pour partager ton ressenti ou ton havre de paix.',
      postFirstPersonal: 'Déposer ma première contribution',
      share: 'Partager',
      respond: 'Répondre',
      show: 'Montrer',
      listen_watch: 'Écouter & Déposer',
      encourage: 'Encourager',
      question: 'Questionner',
      act: 'Agir',
      co_create: 'Créer ensemble',
      activity: 'Activité',
    },
    sw: {
      back: 'Rudi',
      by: 'Na',
      day: 'Siku',
      today: 'Leo',
      allDays: 'Siku zote',
      shares: 'shiriki',
      collectiveWall: 'Ukuta wa Jamii',
      privateSpace: 'Nafasi Binafsi',
      activeStage: 'Hatua ya Sasa',
      youContributed: 'Umeshiriki ✓',
      sendContribution: 'Tuma mchango wangu',
      updateContribution: 'Ongeza au badilisha mchango wangu',
      noContributions: 'Hakuna michango kwa uteuzi huu',
      noContribsDesc: 'Kuwa mwanachama wa kwanza kuacha ushuhuda wako ili kuhamasisha wengine!',
      postFirstTestimony: 'Acha ushuhuda wa kwanza',
      myShares: 'Michango Yangu kwenye Kampeni Hii',
      newShare: 'Mchango mpya',
      completedDays: 'Siku zilizokamilika',
      contributionsDeposited: 'Michango iliyotolewa',
      noPersonalContribs: 'Bado hujaweka mchango wowote kwenye kampeni hii',
      noPersonalDesc: 'Chukua muda kidogo kushiriki hisia zako au kimbilio lako la amani.',
      postFirstPersonal: 'Weka mchango wangu wa kwanza',
      share: 'Shiriki',
      respond: 'Jibu',
      show: 'Onyesha',
      listen_watch: 'Sikiliza & Weka',
      encourage: 'Tia Moyo',
      question: 'Uliza',
      act: 'Tenda',
      co_create: 'Unda Pamoja',
      activity: 'Shughuli',
    },
    en: {
      back: 'Back',
      by: 'By',
      day: 'Day',
      today: 'Today',
      allDays: 'All days',
      shares: 'shares',
      collectiveWall: 'Community Wall',
      privateSpace: 'Private Space',
      activeStage: 'Active Step',
      youContributed: 'You contributed ✓',
      sendContribution: 'Submit my contribution',
      updateContribution: 'Add or edit my contribution',
      noContributions: 'No contributions for this selection',
      noContribsDesc: 'Be the first member to share your thoughts and inspire others!',
      postFirstTestimony: 'Submit the first testimony',
      myShares: 'My Contributions in this Campaign',
      newShare: 'New share',
      completedDays: 'Days completed',
      contributionsDeposited: 'Contributions submitted',
      noPersonalContribs: "You haven't submitted any contributions to this campaign yet",
      noPersonalDesc: 'Take a moment to share your feelings or peaceful space.',
      postFirstPersonal: 'Submit my first contribution',
      share: 'Share',
      respond: 'Respond',
      show: 'Show',
      listen_watch: 'Listen & Post',
      encourage: 'Encourage',
      question: 'Question',
      act: 'Act',
      co_create: 'Co-create',
      activity: 'Activity',
    },
  }[language] || {
    back: 'Retour',
    by: 'Par',
    day: 'Jour',
    today: "Aujourd'hui",
    allDays: 'Tous les jours',
    shares: 'partages',
    collectiveWall: 'Mur collectif',
    privateSpace: 'Espace Privé',
    activeStage: 'Étape Active',
    youContributed: 'Tu as contribué ✓',
    sendContribution: 'Envoyer ma contribution',
    updateContribution: 'Ajouter ou modifier ma contribution',
    noContributions: 'Aucune contribution pour cette sélection',
    noContribsDesc: 'Sois le premier membre à déposer ton partage pour inspirer les autres !',
    postFirstTestimony: 'Déposer le premier témoignage',
    myShares: 'Mes Partages dans cette Campagne',
    newShare: 'Nouveau partage',
    completedDays: 'Jours complétés',
    contributionsDeposited: 'Contributions déposées',
    noPersonalContribs: "Tu n'as pas encore déposé de contribution dans cette campagne",
    noPersonalDesc: 'Prends quelques instants pour partager ton ressenti ou ton havre de paix.',
    postFirstPersonal: 'Déposer ma première contribution',
    share: 'Partager',
    respond: 'Répondre',
    show: 'Montrer',
    listen_watch: 'Écouter & Déposer',
    encourage: 'Encourager',
    question: 'Questionner',
    act: 'Agir',
    co_create: 'Créer ensemble',
    activity: 'Activité',
  };

  // Find activity corresponding to currently selected day (or currentDay if 'all')
  const activeActivityForSelectedDay =
    campaign.activities.find((a) => a.dayNumber === (selectedDay === 'all' ? currentDay : selectedDay)) ||
    campaign.activities[0];

  // All contributions in the campaign
  const allContributions = campaign.contributions || [];

  // Filter contributions by selected day
  const dayFilteredContributions = allContributions.filter((c) => {
    if (selectedDay !== 'all' && c.dayNumber !== selectedDay) {
      return false;
    }
    return true;
  });

  // User's own contributions in this campaign
  const myContributions = allContributions.filter(
    (c) => c.authorId === (currentUser?.id || 'me') || c.authorName === (currentUser?.name || 'Moi')
  );

  const userContributedToSelectedDay = myContributions.some(
    (c) => c.dayNumber === (selectedDay === 'all' ? currentDay : selectedDay)
  );

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'share':
        return { label: detailTexts.share, icon: '📢', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
      case 'respond':
        return { label: detailTexts.respond, icon: '💬', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' };
      case 'show':
        return { label: detailTexts.show, icon: '📷', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      case 'listen_watch':
        return { label: detailTexts.listen_watch, icon: '🎧', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
      case 'encourage':
        return { label: detailTexts.encourage, icon: '🤝', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
      case 'question':
        return { label: detailTexts.question, icon: '❓', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
      case 'act':
        return { label: detailTexts.act, icon: '⚡', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'co_create':
        return { label: detailTexts.co_create, icon: '✨', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
      default:
        return { label: detailTexts.activity, icon: '🌱', color: 'text-slate-300 bg-slate-800 border-slate-700' };
    }
  };

  // Generate list of days (1 to durationDays, highlighting available and active)
  const daysList = Array.from({ length: campaign.durationDays || 21 }, (_, i) => i + 1);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* 1. CARTE DU RÉSUMÉ DE LA CAMPAGNE */}
      <div className="bg-[#111827] rounded-3xl border border-slate-800/90 shadow-xl overflow-hidden space-y-0">
        
        {/* En-tête visuel avec photo de la campagne & bouton retour en haut à gauche */}
        <div className="w-full h-48 sm:h-64 relative overflow-hidden bg-slate-950">
          <img
            src={campaign.image}
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-black/40" />

          {/* Bouton retour en haut à gauche */}
          <div className="absolute top-4 left-4 z-10">
            <button
              type="button"
              id="btn-campaign-back"
              onClick={onBack}
              title={detailTexts.back}
              className="p-2.5 rounded-2xl bg-slate-950/80 hover:bg-slate-900 text-white border border-slate-700/80 shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white stroke-[2.5]" />
            </button>
          </div>

          {/* Badges d'organisation et communauté sur l'image */}
          <div className="absolute bottom-4 left-4 sm:left-6 right-4 sm:right-6 space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-cyan-300 font-bold text-xs">
                {campaign.communityName}
              </span>
              {onOpenOrganizationProfile ? (
                <button
                  type="button"
                  onClick={() => onOpenOrganizationProfile(campaign.organizationId)}
                  className="text-slate-300 hover:text-cyan-300 underline underline-offset-2 text-xs transition-colors cursor-pointer font-medium"
                >
                  {detailTexts.by} {campaign.organizationName}
                </button>
              ) : (
                <span className="text-slate-400 text-xs">
                  {detailTexts.by} {campaign.organizationName}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 pt-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight font-display drop-shadow-md">
                {campaignHeaderTranslation.translated && campaignHeaderTranslation.title
                  ? campaignHeaderTranslation.title
                  : campaign.title}
              </h1>
              <div className="shrink-0">
                <TranslateButton
                  compact
                  originalPost={{
                    title: campaign.title,
                    content: campaign.description,
                  }}
                  targetLanguage={language}
                  onTogglePostTranslation={(active, trans) => {
                    setCampaignHeaderTranslation({
                      translated: active,
                      title: trans.title,
                    });
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Corps de la carte de résumé */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Nombre de contributions & participants */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-slate-900/90 text-slate-200 border border-slate-800 text-xs font-bold shadow-xs">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px] font-extrabold text-cyan-400/90 tracking-tight">
                  {allContributions.length}
                </span>
                <span className="text-[11px] text-cyan-300 font-semibold pl-0.5">
                  {strings.contributionsCount}
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-slate-900/90 text-slate-200 border border-slate-800 text-xs font-bold shadow-xs">
                <Users className="w-4 h-4 text-teal-400" />
                <span className="text-[11px] font-extrabold text-teal-400/90 tracking-tight">
                  {campaign.participantsCount}
                </span>
                <span className="text-[11px] text-teal-300 font-semibold pl-0.5">
                  {strings.participants}
                </span>
              </div>
            </div>

            {/* Sélecteur de jours sous forme de liste déroulante */}
            <div className="flex items-center gap-2 min-w-[220px]">
              <label htmlFor="select-campaign-day" className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>{detailTexts.day} :</span>
              </label>
              <select
                id="select-campaign-day"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="flex-1 px-3.5 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer shadow-inner"
              >
                <option value="all">{detailTexts.allDays} ({allContributions.length} {detailTexts.shares})</option>
                {daysList.map((dayNum) => {
                  const act = campaign.activities.find((a) => a.dayNumber === dayNum);
                  const isCurrent = dayNum === currentDay;
                  const isFuture = dayNum > currentDay;
                  return (
                    <option key={dayNum} value={dayNum} disabled={isFuture}>
                      {detailTexts.day} {dayNum} {isCurrent ? `(${detailTexts.today})` : ''} {act ? `- ${act.title.replace(/^Jour \d+\s*:\s*/, '')}` : ''} {isFuture ? '🔒' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Filtre Mur collectif / Espace Privé */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            <button
              type="button"
              id="tab-mur-collectif"
              onClick={() => setActiveTab('wall')}
              className={`flex-1 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'wall'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{detailTexts.collectiveWall}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'wall' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                {allContributions.length}
              </span>
            </button>

            <button
              type="button"
              id="tab-espace-prive"
              onClick={() => setActiveTab('my_space')}
              className={`flex-1 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'my_space'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>{detailTexts.privateSpace}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'my_space' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                {myContributions.length}
              </span>
            </button>
          </div>

        </div>
      </div>

      {/* VUE 1 : LE MUR COLLECTIF */}
      {activeTab === 'wall' && (
        <div className="space-y-6">
          
          {/* BANDEAU DE PARTICIPATION AU JOUR SÉLECTIONNÉ */}
          {activeActivityForSelectedDay && (
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-cyan-950/30 via-slate-900/70 to-slate-900/30 border border-cyan-500/30 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-cyan-500 text-slate-950">
                      {detailTexts.day} {activeActivityForSelectedDay.dayNumber} {activeActivityForSelectedDay.dayNumber === currentDay ? `• ${detailTexts.activeStage}` : ''}
                    </span>
                    <span className="text-xs text-cyan-300 font-semibold flex items-center gap-1">
                      {getActivityTypeLabel(activeActivityForSelectedDay.activityType).icon}
                      <span>{getActivityTypeLabel(activeActivityForSelectedDay.activityType).label}</span>
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{activeActivityForSelectedDay.estimatedMinutes} min</span>
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white pt-1">
                    {activityTranslations[activeActivityForSelectedDay.id]?.translated &&
                    activityTranslations[activeActivityForSelectedDay.id]?.title
                      ? activityTranslations[activeActivityForSelectedDay.id].title
                      : activeActivityForSelectedDay.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <TranslateButton
                    compact
                    originalPost={{
                      title: activeActivityForSelectedDay.title,
                      content: activeActivityForSelectedDay.description,
                      objective: activeActivityForSelectedDay.promptText,
                    }}
                    targetLanguage={language}
                    onTogglePostTranslation={(active, trans) => {
                      setActivityTranslations((prev) => ({
                        ...prev,
                        [activeActivityForSelectedDay.id]: {
                          translated: active,
                          title: trans.title,
                          desc: trans.content,
                          prompt: trans.objective,
                        },
                      }));
                    }}
                  />
                  {userContributedToSelectedDay && (
                    <span className="px-3 py-1 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5 shrink-0 self-start">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{detailTexts.youContributed}</span>
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {activityTranslations[activeActivityForSelectedDay.id]?.translated
                  ? activityTranslations[activeActivityForSelectedDay.id].desc
                  : activeActivityForSelectedDay.description}
              </p>

              {activeActivityForSelectedDay.promptText && (
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs text-cyan-200 italic">
                  « {activityTranslations[activeActivityForSelectedDay.id]?.translated &&
                  activityTranslations[activeActivityForSelectedDay.id]?.prompt
                    ? activityTranslations[activeActivityForSelectedDay.id].prompt
                    : activeActivityForSelectedDay.promptText} »
                </div>
              )}

              {/* BOUTON D'ENVOI DE CONTRIBUTION */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedActivityForModal(activeActivityForSelectedDay)}
                  className="px-7 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all active:scale-95 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {userContributedToSelectedDay
                      ? detailTexts.updateContribution
                      : detailTexts.sendContribution}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* FLUX DE CONTRIBUTIONS */}
          <div className="space-y-4 pt-1">
            {dayFilteredContributions.map((contrib) => (
              <CampaignWallCard
                key={contrib.id}
                contribution={contrib}
                currentUser={currentUser}
                language={language}
                onDeleteContribution={(contribId) => onDeleteContribution?.(campaign.id, contribId)}
                onEditContribution={(contribId, updated) => onEditContribution?.(campaign.id, contribId, updated)}
              />
            ))}

            {dayFilteredContributions.length === 0 && (
              <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/30 border border-slate-800/60 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">
                    {detailTexts.noContributions}
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {detailTexts.noContribsDesc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedActivityForModal(activeActivityForSelectedDay)}
                  className="px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black inline-flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{detailTexts.postFirstTestimony}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VUE 2 : MON ESPACE PERSONNEL */}
      {activeTab === 'my_space' && (
        <div className="space-y-6">
          
          {/* RÉSUMÉ PERSONNEL */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-5 rounded-3xl bg-slate-900/40 border border-slate-800/60 text-center space-y-1">
              <span className="text-2xl font-black text-cyan-400">
                {myContributions.length}
              </span>
              <span className="text-xs text-slate-400 block font-medium">{detailTexts.contributionsDeposited}</span>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/40 border border-slate-800/60 text-center space-y-1">
              <span className="text-2xl font-black text-teal-400">
                {campaign.userCompletedActivitiesCount || 7} / {campaign.durationDays}
              </span>
              <span className="text-xs text-slate-400 block font-medium">{detailTexts.completedDays}</span>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/40 border border-slate-800/60 text-center space-y-1">
              <span className="text-2xl font-black text-amber-400">
                {campaign.rewards?.badgeIcon || '🛡️'}
              </span>
              <span className="text-xs text-slate-400 block font-medium">
                {campaign.rewards?.badgeTitle || 'Badge Résilience'}
              </span>
            </div>
          </div>

          {/* LISTE DES CONTRIBUTIONS DE L'UTILISATEUR */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{detailTexts.myShares}</span>
                <span className="text-xs text-slate-400 font-normal">({myContributions.length})</span>
              </h2>

              <button
                type="button"
                onClick={() => setSelectedActivityForModal(activeActivityForSelectedDay)}
                className="px-4 py-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{detailTexts.newShare} ({detailTexts.day} {currentDay})</span>
              </button>
            </div>

            {myContributions.map((contrib) => (
              <CampaignWallCard
                key={contrib.id}
                contribution={contrib}
                currentUser={currentUser}
                language={language}
                onDeleteContribution={(contribId) => onDeleteContribution?.(campaign.id, contribId)}
                onEditContribution={(contribId, updated) => onEditContribution?.(campaign.id, contribId, updated)}
              />
            ))}

            {myContributions.length === 0 && (
              <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/30 border border-slate-800/60 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
                  <Award className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-white">
                  {detailTexts.noPersonalContribs}
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {detailTexts.noPersonalDesc}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedActivityForModal(activeActivityForSelectedDay)}
                  className="px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black inline-flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{detailTexts.postFirstPersonal} ({detailTexts.day} {currentDay})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALE D'ENVOI OU MODIFICATION DE CONTRIBUTION */}
      {selectedActivityForModal && (
        <ActivityParticipationModal
          isOpen={!!selectedActivityForModal}
          onClose={() => setSelectedActivityForModal(null)}
          campaign={campaign}
          activity={selectedActivityForModal}
          currentUser={currentUser}
          initialContribution={
            myContributions.find(
              (c) =>
                c.activityId === selectedActivityForModal.id ||
                c.dayNumber === selectedActivityForModal.dayNumber
            ) || null
          }
          onSubmitContribution={onSubmitContribution}
          onDeleteContribution={(contribId) => onDeleteContribution?.(campaign.id, contribId)}
          onEditContribution={(contribId, updated) => onEditContribution?.(campaign.id, contribId, updated)}
        />
      )}
    </div>
  );
};
