import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  MessageSquare,
  UserX,
  FileText,
  Clock,
  ChevronRight,
  X,
  Send,
  HeartHandshake,
} from 'lucide-react';
import { ModerationReport } from '../../types';

interface AdminModerationTabProps {
  reports: ModerationReport[];
  onUpdateReport?: (reportId: string, newStatus: ModerationReport['status'], notes?: string) => void;
  onShowToast: (msg: string) => void;
  onRecordLog: (action: string, resource: string, details: string) => void;
}

export const AdminModerationTab: React.FC<AdminModerationTabProps> = ({
  reports,
  onUpdateReport,
  onShowToast,
  onRecordLog,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');

  const [selectedReportForModal, setSelectedReportForModal] = useState<ModerationReport | null>(null);
  const [customResolutionNotes, setCustomResolutionNotes] = useState('');

  const filteredReports = reports.filter((rep) => {
    const matchesStatus = statusFilter === 'all' || rep.status === statusFilter;
    const matchesReason = reasonFilter === 'all' || rep.reason === reasonFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      rep.contentSnippet.toLowerCase().includes(q) ||
      rep.authorName.toLowerCase().includes(q) ||
      rep.reporterName.toLowerCase().includes(q) ||
      rep.communityName.toLowerCase().includes(q);

    return matchesStatus && matchesReason && matchesSearch;
  });

  const totalReports = reports.length;
  const pendingReports = reports.filter((r) => r.status === 'pending').length;
  const resolvedReports = reports.filter((r) => r.status !== 'pending').length;

  const handleTakeAction = (
    report: ModerationReport,
    actionStatus: ModerationReport['status'],
    defaultNotes: string
  ) => {
    const notes = customResolutionNotes.trim() || defaultNotes;
    if (onUpdateReport) {
      onUpdateReport(report.id, actionStatus, notes);
    }
    const label = {
      reviewed_hidden: 'Contenu masqué et intervention engagée',
      reviewed_deleted: 'Contenu supprimé définitivement',
      warned: 'Avertissement envoyé à l’auteur',
      suspended: 'Auteur suspendu suite au signalement',
      reviewed_restored: 'Signalement classé sans suite',
      pending: 'Remis en attente',
    }[actionStatus] || 'Action enregistrée';

    onShowToast(`${label} (#${report.id.slice(0, 6)})`);
    onRecordLog(
      'Intervention Modération',
      `Signalement #${report.id.slice(0, 6)}`,
      `Statut : ${actionStatus} | Notes : ${notes}`
    );

    setSelectedReportForModal(null);
    setCustomResolutionNotes('');
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'harassment':
        return { label: 'Harcèlement / Non respect', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
      case 'hate_speech':
        return { label: 'Propos haineux', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      case 'inappropriate_medical_advice':
        return { label: 'Conseil médical non vérifié', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
      case 'privacy_breach':
        return { label: 'Violation de confidentialité', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
      case 'spam':
        return { label: 'Spam / Commercial', color: 'bg-slate-700/40 text-slate-300 border-slate-600/30' };
      default:
        return { label: reason || 'Autre signalement', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Alertes Enregistrées</span>
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalReports}</p>
          <span className="text-[11px] text-cyan-400">Total signalements & SOS</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">En Attente de Traitement</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </div>
          <p className="text-2xl font-bold text-rose-400 mt-2">{pendingReports}</p>
          <span className="text-[11px] text-rose-300">Priorité haute d'écoute</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Signalements Traités</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{resolvedReports}</p>
          <span className="text-[11px] text-slate-400">Pris en charge et classés</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par extrait, auteur, communauté..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente uniquement</option>
            <option value="reviewed_hidden">Masqués / En cours</option>
            <option value="reviewed_deleted">Supprimés</option>
            <option value="warned">Auteurs avertis</option>
            <option value="reviewed_restored">Classés sans suite</option>
          </select>

          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">Tous les motifs</option>
            <option value="harassment">Harcèlement</option>
            <option value="hate_speech">Propos haineux</option>
            <option value="inappropriate_medical_advice">Conseil médical non conforme</option>
            <option value="privacy_breach">Violation vie privée</option>
            <option value="spam">Spam</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-300">Aucun signalement en attente</p>
          <p className="text-xs text-slate-500 mt-1">L'espace d'entraide respecte scrupuleusement la charte.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const isPending = report.status === 'pending';
            const reasonBadge = getReasonLabel(report.reason);

            return (
              <div
                key={report.id}
                className={`p-5 rounded-2xl bg-slate-900/90 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isPending
                    ? 'border-rose-500/40 shadow-lg shadow-rose-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="pt-1 shrink-0">
                    {isPending ? (
                      <span className="w-3 h-3 rounded-full bg-rose-500 flex items-center justify-center animate-ping" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-white">
                        Signalement #{report.id.slice(0, 8)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-mono">
                        {report.contentType?.toUpperCase() || 'POST'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${reasonBadge.color}`}>
                        {reasonBadge.label}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        dans <strong>{report.communityName}</strong>
                      </span>
                    </div>

                    {/* Content snippet */}
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 my-2 text-xs text-slate-200 font-mono italic line-clamp-2">
                      « {report.contentSnippet} »
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <span>
                        Auteur : <strong className="text-slate-200">{report.authorName}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Signalé par : <strong className="text-slate-300">{report.reporterName}</strong>
                      </span>
                      <span>•</span>
                      <span className="text-slate-500">{report.reportedAt || 'Récemment'}</span>
                    </div>

                    {report.notes && (
                      <p className="text-[11px] text-cyan-400 mt-1.5 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Résolution : {report.notes} (par {report.actionTakenBy || 'Modérateur'})
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => {
                      setSelectedReportForModal(report);
                      setCustomResolutionNotes(report.notes || '');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Détails & Notes
                  </button>

                  {isPending ? (
                    <>
                      <button
                        onClick={() =>
                          handleTakeAction(
                            report,
                            'reviewed_hidden',
                            'Pris en charge par modération et masqué temporairement'
                          )
                        }
                        className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
                      >
                        Prendre en charge
                      </button>

                      <button
                        onClick={() =>
                          handleTakeAction(
                            report,
                            'reviewed_restored',
                            'Classé sans suite après vérification'
                          )
                        }
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition-colors"
                      >
                        Classer conforme
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() =>
                        handleTakeAction(
                          report,
                          'pending',
                          'Réouvert pour ré-évaluation'
                        )
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium cursor-pointer"
                    >
                      Réouvrir
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Full Report Details & Resolution */}
      {selectedReportForModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">
                  Détail du Signalement #{selectedReportForModal.id.slice(0, 8)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReportForModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  Extrait du contenu incriminé
                </span>
                <p className="text-xs text-rose-200 mt-1 font-mono leading-relaxed bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  « {selectedReportForModal.contentSnippet} »
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px]">Auteur du contenu</span>
                  <p className="font-semibold text-white mt-0.5">{selectedReportForModal.authorName}</p>
                  <span className="text-[10px] text-slate-400">ID: {selectedReportForModal.authorId}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px]">Signalé par</span>
                  <p className="font-semibold text-white mt-0.5">{selectedReportForModal.reporterName}</p>
                  <span className="text-[10px] text-slate-400">ID: {selectedReportForModal.reporterId}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes de traitement & décisions prises
                </label>
                <textarea
                  rows={3}
                  value={customResolutionNotes}
                  onChange={(e) => setCustomResolutionNotes(e.target.value)}
                  placeholder="Ex: Contenu masqué. Contact établi avec le pair-aidant local pour accompagnement..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 flex-wrap gap-2">
              <button
                onClick={() =>
                  handleTakeAction(
                    selectedReportForModal,
                    'reviewed_deleted',
                    'Contenu supprimé définitivement par la modération'
                  )
                }
                className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold cursor-pointer"
              >
                Supprimer le contenu
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleTakeAction(
                      selectedReportForModal,
                      'warned',
                      'Avertissement envoyé à l’auteur'
                    )
                  }
                  className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold cursor-pointer"
                >
                  Avertir l'auteur
                </button>
                <button
                  onClick={() =>
                    handleTakeAction(
                      selectedReportForModal,
                      'reviewed_hidden',
                      customResolutionNotes || 'Validé et pris en charge'
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  Valider la résolution
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
