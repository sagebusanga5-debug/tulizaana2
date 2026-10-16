import React, { useState } from 'react';
import {
  Award,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  Trash2,
  Eye,
  Calendar,
  Users,
  Target,
  ChevronRight,
  X,
  FileText,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Campaign } from '../../types';

interface AdminCampaignsTabProps {
  campaigns: Campaign[];
  onUpdateCampaign?: (campaignId: string, updatedFields: Partial<Campaign>) => void;
  onDeleteCampaign?: (campaignId: string) => void;
  onShowToast: (msg: string) => void;
  onRecordLog: (action: string, resource: string, details: string) => void;
}

export const AdminCampaignsTab: React.FC<AdminCampaignsTabProps> = ({
  campaigns,
  onUpdateCampaign,
  onDeleteCampaign,
  onShowToast,
  onRecordLog,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'upcoming' | 'draft' | 'completed'>('all');
  const [selectedCampaignForDetails, setSelectedCampaignForDetails] = useState<Campaign | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);

  const filteredCampaigns = campaigns.filter((camp) => {
    const matchesStatus = statusFilter === 'all' || camp.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      camp.title.toLowerCase().includes(q) ||
      camp.organizationName.toLowerCase().includes(q) ||
      camp.communityName.toLowerCase().includes(q) ||
      camp.objective.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
  const totalParticipants = campaigns.reduce((acc, c) => acc + (c.participantsCount || 0), 0);
  const avgCompletion =
    campaigns.length > 0
      ? Math.round(campaigns.reduce((acc, c) => acc + (c.completionRate || 0), 0) / campaigns.length)
      : 0;

  const handleActivate = (camp: Campaign) => {
    if (onUpdateCampaign) {
      onUpdateCampaign(camp.id, { status: 'active' });
    }
    onShowToast(`Campagne « ${camp.title} » activée avec succès`);
    onRecordLog('Activation Campagne', camp.title, `Statut mis à jour vers Actif pour l'organisation ${camp.organizationName}`);
  };

  const handlePause = (camp: Campaign) => {
    if (onUpdateCampaign) {
      onUpdateCampaign(camp.id, { status: 'draft' });
    }
    onShowToast(`Campagne « ${camp.title} » mise en pause`);
    onRecordLog('Suspension Campagne', camp.title, `Campagne mise en pause/brouillon temporaire`);
  };

  const handleComplete = (camp: Campaign) => {
    if (onUpdateCampaign) {
      onUpdateCampaign(camp.id, { status: 'completed' });
    }
    onShowToast(`Campagne « ${camp.title} » marquée comme terminée`);
    onRecordLog('Clôture Campagne', camp.title, `Campagne achevée avec succès`);
  };

  const handleConfirmDelete = () => {
    if (!campaignToDelete) return;
    if (onDeleteCampaign) {
      onDeleteCampaign(campaignToDelete.id);
    }
    onShowToast(`Campagne « ${campaignToDelete.title} » supprimée du système`);
    onRecordLog('Suppression Campagne', campaignToDelete.title, `Supprimée par l'administrateur central`);
    setCampaignToDelete(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Campagnes</span>
            <Award className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalCampaigns}</p>
          <span className="text-[11px] text-cyan-400">Tous cercles confondus</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Campagnes Actives</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{activeCampaigns}</p>
          <span className="text-[11px] text-slate-400">En cours de déroulement</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Participants Engagés</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">{totalParticipants}</p>
          <span className="text-[11px] text-slate-400">Bénéficiaires actifs</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Complétion Moyenne</span>
            <Target className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-indigo-400 mt-2">{avgCompletion}%</p>
          <span className="text-[11px] text-slate-400">Assiduité sur les parcours</span>
        </div>
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par titre, ONG, communauté..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 mr-1" />
          {[
            { id: 'all', label: 'Toutes' },
            { id: 'active', label: 'Actives' },
            { id: 'upcoming', label: 'À venir' },
            { id: 'draft', label: 'Brouillons' },
            { id: 'completed', label: 'Terminées' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                statusFilter === item.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns Grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-300">Aucune campagne trouvée</p>
          <p className="text-xs text-slate-500 mt-1">
            Modifiez vos critères de recherche ou réinitialisez les filtres.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCampaigns.map((camp) => {
            const statusConfig = {
              active: {
                label: 'Active',
                badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
              },
              upcoming: {
                label: 'À venir',
                badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
              },
              draft: {
                label: 'En attente / Brouillon',
                badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
              },
              completed: {
                label: 'Terminée',
                badge: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
              },
            }[camp.status] || {
              label: camp.status,
              badge: 'bg-slate-800 text-slate-300 border-slate-700',
            };

            return (
              <div
                key={camp.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusConfig.badge}`}>
                        {statusConfig.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">
                        {camp.durationDays} jours
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      ID: {camp.id.slice(0, 8)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {camp.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 mb-3">
                    <span className="text-cyan-400 font-medium">{camp.organizationName}</span>
                    <span>•</span>
                    <span>{camp.communityName}</span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 mb-4">
                    {camp.description}
                  </p>

                  {/* Objective pill */}
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-4 flex items-start gap-2">
                    <Target className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-300 line-clamp-1">
                      <strong className="text-white">Objectif :</strong> {camp.objective}
                    </p>
                  </div>

                  {/* Progress info */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        {camp.participantsCount} participants
                      </span>
                      <span className="text-white font-semibold">{camp.completionRate}% complété</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                        style={{ width: `${Math.min(100, Math.max(5, camp.completionRate))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedCampaignForDetails(camp)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Examiner
                  </button>

                  <div className="flex items-center gap-1.5">
                    {camp.status !== 'active' && (
                      <button
                        onClick={() => handleActivate(camp)}
                        title="Activer la campagne sur le cercle"
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Play className="w-3 h-3 fill-emerald-400" />
                        Activer
                      </button>
                    )}

                    {camp.status === 'active' && (
                      <>
                        <button
                          onClick={() => handlePause(camp)}
                          title="Mettre la campagne en pause"
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Pause className="w-3 h-3" />
                          Pause
                        </button>
                        <button
                          onClick={() => handleComplete(camp)}
                          title="Marquer comme achevée"
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Clôturer
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setCampaignToDelete(camp)}
                      title="Supprimer la campagne"
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Campaign Full Details */}
      {selectedCampaignForDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 animate-scale-up my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCampaignForDetails(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                  Campagne {selectedCampaignForDetails.durationDays} Jours
                </span>
                <span className="text-xs text-slate-400">
                  {selectedCampaignForDetails.communityName}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">
                {selectedCampaignForDetails.title}
              </h2>
              <p className="text-xs text-slate-400">
                Supervisée par <strong className="text-slate-200">{selectedCampaignForDetails.organizationName}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Objectif Clé</span>
                <p className="text-sm text-slate-200 mt-1">{selectedCampaignForDetails.objective}</p>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Description Globale</span>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedCampaignForDetails.description}</p>
              </div>
            </div>

            {/* Activities List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  Activités Quotidiennes ({selectedCampaignForDetails.activities?.length || 0})
                </h3>
                <span className="text-xs text-slate-400">
                  Récompense : {selectedCampaignForDetails.rewards?.badgeTitle || '⭐ Badge Spécial'}
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {(selectedCampaignForDetails.activities || []).length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Aucune activité détaillée enregistrée.</p>
                ) : (
                  selectedCampaignForDetails.activities.map((act) => (
                    <div
                      key={act.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3"
                    >
                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-bold shrink-0 mt-0.5">
                        J{act.dayNumber}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white">{act.title}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{act.description}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {act.estimatedMinutes} min
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedCampaignForDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl p-6 space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Supprimer la Campagne ?</h3>
              <p className="text-xs text-slate-300 mt-1">
                Êtes-vous sûr de vouloir supprimer définitivement la campagne «{' '}
                <strong className="text-white">{campaignToDelete.title}</strong> » ? Cette action est irréversible.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCampaignToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
