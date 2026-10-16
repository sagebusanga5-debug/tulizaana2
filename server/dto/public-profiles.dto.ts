/**
 * DTO publics pour les profils organisation et communauté (Chantier 8.5).
 *
 * Règles :
 * - Aucun champ de gestion interne (abonnement, quotas, démo, paiement,
 *   coordonnées privées, OrganizationAdmin, AuditLog).
 * - Sélection Prisma explicite : un nouveau champ ajouté au modèle ne peut
 *   pas être exposé accidentellement.
 * - Les identifiants internes (id, organizationId) ne sont pas exposés au
 *   frontend public. Le slug est l'identifiant public privilégié.
 */

export interface PublicOrganizationSummaryDto {
  slug: string;
  name: string;
  acronym?: string | null;
  logo?: string | null;
  coverImage?: string | null;
  description?: string | null;
  mission?: string | null;
  domain?: string | null;
  type?: string | null;
  country?: string | null;
  city?: string | null;
}

export interface PublicCommunitySummaryDto {
  slug: string;
  name: string;
  icon?: string | null;
  coverImage?: string | null;
  category?: string | null;
  description?: string | null;
  memberCount: number;
  isPrivate: boolean;
}

export interface PublicOrganizationDto extends PublicOrganizationSummaryDto {
  communityCount: number;
  communities: PublicCommunitySummaryDto[];
}

export interface PublicOrganizationStatsDto {
  communityCount: number;
  activeCommunityCount: number;
  publicCommunityCount: number;
}

export interface PublicCampaignSummaryDto {
  slug: string;
  title: string;
  description?: string | null;
  status: string;
  createdAt: string;
}

export interface PublicCommunityDto {
  slug: string;
  name: string;
  description?: string | null;
  mission?: string | null;
  icon?: string | null;
  coverImage?: string | null;
  category?: string | null;
  isPrivate: boolean;
  memberCount: number;
  activeCampaignCount: number;
  organization: PublicOrganizationSummaryDto;
  campaigns?: PublicCampaignSummaryDto[];
}

export interface PublicCommunityStatsDto {
  memberCount: number;
  activeCampaignCount: number;
  publicCampaignCount: number;
}