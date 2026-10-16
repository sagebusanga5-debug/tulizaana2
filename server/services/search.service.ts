/**
 * Recherche globale, sans contourner la portee des ressources.
 *
 * Une recherche n'est pas un annuaire interne : les communautes, campagnes
 * et publications reutilisent exactement `buildReadableCommunityFilter`.
 */
import { PrismaClient } from "@prisma/client";
import { buildReadableCommunityFilter } from "./community-access.service.js";
import {
  PUBLIC_ORGANIZATION_SELECT,
  toPublicOrganization,
} from "./organization-dto.js";

export const SEARCH_TYPES = ["organizations", "communities", "campaigns", "posts", "users"] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

export interface SearchResult {
  type: SearchType;
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  /** Identifiant de la ressource cible, jamais une URL composee depuis l'entree. */
  resourceId: string;
  context?: { id: string; name: string; slug?: string | null };
  tags?: string[];
}

export interface SearchResultPage {
  items: SearchResult[];
  total: number;
}

export interface SearchResponse {
  query: string;
  types: SearchType[];
  page: number;
  limit: number;
  results: Partial<Record<SearchType, SearchResultPage>>;
}

export interface SearchOptions {
  query: string;
  userId?: string;
  types?: SearchType[];
  page?: number;
  limit?: number;
}

/** Normalise sans modifier le texte effectivement recherche par PostgreSQL. */
export function normalizeSearchQuery(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, 100);
}

export function parseSearchTypes(value: unknown): SearchType[] | null {
  if (value === undefined || value === "") return [...SEARCH_TYPES];
  if (typeof value !== "string") return null;
  const types = [...new Set(value.split(",").map((type) => type.trim()))];
  if (!types.length || types.some((type) => !SEARCH_TYPES.includes(type as SearchType))) return null;
  return types as SearchType[];
}

/**
 * Execute une recherche independante par type : `limit` est donc un plafond
 * par type, jamais un moyen d'evincer les autres categories de resultats.
 */
export async function search(
  prisma: PrismaClient,
  options: SearchOptions
): Promise<SearchResponse> {
  const query = normalizeSearchQuery(options.query);
  const types = options.types?.length ? options.types : [...SEARCH_TYPES];
  const page = Math.max(1, Math.floor(options.page || 1));
  const limit = Math.min(20, Math.max(1, Math.floor(options.limit || 20)));
  const skip = (page - 1) * limit;

  const readableCommunities = await buildReadableCommunityFilter(prisma, options.userId);
  const results: Partial<Record<SearchType, SearchResultPage>> = {};

  await Promise.all(types.map(async (type) => {
    if (type === "organizations") {
      const where = {
        status: "approved",
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { acronym: { contains: query, mode: "insensitive" as const } },
          { description: { contains: query, mode: "insensitive" as const } },
        ],
      };
      const [organizations, total] = await Promise.all([
        prisma.organization.findMany({
          where,
          select: {
            ...PUBLIC_ORGANIZATION_SELECT,
            communities: { where: { status: "active", isPrivate: false }, select: { id: true } },
            campaigns: { where: { status: "active" }, select: { id: true } },
          },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.organization.count({ where }),
      ]);
      results.organizations = {
        total,
        items: organizations.map((organization) => {
          const dto = toPublicOrganization(organization, {
            numberOfPublicCommunities: organization.communities.length,
            numberOfActiveCampaigns: organization.campaigns.length,
          });
          return {
            type: "organizations",
            id: dto.id,
            resourceId: dto.slug || dto.id,
            title: dto.name,
            description: dto.description || dto.mission || null,
            image: dto.logo,
          };
        }),
      };
      return;
    }

    if (type === "communities") {
      const where = {
        ...readableCommunities,
        // `buildReadableCommunityFilter` porte lui-meme parfois un OR
        // (public OU membre d'un cercle prive). Le mettre dans `AND` evite
        // que les termes de recherche n'ecrasent cette restriction.
        AND: [{
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { description: { contains: query, mode: "insensitive" as const } },
            { mission: { contains: query, mode: "insensitive" as const } },
          ],
        }],
      };
      const [communities, total] = await Promise.all([
        prisma.community.findMany({
          where,
          select: { id: true, slug: true, name: true, description: true, coverImage: true, organization: { select: { id: true, name: true } } },
          skip, take: limit, orderBy: { createdAt: "desc" },
        }),
        prisma.community.count({ where }),
      ]);
      results.communities = {
        total,
        items: communities.map((community) => ({
          type: "communities", id: community.id, resourceId: community.slug, title: community.name,
          description: community.description || null, image: community.coverImage,
          context: { id: community.organization.id, name: community.organization.name },
        })),
      };
      return;
    }

    if (type === "campaigns") {
      const where = {
        community: readableCommunities,
        status: { in: ["active", "completed"] },
        OR: [
          { title: { contains: query, mode: "insensitive" as const } },
          { description: { contains: query, mode: "insensitive" as const } },
          { category: { contains: query, mode: "insensitive" as const } },
        ],
      };
      const [campaigns, total] = await Promise.all([
        prisma.campaign.findMany({
          where,
          select: { id: true, title: true, description: true, community: { select: { id: true, name: true, slug: true } } },
          skip, take: limit, orderBy: { createdAt: "desc" },
        }),
        prisma.campaign.count({ where }),
      ]);
      results.campaigns = {
        total,
        items: campaigns.map((campaign) => ({
          type: "campaigns", id: campaign.id, resourceId: campaign.id, title: campaign.title,
          description: campaign.description || null, image: null, context: campaign.community,
        })),
      };
      return;
    }

    if (type === "posts") {
      const where = {
        community: readableCommunities,
        OR: [
          { content: { contains: query, mode: "insensitive" as const } },
          { title: { contains: query, mode: "insensitive" as const } },
          // PostgreSQL ne propose pas `contains` insensible a la casse pour
          // un tableau : `has` conserve neanmoins la recherche par tag exacte.
          { tags: { has: query } },
        ],
      };
      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          select: { id: true, title: true, content: true, mediaUrl: true, tags: true, community: { select: { id: true, name: true, slug: true } } },
          skip, take: limit, orderBy: { createdAt: "desc" },
        }),
        prisma.post.count({ where }),
      ]);
      results.posts = {
        total,
        items: posts.map((post) => ({
          type: "posts", id: post.id, resourceId: post.id, title: post.title || "Publication", description: post.content,
          image: post.mediaUrl, tags: post.tags, context: post.community,
        })),
      };
      return;
    }

    // Un profil anonyme n'est jamais indexe dans l'annuaire. Un utilisateur
    // visible doit aussi partager au moins un cercle effectivement lisible ;
    // cela exclut tout compte sans surface publique ou commune avec l'appelant.
    const where = {
      isSuspended: false,
      isAnonymous: false,
      communityMemberships: { some: { status: "active", community: readableCommunities } },
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { pseudonym: { contains: query, mode: "insensitive" as const } },
      ],
    };
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, select: { id: true, name: true, pseudonym: true, avatar: true }, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.user.count({ where }),
    ]);
    results.users = {
      total,
      items: users.map((user) => ({
        type: "users", id: user.id, resourceId: user.id, title: user.pseudonym || user.name,
        description: null, image: user.avatar,
      })),
    };
  }));

  return { query, types, page, limit, results };
}
