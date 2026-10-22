import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ChevronUp, ChevronDown } from 'lucide-react';
import {
  UserProfile,
  Organization,
  Community,
  StoryTestimonial,
  Post,
  Campaign,
  CampaignContribution,
  MessageThread,
  InvitationCode,
  ModerationReport,
  AppNotification,
  Language,
  PartnerTab,
  MemberStatus,
  MemberInvitationRequest,
  SearchResult,
} from './types';
import {
  MOCK_USERS,
  MOCK_ORGANIZATIONS,
  MOCK_COMMUNITIES,
  MOCK_STORIES,
  MOCK_POSTS,
  MOCK_CAMPAIGNS,
  MOCK_MESSAGE_THREADS,
  MOCK_INVITATIONS,
  MOCK_MODERATION_REPORTS,
  MOCK_NOTIFICATIONS,
} from './data/mockData';
import {
  getLocalizedOrganizations,
  getLocalizedCommunities,
  getLocalizedStories,
  getLocalizedPosts,
  getLocalizedCampaigns,
  prefetchPostTranslations,
  clearUserPostTranslations,
} from './data/localizedMockData';
import { api } from './services/api';
import { clearAppStorage, STORAGE_KEYS } from './utils/storage';
import { t } from './translations';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';

const INITIAL_INVITATION_REQUESTS: MemberInvitationRequest[] = [
  {
    id: 'req-drepano-1',
    candidateName: 'Espérance Mwamba',
    candidateAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    contactEmail: 'esperance.mwamba@gmail.com',
    contactPhone: '+243 99 876 5432',
    communityId: 'comm-drepano',
    communityName: 'Vaincre la Drépanocytose',
    organizationId: 'org-drepano',
    situation: 'Jeune adulte diagnostiquée Drépanocytose SS (Guerrière) à Kinshasa',
    motivation: 'Je cherche un cercle de parole bienveillant et confidentiel pour échanger sur la gestion des crises douloureuses vaso-occlusives, trouver du soutien moral et des astuces d’hydratation.',
    isFirstRequestOnTulizaana: true,
    requestedAt: 'Il y a 2 heures',
    status: 'pending',
  },
  {
    id: 'req-drepano-2',
    candidateName: 'Clémentine Nabintu',
    candidateAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    contactEmail: 'clementina.bintu@yahoo.fr',
    contactPhone: '+243 85 123 4567',
    communityId: 'comm-drepano',
    communityName: 'Vaincre la Drépanocytose',
    organizationId: 'org-drepano',
    situation: 'Maman d’un enfant de 5 ans vivant avec la drépanocytose SS',
    motivation: 'Mon enfant fait des crises fréquentes et je me sens isolée. Je participe déjà au cercle Santé Mentale de Tulizaana et je souhaite maintenant rejoindre ce cercle spécialisé pour des conseils concrets.',
    isFirstRequestOnTulizaana: false,
    existingCommunitiesJoined: ['Santé Mentale & Esprit Serein'],
    requestedAt: 'Il y a 5 heures',
    status: 'pending',
  },
  {
    id: 'req-drepano-3',
    candidateName: 'Patrick Kalombo',
    candidateAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    contactEmail: 'patrick.kalombo@gmail.com',
    contactPhone: '+243 82 456 7890',
    communityId: 'comm-drepano',
    communityName: 'Vaincre la Drépanocytose',
    organizationId: 'org-drepano',
    situation: 'Patient adulte drépanocytaire SC vivant à Lubumbashi',
    motivation: 'Je souhaite échanger avec d’autres patients adultes, partager mes stratégies de prévention du froid et encourager les plus jeunes dans leur parcours médical.',
    isFirstRequestOnTulizaana: true,
    requestedAt: 'Il y a 1 jour',
    status: 'pending',
  },
  {
    id: 'req-panzi-1',
    candidateName: 'Aimée Nsimba',
    candidateAvatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150',
    contactEmail: 'aimee.nsimba@gmail.com',
    contactPhone: '+243 97 555 4321',
    communityId: 'comm-survivantes',
    communityName: 'Survivantes & Cœurs Résilients',
    organizationId: 'org-panzi',
    situation: 'Survivante accompagnée en parcours de réhabilitation à Bukavu',
    motivation: 'Je désire intégrer ce sanctuaire d’écoute pour rompre l’isolement, participer aux cercles de parole hebdomadaires et reconstruire ma confiance.',
    isFirstRequestOnTulizaana: true,
    requestedAt: 'Il y a 3 heures',
    status: 'pending',
  },
];

// User Portal Components
import { UserNavbar } from './components/user/UserNavbar';
import { UserSidebar } from './components/user/UserSidebar';
import { MobileBottomNav } from './components/user/MobileBottomNav';
import { StoriesBar } from './components/user/StoriesBar';
import { StoryViewerModal } from './components/user/StoryViewerModal';
import { PostCard } from './components/user/PostCard';
import { CreatePostModal } from './components/user/CreatePostModal';
import { UserProfileModal } from './components/user/UserProfileModal';
import { ProfileView } from './components/user/ProfileView';
import { CampaignsView } from './components/user/CampaignsView';
import { CommunitiesView } from './components/user/CommunitiesView';
import { MessagingView } from './components/user/MessagingView';
import { GlobalSearchView } from './components/user/GlobalSearchView';
import { InviteGateModal } from './components/user/InviteGateModal';

// Partner Portal Components
import { PartnerLayout } from './components/partner/PartnerLayout';
import { PartnerDashboard } from './components/partner/PartnerDashboard';
import { PartnerCommunities } from './components/partner/PartnerCommunities';
import { PartnerCampaigns } from './components/partner/PartnerCampaigns';
import { PartnerMembers } from './components/partner/PartnerMembers';
import { PartnerModeration } from './components/partner/PartnerModeration';
import { PartnerAnalytics } from './components/partner/PartnerAnalytics';
import { PartnerReports } from './components/partner/PartnerReports';
import { PartnerSubscription } from './components/partner/PartnerSubscription';
import { PartnerOrganizationProfile } from './components/partner/PartnerOrganizationProfile';
import { OrganizationProfileModal } from './components/partner/OrganizationProfileModal';
import { PartnerAuthModal } from './components/partner/PartnerAuthModal';
import { CreateOrganizationModal } from './components/partner/CreateOrganizationModal';
import { CreateCommunityModal } from './components/partner/CreateCommunityModal';

// Onboarding Components
import { SplashScreen } from './components/onboarding/SplashScreen';
import { WelcomeScreen } from './components/onboarding/WelcomeScreen';
import { InviteGateScreen } from './components/onboarding/InviteGateScreen';
import { logoutGoogle } from './services/googleAuthService';

// Common Components
import { SOSModal } from './components/common/SOSModal';
import { NotificationDrawer } from './components/common/NotificationDrawer';

// Tulizaana Central Back Office Admin
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminBackOffice } from './components/admin/AdminBackOffice';
import {
  loadAdminSession,
  loadAdminSessionFromStorage,
  signOutAdmin,
  type AdminSession,
} from './components/admin/adminAuth';

export function App() {
  // Persistent Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Onboarding Workflow ('splash' -> 'welcome' -> 'invite_gate' -> 'app')
  const [onboardingStep, setOnboardingStep] = useState<'splash' | 'welcome' | 'invite_gate' | 'app'>('splash');
  const [selectedRoleForGate, setSelectedRoleForGate] = useState<'user' | 'partner'>('user');

  // Portal Mode
  const [interfaceMode, setInterfaceMode] = useState<'user' | 'partner'>(() => {
    try {
      const savedMode = localStorage.getItem(STORAGE_KEYS.interfaceMode);
      return savedMode === 'partner' ? 'partner' : 'user';
    } catch {
      return 'user';
    }
  });
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.preferredLang) as Language;
      if (saved && ['fr', 'sw', 'en', 'ar', 'pt'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'fr';
  });
  const currentLang = t[language] || t.fr;

  // Synchronize active language with document element attributes and localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.preferredLang, language);
    } catch {}
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // Navigation States
  const [activeUserTab, setActiveUserTab] = useState<string>('feed');
  const [activePartnerTab, setActivePartnerTab] = useState<PartnerTab>('profile');

  // Partner Portal Authentication & Access Gate
  // Chantier 4 : ce drapeau ne peut plus etre pose par le client. Il n'est
  // mis a `true` qu'apres que le serveur a confirme la session ET retourne les
  // organisations issues de `OrganizationAdmin` (voir `onSuccessAuth`).
  // Au chargement, il est revalide par `GET /api/organizations/mine`.
  const [isPartnerAuthenticated, setIsPartnerAuthenticated] = useState<boolean>(false);
  const [managedPartnerOrganizations, setManagedPartnerOrganizations] = useState<
    import('./services/api').PartnerManagedOrganization[]
  >([]);
  const [partnerBlockedBy, setPartnerBlockedBy] = useState<string | null>(null);
  const [showPartnerAuthModal, setShowPartnerAuthModal] = useState<boolean>(false);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState<boolean>(false);
const [showCreateCommunityModal, setShowCreateCommunityModal] = useState<boolean>(false);
  const [selectedOrgForModal, setSelectedOrgForModal] = useState<Organization | null>(null);

  // Tulizaana Central Back Office Admin State
  // Aucune session administrateur n'est derivée d'un indicateur de navigateur :
  // `adminSession` n'existe que si le serveur a confirmé (GET /api/auth/me) que le
  // jeton courant appartient a un compte administrateur actif. Ce state ne sert
  // qu'a afficher l'interface ; l'autorisation reelle est revalidee a chaque appel.
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);
  const [showAdminBackOffice, setShowAdminBackOffice] = useState<boolean>(false);
  // Le Back Office enregistre ici sa fonction d'affichage des messages, afin que
  // les refus du serveur soient visibles par l'administrateur et jamais avalés.
  const adminNotifyRef = useRef<((msg: string) => void) | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    // D'abord, charger depuis localStorage pour persistance
    const localSession = loadAdminSessionFromStorage();
    if (localSession) {
      setAdminSession(localSession);
      setShowAdminBackOffice(true);
    }
    
    // Puis vérifier avec le serveur (le token JWT permet ça)
    loadAdminSession().then((session) => {
      if (!cancelled) {
        if (session) {
          setAdminSession(session);
          setShowAdminBackOffice(true);
        } else {
          // Si le serveur dit qu'il n'y a pas de session valide, effacer localStorage
          if (localSession) {
            signOutAdmin();
            setAdminSession(null);
            setShowAdminBackOffice(false);
          }
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenAdminBackOffice = () => {
    if (adminSession) {
      setShowAdminBackOffice(true);
    } else {
      setShowAdminLoginModal(true);
    }
  };

  const handleCloseAdminBackOffice = async () => {
    setShowAdminBackOffice(false);
    
    // Si une session admin existe, charger les données de l'utilisateur et passer à l'interface app
    if (adminSession) {
      try {
        const me = await api.auth.me();
        if (me.success && me.data) {
          // Mettre à jour currentUser avec les données admin
          setCurrentUser(me.data);
          setAllUsers(prev => [...prev.filter(u => u.id !== me.data.id), me.data]);
          setViewingProfileUserId(me.data.id);
          
          // Passer à l'interface utilisateur
          setOnboardingStep('app');
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil admin:', error);
      }
    }
  };

  const handleAdminLoginSuccess = (session: AdminSession) => {
    setAdminSession(session);
    setShowAdminLoginModal(false);
    setShowAdminBackOffice(true);
  };

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    signOutAdmin(); // Cela efface maintenant localStorage aussi
    setAdminSession(null);
    setShowAdminBackOffice(false);
    clearAppStorage();
    resetSensitiveReactState();
  };

  /**
   * Applique une modification d'organisation : la décision est prise par le
   * serveur, et l'état local n'est mis à jour qu'après son accord. Un refus HTTP
   * est remonté tel quel plutôt que d'être masqué par une interface optimiste.
   */
  const handleUpdateOrganizationFromAdmin = async (
    orgId: string,
    updatedFields: Partial<Organization>
  ) => {
    if (!updatedFields.status) return;

    const response = await api.admin.updateOrganizationStatus(orgId, {
      status: updatedFields.status,
      subscriptionPlan: updatedFields.subscriptionPlan,
    });

    if (!response.success) {
      adminNotifyRef.current?.(response.error || "Le serveur a refusé la mise à jour de l'organisation.");
      return;
    }

    setOrganizations((prev) => {
      const updated = prev.map((o) => (o.id === orgId ? { ...o, ...updatedFields } : o));
return updated;
    });
    if (currentOrganization.id === orgId) {
      setCurrentOrganization((prev) => {
        const merged = { ...prev, ...updatedFields };
return merged;
      });
    }
  };

  const handleUpdateCommunityFromAdmin = async (
    commId: string,
    updatedFields: Partial<Community>
  ) => {
    if (!updatedFields.status) return;

    const response = await api.admin.updateCommunityStatus(commId, updatedFields.status);

    if (!response.success) {
      adminNotifyRef.current?.(response.error || "Le serveur a refusé la mise à jour du cercle.");
      return;
    }

    setCommunities((prev) => {
      const updated = prev.map((c) => (c.id === commId ? { ...c, ...updatedFields } : c));
return updated;
    });
  };

  const handleDeleteCommunityFromAdmin = async (commId: string) => {
    const response = await api.admin.deleteCommunity(commId);

    if (!response.success) {
      adminNotifyRef.current?.(response.error || "Le serveur a refusé la suppression du cercle.");
      return;
    }

    setCommunities((prev) => {
      const updated = prev.filter((c) => c.id !== commId);
return updated;
    });
  };

  const handleDeleteOrganizationFromAdmin = async (orgId: string) => {
    const response = await api.admin.deleteOrganization(orgId);

    if (!response.success) {
      adminNotifyRef.current?.(response.error || "Le serveur a refusé la suppression de l'organisation.");
      return;
    }

    setOrganizations((prev) => {
      const updated = prev.filter((o) => o.id !== orgId);
return updated;
    });
  };

  const handleCreateOrganization = async (newOrg: Organization) => {
    // Chantier 4 : plus de mise a jour d'interface avant reponse serveur, et
    // plus d'ouverture du portail. Deposer une candidature n'accorde AUCUN
    // droit : le serveur impose `status=pending` et la formule d'entree, et
    // l'espace de gestion reste inaccessible tant que l'agrement n'est pas
    // prononce par un administrateur.
    const res = await api.organizations.create({
      name: newOrg.name,
      acronym: newOrg.acronym,
      domain: newOrg.domain,
      mission: newOrg.mission,
      description: newOrg.description,
      type: newOrg.type || 'ong',
      country: newOrg.country,
      city: newOrg.city,
      responsibleName: newOrg.responsibleName,
      responsibleTitle: 'Responsable',
      contactEmail: newOrg.contactEmail,
      contactPhone: newOrg.contactPhone || '+243 81 000 0000',
      // `status` et `subscriptionPlan` ne sont PLUS envoyés : le serveur les
      // impose. Les envoyer n'aurait aucun effet et donnerait l'illusion que
      // le client choisit son plan.
    });

    if (!res.success) {
      alert(res.error || "Le serveur n'a pas enregistre la candidature.");
      setShowCreateOrgModal(false);
      return;
    }

    const createdId = res.data?.organization?.id;
    const candidate: Organization = {
      ...newOrg,
      id: createdId ?? newOrg.id,
      // Valeurs imposees par le serveur, et non choisies ici.
      status: 'pending',
      isVerified: false,
    };

    setOrganizations((prev) => {
      const updated = [candidate, ...prev.filter((o) => o.id !== newOrg.id)];
return updated;
    });

    setShowCreateOrgModal(false);

    alert(
      `Candidature enregistree. La demande concerning « ${candidate.name} » sera examinee par l'equipe de Tulizaana. L'espace de gestion et la creation de cercles resteront indisponibles jusqu'a son approbation.`
    );
  };

  const handleUpdateCampaignFromAdmin = async (
    campaignId: string,
    updatedFields: Partial<Campaign>
  ) => {
    if (!updatedFields.status) return;

    const response = await api.admin.updateCampaignStatus(campaignId, updatedFields.status);

    if (!response.success) {
      adminNotifyRef.current?.(response.error || "Le serveur a refusé la mise à jour de la campagne.");
      return;
    }

    setCampaigns((prev) => {
      const updated = prev.map((c) => (c.id === campaignId ? { ...c, ...updatedFields } : c));
return updated;
    });
  };

  const handleDeleteCampaignFromAdmin = async (campaignId: string) => {
    const response = await api.admin.deleteCampaign(campaignId);

    if (!response.success) {
      adminNotifyRef.current?.(response.error || "Le serveur a refusé la suppression de la campagne.");
      return;
    }

    setCampaigns((prev) => {
      const updated = prev.filter((c) => c.id !== campaignId);
return updated;
    });
  };

  /**
   * Un changement de role ou une suspension ne prend effet qu'apres accord du
   * serveur. Le client ne peut donc pas s'auto-attribuer un privilege, ni en
   * retirer un a un tiers de sa propre initiative.
   */
  const handleUpdateUserFromAdmin = async (
    userId: string,
    updatedFields: Partial<UserProfile>
  ) => {
    const accessChanges: { role?: string; isSuspended?: boolean } = {};
    if (updatedFields.role !== undefined) accessChanges.role = updatedFields.role;
    if (updatedFields.isSuspended !== undefined) accessChanges.isSuspended = updatedFields.isSuspended;

    if (Object.keys(accessChanges).length > 0) {
      const response = await api.admin.updateUserAccess(userId, accessChanges);

      if (!response.success) {
        adminNotifyRef.current?.(response.error || "Le serveur a refusé cette modification de droits.");
        return;
      }
    }

    setAllUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, ...updatedFields } : u));
return updated;
    });
    if (currentUser.id === userId) {
      setCurrentUser((prev) => {
        const merged = { ...prev, ...updatedFields };
return merged;
      });
    }
  };

  const handleUpdateReportFromAdmin = async (
    reportId: string,
    newStatus: ModerationReport['status'],
    notes?: string
  ) => {
    const response = await api.moderation.handleReport(reportId, { status: newStatus, notes });

    if (!response.success) {
      adminNotifyRef.current?.(response.error || "Le serveur a refusé la mise à jour du signalement.");
      return;
    }

    setModerationReports((prev) => {
      const updated = prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: newStatus,
              actionTakenBy: 'Admin Central Tulizaana',
              actionTakenAt: new Date().toISOString(),
              notes: notes || 'Traité par l’équipe de modération',
            }
          : r
      );
return updated;
    });
  };

  // Active User Profile (memoire uniquement, reconstruit depuis l'API quand le cookie serveur existe)
  const [currentUser, setCurrentUser] = useState<UserProfile>(MOCK_USERS[0]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>(MOCK_USERS);
  const [viewingProfileUserId, setViewingProfileUserId] = useState<string>(MOCK_USERS[0].id);

  // Active Partner Organization
  const [currentOrganization, setCurrentOrganization] = useState<Organization>(MOCK_ORGANIZATIONS[1]); // ALD-RDC
  const [organizations, setOrganizations] = useState<Organization[]>(MOCK_ORGANIZATIONS);

  // Core Data Collections: API / memoire React uniquement, sans persistance navigateur
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [stories, setStories] = useState<StoryTestimonial[]>(MOCK_STORIES);
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [communities, setCommunities] = useState<Community[]>(MOCK_COMMUNITIES);
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>(MOCK_MESSAGE_THREADS);
  const [invitations, setInvitations] = useState<InvitationCode[]>(MOCK_INVITATIONS);
  const [moderationReports, setModerationReports] = useState<ModerationReport[]>(MOCK_MODERATION_REPORTS);
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [invitationRequests, setInvitationRequests] = useState<MemberInvitationRequest[]>(INITIAL_INVITATION_REQUESTS);

  const resetSensitiveReactState = () => {
    setCurrentUser(MOCK_USERS[0]);
    setAllUsers(MOCK_USERS);
    setViewingProfileUserId(MOCK_USERS[0].id);
    setCurrentOrganization(MOCK_ORGANIZATIONS[1]);
    setOrganizations(MOCK_ORGANIZATIONS);
    setPosts(MOCK_POSTS);
    setStories(MOCK_STORIES);
    setCampaigns(MOCK_CAMPAIGNS);
    setCommunities(MOCK_COMMUNITIES);
    setMessageThreads(MOCK_MESSAGE_THREADS);
    setInvitations(MOCK_INVITATIONS);
    setModerationReports(MOCK_MODERATION_REPORTS);
    setNotifications(MOCK_NOTIFICATIONS);
    setInvitationRequests(INITIAL_INVITATION_REQUESTS);
    setManagedPartnerOrganizations([]);
    setPartnerBlockedBy(null);
  };

  useEffect(() => {
    let cancelled = false;

    api.auth.me().then((res) => {
      const serverUser = res.success ? res.data?.user || res.data : null;
      if (cancelled || !serverUser) return;

      setCurrentUser((prev) => ({
        ...prev,
        id: serverUser.id || prev.id,
        name: serverUser.name || prev.name,
        pseudonym: serverUser.pseudonym || prev.pseudonym,
        avatar: serverUser.avatar || prev.avatar,
        bio: serverUser.bio || prev.bio,
        role: serverUser.role || prev.role,
        language: serverUser.language || prev.language,
        joinedCommunities: Array.isArray(serverUser.joinedCommunities)
          ? serverUser.joinedCommunities
          : prev.joinedCommunities,
      }));

      setAllUsers((prev) => {
        const exists = prev.some((u) => u.id === (serverUser.id || prev[0]?.id));
        if (!exists) {
          return [{ ...prev[0], ...serverUser }, ...prev.slice(1)];
        }
        return prev.map((u) => (u.id === serverUser.id ? { ...u, ...serverUser } : u));
      });
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);
  // Modal Controls
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [showInviteGateModal, setShowInviteGateModal] = useState(false);
  const [viewingStory, setViewingStory] = useState<StoryTestimonial | null>(null);
// Synchronisation initiale et transparente avec l'API Backend PostgreSQL
  useEffect(() => {
    // 1. Récupération des cercles depuis la base de données
    api.communities.list().then((res) => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setCommunities((prev) => {
          const remoteMap = new Map(res.data.map((c: any) => [c.id, c]));
          // Fusion intelligente préservant les propriétés locales
          const merged = prev.map((local) => {
            const remote: any = remoteMap.get(local.id);
            return remote
              ? {
                  ...local,
                  name: remote.name || local.name,
                  description: remote.description || local.description,
                  mission: remote.mission || local.mission,
                  category: remote.category || local.category,
                  icon: remote.icon || local.icon,
                }
              : local;
          });
          return merged;
        });
      }
    }).catch(() => {});

    // 2. Récupération des campagnes réelles
    api.campaigns.list().then((res) => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setCampaigns((prev) => {
          const apiCampaigns = res.data;
          return apiCampaigns.length > 0 ? apiCampaigns : prev;
        });
      }
    }).catch(() => {});

    // 3. Récupération des organisations partenaires
    api.organizations.list().then((res) => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setOrganizations((prev) => {
          const apiOrgs = res.data;
          return apiOrgs.length > 0 ? apiOrgs : prev;
        });
      }
    }).catch(() => {});

    // 4. Récupération des stories actives
    api.stories.list().then((res) => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setStories((prev) => {
          const apiStories = res.data;
          return apiStories.length > 0 ? apiStories : prev;
        });
      }
    }).catch(() => {});
  }, []);

  // Dynamic user posts translation version trigger
  const [translationVersion, setTranslationVersion] = useState(0);

  useEffect(() => {
    const handlePostTranslated = () => {
      setTranslationVersion((v) => v + 1);
    };
    window.addEventListener('tlz_post_translated', handlePostTranslated);
    return () => {
      window.removeEventListener('tlz_post_translated', handlePostTranslated);
    };
  }, []);

  // Localized collections based on active language
  const localizedOrganizations = useMemo(() => getLocalizedOrganizations(language, organizations), [language, organizations]);
  const localizedCommunities = useMemo(() => getLocalizedCommunities(language, communities), [language, communities]);
  const localizedPosts = useMemo(() => getLocalizedPosts(language, posts), [language, posts, translationVersion]);
  const localizedStories = useMemo(() => getLocalizedStories(language, stories), [language, stories]);
  const localizedCampaigns = useMemo(() => getLocalizedCampaigns(language, campaigns), [language, campaigns]);
  const localizedCurrentOrganization = useMemo(() => {
    return localizedOrganizations.find((o) => o.id === currentOrganization.id) || currentOrganization;
  }, [localizedOrganizations, currentOrganization]);

  // Current primary community for user
  const activeCommunity =
    (localizedCommunities || []).find((c) => (currentUser?.joinedCommunities || []).includes(c.id)) ||
    localizedCommunities?.[0] ||
    MOCK_COMMUNITIES[0];

  // User Actions
  const handleCreatePost = (newPostData: Partial<Post>) => {
    const targetComm = (communities || []).find((c) => c.id === newPostData.communityId) || activeCommunity;
    const isAnon = Boolean(newPostData.isAnonymous || currentUser.isAnonymous);
    const newPost: Post = {
      id: `post-${Date.now()}`,
      authorId: currentUser.id,
      authorName: isAnon ? 'Anonyme' : currentUser.name,
      authorAvatar: isAnon
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        : currentUser.avatar,
      authorStatus: currentUser.status,
      isAnonymous: isAnon,
      communityId: newPostData.communityId || activeCommunity?.id || 'comm-drepano',
      communityName: newPostData.communityName || targetComm?.name || activeCommunity?.name || 'Communauté',
      type: newPostData.type || 'question',
      title: newPostData.title || '',
      content: newPostData.content || '',
      media: newPostData.media || [],
      tags: newPostData.tags || ['#santé', '#résilience'],
      timestamp: 'À l’instant',
      reactions: { support: 1, understand: 0, courage: 1, bravo: 0 },
      commentsCount: 0,
      comments: [],
    };

    setPosts([newPost, ...posts]);
    setCurrentUser((prev) => ({ ...prev, points: prev.points + 25 }));
    prefetchPostTranslations(newPost, language);

    // Persistance asynchrone sur l'API PostgreSQL
    api.posts.create({
      communityId: newPost.communityId,
      content: newPost.content,
      title: newPost.title,
      type: newPost.type,
      tags: newPost.tags,
      isAnonymous: newPost.isAnonymous,
      mediaUrl: newPost.media?.[0]?.url,
      mediaType: newPost.media?.[0]?.type,
    }).catch((err) => console.warn('Synchronisation publication backend (mode local maintenu):', err));

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handlePostReaction = (postId: string, reactionType: 'support' | 'understand' | 'courage' | 'bravo') => {
    // Appel asynchrone API
    api.posts.react(postId, reactionType).catch(() => {});

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const currentReactions = { ...p.reactions };
          const previousReaction = p.userReaction;

          if (previousReaction === reactionType) {
            // Toggle off
            currentReactions[reactionType] = Math.max(0, currentReactions[reactionType] - 1);
            return { ...p, reactions: currentReactions, userReaction: undefined };
          } else {
            // If already had another reaction, decrement it
            if (previousReaction) {
              currentReactions[previousReaction] = Math.max(0, currentReactions[previousReaction] - 1);
            }
            currentReactions[reactionType] = (currentReactions[reactionType] || 0) + 1;

            // Trigger slight haptic / visual celebration for supportive reactions
            confetti({
              particleCount: 20,
              spread: 40,
              origin: { y: 0.7 },
            });

            return { ...p, reactions: currentReactions, userReaction: reactionType };
          }
        }
        return p;
      })
    );
  };

  const handleAddComment = (postId: string, content: string, isAnonymous?: boolean) => {
    const isAnon = Boolean(isAnonymous || currentUser.isAnonymous);

    // Enregistrement asynchrone sur l'API
    api.posts.comment(postId, content, isAnon).catch(() => {});

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const newComment = {
            id: `comm-${Date.now()}`,
            postId,
            authorId: currentUser.id,
            authorName: isAnon ? 'Anonyme' : currentUser.name,
            authorAvatar: isAnon
              ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              : currentUser.avatar,
            authorStatus: currentUser.status,
            isAnonymous: isAnon,
            content,
            timestamp: 'À l’instant',
            reactions: { support: 1, understand: 0, courage: 0, bravo: 0 },
          };

          return {
            ...p,
            commentsCount: p.commentsCount + 1,
            comments: [...p.comments, newComment],
          };
        }
        return p;
      })
    );

    setCurrentUser((prev) => ({ ...prev, points: prev.points + 10 }));
  };

  const handleCreateStory = (newStory: Partial<StoryTestimonial>) => {
    const created: StoryTestimonial = {
      id: `story-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      authorStatus: currentUser.status,
      communityId: activeCommunity.id,
      communityName: activeCommunity.name.split(' ')[0] || 'Cercle',
      type: newStory.type || 'photo',
      mediaUrl: newStory.mediaUrl,
      caption: newStory.caption || 'Mon témoignage de résilience',
      timestamp: 'À l’instant',
      hasRingGlow: true,
      reactions: { support: 5, understand: 2, courage: 3, bravo: 4 },
      isFeaturedOnProfile: true,
    };

    setStories([created, ...stories]);
    setCurrentUser((prev) => ({
      ...prev,
      points: prev.points + 30,
      featuredTestimonialIds: [created.id, ...prev.featuredTestimonialIds],
    }));

    // Envoi asynchrone à l'API backend
    api.stories.create({
      communityId: created.communityId,
      caption: created.caption,
      mediaUrl: created.mediaUrl,
      mediaType: created.type === 'audio' ? 'audio' : 'image',
    }).catch(() => {});

    confetti({
      particleCount: 60,
      spread: 75,
      origin: { y: 0.5 },
    });
  };

  const handleToggleFeaturedStory = (storyId: string) => {
    setStories((prev) =>
      prev.map((s) => (s.id === storyId ? { ...s, isFeaturedOnProfile: !s.isFeaturedOnProfile } : s))
    );
    setCurrentUser((prev) => {
      const isCurrentlyFeatured = prev.featuredTestimonialIds.includes(storyId);
      return {
        ...prev,
        featuredTestimonialIds: isCurrentlyFeatured
          ? prev.featuredTestimonialIds.filter((id) => id !== storyId)
          : [storyId, ...prev.featuredTestimonialIds],
      };
    });
  };

  const handleOpenUserProfile = (userId: string) => {
    setViewingProfileUserId(userId);
    setActiveUserTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenMyProfile = () => {
    setViewingProfileUserId(currentUser.id);
    setActiveUserTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSearch = () => {
    setActiveUserTab('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * L'API ne livre que les identifiants publics de recherche. Cette application
   * a une navigation par onglets (pas de routeur URL) : on ouvre donc la vue
   * existante qui porte le contenu choisi, sans fabriquer de donnees locales.
   */
  const handleOpenSearchResult = (result: SearchResult) => {
    if (result.type === 'organizations') {
      handleOpenOrganizationProfile(result.title);
      return;
    }
    if (result.type === 'users') {
      handleOpenUserProfile(result.id);
      return;
    }

    const destination = result.type === 'communities'
      ? 'communities'
      : result.type === 'campaigns'
        ? 'campaigns'
        : 'feed';
    setActiveUserTab(destination);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFollowToggle = (targetUserId: string) => {
    setCurrentUser((prev) => {
      const isFollowing = prev.followingUserIds?.includes(targetUserId);
      const updatedFollowing = isFollowing
        ? prev.followingUserIds.filter((id) => id !== targetUserId)
        : [...(prev.followingUserIds || []), targetUserId];
      return { ...prev, followingUserIds: updatedFollowing };
    });

    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === currentUser.id) {
          const isFollowing = u.followingUserIds?.includes(targetUserId);
          const updatedFollowing = isFollowing
            ? u.followingUserIds.filter((id) => id !== targetUserId)
            : [...(u.followingUserIds || []), targetUserId];
          return { ...u, followingUserIds: updatedFollowing };
        }
        return u;
      })
    );
  };

  const handleSavePost = (postId: string) => {
    setCurrentUser((prev) => {
      const isSaved = (prev.savedPostIds || []).includes(postId);
      const updatedSaved = isSaved
        ? (prev.savedPostIds || []).filter((id) => id !== postId)
        : [...(prev.savedPostIds || []), postId];
      const updatedUser = { ...prev, savedPostIds: updatedSaved };
return updatedUser;
    });

    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === currentUser.id) {
          const isSaved = (u.savedPostIds || []).includes(postId);
          const updatedSaved = isSaved
            ? (u.savedPostIds || []).filter((id) => id !== postId)
            : [...(u.savedPostIds || []), postId];
          return { ...u, savedPostIds: updatedSaved };
        }
        return u;
      })
    );
  };

  const handleUpdateProfile = (updatedData: {
    name: string;
    pseudonym: string;
    bio: string;
    avatar: string;
    isAnonymous: boolean;
  }) => {
    const nextAnon = updatedData.isAnonymous;
    const updatedUser: UserProfile = {
      ...currentUser,
      name: updatedData.name,
      pseudonym: updatedData.pseudonym,
      bio: updatedData.bio,
      avatar: updatedData.avatar,
      isAnonymous: nextAnon,
    };

    setCurrentUser(updatedUser);
setAllUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? updatedUser : u))
    );

    // Synchronize posts so author name and photo reflect the anonymity state across Tulizaana
    setPosts((prev) => {
      const updated = prev.map((p) => {
        if (p.authorId === currentUser.id) {
          return {
            ...p,
            authorName: nextAnon ? 'Anonyme' : updatedData.name,
            authorAvatar: nextAnon
              ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              : updatedData.avatar,
            isAnonymous: nextAnon,
          };
        }
        return p;
      });
return updated;
    });

    // Synchronize campaign contributions so author name and photo reflect the anonymity state
    setCampaigns((prev) =>
      prev.map((c) => ({
        ...c,
        contributions: (c.contributions || []).map((contrib) => {
          if (contrib.authorId === currentUser.id) {
            return {
              ...contrib,
              authorName: nextAnon ? 'Anonyme' : updatedData.name,
              authorAvatar: nextAnon
                ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                : updatedData.avatar,
              isAnonymous: nextAnon,
            };
          }
          return contrib;
        }),
      }))
    );
  };

  const handleToggleAnonymousMode = () => {
    const nextAnon = !currentUser.isAnonymous;
    const updatedUser: UserProfile = {
      ...currentUser,
      isAnonymous: nextAnon,
    };

    setCurrentUser(updatedUser);
setAllUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? updatedUser : u))
    );

    setPosts((prev) => {
      const updated = prev.map((p) => {
        if (p.authorId === currentUser.id) {
          return {
            ...p,
            authorName: nextAnon ? 'Anonyme' : currentUser.name,
            authorAvatar: nextAnon
              ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              : currentUser.avatar,
            isAnonymous: nextAnon,
          };
        }
        return p;
      });
return updated;
    });

    setCampaigns((prev) =>
      prev.map((c) => ({
        ...c,
        contributions: (c.contributions || []).map((contrib) => {
          if (contrib.authorId === currentUser.id) {
            return {
              ...contrib,
              authorName: nextAnon ? 'Anonyme' : currentUser.name,
              authorAvatar: nextAnon
                ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                : currentUser.avatar,
              isAnonymous: nextAnon,
            };
          }
          return contrib;
        }),
      }))
    );
  };

  const handleCompleteCampaignActivity = (campaignId: string, activityId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === campaignId) {
          const updatedActs = (c.activities || []).map((act) =>
            act.id === activityId
              ? { ...act, isCompleted: true, completedAt: new Date().toISOString() }
              : act
          );
          const completedCount = updatedActs.filter((a) => a.isCompleted).length;
          const progress = Math.round((completedCount / (updatedActs.length || 1)) * 100);

          return {
            ...c,
            activities: updatedActs,
            userCompletedActivitiesCount: completedCount,
            userProgressPercent: progress,
          };
        }
        return c;
      })
    );

    setCurrentUser((prev) => ({ ...prev, points: prev.points + 20 }));

    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const handleSubmitCampaignContribution = (
    campaignId: string,
    activityId: string,
    contributionData: Omit<CampaignContribution, 'id' | 'createdAt' | 'reactions' | 'commentsCount'>
  ) => {
    const isAnon = Boolean(contributionData.isAnonymous || currentUser.isAnonymous);
    const newContrib: CampaignContribution = {
      id: `contrib-${Date.now()}`,
      campaignId,
      campaignTitle: contributionData.campaignTitle || 'Campagne',
      activityId,
      dayNumber: contributionData.dayNumber,
      activityTitle: contributionData.activityTitle || 'Activité',
      authorId: currentUser.id,
      authorName: isAnon ? 'Anonyme' : (contributionData.authorName || currentUser.name),
      authorAvatar: isAnon
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        : (contributionData.authorAvatar || currentUser.avatar),
      authorStatus: contributionData.authorStatus || 'active_participant',
      isAnonymous: isAnon,
      mediaType: contributionData.mediaType,
      mediaUrl: contributionData.mediaUrl,
      audioDuration: contributionData.audioDuration,
      caption: contributionData.caption,
      content: contributionData.content,
      visibility: contributionData.visibility,
      reactions: { support: 1, understand: 1, courage: 2, bravo: 1 },
      commentsCount: 0,
      comments: [],
      createdAt: 'À l’instant',
    };

    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === campaignId) {
          const updatedActs = (c.activities || []).map((act) =>
            act.id === activityId
              ? { ...act, isCompleted: true, completedAt: new Date().toISOString() }
              : act
          );
          const completedCount = updatedActs.filter((a) => a.isCompleted).length;
          const progress = Math.round((completedCount / (updatedActs.length || 1)) * 100);

          const existingContribs = c.contributions || [];
          const mediaKey =
            contributionData.mediaType === 'video'
              ? 'videos'
              : contributionData.mediaType === 'audio'
              ? 'audios'
              : contributionData.mediaType === 'photo'
              ? 'photos'
              : contributionData.mediaType === 'text'
              ? 'texts'
              : 'interactions';

          const currentCounts = c.mediaCounts || {
            videos: 0,
            audios: 0,
            photos: 0,
            texts: 0,
            interactions: 0,
          };

          return {
            ...c,
            activities: updatedActs,
            contributions: [newContrib, ...existingContribs],
            contributionsCount: (c.contributionsCount || existingContribs.length) + 1,
            mediaCounts: {
              ...currentCounts,
              [mediaKey]: (currentCounts[mediaKey] || 0) + 1,
            },
            userCompletedActivitiesCount: completedCount,
            userProgressPercent: progress,
          };
        }
        return c;
      })
    );

    // If visibility is community_members, also feed it into the community posts!
    if (contributionData.visibility === 'community_members' && (contributionData.content || contributionData.mediaUrl)) {
      const camp = campaigns.find((c) => c.id === campaignId);
      const postMedia = contributionData.mediaUrl
        ? [
            {
              id: `media-${Date.now()}`,
              type: contributionData.mediaType === 'photo' ? ('image' as const) : contributionData.mediaType === 'video' ? ('video' as const) : ('audio' as const),
              url: contributionData.mediaUrl,
            },
          ]
        : [];

      const newPost: Post = {
        id: `post-camp-${Date.now()}`,
        authorId: contributionData.authorId,
        authorName: contributionData.isAnonymous ? 'Membre Solidaire' : currentUser.name,
        authorAvatar: contributionData.isAnonymous ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' : currentUser.avatar,
        authorStatus: contributionData.authorStatus || 'active_participant',
        isAnonymous: Boolean(contributionData.isAnonymous),
        communityId: camp?.communityId || 'comm-drepano',
        communityName: camp?.communityName || 'Communauté Drépanocytose',
        type: 'campaign_share',
        title: `Parcours : ${camp?.title || 'Campagne'} • Jour ${contributionData.dayNumber}`,
        content: contributionData.content || 'Contribution au parcours collectif',
        media: postMedia,
        tags: ['Campagne', 'ParcoursCollectif', 'Résilience'],
        timestamp: 'À l’instant',
        reactions: { support: 2, understand: 1, courage: 3, bravo: 2 },
        commentsCount: 0,
        comments: [],
        isPinned: false,
      };

      setPosts((prev) => [newPost, ...prev]);
    }

    setCurrentUser((prev) => ({
      ...prev,
      points: prev.points + 25,
      completedCampaignsCount: prev.completedCampaignsCount || 1,
    }));

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#10b981', '#fbbf24', '#a855f7'],
    });
  };

  const handleRequestCommunityInvitation = (params: {
    communityId: string;
    pseudonym: string;
    deliveryChannel: 'chat' | 'whatsapp';
    whatsappNumber?: string;
    reason?: string;
  }) => {
    const comm = (communities || []).find((c) => c.id === params.communityId);
    const org = (organizations || []).find((o) => o.id === comm?.organizationId);
    const orgName = comm?.organizationName || org?.name || 'Alliance Nationale Santé RDC';
    const orgLogo = comm?.image || org?.logo || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=150&auto=format&fit=crop&q=80';

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const threadId = `thread-org-${org?.id || comm?.id || 'partner'}`;

    const intakeMessageContent = `Bonjour ${params.pseudonym || currentUser.pseudonym || currentUser.name} ! 🌿\n\nNous avons bien reçu votre demande d'invitation pour intégrer le cercle protégé « ${comm?.name || 'Communauté'} » supervisé par ${orgName}.\n\n⏳ Statut de votre candidature : En attente d'examen par nos coordinateurs.\n\nDans le cadre de la protection des personnes vulnérables et pour garantir un climat de sécurité psychologique, l'équipe de ${orgName} vérifie chaque demande avant de délivrer un code d'accès confidentiel. Dès validation, votre code d'invitation vous sera envoyé directement ici.\n\n${params.deliveryChannel === 'whatsapp' && params.whatsappNumber ? `Une notification sera également transmise sur votre numéro WhatsApp (${params.whatsappNumber}).\n\n` : ''}Merci de votre confiance et de votre patience.`;

    // Create or update message thread with intake acknowledgment
    setMessageThreads((prev) => {
      const existingThread = prev.find(
        (t) => t.id === threadId || t.otherUser.id === `user-org-${org?.id || comm?.id}`
      );

      const newMsg = {
        id: `msg-${Date.now()}`,
        senderId: `user-org-${org?.id || comm?.id || 'partner'}`,
        senderName: `${orgName}`,
        senderAvatar: orgLogo,
        receiverId: currentUser.id,
        content: intakeMessageContent,
        type: 'text' as const,
        timestamp,
        isRead: false,
      };

      if (existingThread) {
        return prev.map((t) =>
          t.id === existingThread.id
            ? {
                ...t,
                lastMessage: `Demande d'invitation en cours d'examen`,
                lastMessageTimestamp: timestamp,
                unreadCount: t.unreadCount + 1,
                messages: [...t.messages, newMsg],
              }
            : t
        );
      } else {
        const newThread: MessageThread = {
          id: threadId,
          otherUser: {
            id: `user-org-${org?.id || comm?.id || 'partner'}`,
            name: orgName,
            avatar: orgLogo,
            status: 'mentor',
            sharedCommunityName: comm?.name || 'Communauté Protégée',
            isOnline: true,
          },
          lastMessage: `Demande d'invitation en cours d'examen`,
          lastMessageTimestamp: timestamp,
          unreadCount: 1,
          messages: [newMsg],
        };
        return [newThread, ...prev];
      }
    });

    // In-app Notification for user
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      type: 'message',
      title: `Demande d'invitation enregistrée - ${orgName}`,
      message: `Votre demande pour « ${comm?.name || 'la communauté'} » a été transmise aux coordinateurs de l'organisation.`,
      linkTab: 'messages',
      timestamp: 'À l’instant',
      isRead: false,
      avatar: orgLogo,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Record request into Partner invitation requests table (STRICT PENDING STATUS)
    const newReq: MemberInvitationRequest = {
      id: `req-${Date.now()}`,
      candidateName: params.pseudonym || currentUser.pseudonym || currentUser.name,
      candidateAvatar: currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      contactEmail: params.deliveryChannel === 'chat' ? `${(params.pseudonym || currentUser.name).toLowerCase().replace(/\s+/g, '')}@tulizaana.user` : undefined,
      contactPhone: params.deliveryChannel === 'whatsapp' ? params.whatsappNumber : undefined,
      communityId: comm?.id || params.communityId,
      communityName: comm?.name || 'Cercle Privé',
      organizationId: org?.id || comm?.organizationId || currentOrganization.id,
      situation: params.reason || 'Demande d’accès spontanée au cercle fermé',
      motivation: params.reason || 'Recherche d’écoute mutuelle, conseils pratiques et soutien communautaire sécurisé.',
      requestedAt: 'À l’instant',
      status: 'pending',
    };
    setInvitationRequests((prev) => {
      const updated = [newReq, ...prev];
return updated;
    });

    return { pending: true };
  };

  const handleJoinCampaign = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              isUserParticipating: true,
              participantsCount: c.participantsCount + 1,
              userProgressPercent: 5,
              userCompletedActivitiesCount: 1,
            }
          : c
      )
    );
  };

  const handleReportPost = (postId: string, reason: string) => {
    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) return;

    const newReport: ModerationReport = {
      id: `rep-${Date.now()}`,
      contentId: postId,
      contentType: 'post',
      contentSnippet: targetPost.content.substring(0, 100),
      authorId: targetPost.authorId,
      authorName: targetPost.authorName,
      communityId: targetPost.communityId,
      communityName: targetPost.communityName,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      reason: reason as any,
      reportedAt: new Date().toISOString(),
      status: 'pending',
    };

    setModerationReports([newReport, ...moderationReports]);
  };

  const handleDeletePost = (postId: string) => {
    clearUserPostTranslations(postId);
    setPosts((prev) => {
      const updated = prev.filter((p) => p.id !== postId);
return updated;
    });
  };

  const handleEditPost = (
    postId: string,
    updatedData: { title?: string; content?: string; tags?: string[] }
  ) => {
    clearUserPostTranslations(postId);
    setPosts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === postId) {
          const edited = {
            ...p,
            title: updatedData.title !== undefined ? updatedData.title : p.title,
            content: updatedData.content !== undefined ? updatedData.content : p.content,
            tags: updatedData.tags !== undefined ? updatedData.tags : p.tags,
          };
          prefetchPostTranslations(edited, language);
          return edited;
        }
        return p;
      });
return updated;
    });
  };

  const handleDeleteCampaignContribution = (campaignId: string, contributionId: string) => {
    setCampaigns((prev) => {
      const updated = prev.map((c) => {
        const hasContrib = (c.contributions || []).some((item) => item.id === contributionId);
        if (c.id === campaignId || hasContrib) {
          const filteredContribs = (c.contributions || []).filter((item) => item.id !== contributionId);
          return {
            ...c,
            contributions: filteredContribs,
            contributionsCount: Math.max(0, (c.contributionsCount || (c.contributions?.length || 1)) - 1),
          };
        }
        return c;
      });
      return updated;
    });
  };

  const handleEditCampaignContribution = (
    campaignId: string,
    contributionId: string,
    updatedData: {
      content: string;
      caption?: string;
      visibility?: 'campaign_members' | 'community_members' | 'private';
      mediaUrl?: string;
      mediaType?: 'text' | 'audio' | 'photo' | 'video' | 'interaction';
    }
  ) => {
    setCampaigns((prev) => {
      const updated = prev.map((c) => {
        const hasContrib = (c.contributions || []).some((item) => item.id === contributionId);
        if (c.id === campaignId || hasContrib) {
          const updatedContribs = (c.contributions || []).map((contrib) => {
            if (contrib.id === contributionId) {
              return {
                ...contrib,
                content: updatedData.content !== undefined ? updatedData.content : contrib.content,
                caption: updatedData.caption !== undefined ? updatedData.caption : contrib.caption,
                visibility: updatedData.visibility || contrib.visibility,
                mediaUrl: updatedData.mediaUrl !== undefined ? updatedData.mediaUrl : contrib.mediaUrl,
                mediaType: updatedData.mediaType || contrib.mediaType,
              };
            }
            return contrib;
          });
          return {
            ...c,
            contributions: updatedContribs,
          };
        }
        return c;
      });
      return updated;
    });
  };

  // Partner Actions
  const handleCreateCampaign = (newCamp: Partial<Campaign>) => {
    const fullCamp: Campaign = {
      id: `camp-${Date.now()}`,
      organizationId: currentOrganization.id,
      organizationName: currentOrganization.name,
      communityId: newCamp.communityId || activeCommunity.id,
      communityName: newCamp.communityName || activeCommunity.name,
      title: newCamp.title || 'Nouveau Parcours de Résilience',
      slug: (newCamp.title || 'parcours').toLowerCase().replace(/\s+/g, '-'),
      description: newCamp.description || 'Description du parcours',
      objective: 'Renforcer la résilience collective et l’écoute mutuelle',
      image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&auto=format&fit=crop&q=80',
      durationDays: newCamp.durationDays || 21,
      currentDay: 1,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000 * (newCamp.durationDays || 21)).toISOString(),
      participantsCount: 1,
      completionRate: 0,
      status: 'active',
      activities: newCamp.activities || [],
      rewards: newCamp.rewards || {
        points: 200,
        badgeTitle: '⭐ Champion de Résilience',
        badgeIcon: '⭐',
      },
      rules: ['Bienveillance et respect du cercle'],
      isUserParticipating: true,
      userProgressPercent: 0,
      userCompletedActivitiesCount: 0,
    };

    setCampaigns([fullCamp, ...campaigns]);
  };

  const handleCreateCommunity = (newComm: Partial<Community>) => {
    const fullComm: Community = {
      id: `comm-${Date.now()}`,
      organizationId: currentOrganization.id,
      organizationName: currentOrganization.name,
      name: newComm.name || 'Nouvelle Communauté',
      slug: (newComm.name || 'communaute').toLowerCase().replace(/\s+/g, '-'),
      description: newComm.description || 'Espace d’entraide fermé et sécurisé',
      rules: newComm.rules || ['Confidentialité absolue', 'Bienveillance'],
      image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=500&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&auto=format&fit=crop&q=80',
      category: newComm.category || 'chronic_disease',
      membersCount: 1,
      postsCount: 0,
      activeCampaignsCount: 0,
      status: 'pending_review',
      isPrivate: true,
      createdAt: new Date().toISOString(),
    };

    setCommunities([...communities, fullComm]);

    // Persistance RÉELLE dans Supabase PostgreSQL
    api.communities.create({
      name: fullComm.name,
      slug: fullComm.slug,
      description: fullComm.description,
      rules: fullComm.rules,
      category: fullComm.category,
      coverImage: fullComm.coverImage,
      isPrivate: fullComm.isPrivate,
      organizationId: currentOrganization.id,
    }).then((res) => {
      if (res.success && res.data?.id) {
        setCommunities((prev) =>
          prev.map((c) => (c.id === fullComm.id ? { ...c, id: res.data.id } : c))
        );
      }
    }).catch((err) => {
      console.warn('Persistance communauté Supabase (mode local conservé) :', err);
    });
  };

  const handleGenerateInviteCodes = (data: {
    communityId: string;
    count: number;
    maxUses: number;
  }) => {
    const targetComm = communities.find((c) => c.id === data.communityId) || communities[0];
    const generatedCodes: InvitationCode[] = [];

    for (let i = 0; i < (data.count || 1); i++) {
      const codeStr = `TLZ-${targetComm.slug.substring(0, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      generatedCodes.push({
        id: `inv-${Date.now()}-${i}`,
        code: codeStr,
        link: `https://tulizaana.org/join?code=${codeStr}`,
        organizationId: currentOrganization.id,
        organizationName: currentOrganization.name,
        communityId: targetComm.id,
        communityName: targetComm.name,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
        maxUses: data.maxUses || 1,
        currentUses: 0,
        status: 'active',
        createdBy: currentUser.name,
      });
    }

    setInvitations([...generatedCodes, ...invitations]);
    return generatedCodes[0];
  };

  const handleGenerateInviteCode = (communityId: string, maxUses: number) => {
    return handleGenerateInviteCodes({ communityId, count: 1, maxUses });
  };

  const handleUpdateCommunity = (communityId: string, updatedData: Partial<Community>) => {
    setCommunities((prev) => {
      const updated = prev.map((c) => (c.id === communityId ? { ...c, ...updatedData } : c));
return updated;
    });
  };

  const handleUpdateCampaign = (campaignId: string, updatedData: Partial<Campaign>) => {
    setCampaigns((prev) => {
      const updated = prev.map((c) => (c.id === campaignId ? { ...c, ...updatedData } : c));
return updated;
    });
  };

  const handleAcceptInvitationRequest = (
    requestId: string,
    code: string,
    dispatchMethod: 'whatsapp' | 'tulizaana_chat' = 'whatsapp',
    deliveryMessage?: string
  ) => {
    const targetReq = invitationRequests.find((r) => r.id === requestId);
    const org = organizations.find((o) => o.id === targetReq?.organizationId) || currentOrganization;
    const orgName = targetReq?.organizationName || org.name;
    const orgLogo = org.logo;

    setInvitationRequests((prev) => {
      const updated = prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: 'accepted' as const,
              assignedCode: code,
              dispatchedVia: dispatchMethod,
              dispatchedAt: new Date().toISOString(),
            }
          : req
      );
return updated;
    });

    // Ensure the code exists in invitations
    setInvitations((prev) => {
      const exists = prev.find((i) => i.code === code);
      if (!exists) {
        const newInv: InvitationCode = {
          id: `inv-${Date.now()}`,
          code,
          link: `https://tulizaana.org/join/${code.toLowerCase()}`,
          organizationId: org.id,
          organizationName: orgName,
          communityId: targetReq?.communityId || communities[0]?.id || '',
          communityName: targetReq?.communityName || communities[0]?.name || '',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
          maxUses: 10,
          currentUses: 0,
          status: 'active',
          createdBy: org.responsibleName,
        };
        return [newInv, ...prev];
      }
      return prev;
    });

    // Deliver acceptance message & invitation code to user thread
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const threadId = `thread-org-${targetReq?.organizationId || org.id || 'partner'}`;

    const defaultAcceptanceMsg = `Bonjour ${targetReq?.candidateName || currentUser.name} ! 🎉\n\nVotre demande pour rejoindre le cercle fermé « ${targetReq?.communityName || 'la communauté'} » a été validée avec succès par l'équipe de ${orgName}.\n\n🔑 VOTRE CODE D'INVITATION PERSONNEL :\n${code}\n\nVous pouvez dès maintenant utiliser ce code pour déverrouiller et entrer dans la communauté.\n\nBienvenue dans cet espace sécurisé d'écoute et de bienveillance !`;
    const messageContent = deliveryMessage || defaultAcceptanceMsg;

    setMessageThreads((prev) => {
      const existingThread = prev.find(
        (t) => t.id === threadId || t.otherUser.id === `user-org-${targetReq?.organizationId || org.id}`
      );

      const newMsg = {
        id: `msg-${Date.now()}`,
        senderId: `user-org-${targetReq?.organizationId || org.id}`,
        senderName: orgName,
        senderAvatar: orgLogo,
        receiverId: currentUser.id,
        content: messageContent,
        type: 'text' as const,
        timestamp,
        isRead: false,
      };

      if (existingThread) {
        return prev.map((t) =>
          t.id === existingThread.id
            ? {
                ...t,
                lastMessage: `Votre code d'invitation validé : ${code}`,
                lastMessageTimestamp: timestamp,
                unreadCount: t.unreadCount + 1,
                messages: [...t.messages, newMsg],
              }
            : t
        );
      } else {
        const newThread: MessageThread = {
          id: threadId,
          otherUser: {
            id: `user-org-${targetReq?.organizationId || org.id}`,
            name: orgName,
            avatar: orgLogo,
            status: 'mentor',
            sharedCommunityName: targetReq?.communityName || 'Communauté Protégée',
            isOnline: true,
          },
          lastMessage: `Votre code d'invitation validé : ${code}`,
          lastMessageTimestamp: timestamp,
          unreadCount: 1,
          messages: [newMsg],
        };
        return [newThread, ...prev];
      }
    });

    // In-app notification for candidate
    const approvalNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      type: 'message',
      title: `Demande acceptée - ${orgName}`,
      message: `Votre demande pour « ${targetReq?.communityName || 'la communauté'} » a été approuvée. Code d'invitation : ${code}`,
      linkTab: 'communities',
      timestamp: 'À l’instant',
      isRead: false,
      avatar: orgLogo,
    };
    setNotifications((prev) => [approvalNotif, ...prev]);
  };

  const handleRejectInvitationRequest = (requestId: string, reason?: string) => {
    setInvitationRequests((prev) => {
      const updated = prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: 'rejected' as const,
              rejectionReason: reason || 'Critères d’admission non réunis.',
              rejectedAt: new Date().toISOString(),
            }
          : req
      );
return updated;
    });
  };

  const handleDeleteInvitationRequest = (requestId: string) => {
    setInvitationRequests((prev) => {
      const updated = prev.filter((req) => req.id !== requestId);
return updated;
    });
  };

  const handleCreateInvitationRequest = (newRequest: MemberInvitationRequest) => {
    setInvitationRequests((prev) => {
      const updated = [newRequest, ...prev];
return updated;
    });
  };

  /**
   * Chantier 4 - plus d'escalade de formule cote client.
   *
   * Avant : le client derivait les quotas du NOM du plan
   * (`enterprise` -> 50000 membres / 50 campagnes), puis les ecrivait dans
   * son etat local. C'etait exactement l'architecture interdite : le plan
   * decide de l'autorisation.
   *
   * Apres : la demande de changement est enregistree par le serveur via
   * `POST /api/organizations/:id/subscription-request`, qui ne modifie NI la
   * formule, NI les quotas, NI l'etat de paiement. L'affichage est ensuite
   * relu depuis `GET /api/organizations/:id/manage`, seule source des quotas.
   */
  const handleUpgradeOrganizationPlan = (
    _newPlan: 'basic' | 'starter' | 'growth' | 'enterprise'
  ) => {
    void (async () => {
      const res = await api.partner.requestSubscriptionChange(
        currentOrganization.id,
        _newPlan
      );

      if (!res.success) {
        alert(res.error || "La demande de changement de formule a echoue.");
        return;
      }

      // Aucun quota ni formule n'est modifie localement : le serveur est
      // l'unique autorite et rien n'a encore change.
      alert(
        res.data?.message ||
          "Votre demande a ete transmise. Aucun changement n'est applique tant que le paiement n'est pas valide."
      );
    })();
  };

  const handleUpdateMemberStatus = (userId: string, newStatus: MemberStatus) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, status: newStatus }));
    }
  };

  const handleTakeModerationAction = (
    reportId: string,
    newStatus: ModerationReport['status'],
    notes?: string
  ) => {
    setModerationReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: newStatus,
              actionTakenBy: currentUser.name,
              actionTakenAt: new Date().toISOString(),
              notes: notes || 'Traité par modérateur',
            }
          : r
      )
    );
  };

  // Partner Metrics aggregated from state
  const partnerMetrics = {
    totalMembers: allUsers.length + 1420,
    monthlyGrowthPercent: 18.4,
    activeCampaignsCount: campaigns.filter((c) => c.organizationId === currentOrganization.id).length || 2,
    campaignCompletionRate: 82.5,
    totalSupportReactions: 3856,
    pendingReportsCount: moderationReports.filter((r) => r.status === 'pending').length,
    resolvedReportsCount: moderationReports.filter((r) => r.status !== 'pending').length,
  };

  // Filtered posts for user feed (with priority to pinned, newest user posts, and followed users)
  const displayedPosts = useMemo(() => {
    return localizedPosts
      .filter(
        (p) =>
          currentUser.joinedCommunities.includes(p.communityId) ||
          p.communityId === activeCommunity?.id ||
          (p.communityId === 'comm-drepano' && currentUser.joinedCommunities.some((c) => c.startsWith('comm-drepano')))
      )
      .sort((a, b) => {
        // 1. Pinned posts stay at the very top
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        // 2. Newly published user posts (e.g. timestamp 'À l’instant') take immediate precedence over older posts
        const aIsJustNow = a.timestamp === 'À l’instant' && a.authorId === currentUser.id;
        const bIsJustNow = b.timestamp === 'À l’instant' && b.authorId === currentUser.id;
        if (aIsJustNow && !bIsJustNow) return -1;
        if (!aIsJustNow && bIsJustNow) return 1;

        // 3. Followed users prioritized on feed
        const aFollowed = currentUser.followingUserIds?.includes(a.authorId) ? 1 : 0;
        const bFollowed = currentUser.followingUserIds?.includes(b.authorId) ? 1 : 0;
        if (aFollowed !== bFollowed) {
          return bFollowed - aFollowed;
        }
        return 0;
      });
  }, [localizedPosts, currentUser, activeCommunity]);

  // Organization Profile Modal Opener (Anywhere on Tulizaana)
  const handleOpenOrganizationProfile = (orgOrId: Organization | string) => {
    if (typeof orgOrId === 'string') {
      const found = localizedOrganizations.find((o) => o.id === orgOrId || o.name.toLowerCase() === orgOrId.toLowerCase());
      if (found) {
        setSelectedOrgForModal(found);
      } else {
        setSelectedOrgForModal({
          id: orgOrId,
          name: orgOrId,
          description: "Organisation partenaire certifiée sur Tulizaana.",
          type: 'ong',
          logo: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&auto=format&fit=crop&q=80',
          coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&auto=format&fit=crop&q=80',
          country: 'RDC',
          communitiesCount: 1,
          activeCampaignsCount: 1,
          status: 'verified',
          responsibleName: 'Équipe psychosociale',
          responsibleRole: 'Superviseur',
          contactEmail: 'contact@tulizaana.org',
          phone: '+243 000 000 000',
          domain: 'Santé & Écoute',
          joinedAt: '2024',
          isVerified: true,
        });
      }
    } else {
      setSelectedOrgForModal(orgOrId);
    }
  };

  // Switch to Partner Mode with Security Authentication Guard
  const handleRequestPartnerMode = () => {
    if (isPartnerAuthenticated) {
      setActivePartnerTab('profile');
      setInterfaceMode('partner');
      try {
        localStorage.setItem(STORAGE_KEYS.interfaceMode, 'partner');
      } catch {}
    } else {
      setShowPartnerAuthModal(true);
    }
  };

  // User logout handler with full persistence reset
  const handleLogout = async () => {
    logoutGoogle().catch(() => {});
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    setIsLoggedIn(false);
    setIsPartnerAuthenticated(false);
    clearAppStorage();
    resetSensitiveReactState();
    setShowProfileModal(false);
    setActiveUserTab('feed');
    setOnboardingStep('welcome');
  };

  // 1. STEP 1: SPLASH SCREEN / LOADING PAGE (DIRECT TO HOME IF ALREADY LOGGED IN)
  if (onboardingStep === 'splash') {
    return (
      <SplashScreen
        onFinish={async () => {
          let authed = false;
          try {
            const me = await api.auth.me();
            authed = me.success && !!me.data;
          } catch {
            authed = false;
          }
          if (authed) {
            setOnboardingStep('app');
          } else {
            setOnboardingStep('welcome');
          }
        }}
      />
    );
  }

  // 2. STEP 2: WELCOME / LANDING EXPLANATION PAGE
  if (onboardingStep === 'welcome') {
    return (
      <>
        <WelcomeScreen
          language={language}
          onSelectLanguage={setLanguage}
          onSelectRole={(role) => {
            setSelectedRoleForGate(role);
            setOnboardingStep('invite_gate');
          }}
          onOpenAdminBackOffice={handleOpenAdminBackOffice}
        />
        {showAdminLoginModal && (
          <AdminLoginModal
            isOpen={showAdminLoginModal}
            language={language}
            onClose={() => setShowAdminLoginModal(false)}
            onSuccess={handleAdminLoginSuccess}
          />
        )}
        {showAdminBackOffice && adminSession && (
          <AdminBackOffice
            organizations={localizedOrganizations}
            communities={localizedCommunities}
            users={allUsers}
            posts={localizedPosts}
            campaigns={localizedCampaigns}
            reports={moderationReports}
            language={language}
            adminSession={adminSession}
            notifyRef={adminNotifyRef}
            onSelectLanguage={setLanguage}
            onUpdateOrganization={handleUpdateOrganizationFromAdmin}
            onAddOrganization={handleCreateOrganization}
            onDeleteOrganization={handleDeleteOrganizationFromAdmin}
            onUpdateCommunity={handleUpdateCommunityFromAdmin}
            onDeleteCommunity={handleDeleteCommunityFromAdmin}
            onUpdateCampaign={handleUpdateCampaignFromAdmin}
            onDeleteCampaign={handleDeleteCampaignFromAdmin}
            onUpdateUser={handleUpdateUserFromAdmin}
            onUpdateReport={handleUpdateReportFromAdmin}
            onClose={handleCloseAdminBackOffice}
            onLogoutAdmin={handleAdminLogout}
          />
        )}
      </>
    );
  }

  // 3. STEP 3: INVITATION GATEWAY (CODE ENTRY, REGISTRATION & AUTH FLOW)
  if (onboardingStep === 'invite_gate') {
    return (
      <>
        <InviteGateScreen
          initialRole={selectedRoleForGate}
          communities={localizedCommunities}
          organizations={localizedOrganizations}
          invitations={invitations}
          language={language}
          onSelectLanguage={setLanguage}
          onBackToWelcome={() => setOnboardingStep('welcome')}
          onSuccessUserLogin={(communityId, userProfile) => {
            setInterfaceMode('user');
            setIsLoggedIn(true);
            try {
              localStorage.setItem(STORAGE_KEYS.interfaceMode, 'user');
            } catch {}

            if (userProfile) {
              setCurrentUser((prev) => {
                const updated = {
                  ...prev,
                  ...userProfile,
                  joinedCommunities: Array.from(new Set([...prev.joinedCommunities, communityId])),
                };
return updated;
              });
            } else {
              setCurrentUser((prev) => {
                const updated = {
                  ...prev,
                  joinedCommunities: Array.from(new Set([...prev.joinedCommunities, communityId])),
                };
return updated;
              });
            }
            setOnboardingStep('app');
          }}
          onRegisterOrganization={(newOrg) => {
            setOrganizations((prev) => {
              const updated = [newOrg, ...prev.filter((o) => o.id !== newOrg.id)];
return updated;
            });
          }}
          onSuccessPartnerLogin={(organizationId) => {
            // Chantier 4 : plus aucune decision d'acces cote client. Le drapeau
            // local `isVerified` n'est plus une preuve. On interroge le serveur,
            // qui resout l'organisation depuis `OrganizationAdmin`.
            void (async () => {
              const managed = await api.partner.managedOrganizations();

              if (!managed.success || !managed.data) {
                setShowPartnerAuthModal(true);
                return;
              }

              setManagedPartnerOrganizations(managed.data);

              const serverOrg = managed.data.find((o) => o.id === organizationId);
              if (!serverOrg) {
                setPartnerBlockedBy('PARTNER_NO_ORGANIZATION');
                alert(
                  "Aucune organisation partenaire n'est associee a ce compte sur le serveur."
                );
                setShowPartnerAuthModal(true);
                return;
              }

              if (!serverOrg.canPerformSubscriptionActions) {
                setPartnerBlockedBy(serverOrg.blockedBy);
                alert(
                  serverOrg.blockedBy === 'ORGANIZATION_NOT_APPROVED'
                    ? `Compte en attente de validation : la demande de « ${serverOrg.name} » est en cours d'examen par l'equipe de Tulizaana. Aucun acces n'est accorde avant validation.`
                    : `Acces restreint pour « ${serverOrg.name} ». Raison : ${serverOrg.blockedBy}.`
                );
                return;
              }

              const matchedOrg = organizations.find((o) => o.id === organizationId);
              setPartnerBlockedBy(null);
              setIsLoggedIn(true);
              setIsPartnerAuthenticated(true);
              setActivePartnerTab('profile');
              try {
                localStorage.setItem(STORAGE_KEYS.interfaceMode, 'partner');
              } catch {}
              if (matchedOrg) {
                setCurrentOrganization(matchedOrg);
              }
              setOnboardingStep('app');
            })();
          }}
          onOpenAdminBackOffice={handleOpenAdminBackOffice}
        />
        {showAdminLoginModal && (
          <AdminLoginModal
            isOpen={showAdminLoginModal}
            language={language}
            onClose={() => setShowAdminLoginModal(false)}
            onSuccess={handleAdminLoginSuccess}
          />
        )}
        {showAdminBackOffice && adminSession && (
          <AdminBackOffice
            organizations={localizedOrganizations}
            communities={localizedCommunities}
            users={allUsers}
            posts={localizedPosts}
            campaigns={localizedCampaigns}
            reports={moderationReports}
            language={language}
            adminSession={adminSession}
            notifyRef={adminNotifyRef}
            onSelectLanguage={setLanguage}
            onUpdateOrganization={handleUpdateOrganizationFromAdmin}
            onAddOrganization={handleCreateOrganization}
            onDeleteOrganization={handleDeleteOrganizationFromAdmin}
            onUpdateCommunity={handleUpdateCommunityFromAdmin}
            onDeleteCommunity={handleDeleteCommunityFromAdmin}
            onUpdateCampaign={handleUpdateCampaignFromAdmin}
            onDeleteCampaign={handleDeleteCampaignFromAdmin}
            onUpdateUser={handleUpdateUserFromAdmin}
            onUpdateReport={handleUpdateReportFromAdmin}
            onClose={handleCloseAdminBackOffice}
            onLogoutAdmin={handleAdminLogout}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#0d131f] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* GLOBAL NOTIFICATION DRAWER */}
      <NotificationDrawer
        isOpen={showNotificationDrawer}
        onClose={() => setShowNotificationDrawer(false)}
        notifications={notifications}
        onMarkAllRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        }
      />

      {/* GLOBAL CRISIS SOS MODAL */}
      {showSOSModal && <SOSModal onClose={() => setShowSOSModal(false)} />}

      {/* STORY VIEWER MODAL */}
      {viewingStory && (
        <StoryViewerModal
          story={viewingStory}
          stories={localizedStories}
          currentUser={currentUser}
          initialIndex={Math.max(0, localizedStories.findIndex((s) => s.id === viewingStory.id))}
          onClose={() => setViewingStory(null)}
          onOpenUserProfile={(userId) => {
            handleOpenUserProfile(userId);
            setViewingStory(null);
          }}
          onStartMessage={(userId) => {
            setActiveUserTab('messages');
            setViewingStory(null);
          }}
          onToggleFeatured={(storyId) => handleToggleFeaturedStory(storyId)}
          onReact={(storyId, reaction) => {
            setStories((prev) =>
              prev.map((s) =>
                s.id === storyId
                  ? {
                      ...s,
                      reactions: {
                        ...(s.reactions || { support: 0, understand: 0, courage: 0, bravo: 0 }),
                        [reaction]: ((s.reactions?.[reaction as keyof typeof s.reactions] || 0) + 1),
                      },
                    }
                  : s
              )
            );
          }}
        />
      )}

      {/* CREATE POST / STORY MODAL */}
      {showCreatePostModal && (
        <CreatePostModal
          currentUser={currentUser}
          communities={localizedCommunities.filter((c) => currentUser.joinedCommunities.includes(c.id))}
          language={language}
          onClose={() => setShowCreatePostModal(false)}
          onCreatePost={handleCreatePost}
          onCreateStory={handleCreateStory}
        />
      )}

      {/* USER PROFILE MODAL */}
      {showProfileModal && (
        <UserProfileModal
          user={currentUser}
          isCurrentUser={true}
          language={language}
          onSelectLanguage={setLanguage}
          stories={localizedStories.filter((s) => s.authorId === currentUser.id)}
          posts={localizedPosts.filter((p) => p.authorId === currentUser.id)}
          campaigns={localizedCampaigns.filter((c) => c.isUserParticipating)}
          notifications={notifications}
          unreadNotificationsCount={notifications.filter((n) => !n.isRead).length}
          onOpenNotifications={() => {
            setShowProfileModal(false);
            setShowNotificationDrawer(true);
          }}
          onLogout={handleLogout}
          onClose={() => setShowProfileModal(false)}
          onUpdateBio={(newBio) => setCurrentUser((prev) => ({ ...prev, bio: newBio }))}
          onStartMessage={() => {
            setShowProfileModal(false);
            setActiveUserTab('messages');
          }}
        />
      )}

      {/* INVITATION GATE MODAL */}
      {showInviteGateModal && (
        <InviteGateModal
          invitations={invitations}
          language={language}
          onClose={() => setShowInviteGateModal(false)}
          onSuccessJoin={(communityId) => {
            setCurrentUser((prev) => ({
              ...prev,
              joinedCommunities: [...new Set([...prev.joinedCommunities, communityId])],
            }));
            setShowInviteGateModal(false);
          }}
        />
      )}

      {/* ORGANIZATION PROFILE MODAL (Accessible anywhere in Tulizaana) */}
      {selectedOrgForModal && (
        <OrganizationProfileModal
          organization={localizedOrganizations.find((o) => o.id === selectedOrgForModal.id) || selectedOrgForModal}
          communities={localizedCommunities}
          currentUser={currentUser}
          language={language}
          onSelectLanguage={(newLang) => {
            setLanguage(newLang);
            try {
              localStorage.setItem(STORAGE_KEYS.preferredLang, newLang);
            } catch {}
          }}
          onClose={() => setSelectedOrgForModal(null)}
          onJoinCommunity={(commId) => {
            setCurrentUser((prev) => ({
              ...prev,
              joinedCommunities: Array.from(new Set([...prev.joinedCommunities, commId])),
            }));
          }}
          onContact={() => {
            setSelectedOrgForModal(null);
            setActiveUserTab('messages');
            setInterfaceMode('user');
          }}
        />
      )}

      {/* PARTNER AUTHENTICATION MODAL */}
      {showPartnerAuthModal && (
        <PartnerAuthModal
          isOpen={showPartnerAuthModal}
          language={language}
          onClose={() => setShowPartnerAuthModal(false)}
          onSuccessAuth={(orgId, managed) => {
            // Chantier 4 : la session partenaire n'est plus une chaine dans
            // sessionStorage. Elle n'existe que parce que le serveur a confirme
            // `GET /api/organizations/mine`, et l'organisation provient de la
            // table `OrganizationAdmin`.
            setManagedPartnerOrganizations(managed);
            const serverOrg = managed.find((o) => o.id === orgId);
            const matchedOrg = organizations.find((o) => o.id === orgId);
            if (matchedOrg) {
              setCurrentOrganization(matchedOrg);
            } else if (serverOrg) {
              setCurrentOrganization({
                ...(currentOrganization as Organization),
                id: serverOrg.id,
                name: serverOrg.name,
                acronym: serverOrg.acronym ?? undefined,
                logo: serverOrg.logo ?? '',
                status: serverOrg.status as Organization['status'],
                subscriptionPlan:
                  serverOrg.subscriptionPlan as Organization['subscriptionPlan'],
              } as Organization);
            }
            setIsPartnerAuthenticated(true);
            try {
              localStorage.setItem(STORAGE_KEYS.interfaceMode, 'partner');
            } catch {}
            setActivePartnerTab('profile');
            setInterfaceMode('partner');
            setShowPartnerAuthModal(false);
          }}
        />
      )}

      {/* CREATE ORGANIZATION MODAL (LEGAL PROOF IN AFRICA, LOCATION, DOMAINS, VISION, MISSION) */}
      {showCreateOrgModal && (
        <CreateOrganizationModal
          isOpen={showCreateOrgModal}
          onClose={() => setShowCreateOrgModal(false)}
          onCreateOrganization={handleCreateOrganization}
        />
      )}

      {/* CREATE COMMUNITY MODAL
          Remplace « Creer un profil organisation » dans le portail : un
          partenaire gere ses cercles, il ne cree plus d'organisation. */}
      {showCreateCommunityModal && currentOrganization && (
        <CreateCommunityModal
          isOpen={showCreateCommunityModal}
          organizationId={currentOrganization.id}
          organizationName={currentOrganization.name}
          language={language}
          onClose={() => setShowCreateCommunityModal(false)}
          onCreated={() => {
            setShowCreateCommunityModal(false);
            setActivePartnerTab('communities');
          }}
        />
      )}

      {/* CONDITIONAL RENDERING BASED ON INTERFACE MODE */}
      {interfaceMode === 'user' ? (
        
        /* USER / BENEFICIARY PORTAL */
        <div className="flex-1 flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
          
          {/* Top User Navbar */}
          <UserNavbar
            currentInterface={interfaceMode}
            activeTab={activeUserTab}
            onSelectInterface={(mode) => {
              if (mode === 'partner') {
                handleRequestPartnerMode();
              } else {
                setInterfaceMode('user');
              }
            }}
            currentUser={currentUser}
            activeCommunity={activeCommunity}
            language={language}
            setLanguage={setLanguage}
            notifications={notifications}
            notificationsCount={notifications.filter((n) => !n.isRead).length}
            onOpenNotifications={() => setShowNotificationDrawer(true)}
            onOpenInviteModal={() => setShowInviteGateModal(true)}
            onOpenProfile={handleOpenMyProfile}
            onOpenSearch={handleOpenSearch}
            onOpenSOS={() => setShowSOSModal(true)}
            onSwitchToPartner={handleRequestPartnerMode}
            onOpenOrganizationProfile={() => {
              const activeOrg = organizations.find((o) => o.id === activeCommunity?.organizationId) || currentOrganization;
              handleOpenOrganizationProfile(activeOrg);
            }}
            onLogout={handleLogout}
          />

          {/* User Layout Container (Sidebar + Content) */}
          <div className="flex-1 flex max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6 pb-24 md:pb-6 gap-6 min-w-0">
            
            {/* Left User Navigation Sidebar */}
            <UserSidebar
              activeTab={activeUserTab}
              onSelectTab={setActiveUserTab}
              unreadMessagesCount={
                messageThreads.reduce((acc, t) => acc + t.unreadCount, 0)
              }
              language={language}
              onOpenSOS={() => setShowSOSModal(true)}
              onOpenProfile={handleOpenMyProfile}
              onOpenInviteGate={() => setShowInviteGateModal(true)}
              onOpenCreatePost={() => setShowCreatePostModal(true)}
            />

            {/* Main Interactive Screen */}
            <main className="flex-1 min-w-0 space-y-6">
              
              {/* TAB 1: FEED & COMMUNITY ACTIVITY */}
              {activeUserTab === 'feed' && (
                <div className="space-y-5">
                  
                  {/* Top Stories & Testimonial Carousel */}
                  <StoriesBar
                    stories={localizedStories}
                    currentUser={currentUser}
                    onOpenStory={(st) => setViewingStory(st)}
                    onAddStory={() => setShowCreatePostModal(true)}
                  />

                  {/* Feed Posts List */}
                  <div className="space-y-4">
                    {displayedPosts.length > 0 ? (
                      displayedPosts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          currentUser={currentUser}
                          language={language}
                          onOpenUserProfile={handleOpenUserProfile}
                          onFollowAuthor={handleFollowToggle}
                          onSavePost={handleSavePost}
                          onReact={handlePostReaction}
                          onAddComment={handleAddComment}
                          onReport={handleReportPost}
                          onDeletePost={handleDeletePost}
                          onEditPost={handleEditPost}
                        />
                      ))
                    ) : (
                      <div className="p-8 rounded-3xl bg-[#182231]/60 border border-slate-800 text-center space-y-3">
                        <p className="text-sm text-slate-300">
                          {currentLang.app?.emptyFeed || 'Aucune publication pour le moment dans vos cercles.'}
                        </p>
                        <button
                          onClick={() => setShowCreatePostModal(true)}
                          className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors cursor-pointer"
                        >
                          {currentLang.app?.publishFirstPost || 'Publier le premier message'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: GLOBAL SEARCH — donnees exclusivement fournies par api.search(). */}
              {activeUserTab === 'search' && (
                <GlobalSearchView onOpenResult={handleOpenSearchResult} />
              )}

              {/* TAB 2: STORIES & EXPERIENCES */}
              {activeUserTab === 'stories' && (
                <div className="space-y-6">
                  <div className="p-6 sm:p-8 rounded-3xl bg-[#182231] border border-slate-800 shadow-xl space-y-3">
                    <h2 className="text-2xl font-extrabold text-white font-display">
                      {currentLang.app?.storiesSectionTitle || 'Vécu & Récits de Résilience'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                      {currentLang.app?.storiesSectionDesc || 'Découvrez les témoignages vocaux, photos et écrits déposés par les membres de vos communautés.'}
                    </p>
                  </div>

                  <StoriesBar
                    stories={localizedStories}
                    onOpenStory={(st) => setViewingStory(st)}
                    onAddStory={() => setShowCreatePostModal(true)}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {localizedStories.map((story) => (
                      <div
                        key={story.id}
                        onClick={() => setViewingStory(story)}
                        className="p-5 rounded-3xl bg-[#182231] border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer space-y-4 shadow-lg group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={story.authorAvatar}
                            alt={story.authorName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400"
                          />
                          <div>
                            <h4 className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors">
                              {story.authorName}
                            </h4>
                            <span className="text-[10px] text-slate-400">
                              {story.timestamp} • {story.communityName}
                            </span>
                          </div>
                        </div>

                        {story.mediaUrl && (
                          <div className="h-44 rounded-2xl overflow-hidden bg-slate-900">
                            <img
                              src={story.mediaUrl}
                              alt="Story preview"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}

                        <p className="text-xs text-slate-300 line-clamp-3 italic leading-relaxed">
                          "{story.caption}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: COLLECTIVE CAMPAIGNS */}
              {activeUserTab === 'campaigns' && (
                <CampaignsView
                  campaigns={localizedCampaigns}
                  currentUser={currentUser}
                  language={language}
                  onCompleteActivity={handleCompleteCampaignActivity}
                  onJoinCampaign={handleJoinCampaign}
                  onParticipateCampaign={handleJoinCampaign}
                  onOpenOrganizationProfile={handleOpenOrganizationProfile}
                  onSubmitContribution={handleSubmitCampaignContribution}
                  onDeleteContribution={handleDeleteCampaignContribution}
                  onEditContribution={handleEditCampaignContribution}
                />
              )}

              {/* TAB 4: PRIVATE COMMUNITIES */}
              {activeUserTab === 'communities' && (
                <CommunitiesView
                  communities={localizedCommunities}
                  currentUser={currentUser}
                  language={language}
                  userJoinedCommunityIds={currentUser.joinedCommunities}
                  organizations={localizedOrganizations}
                  invitationRequests={invitationRequests}
                  stories={localizedStories}
                  posts={localizedPosts}
                  campaigns={localizedCampaigns}
                  onJoinCommunity={(commId) => {
                    setCurrentUser((prev) => ({
                      ...prev,
                      joinedCommunities: Array.from(new Set([...prev.joinedCommunities, commId])),
                    }));
                  }}
                  onJoinCommunityWithCode={(code) => {
                    const inv = invitations.find(
                      (i) => i.code.toUpperCase() === code.trim().toUpperCase() && i.status === 'active'
                    );
                    if (inv) {
                      setCurrentUser((prev) => ({
                        ...prev,
                        joinedCommunities: Array.from(new Set([...prev.joinedCommunities, inv.communityId])),
                      }));
                      return true;
                    }
                    return false;
                  }}
                  onRequestJoinCommunity={handleRequestCommunityInvitation}
                  onOpenChat={() => {
                    setActiveUserTab('messages');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onSelectCommunityFeed={(commId) => {
                    setActiveUserTab('feed');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onOpenStory={(st) => setViewingStory(st)}
                  onAddStory={() => setShowCreatePostModal(true)}
                  onOpenCreatePost={() => {
                    setShowCreatePostModal(true);
                  }}
                  onReactPost={handlePostReaction}
                  onAddPostComment={handleAddComment}
                  onParticipateCampaign={handleJoinCampaign}
                  onOpenUserProfile={handleOpenUserProfile}
                  onOpenOrganizationProfile={handleOpenOrganizationProfile}
                  onSavePost={handleSavePost}
                  onFollowAuthor={handleFollowToggle}
                  onDeletePost={handleDeletePost}
                  onEditPost={handleEditPost}
                />
              )}

              {/* TAB 5: PRIVATE MESSAGING */}
              {activeUserTab === 'messages' && (
                <MessagingView
                  threads={messageThreads}
                  currentUser={currentUser}
                  language={language}
                  onOpenSOS={() => setShowSOSModal(true)}
                  onSendMessage={async (
                    threadId,
                    content,
                    type = 'text',
                    audioDuration,
                    mediaUrl,
                    fileName,
                    fileSize
                  ) => {
                    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const targetThread = messageThreads.find((t) => t.id === threadId);
                    const newMsg = {
                      id: `msg-${Date.now()}`,
                      senderId: currentUser.id,
                      senderName: currentUser.name,
                      senderAvatar: currentUser.avatar,
                      receiverId: targetThread?.otherUser.id || '',
                      content,
                      type: (type || 'text') as 'text' | 'audio' | 'image' | 'video' | 'file',
                      audioDuration,
                      mediaUrl,
                      fileName,
                      fileSize,
                      timestamp,
                      isRead: true,
                    };

                    setMessageThreads((prev) =>
                      prev.map((t) => {
                        if (t.id === threadId) {
                          return {
                            ...t,
                            lastMessage:
                              type === 'audio'
                                ? '🎤 Message vocal'
                                : type === 'image'
                                ? '📷 Photo'
                                : type === 'video'
                                ? '🎥 Vidéo'
                                : type === 'file'
                                ? `📎 ${fileName || 'Fichier joint'}`
                                : content,
                            lastMessageTimestamp: timestamp,
                            messages: [...t.messages, newMsg],
                          };
                        }
                        return t;
                      })
                    );

                    // Synchronisation BDD pour les messages
                    if (targetThread?.otherUser?.id) {
                      api.messages.sendMessage({
                        receiverId: targetThread.otherUser.id,
                        content,
                        type: (type || 'text') as any,
                        mediaUrl,
                        audioDuration: typeof audioDuration === 'number' ? audioDuration : undefined,
                      }).catch(() => {});
                    }
                  }}
                  onOpenUserProfile={handleOpenUserProfile}
                />
              )}

              {/* TAB 6: USER PROFILE FULL SCREEN PAGE */}
              {activeUserTab === 'profile' && (
                <ProfileView
                  user={
                    allUsers.find((u) => u.id === viewingProfileUserId) ||
                    (viewingProfileUserId === currentUser.id
                      ? currentUser
                      : {
                          id: viewingProfileUserId,
                          name:
                            posts.find((p) => p.authorId === viewingProfileUserId)?.authorName ||
                            'Membre de la communauté',
                          pseudonym: (
                            posts.find((p) => p.authorId === viewingProfileUserId)?.authorName ||
                            'membre'
                          )
                            .toLowerCase()
                            .replace(/\s+/g, '_'),
                          avatar:
                            posts.find((p) => p.authorId === viewingProfileUserId)?.authorAvatar ||
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                          country: 'RDC',
                          language: 'fr',
                          bio: 'Membre actif de la communauté Tulizaana, engagé(e) pour le soutien mutuel et la sensibilisation.',
                          status: 'active_participant',
                          joinedCommunities: ['comm-drepano'],
                          followingUserIds: [],
                          savedPostIds: [],
                          role: 'member',
                          points: 250,
                          completedCampaignsCount: 2,
                          featuredTestimonialIds: [],
                          badges: [],
                          createdAt: '2026-01-15T10:00:00Z',
                        })
                  }
                  currentUser={currentUser}
                  stories={localizedStories}
                  posts={localizedPosts}
                  communities={localizedCommunities}
                  language={language}
                  onSelectLanguage={(newLang) => {
                    setLanguage(newLang);
                    setCurrentUser((prev) => ({ ...prev, language: newLang }));
                  }}
                  onLogout={handleLogout}
                  onFollowToggle={handleFollowToggle}
                  onStartMessage={(userId) => {
                    setActiveUserTab('messages');
                  }}
                  onUpdateProfile={handleUpdateProfile}
                  onToggleAnonymousMode={handleToggleAnonymousMode}
                  onOpenStory={(st) => setViewingStory(st)}
                  onAddStory={() => setShowCreatePostModal(true)}
                  onReactPost={handlePostReaction}
                  onAddPostComment={handleAddComment}
                  onBackToFeed={() => setActiveUserTab('feed')}
                  onOpenUserProfile={handleOpenUserProfile}
                  onSavePost={handleSavePost}
                  onDeletePost={handleDeletePost}
                  onEditPost={handleEditPost}
                />
              )}
            </main>
          </div>

          {/* Mobile Bottom Navigation Bar */}
          <MobileBottomNav
            activeTab={activeUserTab}
            language={language}
            onSelectTab={(tab) => {
              setActiveUserTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            unreadMessagesCount={
              messageThreads.reduce((acc, t) => acc + t.unreadCount, 0)
            }
            onOpenCreatePost={() => setShowCreatePostModal(true)}
            onOpenSearch={handleOpenSearch}
            onOpenProfile={handleOpenMyProfile}
          />
        </div>
      ) : (
        
        /* PARTNER SAAS PORTAL */
        <PartnerLayout
          organization={localizedCurrentOrganization}
          activeTab={activePartnerTab}
          onSelectTab={setActivePartnerTab}
          language={language}
          onSelectLanguage={setLanguage}
          onSwitchToUser={() => {
            setInterfaceMode('user');
            try {
              localStorage.setItem(STORAGE_KEYS.interfaceMode, 'user');
            } catch {}
          }}
          onLogout={() => {
            setIsPartnerAuthenticated(false);
            clearAppStorage();
            resetSensitiveReactState();
            setOnboardingStep('welcome');
          }}
          notificationsCount={notifications.length}
        >
          {activePartnerTab === 'profile' && (
            <PartnerOrganizationProfile
              organization={localizedCurrentOrganization}
              communities={localizedCommunities}
              isPartnerAdminView={true}
              language={language}
              onSelectLanguage={(newLang) => {
                setLanguage(newLang);
                try {
                  localStorage.setItem(STORAGE_KEYS.preferredLang, newLang);
                } catch {}
              }}
              onNavigateTab={setActivePartnerTab}
              onOpenCreateCommunity={() => setShowCreateCommunityModal(true)}
              onSelectCommunity={(commId) => {
                setActivePartnerTab('communities');
              }}
              onUpdateOrganization={(updated) => {
                setCurrentOrganization((prev) => {
                  const merged = { ...prev, ...updated };
return merged;
                });
                setOrganizations((prev) => {
                  const updatedList = prev.map((o) => (o.id === currentOrganization.id ? { ...o, ...updated } : o));
return updatedList;
                });
              }}
            />
          )}

          {activePartnerTab === 'dashboard' && (
            <PartnerDashboard
              organization={localizedCurrentOrganization}
              metrics={partnerMetrics}
              onNavigateTab={setActivePartnerTab}
              onOpenCreateCampaign={() => setActivePartnerTab('campaigns')}
              onOpenInviteGenerator={() => setActivePartnerTab('communities')}
            />
          )}

          {activePartnerTab === 'communities' && (
            <PartnerCommunities
              organization={localizedCurrentOrganization}
              communities={localizedCommunities}
              invitations={invitations}
              onCreateCommunity={handleCreateCommunity}
              onUpdateCommunity={handleUpdateCommunity}
              onGenerateInviteCodes={handleGenerateInviteCodes}
            />
          )}

          {activePartnerTab === 'campaigns' && (
            <PartnerCampaigns
              organization={localizedCurrentOrganization}
              communities={localizedCommunities}
              campaigns={localizedCampaigns}
              onCreateCampaign={handleCreateCampaign}
              onUpdateCampaign={handleUpdateCampaign}
            />
          )}

          {activePartnerTab === 'members' && (
            <PartnerMembers
              organization={localizedCurrentOrganization}
              communities={localizedCommunities}
              members={allUsers}
              invitationRequests={invitationRequests}
              invitations={invitations}
              onUpdateMemberStatus={handleUpdateMemberStatus}
              onWarnMember={(userId, reason) => {
                alert(`Avertissement bienveillant envoyé au membre : ${reason}`);
              }}
              onAcceptInvitationRequest={handleAcceptInvitationRequest}
              onDeleteInvitationRequest={handleDeleteInvitationRequest}
              onCreateInvitationRequest={handleCreateInvitationRequest}
            />
          )}

          {activePartnerTab === 'moderation' && (
            <PartnerModeration
              organization={localizedCurrentOrganization}
              reports={moderationReports}
              onTakeAction={handleTakeModerationAction}
            />
          )}

          {activePartnerTab === 'analytics' && (
            <PartnerAnalytics metrics={partnerMetrics} />
          )}

          {activePartnerTab === 'reports' && (
            <PartnerReports
              organization={localizedCurrentOrganization}
              metrics={partnerMetrics}
            />
          )}

          {activePartnerTab === 'subscription' && (
            <PartnerSubscription
              organization={localizedCurrentOrganization}
              onUpgradePlan={handleUpgradeOrganizationPlan}
            />
          )}
        </PartnerLayout>
      )}

      {/* Discrete Desktop Scroll Control Arrows */}
      <div className="hidden md:flex fixed bottom-6 right-6 z-40 flex-col gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title={currentLang.app?.scrollToTop || "Défiler vers le haut"}
          aria-label={currentLang.app?.scrollToTop || "Défiler vers le haut"}
          className="w-7 h-7 rounded-full bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 shadow-lg flex items-center justify-center transition-all cursor-pointer"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })}
          title={currentLang.app?.scrollToBottom || "Défiler vers le bas"}
          aria-label={currentLang.app?.scrollToBottom || "Défiler vers le bas"}
          className="w-7 h-7 rounded-full bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 shadow-lg flex items-center justify-center transition-all cursor-pointer"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Global Brand Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0a0f18] py-6 text-center text-xs text-slate-400 space-y-1 mt-auto">
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleOpenAdminBackOffice}
            title="Tulizaana Ecosystem"
            className="font-extrabold text-cyan-400 font-display tracking-wider hover:text-cyan-300 hover:underline cursor-pointer transition-colors"
          >
            TULIZAANA ECOSYSTEM
          </button>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300">{currentLang.app?.tagline || 'Communauté & Résilience Holistique'}</span>
        </div>
        <p className="text-[11px] text-slate-500 max-w-lg mx-auto">
          {currentLang.app?.footerDesc || 'Plateforme sécurisée de soutien mutuel et cercles fermés pour personnes vulnérables et partenaires humanitaires.'}
        </p>
      </footer>

      {/* TULIZAANA CENTRAL ADMIN MODAL & BACK OFFICE */}
      {showAdminLoginModal && (
        <AdminLoginModal
          isOpen={showAdminLoginModal}
          language={language}
          onClose={() => setShowAdminLoginModal(false)}
          onSuccess={handleAdminLoginSuccess}
        />
      )}

      {showAdminBackOffice && adminSession && (
        <AdminBackOffice
          organizations={localizedOrganizations}
          communities={localizedCommunities}
          users={allUsers}
          posts={localizedPosts}
          campaigns={localizedCampaigns}
          reports={moderationReports}
          language={language}
          adminSession={adminSession}
          notifyRef={adminNotifyRef}
          onSelectLanguage={setLanguage}
          onUpdateOrganization={handleUpdateOrganizationFromAdmin}
          onAddOrganization={handleCreateOrganization}
          onDeleteOrganization={handleDeleteOrganizationFromAdmin}
          onUpdateCommunity={handleUpdateCommunityFromAdmin}
          onDeleteCommunity={handleDeleteCommunityFromAdmin}
          onUpdateCampaign={handleUpdateCampaignFromAdmin}
          onDeleteCampaign={handleDeleteCampaignFromAdmin}
          onUpdateUser={handleUpdateUserFromAdmin}
          onUpdateReport={handleUpdateReportFromAdmin}
          onClose={() => setShowAdminBackOffice(false)}
          onLogoutAdmin={handleAdminLogout}
        />
      )}

      {/* PWA Offline / Online Connectivity Indicator */}
      <OfflineIndicator language={language} />
    </div>
  );
}

export default App;
