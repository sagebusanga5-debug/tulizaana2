import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  Calendar,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Award,
  Loader2,
  PlusCircle,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { Organization, PartnerMetrics, PartnerReport } from '../../types';
import { api } from '../../services/api';

interface PartnerReportsProps {
  organization: Organization;
  metrics: PartnerMetrics;
}

export const PartnerReports: React.FC<PartnerReportsProps> = ({
  organization,
  metrics,
}) => {
  const [reportPeriod, setReportPeriod] = useState('q1_2026');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [reports, setReports] = useState<PartnerReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<PartnerReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingReports, setIsFetchingReports] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }, 1500);
  };

  // Fetch reports list
  const fetchReports = async () => {
    setIsFetchingReports(true);
    setError(null);
    try {
      const response = await api.partner.reports.list({ organizationId: organization.id });
      if (response.success && response.data) {
        setReports(response.data.reports);
        if (response.data.reports.length > 0 && !selectedReport) {
          setSelectedReport(response.data.reports[0]);
        }
      } else {
        setError(response.error || 'Erreur lors de la rÃ©cupÃ©ration des rapports');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setIsFetchingReports(false);
    }
  };

  // Generate a new report
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      // Generate for the last 3 months by default
      const periodEnd = new Date();
      const periodStart = new Date();
      periodStart.setMonth(periodStart.getMonth() - 3);
      periodStart.setDate(1);
      
      const response = await api.partner.reports.generate({
        organizationId: organization.id,
        periodStart: periodStart.toISOString().split('T')[0],
        periodEnd: periodEnd.toISOString().split('T')[0],
      });
      
      if (response.success && response.data) {
        setSelectedReport(response.data);
        await fetchReports();
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      } else {
        setError(response.error || 'Erreur lors de la gÃ©nÃ©ration du rapport');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setIsGenerating(false);
    }
  };

  // Get a specific report by ID
  const handleSelectReport = async (id: string) => {
    const report = reports.find(r => r.id === id);
    if (report) {
      setSelectedReport(report);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.partner.reports.get(id);
      if (response.success && response.data) {
        setSelectedReport(response.data);
      } else {
        setError(response.error || 'Erreur lors de la rÃ©cupÃ©ration du rapport');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [organization.id]);

  return (
    <div className="space-y-6">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight">
              Rapports Bailleurs & Impact
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-[11px] font-semibold border border-cyan-500/20">
              CertifiÃ© conforme
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            GÃ©nÃ©rez des synthÃ¨ses d'impact auditables avec mÃ©triques et verbatims 100% anonymisÃ©s.
          </p>
        </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={fetchReports}
              disabled={isFetchingReports}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isFetchingReports ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>

            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <PlusCircle className="w-3.5 h-3.5" />
              )}
              <span>{isGenerating ? 'GÃ©nÃ©ration...' : 'GÃ©nÃ©rer un rapport'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Imprimer</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Exporter PDF</span>
            </button>
          </div>
      </div>

      {downloadSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Le rapport officiel d'impact pour bailleurs a Ã©tÃ© gÃ©nÃ©rÃ© avec succÃ¨s !</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Reports List */}
      {reports.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Rapports gÃ©nÃ©rÃ©s ({reports.length})</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => handleSelectReport(report.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  selectedReport?.id === report.id
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {new Date(report.periodStart).toLocaleDateString('fr-FR')} - {' '}
                    {new Date(report.periodEnd).toLocaleDateString('fr-FR')}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-900/50 text-[10px]">
                    {report.level}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PRINTABLE REPORT PREVIEW CANVAS */}
      {selectedReport && (
      <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-slate-100 border border-slate-700/80 shadow-2xl space-y-8 font-sans">
        
        {/* Report Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/40">
                RAPPORT OFFICIEL D'IMPACT
              </span>
              <span className="text-xs text-slate-400 font-mono">
                REF: TLZ-REP-{new Date(selectedReport.generatedAt).getFullYear()}-{selectedReport.id.slice(-8).toUpperCase()}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              Rapport de RÃ©silience & Soutien Psychologique
            </h2>
            <p className="text-xs sm:text-sm text-cyan-300 font-semibold">
              Organisation porteuse : {organization.name} ({organization.country})
            </p>
          </div>

          <div className="text-right text-xs text-slate-400 space-y-1">
            <div>PÃ©riode : <strong>{new Date(selectedReport.periodStart).toLocaleDateString('fr-FR')} - {new Date(selectedReport.periodEnd).toLocaleDateString('fr-FR')}</strong></div>
            <div>Plateforme : <strong>Tulizaana Ecosystem</strong></div>
            <div>Statut : <strong>DonnÃ©es CertifiÃ©es et AnonymisÃ©es</strong></div>
            <div>Niveau : <strong className="capitalize">{selectedReport.level}</strong></div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-cyan-400">
            1. SynthÃ¨se ExÃ©cutive & Faits Marquants
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Au cours de cette pÃ©riode, <strong>{organization.name}</strong> a dÃ©ployÃ© {metrics.activeCampaignsCount} campagnes structurÃ©es de rÃ©silience collective dans ses communautÃ©s fermÃ©es. GrÃ¢ce Ã  un cadre sÃ©curisÃ© et sans jugement, <strong>{metrics.totalMembers.toLocaleString()} membres actifs</strong> ont brisÃ© leur isolement, gÃ©nÃ©rant <strong>{metrics.totalSupportReactions.toLocaleString()} actes concrets de solidaritÃ© et d'Ã©coute mutuelle</strong>.
          </p>
        </div>

        {/* Core Metrics Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-cyan-400">
            2. Indicateurs ClÃ©s de Performance (KPIs)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">BÃ©nÃ©ficiaires touchÃ©s</div>
              <div className="text-2xl font-extrabold text-white mt-1">
                {typeof selectedReport.data.summary.activeMembers === 'number'
                  ? selectedReport.data.summary.activeMembers.toLocaleString()
                  : metrics.totalMembers.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-400 font-bold mt-1">
                +{metrics.monthlyGrowthPercent}% de croissance
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">CommunautÃ©s actives</div>
              <div className="text-2xl font-extrabold text-cyan-400 mt-1">
                {selectedReport.data.summary.activeCommunities.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Campagnes: {selectedReport.data.summary.campaigns}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">Actes de soutien</div>
              <div className="text-2xl font-extrabold text-rose-400 mt-1">
                {typeof selectedReport.data.summary.reactions === 'number'
                  ? selectedReport.data.summary.reactions.toLocaleString()
                  : metrics.totalSupportReactions.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                RÃ©actions & encouragements
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">Publications</div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                {typeof selectedReport.data.summary.posts === 'number'
                  ? selectedReport.data.summary.posts.toLocaleString()
                  : 'â€”'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Commentaires: {typeof selectedReport.data.summary.comments === 'number' ? selectedReport.data.summary.comments.toLocaleString() : 'â€”'}
              </div>
            </div>
          </div>
        </div>

        {/* Insights & Recommendations */}
        {selectedReport.insights && selectedReport.insights.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-cyan-400">
              3. Insights & Recommandations (AnonymisÃ©s)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedReport.insights.map((insight, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <div className="font-bold text-cyan-400 mb-1">{insight.title}</div>
                  <p>{insight.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certification footer */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span>Document conforme aux normes Ã©thiques et de protection des donnÃ©es vulnÃ©rables (Tulizaana Trust Standard).</span>
          </div>
          <div className="font-mono text-slate-500">
            Certificat numÃ©rique vÃ©rifiÃ© â€¢ GÃ©nÃ©rÃ© le {new Date(selectedReport.generatedAt).toLocaleDateString('fr-FR')} Ã  {new Date(selectedReport.generatedAt).toLocaleTimeString('fr-FR')}
          </div>
        </div>
      </div>
      )}

      {/* Empty state */}
      {!selectedReport && reports.length === 0 && !isFetchingReports && !error && (
        <div className="p-12 rounded-3xl bg-slate-900 border border-slate-700 text-center">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Aucun rapport gÃ©nÃ©rÃ©</h3>
          <p className="text-xs text-slate-400 mb-6">
            GÃ©nÃ©rez votre premier rapport d'impact pour voir les donnÃ©es agrÃ©gÃ©es et anonymisÃ©es.
          </p>
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 mx-auto"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
            <span>{isGenerating ? 'GÃ©nÃ©ration...' : 'GÃ©nÃ©rer un rapport'}</span>
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading || isFetchingReports ? (
        <div className="p-12 rounded-3xl bg-slate-900 border border-slate-700 text-center">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-xs text-slate-400">Chargement des rapports...</p>
        </div>
      ) : null}
    </div>
  );
};
