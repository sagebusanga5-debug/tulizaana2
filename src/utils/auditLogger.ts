import { AuditLog } from '../types';
export type { AuditLog };

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    userId: 'admin-master',
    userName: 'Admin Tulizaana (Super Admin)',
    userRole: 'admin',
    action: 'Connexion Sécurisée Back Office',
    resource: 'Console Centrale',
    details: 'Authentification multifacteur réussie via session chiffrée',
    ipAddress: '197.234.12.89 (Kinshasa, RDC)',
    timestamp: 'Il y a 10 minutes',
    status: 'success',
  },
  {
    id: 'log-002',
    userId: 'admin-master',
    userName: 'Admin Tulizaana',
    userRole: 'admin',
    action: 'Validation Organisation',
    resource: 'Alliance Drépanocytose RDC',
    resourceId: 'org-drepano',
    details: 'Vérification légale statut ONG N° 45/2018 et attribution du plan Starter',
    ipAddress: '197.234.12.89',
    timestamp: 'Il y a 2 heures',
    status: 'success',
  },
  {
    id: 'log-003',
    userId: 'admin-master',
    userName: 'Admin Tulizaana',
    userRole: 'admin',
    action: 'Attribution Code Candidat',
    resource: 'Demande Adhésion #req-001',
    resourceId: 'req-001',
    details: 'Code TLZ-DREP-7892 envoyé sur WhatsApp au candidat Sarah M.',
    ipAddress: '197.234.12.89',
    timestamp: 'Il y a 4 heures',
    status: 'success',
  },
  {
    id: 'log-004',
    userId: 'admin-master',
    userName: 'Admin Tulizaana',
    userRole: 'admin',
    action: 'Résolution Alerte SOS Modération',
    resource: 'Signalement #rep-001',
    resourceId: 'rep-001',
    details: 'Prise en charge détresse psychologique et réorientation vers le Dr Mutombo',
    ipAddress: '197.234.12.89',
    timestamp: 'Hier à 18:30',
    status: 'success',
  },
  {
    id: 'log-005',
    userId: 'sys-watcher',
    userName: 'Contrôleur de Sécurité IA',
    userRole: 'admin',
    action: 'Tentative d’accès anormal',
    resource: 'API Auth Gateway',
    details: '3 échecs consécutifs sur compte partenaire tiers suspendu',
    ipAddress: '41.243.8.102 (Dakar, Sénégal)',
    timestamp: 'Hier à 14:12',
    status: 'warning',
  },
];

let auditLogsMemory: AuditLog[] | null = null;

export function getStoredAuditLogs(): AuditLog[] {
  return auditLogsMemory || INITIAL_AUDIT_LOGS;
}

export function recordAuditLog(
  action: string,
  resource: string,
  details: string,
  status: 'success' | 'warning' | 'denied' = 'success',
  resourceId?: string
): AuditLog[] {
  const currentLogs = getStoredAuditLogs();
  const newLog: AuditLog = {
    id: `log-${Date.now()}`,
    userId: 'admin-master',
    userName: 'Admin Tulizaana',
    userRole: 'admin',
    action,
    resource,
    resourceId,
    details,
    ipAddress: '197.234.12.89 (Kinshasa, RDC)',
    timestamp: 'À l’instant',
    status,
  };

  const updated = [newLog, ...currentLogs];
  auditLogsMemory = updated;
  return updated;
}

export function exportLogsToCSV(logs: AuditLog[]) {
  const headers = ['ID', 'Date', 'Administrateur', 'Action', 'Ressource', 'Détails', 'Adresse IP', 'Statut'];
  const rows = logs.map((l) => [
    l.id,
    l.timestamp,
    `"${l.userName}"`,
    `"${l.action}"`,
    `"${l.resource}"`,
    `"${l.details.replace(/"/g, '""')}"`,
    l.ipAddress,
    l.status,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `tulizaana_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
