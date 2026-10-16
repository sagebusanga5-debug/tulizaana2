import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  Users,
  Award,
  ArrowRight,
  Target,
  CheckCircle2,
  Flame,
  MessageSquare,
  ChevronRight,
  Volume2,
  Film,
  Camera,
  FileText,
} from 'lucide-react';
import { Campaign, CampaignContribution, UserProfile, Language } from '../../types';
import { CampaignDetailView } from './campaigns/CampaignDetailView';
import { t } from '../../translations';
import { TranslateButton } from '../common/TranslateButton';

interface CampaignsViewProps {
  campaigns: Campaign[];
  currentUser?: UserProfile;
  language?: Language;
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

export const CampaignsView: React.FC<CampaignsViewProps> = ({
  campaigns,
  currentUser,
  language = 'fr',
  onJoinCampaign,
  onOpenOrganizationProfile,
  onSubmitContribution,
  onDeleteContribution,
  onEditContribution,
}) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [translatedCards, setTranslatedCards] = useState<
    Record<string, { translated: boolean; title?: string; desc: string; objective?: string }>
  >({});

  const strings = t[language]?.campaignsView || t.fr.campaignsView;

  // If a campaign is selected, render the dedicated Detail View directly
  if (selectedCampaignId) {
    const selectedCamp = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];
    return (
      <CampaignDetailView
        campaign={selectedCamp}
        currentUser={currentUser}
        language={language}
        onBack={() => setSelectedCampaignId(null)}
        onJoinCampaign={onJoinCampaign}
        onOpenOrganizationProfile={onOpenOrganizationProfile}
        onSubmitContribution={onSubmitContribution}
        onDeleteContribution={onDeleteContribution}
        onEditContribution={onEditContribution}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* CAMPAIGN CARDS LIST */}
      <div className="space-y-8">
        {campaigns.map((camp) => {
          const currentDay = camp.currentDay || 8;
          const completedActivities = camp.userCompletedActivitiesCount || 7;
          const progress = Math.round((completedActivities / camp.durationDays) * 100);
          const hasStarted = (camp.userCompletedActivitiesCount || 0) > 0;
          const contributionsTotal = camp.contributions?.length || camp.activities?.reduce((acc, act) => acc + (act.contributionsCount || 0), 0) || 18;
          const cardTrans = translatedCards[camp.id];

          return (
            <div
              key={camp.id}
              onClick={() => setSelectedCampaignId(camp.id)}
              className="group bg-[#111827] rounded-3xl border border-slate-800/90 shadow-xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300 cursor-pointer flex flex-col"
            >
              {/* LARGE PRESENTATION IMAGE / VIDEO BANNER */}
              <div className="w-full h-64 sm:h-80 md:h-96 relative overflow-hidden bg-slate-950">
                <img
                  src={camp.image}
                  alt={camp.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                />
                
                {/* Visual subtle dark gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-black/30" />

                {/* Top Badges */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-cyan-300 font-bold text-xs shadow-md">
                      {camp.communityName}
                    </span>
                    <span className="px-3.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-slate-300 font-medium text-xs flex items-center gap-1.5 shadow-md">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      {camp.durationDays} {strings.days}
                    </span>
                  </div>
                </div>

                {/* Bottom Image Info Banner */}
                <div className="absolute bottom-4 left-4 sm:left-6 right-4 sm:right-6 space-y-1">
                  {onOpenOrganizationProfile ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenOrganizationProfile(camp.organizationId);
                      }}
                      className="text-[11px] text-cyan-300 hover:text-white font-semibold uppercase tracking-wider block underline underline-offset-2 transition-colors cursor-pointer"
                      title={`Voir le profil de l'organisation ${camp.organizationName}`}
                    >
                      {strings.by} {camp.organizationName}
                    </button>
                  ) : (
                    <span className="text-[11px] text-cyan-300 font-semibold uppercase tracking-wider block">
                      {strings.by} {camp.organizationName}
                    </span>
                  )}
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight font-display drop-shadow-md">
                    {cardTrans?.translated && cardTrans.title ? cardTrans.title : camp.title}
                  </h2>
                </div>
              </div>

              {/* PROGRESS BAR */}
              <div className="w-full bg-slate-900 border-b border-slate-800/80 px-6 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>
                    {hasStarted ? `${strings.progress} : ${progress}%` : strings.notStarted}
                  </span>
                </div>

                <div className="flex-1 max-w-md h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800/80">
                  <div
                    style={{ width: `${hasStarted ? progress : 0}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-500"
                  />
                </div>
              </div>

              {/* CARD CONTENT BODY */}
              <div className="p-6 sm:p-7 space-y-5 flex-1 flex flex-col justify-between">
                
                <div className="space-y-4">
                  {/* Dynamic translation trigger */}
                  <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <TranslateButton
                      originalPost={{
                        title: camp.title,
                        content: camp.description,
                        objective: camp.objective,
                      }}
                      targetLanguage={language}
                      onTogglePostTranslation={(active, trans) => {
                        setTranslatedCards((prev) => ({
                          ...prev,
                          [camp.id]: {
                            translated: active,
                            title: trans.title,
                            desc: trans.content,
                            objective: trans.objective,
                          },
                        }));
                      }}
                    />
                  </div>

                  {/* 1. Short Description */}
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {cardTrans?.translated && cardTrans.desc ? cardTrans.desc : camp.description}
                  </p>

                  {/* 2. OBJECTIF (Sans bordure) */}
                  {camp.objective && (
                    <div className="p-4 rounded-2xl bg-cyan-950/20 space-y-1.5">
                      <div className="flex items-center gap-2 text-cyan-400 text-xs font-black uppercase tracking-wider">
                        <Target className="w-4 h-4 text-cyan-400" />
                        <span>{strings.goal}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        {cardTrans?.translated && cardTrans.objective ? cardTrans.objective : camp.objective}
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. CONTRIBUTIONS & PARTICIPANTS RESPECTANT LE DESIGN DES RÉACTIONS DU FIL */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    {/* Bouton pillule Contributions style réaction */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/90 text-slate-200 border border-slate-800 text-xs font-bold shadow-xs">
                      <MessageSquare className="w-4 h-4 text-cyan-400" />
                      <span className="text-[11px] font-extrabold text-cyan-400/90 tracking-tight">
                        {contributionsTotal}
                      </span>
                      <span className="text-[11px] text-cyan-300 font-semibold pl-0.5">
                        {strings.contributionsCount}
                      </span>
                    </div>

                    {/* Bouton pillule Participants style réaction */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/90 text-slate-200 border border-slate-800 text-xs font-bold shadow-xs">
                      <Users className="w-4 h-4 text-teal-400" />
                      <span className="text-[11px] font-extrabold text-teal-400/90 tracking-tight">
                        {camp.participantsCount}
                      </span>
                      <span className="text-[11px] text-teal-300 font-semibold pl-0.5">
                        {strings.participants}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. BOUTON PARTICIPER / CONTINUER QUI PREND TOUT L'ESPACE EN BAS */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!hasStarted && onJoinCampaign) {
                        onJoinCampaign(camp.id);
                      }
                      setSelectedCampaignId(camp.id);
                    }}
                    className="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer shadow-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25"
                  >
                    <span>{hasStarted ? strings.continue : strings.join}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
