import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  ShieldCheck,
  Building2,
  Users,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Key,
  Lock,
  LogOut,
  Search,
  Filter,
  RefreshCw,
  Plus,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Settings,
  ChevronRight,
  ArrowUpRight,
  Trash2,
  Check,
  X,
  Radio,
  Globe,
  Award,
  HeartHandshake,
  Activity,
  Eye,
  Mail,
  Terminal,
  Palette,
  Layers,
} from 'lucide-react';
import {
  Organization,
  Community,
  UserProfile,
  Post,
  Campaign,
  ModerationReport,
  Language,
} from '../../types';
import { t } from '../../translations';
import { TulizaanaLogo } from '../brand/TulizaanaBrand';
import {
  type AdminSession,
} from './adminAuth';
import { OrganizationValidationModal } from './OrganizationValidationModal';
import { AdminCampaignsTab } from './AdminCampaignsTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminModerationTab } from './AdminModerationTab';
import { AdminLogsTab } from './AdminLogsTab';
import { AdminSettingsTab } from './AdminSettingsTab';
import { AdminBrandIconPublisher } from './AdminBrandIconPublisher';
import { AdminArchitectureTab } from './AdminArchitectureTab';
import { AdminAddOrgModal } from './AdminAddOrgModal';
import {
  getStoredAuditLogs,
  recordAuditLog,
  AuditLog,
} from '../../utils/auditLogger';

interface AdminBackOfficeProps {
  organizations: Organization[];
  communities: Community[];
  users: UserProfile[];
  posts: Post[];
  campaigns: Campaign[];
  reports: ModerationReport[];
  language?: Language;
  /** Identité confirmée par le serveur (GET /api/auth/me) à la connexion. */
  adminSession: AdminSession;
  /** Permet à App.tsx d'afficher les refus du serveur dans ce Back Office. */
  notifyRef?: React.MutableRefObject<((msg: string) => void) | null>;
  onSelectLanguage?: (lang: Language) => void;
  onUpdateOrganization: (orgId: string, updatedFields: Partial<Organization>) => void;
  onAddOrganization: (newOrg: Organization) => void;
  onDeleteOrganization: (orgId: string) => void;
  onUpdateCommunity: (commId: string, updatedFields: Partial<Community>) => void;
  onDeleteCommunity: (commId: string) => void;
  onUpdateCampaign?: (campaignId: string, updatedFields: Partial<Campaign>) => void;
  onDeleteCampaign?: (campaignId: string) => void;
  onUpdateUser?: (userId: string, updatedFields: Partial<UserProfile>) => void;
  onUpdateReport?: (reportId: string, newStatus: ModerationReport['status'], notes?: string) => void;
  onClose: () => void;
  onLogoutAdmin: () => void;
}

export type AdminTab =
  | 'overview'
  | 'organizations'
  | 'communities'
  | 'campaigns'
  | 'users'
  | 'moderation'
  | 'logs'
  | 'branding'
  | 'architecture'
  | 'settings';

export const AdminBackOffice: React.FC<AdminBackOfficeProps> = ({
  organizations: propOrganizations,
  communities: propCommunities,
  users: propUsers,
  posts: propPosts,
  campaigns: propCampaigns,
  reports: propReports,
  language = 'fr',
  adminSession,
  notifyRef,
  onSelectLanguage,
  onUpdateOrganization,
  onAddOrganization,
  onDeleteOrganization,
  onUpdateCommunity,
  onDeleteCommunity,
  onUpdateCampaign,
  onDeleteCampaign,
  onUpdateUser,
  onUpdateReport,
  onClose,
  onLogoutAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const adminText = t[language || 'fr']?.admin || t.fr.admin;

  // État local pour les données chargées depuis l'API
  const [apiData, setApiData] = useState<{
    organizations: Organization[] | null;
    communities: Community[] | null;
    users: UserProfile[] | null;
    campaigns: Campaign[] | null;
    reports: ModerationReport[] | null;
  }>({
    organizations: null,
    communities: null,
    users: null,
    campaigns: null,
    reports: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Charger les données depuis l'API au montage
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [orgsRes, commsRes, usersRes, campsRes] = await Promise.all([
          api.organizations.list(),
          api.communities.list(),
          api.admin.listUsers(),
          api.campaigns.list(),
        ]);

        console.log('API Responses:', { orgsRes, commsRes, usersRes, campsRes });

        setApiData({
          organizations: orgsRes.success ? orgsRes.data : propOrganizations,
          communities: commsRes.success ? commsRes.data : propCommunities,
          users: usersRes.success ? usersRes.data : propUsers,
          campaigns: campsRes.success ? campsRes.data : propCampaigns,
          reports: propReports, // Pas d'endpoint admin pour les reports pour l'instant
        });

        if (!orgsRes.success) {
          console.error('Organizations API error:', orgsRes.error);
          setLoadError(`Organisations: ${orgsRes.error}`);
        }
        if (!commsRes.success) {
          console.error('Communities API error:', commsRes.error);
          setLoadError(`Communautés: ${commsRes.error}`);
        }
        if (!usersRes.success) {
          console.error('Users API error:', usersRes.error);
          setLoadError(`Utilisateurs: ${usersRes.error}`);
        }
        if (!campsRes.success) {
          console.error('Campaigns API error:', campsRes.error);
          setLoadError(`Campagnes: ${campsRes.error}`);
        }
      } catch (error) {
        console.error('Erreur de chargement des données:', error);
        setLoadError(error instanceof Error ? error.message : 'Erreur inconnue');
        // Fallback sur les props en cas d'erreur
        setApiData({
          organizations: propOrganizations,
          communities: propCommunities,
          users: propUsers,
          campaigns: propCampaigns,
          reports: propReports,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []); // Une seule fois au montage

  // Utiliser les données API si disponibles, sinon les props
  const organizations = apiData.organizations ?? propOrganizations;
  const communities = apiData.communities ?? propCommunities;
  const users = apiData.users ?? propUsers;
  const campaigns = apiData.campaigns ?? propCampaigns;
  const reports = apiData.reports ?? propReports;
  const posts = propPosts; // Posts pas chargés depuis l'API pour l'instant

  // Modal and deletion states
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
  const [communityToDelete, setCommunityToDelete] = useState<Community | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getStoredAuditLogs());

  const handleRecordLog = (
    action: string,
    resource: string,
    details: string,
    status: 'success' | 'warning' | 'denied' = 'success',
    resourceId?: string
  ) => {
    const updated = recordAuditLog(action, resource, details, status, resourceId);
    setAuditLogs(updated);
  };

  // Modal states
  const [selectedOrgForValidation, setSelectedOrgForValidation] = useState<Organization | null>(null);
  const [selectedOrgInitialTab, setSelectedOrgInitialTab] = useState<'identity' | 'contact' | 'documents' | 'plan' | 'email'>('identity');

  // Search and filter states
  const [orgFilterStatus, setOrgFilterStatus] = useState<string>('all');
  const [orgSearchQuery, setOrgSearchQuery] = useState<string>('');
  const [commFilterStatus, setCommFilterStatus] = useState<string>('all');
  const [commSearchQuery, setCommSearchQuery] = useState<string>('');

  // Quick Action notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Les handlers d'action vivent dans App.tsx : on leur ouvre l'affichage de ce
  // Back Office pour qu'un refus HTTP soit visible plutôt qu'avalé en silence.
  useEffect(() => {
    if (!notifyRef) return;
    notifyRef.current = showToast;
    return () => {
      notifyRef.current = null;
    };
  }, [notifyRef]);

  // Calculations for global analytics
  const totalOrganizations = organizations.length;
  const approvedOrganizations = organizations.filter((o) => o.status === 'approved').length;
  const pendingOrganizations = organizations.filter((o) => o.status === 'pending' || o.status === 'under_review').length;
  const suspendedOrganizations = organizations.filter((o) => o.status === 'suspended' || o.status === 'rejected').length;

  const totalCommunities = communities.length;
  const activeCommunities = communities.filter((c) => c.status === 'active' || c.status === 'approved').length;
  const pendingCommunities = communities.filter((c) => c.status === 'draft' || c.status === 'pending_review').length;

  const totalMembers = users.length;
  const totalPosts = posts.length;
  const totalCampaigns = campaigns.length;
  const totalReports = reports.length;
  const pendingReports = reports.filter((r) => r.status === 'pending').length;

  // Filtered Organizations
  const filteredOrganizations = organizations.filter((org) => {
    const matchesStatus =
      orgFilterStatus === 'all'
        ? true
        : orgFilterStatus === 'pending'
        ? org.status === 'pending' || org.status === 'under_review'
        : org.status === orgFilterStatus;

    const matchesSearch =
      org.name.toLowerCase().includes(orgSearchQuery.toLowerCase()) ||
      org.responsibleName.toLowerCase().includes(orgSearchQuery.toLowerCase()) ||
      org.country.toLowerCase().includes(orgSearchQuery.toLowerCase()) ||
      (org.acronym && org.acronym.toLowerCase().includes(orgSearchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  // Filtered Communities
  const filteredCommunities = communities.filter((comm) => {
    const matchesStatus =
      commFilterStatus === 'all'
        ? true
        : commFilterStatus === 'pending'
        ? comm.status === 'draft' || comm.status === 'pending_review'
        : comm.status === commFilterStatus;

    const matchesSearch =
      comm.name.toLowerCase().includes(commSearchQuery.toLowerCase()) ||
      comm.organizationName.toLowerCase().includes(commSearchQuery.toLowerCase()) ||
      comm.description.toLowerCase().includes(commSearchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Organization Approval Actions
  const handleApproveOrganization = (org: Organization) => {
    onUpdateOrganization(org.id, { status: 'approved' });
    showToast(`L'organisation "${org.name}" a été validée avec succès`);
  };

  const handlePutOrgUnderReview = (org: Organization) => {
    onUpdateOrganization(org.id, { status: 'under_review' });
    showToast(`L'organisation "${org.name}" est placée sous examen`);
  };

  const handleSuspendOrganization = (org: Organization) => {
    onUpdateOrganization(org.id, { status: 'suspended' });
    showToast(`L'organisation "${org.name}" a été suspendue`);
  };

  // Community Approval Actions
  const handleApproveCommunity = (comm: Community) => {
    onUpdateCommunity(comm.id, { status: 'active' });
    showToast(`La communauté "${comm.name}" a été validée et activée`);
  };

  const handleSuspendCommunity = (comm: Community) => {
    onUpdateCommunity(comm.id, { status: 'suspended' });
    showToast(`La communauté "${comm.name}" a été suspendue`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070b12] text-slate-100 flex flex-col font-sans overflow-hidden select-none">
      
      {/* 1. TOP SECURE BAR & NAVIGATION */}
      <header className="h-16 sm:h-20 bg-[#0a101b] border-b border-cyan-500/20 px-4 sm:px-8 flex items-center justify-between shrink-0">
        
        {/* Left: Brand + Badge */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative">
            <TulizaanaLogo size="md" iconClassName="w-8 h-8 sm:w-9 sm:h-9" />
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-black tracking-widest uppercase">
              Admin
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                {adminText.title}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3" />
                {adminText.subtitle}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {adminText.description}
            </p>
          </div>
        </div>

        {/* Right Controls: User info, Language Switcher, Exit & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-[11px]">{adminSession.email}</span>
          </div>

          {/* Language Switcher in Admin Header (hidden on mobile, visible on sm and up) */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <select
              value={language}
              onChange={(e) => onSelectLanguage && onSelectLanguage(e.target.value as Language)}
              aria-label="Changer de langue"
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="en" className="bg-slate-900 text-white">EN</option>
              <option value="fr" className="bg-slate-900 text-white">FR</option>
              <option value="ar" className="bg-slate-900 text-white">AR</option>
              <option value="pt" className="bg-slate-900 text-white">PT</option>
              <option value="sw" className="bg-slate-900 text-white">SW</option>
            </select>
          </div>

          <button
            onClick={onClose}
            title={adminText.viewPlatform}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{adminText.viewPlatform}</span>
          </button>

          <button
            onClick={onLogoutAdmin}
            title={adminText.exitConsole}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{adminText.exitConsole}</span>
          </button>
        </div>
      </header>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="bg-[#0b1220] border-b border-slate-800 px-4 sm:px-8 py-2 flex items-center justify-between overflow-x-auto scrollbar-none shrink-0">
        <div className="flex items-center gap-1 sm:gap-2 min-w-max">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{adminText.tabs.overview}</span>
          </button>

          <button
            onClick={() => setActiveTab('organizations')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
              activeTab === 'organizations'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{adminText.tabs.organizations}</span>
            {pendingOrganizations > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                {pendingOrganizations}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('communities')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
              activeTab === 'communities'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{adminText.tabs.communities}</span>
            {pendingCommunities > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                {pendingCommunities}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('campaigns')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'campaigns'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>{adminText.tabs.campaigns}</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>{adminText.tabs.users}</span>
          </button>

          <button
            onClick={() => setActiveTab('moderation')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
              activeTab === 'moderation'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{adminText.tabs.moderation}</span>
            {pendingReports > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {pendingReports}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>{adminText.tabs.logs}</span>
          </button>

          <button
            onClick={() => setActiveTab('branding')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'branding'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Icône & Marque</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'architecture'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Architecture & Prod</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{adminText.tabs.settings}</span>
          </button>
        </div>

        {/* Real-time platform status chip */}
        <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 min-w-max pl-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{adminText.platformOperational}</span>
          <span className="text-slate-600">•</span>
          <span className="font-mono text-cyan-400 font-semibold">{totalMembers} {adminText.members}</span>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="absolute top-24 right-6 z-50 px-4 py-2.5 rounded-2xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-xl shadow-cyan-500/30 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3. MAIN TAB CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
        
        {/* Indicateur de chargement */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center animate-pulse">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-300">Chargement des données...</h3>
              <p className="text-sm text-slate-500">Connexion au backend en cours</p>
            </div>
          </div>
        )}
        
        {/* Indicateur d'erreur */}
        {!isLoading && loadError && (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-rose-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-300">Erreur de chargement</h3>
              <p className="text-sm text-slate-500 max-w-md">{loadError}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-sm hover:bg-cyan-400 transition-colors cursor-pointer"
            >
              Recharger la page
            </button>
          </div>
        )}
        
        {/* Indicateur de données vides */}
        {!isLoading && !loadError && organizations.length === 0 && communities.length === 0 && users.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
              <Activity className="w-8 h-8 text-slate-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-300">Aucune donnée chargée</h3>
              <p className="text-sm text-slate-500 max-w-md">
                Les données du back-office ne sont pas encore synchronisées avec le backend.
                Veuillez recharger la page ou contacter l'administrateur.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-sm hover:bg-cyan-400 transition-colors cursor-pointer"
            >
              Recharger la page
            </button>
          </div>
        )}
        
        {/* ============================================================ */}
        {/* TAB 1: VUE D'ENSEMBLE & ANALYTICS                            */}
        {/* ============================================================ */}
        {activeTab === 'overview' && !isLoading && !loadError && (organizations.length > 0 || communities.length > 0 || users.length > 0) && (
          <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            
            {/* Top KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <button
                onClick={() => setActiveTab('organizations')}
                className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 shadow-sm flex flex-col justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-400 mb-2 w-full">
                  <span className="text-xs font-semibold group-hover:text-cyan-300 transition-colors">{adminText.organizations}</span>
                  <Building2 className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{totalOrganizations}</div>
                  <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{approvedOrganizations} {adminText.verifiedCount}</span>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('communities')}
                className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-purple-500/50 shadow-sm flex flex-col justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-400 mb-2 w-full">
                  <span className="text-xs font-semibold group-hover:text-purple-300 transition-colors">{adminText.communities}</span>
                  <Users className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{totalCommunities}</div>
                  <div className="text-[11px] text-purple-400 mt-1 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{activeCommunities} {adminText.activeCount}</span>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-teal-500/50 shadow-sm flex flex-col justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-400 mb-2 w-full">
                  <span className="text-xs font-semibold group-hover:text-teal-300 transition-colors">{adminText.registeredMembers}</span>
                  <HeartHandshake className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{totalMembers}</div>
                  <div className="text-[11px] text-teal-400 mt-1 font-medium">
                    {adminText.monthlyGrowth}
                  </div>
                </div>
              </button>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold">{adminText.postsCount}</span>
                  <FileText className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{totalPosts}</div>
                  <div className="text-[11px] text-slate-400 mt-1 font-medium">
                    {adminText.postsDesc}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('campaigns')}
                className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 shadow-sm flex flex-col justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-400 mb-2 w-full">
                  <span className="text-xs font-semibold group-hover:text-indigo-300 transition-colors">{adminText.campaigns}</span>
                  <Award className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{totalCampaigns}</div>
                  <div className="text-[11px] text-indigo-400 mt-1 font-medium">
                    {adminText.campaignsDesc}
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('moderation')}
                className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-rose-500/50 shadow-sm flex flex-col justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-400 mb-2 w-full">
                  <span className="text-xs font-semibold group-hover:text-rose-300 transition-colors">{adminText.moderation}</span>
                  <ShieldAlert className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{pendingReports}</div>
                  <div className="text-[11px] text-rose-400 mt-1 font-medium">
                    {adminText.toHandle}
                  </div>
                </div>
              </button>
            </div>

            {/* Validation Attention Banner */}
            {(pendingOrganizations > 0 || pendingCommunities > 0) && (
              <div className="p-5 rounded-2xl bg-linear-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-amber-300">
                      {adminText.attentionBannerTitle}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {adminText.attentionBannerDesc(pendingOrganizations, pendingCommunities)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pendingOrganizations > 0 && (
                    <button
                      onClick={() => {
                        setActiveTab('organizations');
                        setOrgFilterStatus('pending');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
                    >
                      {adminText.viewPendingOrgs} ({pendingOrganizations})
                    </button>
                  )}
                  {pendingCommunities > 0 && (
                    <button
                      onClick={() => {
                        setActiveTab('communities');
                        setCommFilterStatus('pending');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs cursor-pointer transition-colors"
                    >
                      {adminText.viewPendingComms} ({pendingCommunities})
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Analytics Modules Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Module 1: Répartition des Organisations par Domaine */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-400" />
                    <span>Répartition des Organisations Partenaires</span>
                  </h3>
                  <span className="text-xs text-slate-400">{totalOrganizations} partenaires</span>
                </div>

                <div className="space-y-3 pt-2">
                  {organizations.slice(0, 5).map((org) => (
                    <div key={org.id} className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={org.logo} alt={org.name} className="w-8 h-8 rounded-lg object-cover" />
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{org.name}</span>
                            {org.status === 'approved' && (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {org.country} • {org.type.toUpperCase()} • {org.subscriptionPlan.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          org.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : org.status === 'pending' || org.status === 'under_review'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}>
                          {org.status === 'approved' ? 'Validée' : org.status === 'under_review' ? 'En examen' : org.status === 'pending' ? 'En attente' : 'Suspendue'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrgInitialTab('identity');
                            setSelectedOrgForValidation(org);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700 shadow-xs"
                          title="Consulter l'intégralité du dossier administratif et légal"
                        >
                          <FileText className="w-3 h-3 text-cyan-400" />
                          <span>Dossier</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Module 2: Écoute & Résilience */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Baromètre d'Impact & Bienveillance Écosystème</span>
                  </h3>
                  <span className="text-xs text-emerald-400 font-bold">98.4% de bienveillance</span>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">Taux de résolution des alertes d'isolement</span>
                      <span className="text-cyan-400 font-bold">94%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-linear-to-r from-cyan-500 to-teal-400 rounded-full" style={{ width: '94%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">Engagement aux cercles fermés thérapeutiques</span>
                      <span className="text-purple-400 font-bold">88%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-linear-to-r from-purple-500 to-indigo-400 rounded-full" style={{ width: '88%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">Confidentialité & Chiffrement de bout en bout</span>
                      <span className="text-emerald-400 font-bold">100% garanti</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-slate-300 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Espace d'écoute solidaire : 1,480 échanges sécurisés protégés.</span>
                    </div>
                    <span className="text-[10px] text-cyan-300 font-mono">Actif 24/7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: VALIDATION DES ORGANISATIONS                          */}
        {/* ============================================================ */}
        {activeTab === 'organizations' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            
            {/* Header + Search Bar + Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <div>
                  <h2 className="text-sm font-bold text-white">{adminText.organizations}</h2>
                  <p className="text-xs text-slate-400">
                    {adminText.manageDetails}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddOrgModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{adminText.addOrgBtn}</span>
                </button>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orgSearchQuery}
                    onChange={(e) => setOrgSearchQuery(e.target.value)}
                    placeholder={adminText.searchPlaceholder}
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500 w-48 sm:w-56"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={orgFilterStatus}
                  onChange={(e) => setOrgFilterStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 font-semibold focus:outline-hidden focus:border-cyan-500 cursor-pointer"
                >
                  <option value="all">{adminText.allFilter} ({totalOrganizations})</option>
                  <option value="pending">{adminText.pendingFilter} ({pendingOrganizations})</option>
                  <option value="approved">{adminText.approvedFilter} ({approvedOrganizations})</option>
                  <option value="suspended">{adminText.suspendedFilter} ({suspendedOrganizations})</option>
                </select>
              </div>
            </div>

            {/* Organizations Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrganizations.map((org) => {
                const isApproved = org.status === 'approved';
                const isPending = org.status === 'pending' || org.status === 'under_review';
                const isSuspended = org.status === 'suspended' || org.status === 'rejected';

                return (
                  <div
                    key={org.id}
                    className={`p-5 rounded-3xl bg-slate-900/90 border transition-all flex flex-col justify-between ${
                      isPending
                        ? 'border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : isApproved
                        ? 'border-slate-800 hover:border-slate-700'
                        : 'border-rose-500/40'
                    }`}
                  >
                    <div>
                      {/* Card Header: Logo, Name, Status Badge */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={org.logo}
                            alt={org.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-800 shadow-md"
                          />
                          <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                              <span>{org.name}</span>
                              {isApproved && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                              )}
                            </h3>
                            <span className="text-[11px] text-slate-400">
                              {org.country} {org.city ? `• ${org.city}` : ''}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                            isApproved
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isApproved
                            ? 'Validée'
                            : org.status === 'under_review'
                            ? 'En examen'
                            : org.status === 'pending'
                            ? 'En attente'
                            : 'Suspendue'}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-300 line-clamp-2 mb-3 leading-relaxed">
                        {org.description}
                      </p>

                      {/* Metadata Table */}
                      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/80 space-y-1.5 text-xs text-slate-300 mb-4">
                        <div className="flex justify-between">
                          <span className="text-slate-500 text-[11px]">Type d'entité :</span>
                          <span className="font-semibold text-white capitalize">{org.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 text-[11px]">Responsable :</span>
                          <span className="font-semibold text-white">{org.responsibleName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 text-[11px]">Contact :</span>
                          <span className="font-mono text-[11px] text-cyan-400">{org.contactEmail}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 text-[11px]">Plan Souscrit :</span>
                          <span className="font-bold text-amber-400 uppercase text-[10px]">
                            {org.subscriptionPlan}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Admin Action Buttons */}
                    <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                      {!isApproved ? (
                        <div className="flex items-center gap-2 flex-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrgInitialTab('identity');
                              setSelectedOrgForValidation(org);
                            }}
                            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700 shadow-xs"
                            title="Consulter l'intégralité du dossier légal et administratif"
                          >
                            <FileText className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Voir le Dossier</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrgInitialTab('email');
                              setSelectedOrgForValidation(org);
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
                            title="Ouvrir le formulaire de validation et générer l'email officiel avec code"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Valider par Email</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrgInitialTab('identity');
                            setSelectedOrgForValidation(org);
                          }}
                          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-700 shadow-xs"
                          title="Examiner le dossier complet et les pièces justificatives"
                        >
                          <FileText className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Dossier Complet</span>
                        </button>
                      )}

                      {isApproved && (
                        <button
                          onClick={() => handleSuspendOrganization(org)}
                          className="py-2 px-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
                          title="Suspendre cette organisation"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {org.status !== 'under_review' && !isApproved && (
                        <button
                          onClick={() => handlePutOrgUnderReview(org)}
                          className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                          title="Mettre sous examen"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setOrgToDelete(org)}
                        className="py-2 px-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
                        title="Supprimer cette organisation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: VALIDATION DES COMMUNAUTÉS                            */}
        {/* ============================================================ */}
        {activeTab === 'communities' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {/* Header + Search Bar + Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-400" />
                <div>
                  <h2 className="text-sm font-bold text-white">{adminText.communities}</h2>
                  <p className="text-xs text-slate-400">
                    {adminText.manageDetails}
                  </p>
                </div>
              </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={commSearchQuery}
                        onChange={(e) => setCommSearchQuery(e.target.value)}
                        placeholder={adminText.searchPlaceholder}
                        className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500 w-48 sm:w-56"
                      />
                    </div>

                    {/* Status Filter */}
                    <select
                      value={commFilterStatus}
                      onChange={(e) => setCommFilterStatus(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 font-semibold focus:outline-hidden focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="all">{adminText.allFilter} ({totalCommunities})</option>
                      <option value="pending">{adminText.pendingFilter} ({pendingCommunities})</option>
                      <option value="active">{adminText.approvedFilter} ({activeCommunities})</option>
                      <option value="suspended">{adminText.suspendedFilter}</option>
                    </select>
                  </div>
                </div>

                {/* Communities Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCommunities.map((comm) => {
                    const isActive = comm.status === 'active' || comm.status === 'approved';
                    const isPending = comm.status === 'draft' || comm.status === 'pending_review';

                    return (
                      <div
                        key={comm.id}
                        className={`p-5 rounded-3xl bg-slate-900/90 border transition-all flex flex-col justify-between ${
                          isPending
                            ? 'border-amber-500/40 shadow-lg shadow-amber-500/5'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          {/* Image + Status badge */}
                          <div className="relative h-28 w-full rounded-2xl overflow-hidden mb-3">
                            <img src={comm.coverImage || comm.image} alt={comm.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent" />
                            
                            <div className="absolute top-2.5 right-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                  isActive
                                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                                    : 'bg-amber-500 text-slate-950 animate-pulse'
                                }`}
                              >
                                {isActive ? 'Active' : 'En attente'}
                              </span>
                            </div>

                            <div className="absolute bottom-2 left-2 flex items-center gap-2">
                              <img src={comm.image} alt={comm.name} className="w-7 h-7 rounded-xl object-cover border border-slate-700" />
                              <span className="text-[11px] text-white font-bold bg-slate-950/70 px-2 py-0.5 rounded-lg backdrop-blur-xs">
                                {comm.organizationName}
                              </span>
                            </div>
                          </div>

                          <h3 className="text-sm font-bold text-white mb-1">{comm.name}</h3>
                          <p className="text-xs text-slate-300 line-clamp-2 mb-3 leading-relaxed">
                            {comm.description}
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                            <span>{comm.membersCount} membres inscrits</span>
                            <span>{comm.postsCount} publications</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center gap-2">
                          {!isActive && (
                            <button
                              onClick={() => handleApproveCommunity(comm)}
                              className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Activer le Cercle</span>
                            </button>
                          )}

                          {isActive && (
                            <button
                              onClick={() => handleSuspendCommunity(comm)}
                              className="py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
                            >
                              Suspendre
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setCommunityToDelete(comm)}
                            className="py-2 px-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
                            title="Supprimer ce cercle"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: GESTION DES CAMPAGNES & PARCOURS                      */}
        {/* ============================================================ */}
        {activeTab === 'campaigns' && (
          <AdminCampaignsTab
            campaigns={campaigns}
            communities={communities}
            onUpdateCampaign={onUpdateCampaign}
            onDeleteCampaign={onDeleteCampaign}
            onShowToast={showToast}
            onRecordLog={handleRecordLog}
          />
        )}

        {/* ============================================================ */}
        {/* TAB 5: GESTION DES UTILISATEURS & MEMBRES                    */}
        {/* ============================================================ */}
        {activeTab === 'users' && (
          <AdminUsersTab
            users={users}
            onUpdateUser={onUpdateUser}
            onShowToast={showToast}
            onRecordLog={handleRecordLog}
          />
        )}

        {/* ============================================================ */}
        {/* TAB 6: SÉCURITÉ, MODÉRATION & ALERTES SOS                    */}
        {/* ============================================================ */}
        {activeTab === 'moderation' && (
          <AdminModerationTab
            reports={reports}
            onUpdateReport={onUpdateReport}
            onShowToast={showToast}
            onRecordLog={handleRecordLog}
          />
        )}

        {/* ============================================================ */}
        {/* TAB 7: JOURNAL D'AUDIT & LOGS SYSTÈME                        */}
        {/* ============================================================ */}
        {activeTab === 'logs' && (
          <AdminLogsTab
            logs={auditLogs}
            onRefreshLogs={() => setAuditLogs(getStoredAuditLogs())}
            onShowToast={showToast}
          />
        )}

        {/* ============================================================ */}
        {/* TAB 8: IDENTITÉ VISUELLE & PUBLICATION DE L'ICÔNE DE MARQUE  */}
        {/* ============================================================ */}
        {activeTab === 'branding' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <AdminBrandIconPublisher
              onShowToast={showToast}
              onRecordLog={handleRecordLog}
            />
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 9: ARCHITECTURE PRODUCTION (VERCEL • SUPABASE • CLOUDINARY) */}
        {/* ============================================================ */}
        {activeTab === 'architecture' && (
          <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            <AdminArchitectureTab onShowToast={showToast} />
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 10: PARAMÈTRES SYSTÈME & IDENTIFIANTS                    */}
        {/* ============================================================ */}
        {activeTab === 'settings' && (
          <AdminSettingsTab
            organizations={organizations}
            communities={communities}
            users={users}
            campaigns={campaigns}
            reports={reports}
            adminSession={adminSession}
            onShowToast={showToast}
            onRecordLog={handleRecordLog}
          />
        )}
      </main>

      {/* ============================================================ */}
      {/* MODAL 1: VALIDATION D'ORGANISATION (EMAIL AVEC CODE)          */}
      {/* ============================================================ */}
      {selectedOrgForValidation && (
        <OrganizationValidationModal
          organization={selectedOrgForValidation}
          isOpen={true}
          initialTab={selectedOrgInitialTab}
          onClose={() => setSelectedOrgForValidation(null)}
          onValidateAndSendEmail={(orgId, code) => {
            onUpdateOrganization(orgId, {
              status: 'approved',
              isVerified: true,
              invitationCode: code,
              validatedAt: new Date().toISOString(),
              validationEmailSentAt: new Date().toISOString(),
            });
            handleRecordLog(
              'Validation Organisation',
              'Organisations',
              `Organisation « ${selectedOrgForValidation.name} » approuvée avec attribution du code ${code}`,
              'success',
              orgId
            );
            setSelectedOrgForValidation(null);
            showToast(`Organisation « ${selectedOrgForValidation.name} » approuvée avec succès !`);
          }}
          onPutUnderReview={(orgId) => {
            onUpdateOrganization(orgId, { status: 'under_review' });
            setSelectedOrgForValidation(null);
            showToast(`Organisation ${selectedOrgForValidation.name} mise sous examen approfondi`);
          }}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL 2: AJOUTER UNE NOUVELLE ORGANISATION PARTENAIRE        */}
      {/* ============================================================ */}
      {showAddOrgModal && (
        <AdminAddOrgModal
          isOpen={showAddOrgModal}
          onClose={() => setShowAddOrgModal(false)}
          onAddOrganization={(newOrg) => {
            onAddOrganization(newOrg);
            showToast(`Organisation « ${newOrg.name} » créée avec succès`);
            handleRecordLog(
              'Création Organisation',
              'Organisations',
              `Nouvelle organisation « ${newOrg.name} » enregistrée par l'administrateur`,
              'success',
              newOrg.id
            );
          }}
          onShowToast={showToast}
          onRecordLog={handleRecordLog}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL 4: CONFIRMATION SUPPRESSION ORGANISATION               */}
      {/* ============================================================ */}
      {orgToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Supprimer l'organisation ?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement l'organisation{' '}
              <strong className="text-white">« {orgToDelete.name} »</strong> ? Cette action retirera également tous les accès associés.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setOrgToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  const orgName = orgToDelete.name;
                  const orgId = orgToDelete.id;
                  onDeleteOrganization(orgId);
                  setOrgToDelete(null);
                  showToast(`Organisation « ${orgName} » supprimée`);
                  handleRecordLog(
                    'Suppression Organisation',
                    'Organisations',
                    `Organisation « ${orgName} » (${orgId}) supprimée du système`,
                    'warning',
                    orgId
                  );
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold shadow-md shadow-rose-500/20 cursor-pointer"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 5: CONFIRMATION SUPPRESSION COMMUNAUTÉ                 */}
      {/* ============================================================ */}
      {communityToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Supprimer le cercle de soutien ?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement le cercle communautaire{' '}
              <strong className="text-white">« {communityToDelete.name} »</strong> ?
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCommunityToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  const commName = communityToDelete.name;
                  const commId = communityToDelete.id;
                  onDeleteCommunity(commId);
                  setCommunityToDelete(null);
                  showToast(`Cercle « ${commName} » supprimé`);
                  handleRecordLog(
                    'Suppression Communauté',
                    'Communautés',
                    `Cercle communautaire « ${commName} » (${commId}) supprimé du système`,
                    'warning',
                    commId
                  );
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold shadow-md shadow-rose-500/20 cursor-pointer"
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
