/**
 * Client API unifié Tulizaana (Frontend ⇄ Backend).
 * Gère les réponses typées, le basculement gracieux (fallback) si la base de
 * données est indisponible, et l'envoi automatique du cookie de session
 * HttpOnly via `credentials: 'include'`.
 *
 * Le frontend ne stocke plus le JWT dans localStorage : l'authentification
 * repose sur un cookie HttpOnly défini par le backend.
 */

import { STORAGE_KEYS } from '../utils/storage';
import type { SearchResponse, SearchResultType, PartnerReport, PartnerReportsListResponse } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  /**
   * Code d'erreur METIER stable, renvoye par le serveur
   * (`PARTNER_NO_ORGANIZATION`, `QUOTA_EXCEEDED`, ...).
   *
   * C'est le SEUL champ sur lequel le client doit brancher son comportement.
   * Le statut HTTP est expose separement dans `status` et ne doit jamais
   * servir a deviner une condition metier.
   */
  code?: string;
  /** Statut HTTP, fourni pour le diagnostic uniquement. */
  status?: number;
}

/**
 * Codes d'erreur metier partenaires, exposes au client pour le branchement
 * des etats d'interface. Le texte serveur n'est jamais analyse.
 */
export const PARTNER_ERROR_CODES = {
  NO_ORGANIZATION: "PARTNER_NO_ORGANIZATION",
  NOT_APPROVED: "ORGANIZATION_NOT_APPROVED",
  SUBSCRIPTION_REQUIRED: "SUBSCRIPTION_REQUIRED",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  SUBSCRIPTION_EXPIRED: "SUBSCRIPTION_EXPIRED",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  FORBIDDEN_RESOURCE: "FORBIDDEN_RESOURCE",
} as const;

export type PartnerErrorCode =
  (typeof PARTNER_ERROR_CODES)[keyof typeof PARTNER_ERROR_CODES];

/** Libelle affichable, derive du code metier et jamais d'une phrase du serveur. */
export const PARTNER_ERROR_LABELS: Record<PartnerErrorCode, string> = {
  PARTNER_NO_ORGANIZATION:
    "Aucune organisation n'est associee a votre compte. Contactez la plateforme.",
  ORGANIZATION_NOT_APPROVED:
    "Votre organisation n'est pas encore approuvee par la plateforme.",
  SUBSCRIPTION_REQUIRED:
    "Aucun abonnement actif n'est defini pour votre organisation.",
  PAYMENT_PENDING:
    "Le paiement de votre abonnement n'est pas encore valide.",
  SUBSCRIPTION_EXPIRED:
    "Votre abonnement a expire. Aucune nouvelle creation n'est possible.",
  QUOTA_EXCEEDED: "Votre quota est atteint.",
  FORBIDDEN_RESOURCE: "Cette ressource n'appartient pas a votre organisation.",
};

export interface PartnerQuotaView {
  used: number;
  max: number;
  remaining: number;
  exceeded: boolean;
}

/** Organisation gerable, telle que listee par le serveur. */
export interface PartnerManagedOrganization {
  id: string;
  name: string;
  acronym: string | null;
  logo: string | null;
  partnerRole: string;
  status: string;
  subscriptionPlan: string;
  paymentStatus: string | null;
  subscriptionExpiresAt: string | null;
  canPerformSubscriptionActions: boolean;
  blockedBy: PartnerErrorCode | null;
  quotas: {
    communities: PartnerQuotaView;
    members: { used: number; max: number };
    campaignsPerMonth: PartnerQuotaView;
  };
}

/** Profil de gestion complet d'une organisation. */
export interface PartnerOrganizationManage {
  id: string;
  name: string;
  acronym: string | null;
  logo: string | null;
  coverImage: string | null;
  type: string;
  country: string;
  city: string;
  address: string | null;
  domain: string;
  mission: string;
  description: string;
  responsibleName: string;
  responsibleTitle: string | null;
  contactEmail: string;
  contactPhone: string;
  status: string;
  isVerified: boolean;
  subscriptionPlan: string;
  quotas: {
    communities: PartnerQuotaView;
    members: { used: number; max: number };
    campaignsPerMonth: PartnerQuotaView;
  };
  subscription: {
    paymentStatus: string | null;
    paymentValidated: boolean;
    startedAt: string | null;
    expiresAt: string | null;
    expired: boolean;
  };
  canPerformSubscriptionActions: boolean;
  blockedBy: PartnerErrorCode | null;
  validatedAt: string | null;
  createdAt: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Fallback : utiliser le token JWT depuis localStorage si cookie n'est pas disponible (cross-domain)
  const token = localStorage.getItem('tlz_auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const finalUrl = endpoint.startsWith("http://") || endpoint.startsWith("https://")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  try {
    const res = await fetch(finalUrl, {
      ...options,
      headers,
      credentials: "include",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: data?.error || `Erreur serveur (${res.status})`,
        code: typeof data?.code === "string" ? data.code : undefined,
        status: res.status,
      };
    }

    return {
      success: true,
      data: data?.data !== undefined ? data.data : data,
      status: res.status,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur de connexion réseau",
      status: 0,
    };
  }
}

export const api = {
  // Recherche globale : le serveur applique la portee des communautes et ne
  // retourne jamais les messages prives ni les donnees de gestion.
  search: (query: string, options: { types?: SearchResultType[]; page?: number; limit?: number } = {}) => {
    const params = new URLSearchParams({ q: query });
    if (options.types?.length) params.set("types", options.types.join(","));
    if (options.page) params.set("page", String(options.page));
    if (options.limit) params.set("limit", String(options.limit));
    return request<SearchResponse>(`/api/search?${params.toString()}`);
  },
  // Santé du backend et statut BDD
  health: {
    check: () =>
      request<{
        status: string;
        appName: string;
        version: string;
        architecture: {
          frontend: string;
          backend: string;
          database: string;
          mediaStorage: string;
        };
        services: {
          database: { provider: string; configured: boolean; connected: boolean; error?: string };
          supabase: { configured: boolean; connected: boolean; status: string; url?: string; error?: string };
          cloudinary: { configured: boolean; cloudName?: string; status: string; error?: string };
          geminiAi: { configured: boolean; status: string };
        };
      }>("/api/health"),
  },

  // Schéma et initialisation Base de Données Supabase
  schema: {
    getSupabaseSql: () =>
      request<{
        success: boolean;
        sql: string;
        tableCount: number;
        tables: string[];
      }>("/api/schema/supabase-sql"),
    testSupabase: () =>
      request<{
        connected: boolean;
        status: string;
        message: string;
        database?: { configured: boolean; connected: boolean; error?: string; hasUrl: boolean };
        supabase?: { configured: boolean; connected: boolean; url?: string; error?: string };
        tables?: { name: string; count?: number }[];
      }>("/api/schema/test-supabase"),
  },

  // Authentification & Profils
  auth: {
    login: (credentials: { identifier: string; password?: string }) =>
      request<{ user: any; token?: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),

    /**
     * Connexion Google.
     *
     * `idToken` est le Firebase ID token signe par Google : il est envoye dans
     * l'en-tete Authorization et constitue la SEULE preuve d'identite acceptee
     * par le serveur. Les champs email/displayName/photoURL/uid ne sont plus
     * acceptes : le serveur les ignore et les relit depuis le token verifie.
     * Seul `invitationCode` reste une entree metier, validee en base.
     */
    googleLogin: (payload: { idToken: string; invitationCode?: string }) =>
      request<{ user: any }>("/api/auth/google", {
        method: "POST",
        headers: { Authorization: `Bearer ${payload.idToken}` },
        body: JSON.stringify({
          invitationCode: payload.invitationCode,
        }),
      }),

    register: (userData: {
      name: string;
      email?: string;
      password?: string;
      pseudonym?: string;
      invitationCode?: string;
      phoneNumber?: string;
      role?: string;
      isAnonymous?: boolean;
    }) =>
      request<{ user: any }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      }),

    me: () => request<any>("/api/auth/me"),

    updateProfile: (profileData: {
      name?: string;
      pseudonym?: string;
      bio?: string;
      avatar?: string;
      city?: string;
      phoneNumber?: string;
    }) =>
      request<any>("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(profileData),
      }),
  },

  // Cercles & Communautés fermées
  communities: {
    list: (category?: string, search?: string) => {
      const params = new URLSearchParams();
      if (category && category !== "all") params.append("category", category);
      if (search) params.append("search", search);
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<any[]>(`/api/communities${query}`);
    },

    get: (idOrSlug: string) => request<any>(`/api/communities/${idOrSlug}`),

    create: (data: {
      name: string;
      slug?: string;
      description?: string;
      mission?: string;
      category?: string;
      icon?: string;
      coverImage?: string;
      rules?: string[];
      isPrivate?: boolean;
      organizationId?: string;
    }) =>
      request<any>("/api/communities", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    join: (id: string) =>
      request<any>(`/api/communities/${id}/join`, {
        method: "POST",
      }),
  },

  // Fil d'entraide & Publications
  posts: {
    list: (communityId?: string, page: number = 1) => {
      const params = new URLSearchParams();
      if (communityId) params.append("communityId", communityId);
      params.append("page", page.toString());
      return request<{ posts: any[]; pagination: any }>(`/api/posts?${params.toString()}`);
    },

    create: (postData: {
      communityId: string;
      content: string;
      title?: string;
      type?: string;
      tags?: string[];
      isAnonymous?: boolean;
      mediaUrl?: string;
      mediaType?: string;
      media?: Array<{ type: string; url: string; secureUrl?: string; publicId?: string }>;
    }) => {
      const payload: any = {
        communityId: postData.communityId,
        content: postData.content,
        title: postData.title,
        type: postData.type,
        tags: postData.tags,
        isAnonymous: postData.isAnonymous,
      };
      if (Array.isArray(postData.media)) {
        payload.media = postData.media;
      } else if (postData.mediaUrl) {
        payload.media = [
          {
            type: postData.mediaType || "image",
            url: postData.mediaUrl,
            secureUrl: postData.mediaUrl,
          },
        ];
      }
      return request<any>("/api/posts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    react: (postId: string, type: "support" | "understand" | "courage" | "bravo") =>
      request<any>(`/api/posts/${postId}/react`, {
        method: "POST",
        body: JSON.stringify({ type }),
      }),

    comment: (postId: string, content: string, isAnonymous: boolean = false) =>
      request<any>(`/api/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content, isAnonymous }),
      }),
  },

  // Messagerie Privée Sécurisée
  messages: {
    getThreads: () => request<any[]>("/api/messages/threads"),

    getThreadMessages: (threadId: string) => request<any[]>(`/api/messages/threads/${threadId}`),

    sendMessage: (messageData: {
      receiverId: string;
      content: string;
      type?: "text" | "audio" | "image" | "file";
      mediaUrl?: string;
      audioDuration?: number;
    }) =>
      request<any>("/api/messages/send", {
        method: "POST",
        body: JSON.stringify(messageData),
      }),
  },

  // Codes d'invitation & Candidatures
  invitations: {
    verify: (code: string) =>
      request<any>("/api/invitations/verify", {
        method: "POST",
        body: JSON.stringify({ code }),
      }),

    verifyLink: (token: string) =>
      request<any>("/api/invitations/links/verify", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),

    request: (candidatureData: {
      candidateName: string;
      contactEmail?: string;
      contactPhone: string;
      situation: string;
      motivation: string;
      communityId: string;
      organizationId?: string;
    }) =>
      request<any>("/api/invitations/request", {
        method: "POST",
        body: JSON.stringify(candidatureData),
      }),

    acceptCode: (code: string) =>
      request<any>("/api/invitations/accept/code", {
        method: "POST",
        body: JSON.stringify({ code }),
      }),

    acceptLink: (token: string) =>
      request<any>("/api/invitations/accept/link", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),

    listRequests: (filters?: { status?: string; communityId?: string; organizationId?: string }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.communityId) params.append("communityId", filters.communityId);
      if (filters?.organizationId) params.append("organizationId", filters.organizationId);
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<any[]>(`/api/invitations/requests${query}`);
    },

    handleRequest: (id: string, status: "accepted" | "rejected", dispatchedVia?: string) =>
      request<any>(`/api/invitations/requests/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, dispatchedVia }),
      }),

    generate: (invitationData: {
      communityId: string;
      organizationId: string;
      prefix?: string;
      maxUses?: number;
      validityDays?: number;
    }) =>
      request<any>("/api/invitations/generate", {
        method: "POST",
        body: JSON.stringify(invitationData),
      }),

    createLink: (linkData: {
      type: "community" | "campaign";
      targetId: string;
      organizationId: string;
      communityId?: string;
      campaignId?: string;
      maxUses?: number;
      validityDays?: number;
    }) =>
      request<any>("/api/invitations/links", {
        method: "POST",
        body: JSON.stringify(linkData),
      }),
  },

  // Campagnes Solidaires
  campaigns: {
    list: (filters?: { communityId?: string; organizationId?: string; status?: string }) => {
      const params = new URLSearchParams();
      if (filters?.communityId) params.append("communityId", filters.communityId);
      if (filters?.organizationId) params.append("organizationId", filters.organizationId);
      if (filters?.status) params.append("status", filters.status);
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<any[]>(`/api/campaigns${query}`);
    },

    get: (id: string) => request<any>(`/api/campaigns/${id}`),

    create: (data: any) =>
      request<any>("/api/campaigns", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    contribute: (id: string, contributionData: { message: string; activityTitle?: string; isAnonymous?: boolean }) =>
      request<any>(`/api/campaigns/${id}/contribute`, {
        method: "POST",
        body: JSON.stringify(contributionData),
      }),
  },

  // Récits & Stories
  stories: {
    list: (communityId?: string) => {
      const query = communityId ? `?communityId=${communityId}` : "";
      return request<any[]>(`/api/stories${query}`);
    },

    create: (storyData: {
      communityId: string;
      caption: string;
      mediaUrl?: string;
      mediaType?: string;
      audioDuration?: number;
      isVoiceNote?: boolean;
    }) =>
      request<any>("/api/stories", {
        method: "POST",
        body: JSON.stringify(storyData),
      }),
  },

  // Organisations Partenaires (ONG, Hôpitaux)
  organizations: {
    list: (filters?: { status?: string; type?: string; search?: string }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.type) params.append("type", filters.type);
      if (filters?.search) params.append("search", filters.search);
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<any[]>(`/api/organizations${query}`);
    },

    get: (id: string) => request<any>(`/api/organizations/${id}`),

    create: (data: any) =>
      request<any>("/api/organizations", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    updateStatus: (id: string, updates: { status?: string; subscriptionPlan?: string }) =>
      request<any>(`/api/organizations/${id}/status`, {
        method: "PUT",
        body: JSON.stringify(updates),
      }),
  },

  /**
   * Back Office central.
   *
   * Chaque appel est une decision du serveur : le client n'envoie que l'identifiant
   * de la ressource et les champs a modifier. Le role admin n'est jamais transmis
   * par le client, et aucun de ces appels ne peut aboutir sans JWT valide ET
   * role relu en base (voir server/routes/admin.routes.ts).
   */
  admin: {
    overview: () => request<any>("/api/admin/overview"),

    listUsers: (filters?: { search?: string; role?: string; scope?: "active" | "suspended" }) => {
      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);
      if (filters?.role) params.append("role", filters.role);
      if (filters?.scope) params.append("scope", filters.scope);
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<any[]>(`/api/admin/users${query}`);
    },

    updateUserAccess: (userId: string, changes: { role?: string; isSuspended?: boolean }) =>
      request<any>(`/api/admin/users/${encodeURIComponent(userId)}/access`, {
        method: "PUT",
        body: JSON.stringify(changes),
      }),

    updateOrganizationStatus: (
      orgId: string,
      updates: { status: string; subscriptionPlan?: string }
    ) =>
      request<any>(`/api/admin/organizations/${encodeURIComponent(orgId)}/status`, {
        method: "PUT",
        body: JSON.stringify(updates),
      }),

    updateCommunityStatus: (communityId: string, status: string) =>
      request<any>(`/api/admin/communities/${encodeURIComponent(communityId)}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),

    updateCampaignStatus: (campaignId: string, status: string) =>
      request<any>(`/api/admin/campaigns/${encodeURIComponent(campaignId)}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),

    deleteOrganization: (orgId: string) =>
      request<any>(`/api/admin/organizations/${encodeURIComponent(orgId)}`, {
        method: "DELETE",
      }),

    deleteCommunity: (communityId: string) =>
      request<any>(`/api/admin/communities/${encodeURIComponent(communityId)}`, {
        method: "DELETE",
      }),

    deleteCampaign: (campaignId: string) =>
      request<any>(`/api/admin/campaigns/${encodeURIComponent(campaignId)}`, {
        method: "DELETE",
      }),

    listAuditLogs: (limit?: number) =>
      request<any[]>(`/api/admin/audit-logs${limit ? `?limit=${limit}` : ""}`),
  },

  // Signalements de Modération & SOS
  moderation: {
    createReport: (reportData: {
      targetType: string;
      targetId: string;
      reason: string;
      details?: string;
      communityId?: string;
      severity?: string;
    }) =>
      request<any>("/api/moderation/reports", {
        method: "POST",
        body: JSON.stringify(reportData),
      }),

    listReports: (status?: string) => {
      const query = status ? `?status=${status}` : "";
      return request<any[]>(`/api/moderation/reports${query}`);
    },

    handleReport: (id: string, actionData: { status: string; notes?: string }) =>
      request<any>(`/api/moderation/reports/${id}/handle`, {
        method: "PUT",
        body: JSON.stringify(actionData),
      }),
  },

  // Téléversement média (Photos & Vocaux)
  upload: {
    media: (dataUrl: string, type: "image" | "audio" = "image") =>
      request<{ url: string; filename: string; size: number; mimeType: string }>("/api/upload", {
        method: "POST",
        body: JSON.stringify({ dataUrl, type }),
      }),
  },

  /**
   * Portail partenaire (Chantier 4).
   *
   * Toutes les organisations gerables proviennent de `GET /api/organizations/mine`,
   * donc de la table `OrganizationAdmin` relue par le serveur. Le client ne
   * declare jamais une organisation : il choisit parmi celles que le serveur a
   * listees, et le serveur reverifie ce choix a chaque mutation.
   *
   * Aucun de ces appels n'envoie `status`, `subscriptionPlan`, `quota*` ni
   * `paymentStatus` : ces valeurs ne sont pas des entrees du client.
   */
  partner: {
    /**
     * Connexion reelle du portail partenaire.
     *
     * Elle passe par `POST /api/auth/login`, qui verifie le mot de passe en
     * base. Le client ne valide plus rien lui-meme et ne choisit plus
     * l'organisation : celle-ci est resolue par le serveur depuis
     * `OrganizationAdmin`.
     */
    login: (credentials: { email: string; password: string }) =>
      request<{ user: any }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),

    /** Identite serveur : role et organisations reellement gerees. */
    me: () => request<any>("/api/auth/me"),

    /** Liste server-authoritative des organisations gerables, avec quotas. */
    managedOrganizations: () => request<PartnerManagedOrganization[]>("/api/organizations/mine"),

    /** Profil de gestion : quotas `used/max`, abonnement, expiration. */
    organizationManage: (id: string) =>
      request<PartnerOrganizationManage>(`/api/organizations/${encodeURIComponent(id)}/manage`),

    /**
     * Creation d'un cercle. `organizationId` n'est envoye que comme choix de
     * selection parmi les organisations gerables ; le serveur le reverifie et
     * peut l'ignorer au profit de l'organisation unique du compte.
     */
    createCommunity: (data: {
      name: string;
      slug?: string;
      description?: string;
      mission?: string;
      rules?: string[];
      category?: string;
      icon?: string;
      coverImage?: string;
      isPrivate?: boolean;
      organizationId?: string;
    }) =>
      request<any>("/api/communities", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    /** Creation d'une campagne dans un cercle de l'organisation resolue. */
    createCampaign: (data: {
      communityId: string;
      title: string;
      description: string;
      category: string;
      durationDays?: number;
      targetActivitiesCount?: number;
      rewardBadge?: string;
      activities?: unknown[];
    }) =>
      request<any>("/api/campaigns", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    /**
     * Demande de changement de formule.
     *
     * N'applique AUCUN changement : ni formule, ni quotas, ni etat de paiement.
     * La demande est tracee et attend une validation administrative. Aucun
     * paiement n'est simule cote client ni cote serveur.
     */
    requestSubscriptionChange: (organizationId: string, requestedPlan: string) =>
      request<{ message: string; requestedPlan: string; currentPlan: string }>(
        `/api/organizations/${encodeURIComponent(organizationId)}/subscription-request`,
        {
          method: "POST",
          body: JSON.stringify({ requestedPlan }),
        }
      ),

    /**
     * Chantier 8.7 — Rapports partenaires.
     *
     * Le niveau de rapport (BASIC / INTERMEDIATE / ADVANCED) est déterminé
     * côté serveur depuis le `reportLevel` du plan de l'organisation. Le
     * client ne peut pas l'envoyer pour obtenir un niveau supérieur.
     *
     * Toutes les métriques sont anonymisées : un seuil serveur de 5 membres
     * masque toute statistique de groupe trop petit pour éviter la
     * réidentification.
     */
    reports: {
      /**
       * Génère un rapport pour l'organisation courante.
       *
       * `organizationId` est optionnel : le serveur le résout depuis
       * `OrganizationAdmin`. Si plusieurs organisations sont gérées, il
       * doit être fourni comme choix de sélection.
       */
      generate: (data: {
        organizationId?: string;
        communityId?: string;
        periodStart: string;
        periodEnd: string;
      }) =>
        request<PartnerReport>("/api/partner/reports", {
          method: "POST",
          body: JSON.stringify(data),
        }),

      /** Liste paginée des rapports de l'organisation courante. */
      list: (params: { organizationId?: string; page?: number; limit?: number } = {}) => {
        const search = new URLSearchParams();
        if (params.organizationId) search.set("organizationId", params.organizationId);
        if (params.page) search.set("page", String(params.page));
        if (params.limit) search.set("limit", String(params.limit));
        const query = search.toString() ? `?${search.toString()}` : "";
        return request<PartnerReportsListResponse>(`/api/partner/reports${query}`);
      },

      /** Récupère un rapport par son ID. */
      get: (id: string) =>
        request<PartnerReport>(`/api/partner/reports/${encodeURIComponent(id)}`),
    },
  },
};
