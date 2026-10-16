import React, { useState } from 'react';
import {
  Trophy,
  PlusCircle,
  Clock,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Award,
  Calendar,
  Layers,
  FileCheck,
  Building2,
  Film,
  Volume2,
  Camera,
  FileText,
  HeartHandshake,
  BookOpen,
  Eye,
  Lock,
  Edit3,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Campaign, CampaignActivity, CampaignActivityType, CampaignExpectedOutput, Community, Organization } from '../../types';

interface PartnerCampaignsProps {
  organization: Organization;
  communities?: Community[];
  campaigns?: Campaign[];
  onCreateCampaign: (newCamp: Partial<Campaign>) => void;
  onUpdateCampaign?: (campaignId: string, updatedData: Partial<Campaign>) => void;
}

export const PartnerCampaigns: React.FC<PartnerCampaignsProps> = ({
  organization,
  communities = [],
  campaigns = [],
  onCreateCampaign,
  onUpdateCampaign,
}) => {
  const [showBuilder, setShowBuilder] = useState(false);
  const [wizardStep, setWizardStep] = useState<number>(1);

  // Edit Campaign Modal State
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editCampTitle, setEditCampTitle] = useState('');
  const [editCampDesc, setEditCampDesc] = useState('');
  const [editCampObjective, setEditCampObjective] = useState('');
  const [editCampAudience, setEditCampAudience] = useState('');
  const [editCampOutcome, setEditCampOutcome] = useState('');
  const [editCampImage, setEditCampImage] = useState('');
  const [editCampDuration, setEditCampDuration] = useState<number>(21);
  const [editCampStatus, setEditCampStatus] = useState<Campaign['status']>('active');
  const [editCampBadgeTitle, setEditCampBadgeTitle] = useState('');
  const [editCampBadgeIcon, setEditCampBadgeIcon] = useState('⭐');

  // 8-step wizard state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objective, setObjective] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [targetCommunityId, setTargetCommunityId] = useState(communities?.[0]?.id || '');
  const [durationDays, setDurationDays] = useState<number>(21);
  const [badgeTitle, setBadgeTitle] = useState('⭐ Cœur d’Or Résilient');
  const [badgeIcon, setBadgeIcon] = useState('⭐');
  const [badgeDescription, setBadgeDescription] = useState('Attribué pour avoir complété le parcours et soutenu ses pairs.');

  // Activities builder with the 8 activity types and expected outputs
  const [activities, setActivities] = useState<Partial<CampaignActivity>[]>([
    {
      id: 'act-1',
      dayNumber: 1,
      phase: 'discover',
      title: 'Jour 1 : Présente-toi sans parler de ton épreuve',
      description: 'Dis-nous ce qui te fait vibrer, ce que tu aimes faire ou rêver.',
      activityType: 'share',
      expectedOutput: 'text',
      promptText: 'Partage en quelques phrases qui tu es au fond de ton cœur.',
      estimatedMinutes: 5,
    },
    {
      id: 'act-2',
      dayNumber: 2,
      phase: 'discover',
      title: 'Jour 2 : Montre un endroit où tu te sens en paix',
      description: 'Une photo d’un lieu réconfortant qui apaise ton esprit.',
      activityType: 'show',
      expectedOutput: 'photo',
      promptText: 'Dépose une photo de ton havre de paix secret.',
      estimatedMinutes: 4,
    },
    {
      id: 'act-8',
      dayNumber: 8,
      phase: 'participate',
      title: 'Jour 8 : Raconte une petite victoire récente dont tu es fière',
      description: 'Partage en vidéo ou audio une victoire qui t’a redonné le sourire.',
      activityType: 'share',
      expectedOutput: 'video',
      promptText: 'Partage ta victoire du jour.',
      estimatedMinutes: 5,
    },
    {
      id: 'act-9',
      dayNumber: 9,
      phase: 'participate',
      title: 'Jour 9 : Envoie un message d’encouragement à une sœur',
      description: 'Choisis une publication sur le mur et laisse un mot chaleureux.',
      activityType: 'encourage',
      expectedOutput: 'interaction',
      promptText: 'Laisse un mot d’amour fraternel.',
      estimatedMinutes: 4,
    },
    {
      id: 'act-21',
      dayNumber: 21,
      phase: 'celebrate',
      title: 'Jour 21 : Célébration Collective & Remise du Badge',
      description: 'Retrouvailles virtuelles et célébration du chemin parcouru ensemble.',
      activityType: 'co_create',
      expectedOutput: 'text',
      promptText: 'Partage ta gratitude envers le cercle.',
      estimatedMinutes: 8,
    },
  ]);

  const [newActTitle, setNewActTitle] = useState('');
  const [newActDesc, setNewActDesc] = useState('');
  const [newActPrompt, setNewActPrompt] = useState('');
  const [newActType, setNewActType] = useState<CampaignActivityType>('share');
  const [newActOutput, setNewActOutput] = useState<CampaignExpectedOutput>('text');
  const [newActPhase, setNewActPhase] = useState<'discover' | 'participate' | 'celebrate'>('discover');

  const orgCommunities = communities.filter((c) => c.organizationId === organization.id);
  const orgCampaigns = campaigns.filter((c) => c.organizationId === organization.id);

  const handleAddActivity = () => {
    if (!newActTitle.trim()) return;
    setActivities((prev) => [
      ...prev,
      {
        id: `act-${Date.now()}`,
        dayNumber: prev.length + 1,
        phase: newActPhase,
        title: newActTitle.trim(),
        description: newActDesc.trim() || 'Activité de résilience quotidienne',
        promptText: newActPrompt.trim() || undefined,
        activityType: newActType,
        expectedOutput: newActOutput,
        estimatedMinutes: 5,
      },
    ]);
    setNewActTitle('');
    setNewActDesc('');
    setNewActPrompt('');
  };

  const handleFinalPublish = () => {
    const defaultComm = { id: 'comm-drepano', name: 'Communauté Résilience' };
    const selectedComm = (communities || []).find((c) => c.id === targetCommunityId) || communities?.[0] || defaultComm;

    onCreateCampaign({
      title: title || 'Parcours de Résilience Collective',
      description: description || 'Un parcours collectif guidé pour se reconstruire pas-à-pas.',
      objective: objective || 'Restaurer la confiance et retisser du lien social.',
      targetAudience: targetAudience || `Membres de ${selectedComm.name}`,
      expectedOutcome: expectedOutcome || 'Production de récits collectifs et obtention du badge officiel.',
      organizationId: organization?.id || 'org-drepano',
      organizationName: organization?.name || 'ONG Partenaire',
      communityId: selectedComm?.id || 'comm-drepano',
      communityName: selectedComm?.name || 'Communauté Résilience',
      durationDays,
      currentDay: 1,
      currentPhase: 'discover',
      status: 'active',
      participantsCount: 1,
      activeParticipantsCount: 1,
      completionRate: 100,
      contributionsCount: 0,
      mediaCounts: {
        videos: 0,
        audios: 0,
        photos: 0,
        texts: 0,
        interactions: 0,
      },
      rules: [
        'Confidentialité absolue : chaque membre choisit qui voit ses productions.',
        'Bienveillance et non-jugement dans les interactions.',
      ],
      rewards: {
        badgeTitle,
        badgeIcon,
        badgeDescription,
      },
      collectiveStory: {
        title: `Mémoire Collective : ${title || 'Notre Parcours'}`,
        summary: `Anthologie vivante des partages et victoires vécus au fil des ${durationDays} jours.`,
        featuredQuotes: [],
        keyLearnings: [
          'La régularité des micro-partages renforce l’estime de soi.',
          'La validation par les pairs désamorce la solitude.',
        ],
        totalContributions: 0,
      },
      activities: activities as CampaignActivity[],
    });

    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.6 },
    });

    setShowBuilder(false);
    setWizardStep(1);
  };

  const handleStartEditCamp = (camp: Campaign) => {
    setEditingCampaign(camp);
    setEditCampTitle(camp.title);
    setEditCampDesc(camp.description);
    setEditCampObjective(camp.objective || '');
    setEditCampAudience(camp.targetAudience || '');
    setEditCampOutcome(camp.expectedOutcome || '');
    setEditCampImage(camp.image || '');
    setEditCampDuration(camp.durationDays || 21);
    setEditCampStatus(camp.status || 'active');
    setEditCampBadgeTitle(camp.rewards?.badgeTitle || '⭐ Cœur d’Or Résilient');
    setEditCampBadgeIcon(camp.rewards?.badgeIcon || '⭐');
  };

  const handleEditCampSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign || !editCampTitle.trim()) return;

    const updatedData: Partial<Campaign> = {
      title: editCampTitle.trim(),
      description: editCampDesc.trim(),
      objective: editCampObjective.trim(),
      targetAudience: editCampAudience.trim(),
      expectedOutcome: editCampOutcome.trim(),
      image: editCampImage.trim() || editingCampaign.image,
      durationDays: editCampDuration,
      status: editCampStatus,
      rewards: {
        ...editingCampaign.rewards,
        badgeTitle: editCampBadgeTitle.trim() || editingCampaign.rewards.badgeTitle,
        badgeIcon: editCampBadgeIcon.trim() || editingCampaign.rewards.badgeIcon,
      },
    };

    if (onUpdateCampaign) {
      onUpdateCampaign(editingCampaign.id, updatedData);
    }
    setEditingCampaign(null);
  };

  return (
    <div className="space-y-8">
      
      {/* 1. HEADER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#11192b] border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-extrabold uppercase tracking-widest">
            <Trophy className="w-4 h-4" />
            <span>Studio des Expériences Collectives</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Campagnes & Parcours de Résilience
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Créez des parcours structurés en 3 phases où chaque activité quotidienne invite les membres à produire un contenu (audio, photo, vidéo, récit) pour nourrir la communauté.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowBuilder(true)}
          className="px-6 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-xl shadow-cyan-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Créer un Parcours (8 Étapes)</span>
        </button>
      </div>

      {/* 2. ACTIVE CAMPAIGNS LIST & COLLECTIVE IMPACT */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-white">
          Campagnes pilotées par votre organisation ({orgCampaigns.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {orgCampaigns.map((camp) => (
            <div
              key={camp.id}
              className="p-6 rounded-3xl bg-[#0e1628] border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20">
                    {camp.communityName}
                  </span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {camp.durationDays} jours (Jour {camp.currentDay || 1})
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white">
                  {camp.title}
                </h3>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {camp.description}
                </p>

                {/* Media outputs generated */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <div className="font-bold text-cyan-300">{camp.mediaCounts?.videos || 0}</div>
                    <div className="text-[10px] text-slate-400">Vidéos</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <div className="font-bold text-cyan-300">{camp.mediaCounts?.audios || 0}</div>
                    <div className="text-[10px] text-slate-400">Audios</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <div className="font-bold text-cyan-300">{camp.mediaCounts?.photos || 0}</div>
                    <div className="text-[10px] text-slate-400">Photos</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <div className="font-bold text-cyan-300">{camp.mediaCounts?.texts || 0}</div>
                    <div className="text-[10px] text-slate-400">Récits</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-800 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    {camp.participantsCount} participants actifs
                  </span>
                  <span className="text-amber-400 font-bold">
                    {camp.rewards.badgeIcon} {camp.rewards.badgeTitle}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span>{camp.activities.length} activités programmées</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                    Active • {camp.completionRate || 80}% assiduité
                  </span>
                </div>

                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Durée : {camp.durationDays} jours
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStartEditCamp(camp)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                    title="Modifier les contenus de la campagne"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Modifier la campagne</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 8-STEP CAMPAIGN STUDIO WIZARD */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-[#0d1527] rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Studio de Campagne Collective (Étape {wizardStep}/8)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Modèle d’engagement participatif et confidentiel Tulizaana
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBuilder(false)}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress */}
            <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0">
              {[
                '1. Mission',
                '2. Cercle',
                '3. Durée & Phases',
                '4. Activités',
                '5. Productions',
                '6. Confidentialité',
                '7. Récompense',
                '8. Publier',
              ].map((stepLabel, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    wizardStep === idx + 1
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : wizardStep > idx + 1
                      ? 'bg-slate-800 text-cyan-400'
                      : 'text-slate-500'
                  }`}
                >
                  {stepLabel}
                </div>
              ))}
            </div>

            {/* Wizard Body */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-5">
              
              {/* STEP 1: MISSION & OBJECTIFS */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-base font-bold text-white">
                    Étape 1 : Mission, Intention & Résultat Collectif
                  </h4>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Titre du parcours :
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex : 21 jours pour reprendre confiance et habiter son corps"
                      className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-hidden focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Description du voyage collectif :
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Expliquez comment chaque jour invite les membres à faire un geste et partager..."
                      className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-hidden focus:border-cyan-400"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Objectif Collectif :
                      </label>
                      <input
                        type="text"
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        placeholder="Ex : Restaurer le sentiment de sécurité intérieure"
                        className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Résultat attendu à la fin :
                      </label>
                      <input
                        type="text"
                        value={expectedOutcome}
                        onChange={(e) => setExpectedOutcome(e.target.value)}
                        placeholder="Ex : Création du recueil d’audios et de témoignages"
                        className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: CERCLE DE DESTINATION */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-base font-bold text-white">
                    Étape 2 : Sélectionner la communauté / cercle de destination
                  </h4>
                  <p className="text-xs text-slate-300">
                    Ce parcours sera ancré dans la communauté sélectionnée.
                  </p>
                  <div className="space-y-2">
                    {orgCommunities.map((comm) => (
                      <div
                        key={comm.id}
                        onClick={() => setTargetCommunityId(comm.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          targetCommunityId === comm.id
                            ? 'bg-cyan-950/40 border-cyan-400 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <h5 className="font-bold text-sm text-white">{comm.name}</h5>
                          <span className="text-xs text-slate-400">{comm.membersCount} membres protégés</span>
                        </div>
                        {targetCommunityId === comm.id && (
                          <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: DURÉE ET 3 PHASES */}
              {wizardStep === 3 && (
                <div className="space-y-5">
                  <h4 className="text-base font-bold text-white">
                    Étape 3 : Durée et Structure en 3 Phases
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[7, 14, 21, 30].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setDurationDays(days)}
                        className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                          durationDays === days
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xl font-extrabold">{days}</div>
                        <div className="text-xs font-bold">Jours</div>
                      </button>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                    <span className="font-bold text-white block">Architecture standard des 3 phases :</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-300">
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <strong className="text-cyan-400 block mb-1">Phase 1 : Se Découvrir</strong>
                        <span>Micro-rituels d’ancrage et prise de contact sans honte.</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <strong className="text-cyan-400 block mb-1">Phase 2 : Participer</strong>
                        <span>Partages d’audios, victoires, photos et soutiens mutuels.</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <strong className="text-cyan-400 block mb-1">Phase 3 : Célébrer</strong>
                        <span>Tissage de l’Histoire Collective et ancrage des acquis.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: ACTIVITÉS (8 TYPES) */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <h4 className="text-base font-bold text-white">
                    Étape 4 : Définir les activités quotidiennes ({activities.length})
                  </h4>

                  {/* Existing activities list */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {activities.map((act, i) => (
                      <div
                        key={act.id || i}
                        className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-cyan-400">Jour {act.dayNumber} :</span>
                            <span className="text-white font-semibold">{act.title}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Type: {act.activityType} • Format attendu: {act.expectedOutput}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add activity */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-slate-300 block">
                      + Ajouter une activité quotidienne :
                    </span>
                    <input
                      type="text"
                      value={newActTitle}
                      onChange={(e) => setNewActTitle(e.target.value)}
                      placeholder="Titre (Ex : Jour 10 : Raconter une petite victoire)"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={newActPrompt}
                      onChange={(e) => setNewActPrompt(e.target.value)}
                      placeholder="Consigne d'invitation (Ex : Partage en vidéo ou audio ta victoire...)"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        value={newActPhase}
                        onChange={(e) => setNewActPhase(e.target.value as any)}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                      >
                        <option value="discover">Phase 1 : Se Découvrir</option>
                        <option value="participate">Phase 2 : Participer</option>
                        <option value="celebrate">Phase 3 : Célébrer</option>
                      </select>

                      <select
                        value={newActType}
                        onChange={(e) => setNewActType(e.target.value as any)}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                      >
                        <option value="share">Partager (share)</option>
                        <option value="respond">Répondre (respond)</option>
                        <option value="show">Montrer (show)</option>
                        <option value="listen_watch">Écouter/Regarder (listen_watch)</option>
                        <option value="encourage">Encourager (encourage)</option>
                        <option value="question">Questionner (question)</option>
                        <option value="act">Agir (act)</option>
                        <option value="co_create">Créer ensemble (co_create)</option>
                      </select>

                      <select
                        value={newActOutput}
                        onChange={(e) => setNewActOutput(e.target.value as any)}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                      >
                        <option value="text">Format : Texte</option>
                        <option value="audio">Format : Audio</option>
                        <option value="video">Format : Vidéo</option>
                        <option value="photo">Format : Photo</option>
                        <option value="interaction">Format : Soutien</option>
                      </select>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddActivity}
                        className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold cursor-pointer"
                      >
                        Ajouter l’activité
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: PRODUCTIONS ATTENDUES & MÉMOIRE */}
              {wizardStep === 5 && (
                <div className="space-y-4">
                  <h4 className="text-base font-bold text-white">
                    Étape 5 : Transformation de la participation en Contenus & Mémoire Collective
                  </h4>
                  <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/30 text-xs text-cyan-200 leading-relaxed space-y-2">
                    <p className="font-bold text-white">Principe fondamental de Tulizaana :</p>
                    <p>
                      Une campagne n’est pas une simple liste de tâches. Les contributions des membres alimentent automatiquement le Mur de la Campagne et seront compilées dans l’Œuvre Collective au terme des {durationDays} jours.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
                      <Volume2 className="w-5 h-5 text-cyan-400 mx-auto" />
                      <span className="font-bold text-white block">Audios</span>
                      <span className="text-[11px] text-slate-400">Voix & capsules</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
                      <Film className="w-5 h-5 text-cyan-400 mx-auto" />
                      <span className="font-bold text-white block">Vidéos</span>
                      <span className="text-[11px] text-slate-400">Courts témoignages</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
                      <Camera className="w-5 h-5 text-cyan-400 mx-auto" />
                      <span className="font-bold text-white block">Photos</span>
                      <span className="text-[11px] text-slate-400">Havres & symboles</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
                      <FileText className="w-5 h-5 text-cyan-400 mx-auto" />
                      <span className="font-bold text-white block">Récits</span>
                      <span className="text-[11px] text-slate-400">Textes & devises</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: CONFIDENTIALITÉ */}
              {wizardStep === 6 && (
                <div className="space-y-4">
                  <h4 className="text-base font-bold text-white">
                    Étape 6 : Règles de Confidentialité et Sécurité Psychologique
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                      <Lock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block font-bold mb-0.5">
                          La confidentialité prime sur l'engagement
                        </strong>
                        <span className="text-slate-300">
                          Chaque participant peut choisir la visibilité de son contenu (Participants uniquement, Communauté complète, ou Privé pour lui seul).
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                      <Eye className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block font-bold mb-0.5">
                          Option de pseudonyme systématique
                        </strong>
                        <span className="text-slate-300">
                          Les membres peuvent s'exprimer sous le pseudonyme protecteur « Membre Solidaire ».
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7: RÉCOMPENSE ET BADGE */}
              {wizardStep === 7 && (
                <div className="space-y-4">
                  <h4 className="text-base font-bold text-white">
                    Étape 7 : Badge Officiel de Résilience
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Titre du badge :
                      </label>
                      <input
                        type="text"
                        value={badgeTitle}
                        onChange={(e) => setBadgeTitle(e.target.value)}
                        className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Émoji / Symbole :
                      </label>
                      <input
                        type="text"
                        value={badgeIcon}
                        onChange={(e) => setBadgeIcon(e.target.value)}
                        className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Critère d’attribution :
                    </label>
                    <input
                      type="text"
                      value={badgeDescription}
                      onChange={(e) => setBadgeDescription(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {/* STEP 8: APERÇU ET PUBLICATION */}
              {wizardStep === 8 && (
                <div className="space-y-4 text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center mx-auto text-2xl animate-pulse">
                    ✨
                  </div>
                  <h4 className="text-lg font-bold text-white">
                    Prêt à lancer le parcours : « {title || 'Sans titre'} »
                  </h4>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    {durationDays} jours • {activities.length} activités • 3 phases • Recueil d’Histoire Collective activé.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                disabled={wizardStep === 1}
                onClick={() => setWizardStep((s) => s - 1)}
                className="px-4 py-2.5 rounded-2xl bg-slate-900 text-slate-300 text-xs font-bold disabled:opacity-30 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Précédent</span>
              </button>

              {wizardStep < 8 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((s) => s + 1)}
                  className="px-6 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  <span>Suivant</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalPublish}
                  className="px-8 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-xl shadow-cyan-500/30 cursor-pointer"
                >
                  Lancer la Campagne Collective
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT CAMPAIGN MODAL */}
      {editingCampaign && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#11192b] rounded-3xl border border-slate-700 p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">
                    Modifier la Campagne
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {editingCampaign.id} • {editingCampaign.communityName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCampaign(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditCampSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Titre du parcours / campagne :
                </label>
                <input
                  type="text"
                  required
                  value={editCampTitle}
                  onChange={(e) => setEditCampTitle(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Durée du parcours :
                  </label>
                  <select
                    value={editCampDuration}
                    onChange={(e) => setEditCampDuration(parseInt(e.target.value) || 21)}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                  >
                    <option value={7}>7 Jours (Sprint découverte)</option>
                    <option value={14}>14 Jours (Renforcement)</option>
                    <option value={21}>21 Jours (Parcours standard)</option>
                    <option value={30}>30 Jours (Mois de la résilience)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Statut de la campagne :
                  </label>
                  <select
                    value={editCampStatus}
                    onChange={(e) => setEditCampStatus(e.target.value as Campaign['status'])}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="active">Active (En cours)</option>
                    <option value="upcoming">À venir (Planifiée)</option>
                    <option value="draft">Brouillon</option>
                    <option value="completed">Terminée / Archivée</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Image de couverture (URL) :
                </label>
                <input
                  type="url"
                  value={editCampImage}
                  onChange={(e) => setEditCampImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Description détaillée du parcours :
                </label>
                <textarea
                  rows={3}
                  required
                  value={editCampDesc}
                  onChange={(e) => setEditCampDesc(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    🎯 Objectif d'impact :
                  </label>
                  <input
                    type="text"
                    value={editCampObjective}
                    onChange={(e) => setEditCampObjective(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    👥 Public cible :
                  </label>
                  <input
                    type="text"
                    value={editCampAudience}
                    onChange={(e) => setEditCampAudience(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  🏆 Résultat attendu :
                </label>
                <input
                  type="text"
                  value={editCampOutcome}
                  onChange={(e) => setEditCampOutcome(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                  Récompense de fin de parcours
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Nom du Badge</label>
                    <input
                      type="text"
                      value={editCampBadgeTitle}
                      onChange={(e) => setEditCampBadgeTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Icône / Emoji</label>
                    <input
                      type="text"
                      value={editCampBadgeIcon}
                      onChange={(e) => setEditCampBadgeIcon(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCampaign(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
