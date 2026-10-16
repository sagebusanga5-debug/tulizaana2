import React from 'react';
import {
  Users,
  Trophy,
  ShieldAlert,
  BarChart3,
  TrendingUp,
  Sparkles,
  ArrowRight,
  PlusCircle,
  KeyRound,
  FileText,
} from 'lucide-react';
import { Organization, PartnerMetrics, PartnerTab, Language } from '../../types';
import { t } from '../../translations';

interface PartnerDashboardProps {
  organization: Organization;
  metrics: PartnerMetrics;
  language?: Language;
  onNavigateTab: (tab: PartnerTab) => void;
  onOpenCreateCampaign: () => void;
  onOpenInviteGenerator: () => void;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({
  organization,
  metrics,
  language = 'fr',
  onNavigateTab,
  onOpenCreateCampaign,
  onOpenInviteGenerator,
}) => {
  const strings = t[language]?.partnerPortal || t.fr.partnerPortal;

  const dashboardTexts = {
    fr: {
      subtitle: "Indicateurs d'impact, communautés actives et quotas en temps réel.",
      accessCodes: "Codes d'Accès",
      newCampaign: "Nouvelle Campagne",
      activeMembers: "Membres Actifs",
      thisMonth: "ce mois",
      completionRate: "Taux Complétion",
      activeCampaigns: "campagnes en cours",
      supportGiven: "Soutiens Émis",
      fraternalInteractions: "Interactions fraternelles",
      moderation: "Modération",
      reportsToHandle: "Signalements à traiter",
      calmSpace: "Espace serein",
      quotaTitle: "Quotas & Utilisation Forfait",
      details: "Détails",
      members: "Membres",
      campaigns: "Campagnes",
      communities: "Communautés",
      donorReports: "Rapports Bailleurs",
      donorReportsSub: "Export PDF trimestriel certifié",
      rolesAmbassadors: "Rôles & Ambassadeurs",
      rolesSub: "Gestion des permissions",
      impactAnalytics: "Analytique d'Impact",
      analyticsSub: "Graphes & bienveillance",
    },
    sw: {
      subtitle: "Vipimo vya athari, jamii zinazofanya kazi na nafasi zilizotengwa kwa wakati halisi.",
      accessCodes: "Nambari za Kuingia",
      newCampaign: "Kampeni Mpya",
      activeMembers: "Wanachama Walio Hai",
      thisMonth: "mwezi huu",
      completionRate: "Kiwango cha Kukamilisha",
      activeCampaigns: "kampeni zinazoendelea",
      supportGiven: "Msaada Uliotolewa",
      fraternalInteractions: "Mwingiliano wa mshikamano",
      moderation: "Udhibiti & Usalama",
      reportsToHandle: "Ripoti zinazosubiri",
      calmSpace: "Nafasi ya amani",
      quotaTitle: "Vipimo & Matumizi ya Kifurushi",
      details: "Maelezo",
      members: "Wanachama",
      campaigns: "Kampeni",
      communities: "Jamii",
      donorReports: "Ripoti za Wafadhili",
      donorReportsSub: "Faili ya PDF ya kila robo mwaka",
      rolesAmbassadors: "Majukumu & Mabalozi",
      rolesSub: "Usimamizi wa idhini",
      impactAnalytics: "Uchambuzi wa Athari",
      analyticsSub: "Chati & mshikamano",
    },
    en: {
      subtitle: "Impact metrics, active communities, and real-time package quotas.",
      accessCodes: "Access Codes",
      newCampaign: "New Campaign",
      activeMembers: "Active Members",
      thisMonth: "this month",
      completionRate: "Completion Rate",
      activeCampaigns: "active campaigns",
      supportGiven: "Support Sent",
      fraternalInteractions: "Empathetic interactions",
      moderation: "Moderation",
      reportsToHandle: "Reports to review",
      calmSpace: "Harmonious space",
      quotaTitle: "Quotas & Plan Usage",
      details: "Details",
      members: "Members",
      campaigns: "Campaigns",
      communities: "Communities",
      donorReports: "Donor Reports",
      donorReportsSub: "Certified quarterly PDF export",
      rolesAmbassadors: "Roles & Ambassadors",
      rolesSub: "Permission management",
      impactAnalytics: "Impact Analytics",
      analyticsSub: "Charts & community health",
    },
  }[language] || {
    subtitle: "Indicateurs d'impact, communautés actives et quotas en temps réel.",
    accessCodes: "Codes d'Accès",
    newCampaign: "Nouvelle Campagne",
    activeMembers: "Membres Actifs",
    thisMonth: "ce mois",
    completionRate: "Taux Complétion",
    activeCampaigns: "campagnes en cours",
    supportGiven: "Soutiens Émis",
    fraternalInteractions: "Interactions fraternelles",
    moderation: "Modération",
    reportsToHandle: "Signalements à traiter",
    calmSpace: "Espace serein",
    quotaTitle: "Quotas & Utilisation Forfait",
    details: "Détails",
    members: "Membres",
    campaigns: "Campagnes",
    communities: "Communautés",
    donorReports: "Rapports Bailleurs",
    donorReportsSub: "Export PDF trimestriel certifié",
    rolesAmbassadors: "Rôles & Ambassadeurs",
    rolesSub: "Gestion des permissions",
    impactAnalytics: "Analytique d'Impact",
    analyticsSub: "Graphes & bienveillance",
  };

  return (
    <div className="space-y-6">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight">
              {strings.dashboard}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-[11px] font-semibold border border-cyan-500/20">
              {organization.name}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {dashboardTexts.subtitle}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenInviteGenerator}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            <span>{dashboardTexts.accessCodes}</span>
          </button>

          <button
            onClick={onOpenCreateCampaign}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{dashboardTexts.newCampaign}</span>
          </button>
        </div>
      </div>

      {/* 4 PRIMARY KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* 1. Membres Actifs */}
        <div
          onClick={() => onNavigateTab('members')}
          className="p-4 sm:p-5 rounded-2xl bg-[#111827] border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {dashboardTexts.activeMembers}
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            {metrics.totalMembers.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+{metrics.monthlyGrowthPercent}% {dashboardTexts.thisMonth}</span>
          </div>
        </div>

        {/* 2. Complétion Campagnes */}
        <div
          onClick={() => onNavigateTab('campaigns')}
          className="p-4 sm:p-5 rounded-2xl bg-[#111827] border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {dashboardTexts.completionRate}
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20 transition-colors">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            {metrics.campaignCompletionRate}%
          </div>
          <div className="text-[11px] text-slate-400">
            {metrics.activeCampaignsCount} {dashboardTexts.activeCampaigns}
          </div>
        </div>

        {/* 3. Soutiens Échangés */}
        <div
          onClick={() => onNavigateTab('analytics')}
          className="p-4 sm:p-5 rounded-2xl bg-[#111827] border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {dashboardTexts.supportGiven}
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 transition-colors">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            {metrics.totalSupportReactions.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            {dashboardTexts.fraternalInteractions}
          </div>
        </div>

        {/* 4. Modération & Sécurité */}
        <div
          onClick={() => onNavigateTab('moderation')}
          className="p-4 sm:p-5 rounded-2xl bg-[#111827] border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {dashboardTexts.moderation}
            </span>
            <div className={`p-2 rounded-xl ${metrics.pendingReportsCount > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            {metrics.pendingReportsCount}
          </div>
          <div className="text-[11px] text-slate-400">
            {metrics.pendingReportsCount > 0
              ? dashboardTexts.reportsToHandle
              : dashboardTexts.calmSpace}
          </div>
        </div>
      </div>

      {/* QUOTA USAGE & SUBSCRIPTION STATUS */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#111827] border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white font-display">
              {dashboardTexts.quotaTitle}
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 font-mono text-[10px] uppercase font-bold">
              {organization.subscriptionPlan || 'growth'}
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('subscription')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            <span>{dashboardTexts.details}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Members Quota */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">{dashboardTexts.members}</span>
              <span className="font-mono text-cyan-400 font-bold">
                {(organization.quotaMembers?.used || 0).toLocaleString()} / {(organization.quotaMembers?.max || 5000).toLocaleString()}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                style={{
                  width: `${Math.min(100, ((organization.quotaMembers?.used || 0) / (organization.quotaMembers?.max || 5000)) * 100)}%`,
                }}
                className="h-full bg-cyan-400 rounded-full"
              />
            </div>
          </div>

          {/* Campaigns Quota */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">{dashboardTexts.campaigns}</span>
              <span className="font-mono text-teal-400 font-bold">
                {organization.quotaCampaignsPerMonth?.used || 0} / {organization.quotaCampaignsPerMonth?.max || 10}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                style={{
                  width: `${Math.min(100, ((organization.quotaCampaignsPerMonth?.used || 0) / (organization.quotaCampaignsPerMonth?.max || 10)) * 100)}%`,
                }}
                className="h-full bg-teal-400 rounded-full"
              />
            </div>
          </div>

          {/* Communities Quota */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">{dashboardTexts.communities}</span>
              <span className="font-mono text-amber-400 font-bold">
                {organization.quotaCommunities?.used || 0} / {organization.quotaCommunities?.max || 5}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                style={{
                  width: `${Math.min(100, ((organization.quotaCommunities?.used || 0) / (organization.quotaCommunities?.max || 5)) * 100)}%`,
                }}
                className="h-full bg-amber-400 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* QUICK SHORTCUTS TO SUB-MODULES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => onNavigateTab('reports')}
          className="p-4 rounded-2xl bg-[#111827] border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer flex items-center gap-3.5 group"
        >
          <div className="p-2.5 rounded-xl bg-slate-800/80 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
              {dashboardTexts.donorReports}
            </h3>
            <p className="text-[11px] text-slate-400 truncate">
              {dashboardTexts.donorReportsSub}
            </p>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
        </div>

        <div
          onClick={() => onNavigateTab('members')}
          className="p-4 rounded-2xl bg-[#111827] border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer flex items-center gap-3.5 group"
        >
          <div className="p-2.5 rounded-xl bg-slate-800/80 text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-950 transition-colors">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors truncate">
              {dashboardTexts.rolesAmbassadors}
            </h3>
            <p className="text-[11px] text-slate-400 truncate">
              {dashboardTexts.rolesSub}
            </p>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
        </div>

        <div
          onClick={() => onNavigateTab('analytics')}
          className="p-4 rounded-2xl bg-[#111827] border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer flex items-center gap-3.5 group"
        >
          <div className="p-2.5 rounded-xl bg-slate-800/80 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
              {dashboardTexts.impactAnalytics}
            </h3>
            <p className="text-[11px] text-slate-400 truncate">
              {dashboardTexts.analyticsSub}
            </p>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </div>
  );
};
