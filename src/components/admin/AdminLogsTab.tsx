import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Shield,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Terminal,
} from 'lucide-react';
import { AuditLog } from '../../types';
import { exportLogsToCSV, getStoredAuditLogs } from '../../utils/auditLogger';

interface AdminLogsTabProps {
  logs: AuditLog[];
  onRefreshLogs: () => void;
  onShowToast: (msg: string) => void;
}

export const AdminLogsTab: React.FC<AdminLogsTabProps> = ({
  logs,
  onRefreshLogs,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredLogs = logs.filter((l) => {
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      l.action.toLowerCase().includes(q) ||
      l.resource.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      l.userName.toLowerCase().includes(q) ||
      l.ipAddress.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const totalLogs = logs.length;
  const successCount = logs.filter((l) => l.status === 'success').length;
  const warningCount = logs.filter((l) => l.status === 'warning' || l.status === 'denied').length;

  const handleExportCSV = () => {
    exportLogsToCSV(logs);
    onShowToast('Journal d’audit exporté avec succès (CSV)');
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tulizaana_audit_logs_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Fichier JSON d’audit téléchargé');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Événements Enregistrés</span>
            <Terminal className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalLogs}</p>
          <span className="text-[11px] text-cyan-400">Journal infalsifiable</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Opérations Conformes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{successCount}</p>
          <span className="text-[11px] text-slate-400">Statut Success (100% audité)</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Alertes & Sécurité</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">{warningCount}</p>
          <span className="text-[11px] text-slate-400">Avertissements & anomalies</span>
        </div>
      </div>

      {/* Control Bar: Search, Status, and Exports */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrer par action, ressource, administrateur, IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="success">Succès</option>
            <option value="warning">Avertissements</option>
            <option value="denied">Refusés</option>
          </select>

          <button
            onClick={onRefreshLogs}
            title="Rafraîchir les logs"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            JSON
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      {filteredLogs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <Terminal className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-300">Aucune entrée d'audit trouvée</p>
          <p className="text-xs text-slate-500 mt-1">Ajustez vos filtres de recherche.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Date & Heure</th>
                <th className="py-3.5 px-4 font-semibold">Administrateur</th>
                <th className="py-3.5 px-4 font-semibold">Action</th>
                <th className="py-3.5 px-4 font-semibold">Ressource Cible</th>
                <th className="py-3.5 px-4 font-semibold">Détails de l'opération</th>
                <th className="py-3.5 px-4 font-semibold">Origine IP</th>
                <th className="py-3.5 px-4 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredLogs.map((log) => {
                const statusBadge = {
                  success: { label: 'SUCCÈS', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
                  warning: { label: 'ALERTE', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
                  denied: { label: 'REFUSÉ', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
                }[log.status] || { label: log.status, color: 'bg-slate-800 text-slate-300 border-slate-700' };

                return (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-3 px-4 font-sans text-white font-medium whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="py-3 px-4 font-sans text-cyan-300 font-semibold whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-medium whitespace-nowrap">
                      {log.resource}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{log.ipAddress}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
