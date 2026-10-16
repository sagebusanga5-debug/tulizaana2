import React, { useState } from 'react';
import {
  Key,
  Lock,
  CheckCircle2,
  Shield,
  Download,
  AlertTriangle,
  Sliders,
  Server,
  Database,
} from 'lucide-react';
import { type AdminSession } from './adminAuth';
import { Organization, Community, UserProfile, Campaign, ModerationReport } from '../../types';
import { AdminBrandIconPublisher } from './AdminBrandIconPublisher';

interface AdminSettingsTabProps {
  organizations: Organization[];
  communities: Community[];
  users: UserProfile[];
  campaigns: Campaign[];
  reports: ModerationReport[];
  adminSession: AdminSession;
  onShowToast: (msg: string) => void;
  onRecordLog: (action: string, resource: string, details: string) => void;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({
  organizations,
  communities,
  users,
  campaigns,
  reports,
  adminSession,
  onShowToast,
  onRecordLog,
}) => {
  // System toggles
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [strictOrgApproval, setStrictOrgApproval] = useState(true);

  const [autoSOSEscalation, setAutoSOSEscalation] = useState(true);

  const handleToggleMaintenance = () => {
    const next = !maintenanceMode;
    setMaintenanceMode(next);
    onShowToast(next ? 'Mode maintenance activé' : 'Mode maintenance désactivé');
    onRecordLog(
      'Modification Mode Maintenance',
      'Système Plateforme',
      `Statut maintenance : ${next ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`
    );
  };

  const handleToggleStrictOrg = () => {
    const next = !strictOrgApproval;
    setStrictOrgApproval(next);
    onShowToast(next ? 'Validation stricte des ONG activée' : 'Validation automatique assouplie');
  };

  const handleToggleSOS = () => {
    const next = !autoSOSEscalation;
    setAutoSOSEscalation(next);
    onShowToast(next ? 'Escalade automatique SOS activée' : 'Escalade SOS manuelle');
  };

  const handleExportFullBackup = () => {
    const backupData = {
      exportTimestamp: new Date().toISOString(),
      platformVersion: '2.5.0-production',
      organizations,
      communities,
      users,
      campaigns,
      reports,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tulizaana_backup_complet_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Sauvegarde complète du système exportée avec succès');
    onRecordLog(
      'Exportation Sauvegarde Complète',
      'Base de Données Globale',
      `Export JSON de ${organizations.length} ONG, ${communities.length} cercles, ${users.length} membres`
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* 1. Official Brand Icon & Visual Identity Publisher */}
      <AdminBrandIconPublisher
        onShowToast={onShowToast}
        onRecordLog={onRecordLog}
      />

      {/* 2. Session Back Office (lecture seule, autorité côté serveur) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-cyan-500/30 shadow-xl shadow-cyan-950/20 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Session Back Office en cours
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Identité confirmée par le serveur à la connexion. Les identifiants ne sont ni affichables
              ni modifiables depuis le navigateur.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Administrateur connecté
            </label>
            <div className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200">
              {adminSession.name}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Adresse email du compte
            </label>
            <div className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono">
              {adminSession.email}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            Rôle détecté côté serveur : {adminSession.role}. Chaque action administrative est revérifiée
            en base à l’exécution, et un compte suspendu perd immédiatement son accès.
          </span>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Pour changer un mot de passe, utilisez la procédure de récupération de compte.
          </span>
          <button
            type="button"
            onClick={onShowToast('La rotation des mots de passe est gérée côté serveur, depuis la console de déploiement.')}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Comment changer un mot de passe ?
          </button>
        </div>
      </div>

      {/* Platform Security & System Toggles */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Paramètres Globaux de la Plateforme</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Contrôles généraux de sécurité, de gouvernance et de modération active.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-white">Mode Maintenance Général</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Restreint l'accès utilisateur public pour les opérations de mise à jour système.
              </p>
            </div>
            <button
              onClick={handleToggleMaintenance}
              className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                maintenanceMode ? 'bg-amber-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  maintenanceMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-white">Validation Stricte des Organisations</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Exige l'approbation manuelle du Super Admin avant qu'une ONG puisse émettre des codes d'accès.
              </p>
            </div>
            <button
              onClick={handleToggleStrictOrg}
              className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                strictOrgApproval ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  strictOrgApproval ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-white">Escalade Automatique des Alertes SOS</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Notifie immédiatement par SMS / WhatsApp les coordinateurs médicaux d'astreinte lors d'un SOS.
              </p>
            </div>
            <button
              onClick={handleToggleSOS}
              className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                autoSOSEscalation ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  autoSOSEscalation ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Full Database Backup Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Sauvegarde Complète des Données</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Téléchargez un instantané JSON complet (ONG, cercles, membres, campagnes, modération).
            </p>
          </div>
        </div>

        <button
          onClick={handleExportFullBackup}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shrink-0 shadow-lg shadow-emerald-500/20"
        >
          <Download className="w-4 h-4" />
          Exporter Sauvegarde (JSON)
        </button>
      </div>
    </div>
  );
};
