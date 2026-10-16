/**
 * Chantier 4 - DTO de restitution des organisations.
 *
 * Regle absolue : aucune requete publique ne renvoie plus
 * `prisma.organization.findUnique(...)` tel quel. Tout passe par une de ces deux
 * fonctions, qui listent explicitement les champs autorises. Un champ ajoute au
 * modele Prisma ne peut donc pas fuiter par oubli : il ne le peut pas du tout.
 *
 * `toPublicOrganization` ne contient AUCUNE donnee de gestion ni sensible.
 * `toPartnerOrganization` est reserve aux administrateurs de l'organisation.
 */

export interface PublicOrganizationCounters {
  numberOfActiveCampaigns: number;
  numberOfPublicCommunities: number;
}

export interface PublicOrganization {
  id: string;
  slug: string | null;
  name: string;
  acronym: string | null;
  logo: string | null;
  coverImage: string | null;
  type: string;
  country: string;
  city: string;
  domain: string;
  mission: string;
  description: string;
  isVerified: boolean;
  counters: PublicOrganizationCounters;
}

export interface PartnerOrganizationQuota {
  used: number;
  max: number;
  remaining: number;
  exceeded: boolean;
}

export interface PartnerOrganizationDto {
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
  planId: string | null;
  quotas: {
    communities: PartnerOrganizationQuota;
    members: { used: number; max: number };
    campaignsPerMonth: PartnerOrganizationQuota;
  };
  subscription: {
    paymentStatus: string | null;
    paymentValidated: boolean;
    startedAt: string | null;
    expiresAt: string | null;
    expired: boolean;
  };
  demo: {
    used: boolean;
    startedAt: string | null;
    expiresAt: string | null;
    expired: boolean;
  };
  canPerformSubscriptionActions: boolean;
  blockedBy: string | null;
  validatedAt: string | null;
  createdAt: string;
}

/** Ligne minimale attendue par les deux DTO. */
export interface OrganizationRow {
  id: string;
  slug: string | null;
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
  subscriptionPlan: string;
  planId: string | null;
  quotaCommunitiesMax: number;
  quotaMembersMax: number;
  quotaCampaignsMax: number;
  subscriptionStartedAt: Date | null;
  subscriptionExpiresAt: Date | null;
  paymentStatus: string | null;
  validatedAt: Date | null;
  createdAt: Date;
  demoUsed: boolean;
  demoStartedAt: Date | null;
  demoExpiresAt: Date | null;
}

/**
 * Selection Prisma du profil public.
 *
 * `contactEmail`, `contactPhone`, `address`, `responsibleName`, `validatedAt`,
 * les trois quotas et toutes les colonnes d'abonnement en sont ABSENTS : la base
 * ne les ramene meme pas, donc aucune fuite n'est possible.
 */
export const PUBLIC_ORGANIZATION_SELECT = {
  id: true,
  slug: true,
  name: true,
  acronym: true,
  logo: true,
  coverImage: true,
  type: true,
  country: true,
  city: true,
  domain: true,
  mission: true,
  description: true,
  status: true,
  createdAt: true,
} as const;

/** Selection Prisma du profil de gestion, reserve aux administrateurs. */
export const PARTNER_ORGANIZATION_SELECT = {
  id: true,
  slug: true,
  name: true,
  acronym: true,
  logo: true,
  coverImage: true,
  type: true,
  country: true,
  city: true,
  address: true,
  domain: true,
  mission: true,
  description: true,
  responsibleName: true,
  responsibleTitle: true,
  contactEmail: true,
  contactPhone: true,
  status: true,
  subscriptionPlan: true,
  planId: true,
  quotaCommunitiesMax: true,
  quotaMembersMax: true,
  quotaCampaignsMax: true,
  subscriptionStartedAt: true,
  subscriptionExpiresAt: true,
  paymentStatus: true,
  validatedAt: true,
  createdAt: true,
  demoUsed: true,
  demoStartedAt: true,
  demoExpiresAt: true,
} as const;

export type PublicOrganizationRow = Pick<
  OrganizationRow,
  | "id"
  | "slug"
  | "name"
  | "acronym"
  | "logo"
  | "coverImage"
  | "type"
  | "country"
  | "city"
  | "domain"
  | "mission"
  | "description"
  | "status"
  | "createdAt"
>;

/**
 * DTO public.
 *
 * Contre-verification explicite : ni `contactEmail`, ni `contactPhone`, ni
 * `address`, ni `responsibleName`, ni `validatedAt`, ni `quota*`, ni
 * `subscriptionPlan`, ni `subscriptionStartedAt`, ni `subscriptionExpiresAt`,
 * ni `paymentStatus`.
 *
 * Compteurs : `numberOfActiveCampaigns` et `numberOfPublicCommunities` sont
 * exposes parce qu'ils sont deja publics via `GET /api/campaigns` et
 * `GET /api/communities`. `numberOfMembers` n'est VOLONTAIREMENT pas expose :
 * `Community.isPrivate` vaut `true` par defaut, donc compter les membres
 * d'une communaute protegee est une fuite d'information.
 */
export function toPublicOrganization(
  organization: PublicOrganizationRow,
  counters: PublicOrganizationCounters
): PublicOrganization {
  return {
    id: organization.id,
    slug: organization.slug,
    name: organization.name,
    acronym: organization.acronym,
    logo: organization.logo,
    coverImage: organization.coverImage,
    type: organization.type,
    country: organization.country,
    city: organization.city,
    domain: organization.domain,
    mission: organization.mission,
    description: organization.description,
    isVerified: organization.status === "approved",
    counters,
  };
}

/** DTO de gestion. Contient les quotas reels et l'etat d'abonnement. */
export function toPartnerOrganization(
  organization: OrganizationRow,
  usage: { communities: number; campaignsThisMonth: number; members: number },
  entitlements: {
    canPerformSubscriptionActions: boolean;
    blockedBy: string | null;
    expired: boolean;
    paymentValidated: boolean;
  },
  now: Date = new Date()
): PartnerOrganizationDto {
  const toIso = (value: Date | null) => (value ? value.toISOString() : null);

  return {
    id: organization.id,
    name: organization.name,
    acronym: organization.acronym,
    logo: organization.logo,
    coverImage: organization.coverImage,
    type: organization.type,
    country: organization.country,
    city: organization.city,
    address: organization.address,
    domain: organization.domain,
    mission: organization.mission,
    description: organization.description,
    responsibleName: organization.responsibleName,
    responsibleTitle: organization.responsibleTitle,
    contactEmail: organization.contactEmail,
    contactPhone: organization.contactPhone,
    status: organization.status,
    isVerified: organization.status === "approved",
    subscriptionPlan: organization.subscriptionPlan,
    planId: organization.planId,
    quotas: {
      communities: {
        used: usage.communities,
        max: organization.quotaCommunitiesMax,
        remaining: Math.max(0, organization.quotaCommunitiesMax - usage.communities),
        exceeded: usage.communities >= organization.quotaCommunitiesMax,
      },
      members: {
        used: usage.members,
        max: organization.quotaMembersMax,
      },
      campaignsPerMonth: {
        used: usage.campaignsThisMonth,
        max: organization.quotaCampaignsMax,
        remaining: Math.max(0, organization.quotaCampaignsMax - usage.campaignsThisMonth),
        exceeded: usage.campaignsThisMonth >= organization.quotaCampaignsMax,
      },
    },
    subscription: {
      paymentStatus: organization.paymentStatus,
      paymentValidated: entitlements.paymentValidated,
      startedAt: toIso(organization.subscriptionStartedAt),
      expiresAt: toIso(organization.subscriptionExpiresAt),
      expired: entitlements.expired,
    },
    demo: {
      used: organization.demoUsed,
      startedAt: toIso(organization.demoStartedAt),
      expiresAt: toIso(organization.demoExpiresAt),
      expired: organization.demoUsed
        ? organization.demoExpiresAt
          ? organization.demoExpiresAt.getTime() < now.getTime()
          : false
        : false,
    },
    canPerformSubscriptionActions: entitlements.canPerformSubscriptionActions,
    blockedBy: entitlements.blockedBy,
    validatedAt: toIso(organization.validatedAt),
    createdAt: organization.createdAt.toISOString(),
  };
}