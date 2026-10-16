import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  EyeOff,
  Trash2,
  UserX,
  History,
  Lock,
} from 'lucide-react';
import { ModerationReport, Organization } from '../../types';

interface PartnerModerationProps {
  organization: Organization;
  reports?: ModerationReport[];
  onTakeAction: (
    reportId: string,
    newStatus: ModerationReport['status'],
    notes?: string
  ) => void;
}

export const PartnerModeration: React.FC<PartnerModerationProps> = ({
  organization,
  reports = [],
  onTakeAction,
}) => {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState('');

  const pendingReports = (reports || []).filter((r) => r.status === 'pending');
  const resolvedReports = (reports || []).filter((r) => r.status !== 'pending');

  const handleAction = (reportId: string, newStatus: ModerationReport['status']) => {
    onTakeAction(reportId, newStatus, actionNote || 'Action modérateur');
    setSelectedReportId(null);
    setActionNote('');
  };

  return (
    <div className="space-y-6">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight">
              Modération & Sécurité
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${pendingReports.length > 0 ? 'bg-rose-500/15 text-rose-300 border-rose-500/20' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20'}`}>
              {pendingReports.length} en attente
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Garantissez un espace sécurisant et protégez l'intégrité émotionnelle de vos cercles.
          </p>
        </div>
      </div>

      {/* PENDING REPORTS QUEUE */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>File des signalements ({pendingReports.length})</span>
        </h2>

        {pendingReports.length > 0 ? (
          <div className="space-y-3">
            {pendingReports.map((rep) => (
              <div
                key={rep.id}
                className="p-4 sm:p-5 rounded-2xl bg-[#111827] border border-amber-500/30 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold text-[11px] border border-rose-500/30">
                      Motif : {rep.reason}
                    </span>
                    <span className="text-slate-400">
                      Signalé par : <strong className="text-white">{rep.reporterName}</strong>
                    </span>
                  </div>
                  <span className="text-slate-500 text-[11px]">{rep.reportedAt ? new Date(rep.reportedAt).toLocaleDateString() : 'Récemment'}</span>
                </div>

                {/* Content snippet */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed italic">
                  "{rep.contentSnippet}"
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleAction(rep.id, 'reviewed_restored')}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  >
                    Rejeter signalement
                  </button>

                  <button
                    onClick={() => handleAction(rep.id, 'reviewed_hidden')}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold border border-amber-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Masquer</span>
                  </button>

                  <button
                    onClick={() => handleAction(rep.id, 'reviewed_deleted')}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800/80 text-center space-y-1.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
            <h3 className="text-xs font-bold text-white">Aucun signalement en attente</h3>
            <p className="text-[11px] text-slate-400">
              Toutes vos communautés respectent la charte de bienveillance.
            </p>
          </div>
        )}
      </div>

      {/* RESOLVED AUDIT LOG */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#111827] border border-slate-800/80 space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-white font-display">
            Journal d'audit ({resolvedReports.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3 rounded-l-lg">Date</th>
                <th className="p-3">Cible</th>
                <th className="p-3">Motif</th>
                <th className="p-3">Action</th>
                <th className="p-3 rounded-r-lg">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {resolvedReports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-900/30">
                  <td className="p-3 text-slate-400">{r.actionTakenAt || r.reportedAt}</td>
                  <td className="p-3 text-white font-medium">{r.contentType}</td>
                  <td className="p-3 text-slate-300">{r.reason}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 text-[10px] font-semibold border border-slate-700">
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 italic text-[11px]">
                    {r.notes || 'Conforme'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
