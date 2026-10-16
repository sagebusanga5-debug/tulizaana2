import { Response } from "express";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { getPrismaClient } from "../config/database.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";
import {
  PartnerEntitlementError,
  assertPartnerSubscription,
  assertQuotaAvailable,
  countUsedCommunities,
  countUsedMembers,
  deny,
  PARTNER_ORGANIZATION_SELECT,
  resolvePartnerOrganization,
} from "../services/partner-entitlements.service.js";
import {
  buildReadableCommunityFilter,
  resolveReadableCommunityId,
} from "../services/community-access.service.js";

/**
 * Liste tous les cercles d'entraide actifs.
 */
export async function listCommunities(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de données non connectée.", 503);
    return;
  }

  try {
    const { category, search } = req.query;

    // Chantier 5 - `isPrivate` vaut `true` par defaut et ces cercles sont
    // documentes comme fermes. La liste n'en montrait aucun filtre : un
    // appelant anonyme enumerait tous les cercles de soutien de la plateforme.
    const access = await buildReadableCommunityFilter(prisma, req.user?.id);

    const communities = await prisma.community.findMany({
      where: {
        ...access,
        ...(category && typeof category === "string" && { category }),
        ...(search && typeof search === "string" && {
          OR: [
            { name: { contains: search.slice(0, 64), mode: "insensitive" } },
            { description: { contains: search.slice(0, 64), mode: "insensitive" } },
          ],
        }),
      },
      take: 50,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            acronym: true,
            logo: true,
            type: true,
          },
        },
        _count: {
          select: {
            members: true,
            posts: true,
            campaigns: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    sendSuccess(
      res,
      communities.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        mission: c.mission,
        category: c.category,
        icon: c.icon,
        coverImage: c.coverImage,
        rules: c.rules,
        isPrivate: c.isPrivate,
        organizationId: c.organizationId,
        organizationName: c.organization.name,
        membersCount: c._count.members,
        postsCount: c._count.posts,
        activeCampaignsCount: c._count.campaigns,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    console.error("Erreur listCommunities:", err);
    sendError(res, "Erreur lors de la récupération des communautés.", 500);
  }
}

/**
 * Nombre de tentatives en cas de conflit de transaction (P2034).
 *
 * La verification du quota et l'insertion sont dans la meme transaction, donc
 * deux requetes simultanees ne peuvent pas observer le meme compteur et
 * decider chacune qu'il reste une place. Voir la section « Tests de concurrence »
 * du rapport pour la limite residuelle, assumee et documentee.
 */
const COMMUNITY_CREATION_ATTEMPTS = 3;

/**
 * Creation d'une nouvelle communaute (cercle de soutien).
 *
 * Chaine de derivation obligatoire :
 *
 *   JWT -> User -> OrganizationAdmin -> Organization
 *                        -> status approved
 *                        -> abonnement defini + paiement valide + non expire
 *                        -> quota disponible
 *                        -> Community
 *
 * `req.body.organizationId` n'est PAS lu : il est volontairement absent du
 * `destructure` ci-dessous, donc meme envoye il n'est jamais utilise. Une
 * organisation arbitraire ne peut donc pas etre ciblee.
 */
export async function createCommunity(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de donnees non connectee.", 503);
    return;
  }

  if (!req.user) {
    sendError(res, "Authentification requise pour creer un cercle.", 401);
    return;
  }

  try {
    const {
      name,
      slug,
      description,
      mission,
      rules,
      category = "chronic_disease",
      icon = "heart",
      coverImage,
      isPrivate = true,
      // `organizationId` n'est lu QUE comme un choix de selection parmi les
      // organisations reellement gerees. Il n'est jamais une autorite :
      // `resolvePartnerOrganization` le revérifie contre `OrganizationAdmin`.
      organizationId: _requestedOrganizationId,
    } = req.body;

    if (!name || typeof name !== "string") {
      sendError(res, "Le nom du cercle est requis.", 400);
      return;
    }

    // Si l'utilisateur gere plusieurs organisations, `organizationId` peut
    // DESIGNER laquelle, mais elle est verifiee contre la table
    // `OrganizationAdmin`. Une organisation non geree est rejetee en 404.
    const organization = await resolvePartnerOrganization(
      prisma,
      req.user.id,
      typeof _requestedOrganizationId === "string" ? _requestedOrganizationId : null
    );

    // Approbation + abonnement + paiement + expiration.
    // `paymentStatus = validated` ne suffit jamais a lui seul.
    assertPartnerSubscription(organization);

    const cleanSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Suffixe unique : deux creations simultanees ne doivent pas entrer en
    // collision sur la contrainte d'unicite du slug, qui masquerait le resultat
    // du controle de quota derriere une erreur 500.
    const uniqueSuffix = `${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
    const finalSlug = `${cleanSlug}-${uniqueSuffix}`;

    const createInTransaction = async () =>
      prisma.$transaction(
        async (tx) => {
          // Quota lu dans la transaction, sur les colonnes stockees de
          // l'organisation. Le catalogue de plans n'est jamais consulte ici.
          const used = await countUsedCommunities(tx, organization.id);
          assertQuotaAvailable("communities", used, organization.quotaCommunitiesMax);

          const newCommunity = await tx.community.create({
            data: {
              name: name.trim(),
              slug: finalSlug,
              description: description || "Espace d'ecoute, de parole et de soutien mutuel.",
              mission:
                mission || "Faciliter le partage d'experiences vecues et le renforcement psychosocial.",
              rules: Array.isArray(rules)
                ? rules
                : ["Confidentialite absolue", "Bienveillance", "Non-jugement"],
              category,
              icon,
              coverImage,
              isPrivate: Boolean(isPrivate),
              organizationId: organization.id,
              status: "active",
            },
            include: {
              organization: {
                select: { id: true, name: true },
              },
            },
          });

          // Le createur devient moderateur du cercle qu'il vient de creer.
          if (req.user?.id) {
            await tx.communityMember.create({
              data: {
                communityId: newCommunity.id,
                userId: req.user.id,
                role: "moderator",
                status: "active",
              },
            });
          }

          return newCommunity;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );

    let newCommunity: Awaited<ReturnType<typeof createInTransaction>> | undefined;
    let lastConflict: unknown = null;

    for (let attempt = 1; attempt <= COMMUNITY_CREATION_ATTEMPTS; attempt += 1) {
      try {
        newCommunity = await createInTransaction();
        break;
      } catch (err) {
        // Un refus de quota ou d'abonnement est definitif : ne pas reessayer.
        if (err instanceof PartnerEntitlementError) throw err;

        // Conflit de transaction : le compteur est relu a la tentative suivante.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034") {
          lastConflict = err;
          continue;
        }
        throw err;
      }
    }

    if (!newCommunity) {
      console.warn("P2034 persistant sur creation de communaute:", lastConflict);
      sendError(
        res,
        "Creation concurrente detectee, aucune place n'a pu etre reservee. Reessayez dans un instant.",
        409,
        "QUOTA_EXCEEDED"
      );
      return;
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        userName: req.user.name || "Partenaire",
        userRole: req.user.role,
        action: "COMMUNITY_CREATED",
        resource: "Community",
        resourceId: newCommunity.id,
        details: `Creation du cercle ${newCommunity.name}`,
        status: "success",
      },
    });

    sendSuccess(res, newCommunity, 201);
  } catch (err) {
    if (err instanceof PartnerEntitlementError) {
      deny(res, err);
      return;
    }
    console.error("Erreur createCommunity:", err);
    sendError(res, "Erreur lors de la creation de la communaute.", 500);
  }
}

/**
 * Détails complets d'un cercle avec facilitateurs et stats.
 */
export async function getCommunity(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de données non connectée.", 503);
    return;
  }

  try {
    const { id } = req.params;

    // Chantier 5 - ni `status` ni `isPrivate` n'etaient filtres : un cercle
    // suspendu, archive ou prive restait entierement lisible par un anonyme.
    // Un slug est d'abord resolu, puis la portee est verifiee.
    const resolved = await prisma.community.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    });
    if (!resolved) {
      sendError(res, "Cercle introuvable.", 404);
      return;
    }

    const readable = await resolveReadableCommunityId(prisma, req.user?.id, resolved.id);
    if (!readable) {
      sendError(res, "Cercle introuvable.", 404, "FORBIDDEN_RESOURCE");
      return;
    }

    const community = await prisma.community.findFirst({
      where: {
        id: readable,
      },
      include: {
        organization: {
          select: {
            id: true,
            slug: true,
            name: true,
            acronym: true,
            logo: true,
            description: true,
            domain: true,
          },
        },
        members: {
          // `status` est filtre : un facilitateur suspendu ou reduit au
          // silence ne doit pas etre presente comme actif.
          where: {
            status: "active",
            role: { in: ["moderator", "peer_helper", "professional"] },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                pseudonym: true,
                avatar: true,
                role: true,
                bio: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
          take: 5,
        },
        _count: {
          select: {
            members: true,
            posts: true,
            campaigns: true,
          },
        },
      },
    });

    if (!community) {
      sendError(res, "Cercle de soutien introuvable.", 404);
      return;
    }

    sendSuccess(res, {
      id: community.id,
      name: community.name,
      slug: community.slug,
      description: community.description,
      mission: community.mission,
      category: community.category,
      icon: community.icon,
      coverImage: community.coverImage,
      rules: community.rules,
      isPrivate: community.isPrivate,
      organization: community.organization,
      facilitators: community.members.map((m) => ({
        id: m.user.id,
        name: m.user.pseudonym || m.user.name,
        avatar: m.user.avatar,
        role: m.role,
        bio: m.user.bio,
      })),
      stats: {
        members: community._count.members,
        posts: community._count.posts,
        campaigns: community._count.campaigns,
      },
    });
  } catch (err) {
    console.error("Erreur getCommunity:", err);
    sendError(res, "Erreur lors de la récupération du cercle.", 500);
  }
}

/**
 * Adhésion d'un membre connecté à un cercle.
 */
export async function joinCommunity(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de données non connectée.", 503);
    return;
  }

  if (!req.user) {
    sendError(res, "Authentification requise pour rejoindre ce cercle.", 401);
    return;
  }

  try {
    const { id } = req.params;

    const community = await prisma.community.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!community) {
      sendError(res, "Cercle de soutien introuvable.", 404);
      return;
    }

    // Chantier 5 - un cercle suspendu n'admet plus d'adhesion.
    if (community.status !== "active") {
      sendError(res, "Cercle introuvable.", 404, "FORBIDDEN_RESOURCE");
      return;
    }

    // Vérification d'adhésion existante
    const existing = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId: req.user.id,
        },
      },
      select: { id: true, communityId: true, userId: true, role: true, status: true, joinedAt: true },
    });

    if (existing) {
      // Chantier 5 - un membre suspendu ou reduit au silence ne recoit plus
      // « vous faites deja partie » : l'API ne doit pas confirmer une adhésion
      // qui est reellement barree.
      if (existing.status === "suspended") {
        sendError(res, "Votre adhesion a ce cercle est suspendue.", 403, "FORBIDDEN_RESOURCE");
        return;
      }
      if (existing.status === "muted") {
        sendError(res, "Vous etes membre de ce cercle, mais votre adhesion est en pause.", 403, "FORBIDDEN_RESOURCE");
        return;
      }
      sendSuccess(res, { message: "Vous faites déjà partie de ce cercle.", member: existing });
      return;
    }

    // Chantier 5 - ces cercles sont fermes sur invitation. L'auto-adhesion
    // par defaut laissait n'importe quel compte authentifie s'inscrire dans
    // le cercle prive de n'importe quelle organisation partenaire.
    if (community.isPrivate) {
      const invitation = await prisma.invitation.findFirst({
        where: { communityId: community.id, status: "active", expiresAt: { gt: new Date() } },
        select: { id: true, maxUses: true, currentUses: true },
      });
      const hasSeat =
        invitation !== null && invitation.currentUses < invitation.maxUses;

      if (!hasSeat) {
        const isManager = await prisma.organizationAdmin.findFirst({
          where: { userId: req.user.id, organizationId: community.organizationId },
          select: { id: true },
        });
        if (!isManager) {
          sendError(
            res,
            "Ce cercle d'entraide est ferme : il rejoint sur invitation.",
            403,
            "FORBIDDEN_RESOURCE"
          );
          return;
        }
      }
    }

    // Chantier 5 - `Organization.quotaMembersMax` est enfin applique. L'adhesion
    // est comptee et verifiee sous transaction SERIALIZABLE, comme les quotas
    // de cercles et de campagnes.
    let member;
    try {
      member = await prisma.$transaction(
        async (tx) => {
          const organization = await tx.organization.findUnique({
            where: { id: community.organizationId },
            select: PARTNER_ORGANIZATION_SELECT,
          });

          if (!organization) {
            throw new PartnerEntitlementError(
              "FORBIDDEN_RESOURCE",
              "Organisation introuvable.",
              404
            );
          }

          assertPartnerSubscription(organization);

          const used = await countUsedMembers(tx, community.organizationId);
          assertQuotaAvailable("members", used, organization.quotaMembersMax);

          return tx.communityMember.create({
            data: {
              communityId: community.id,
              userId: req.user.id,
              role: "member",
              status: "active",
            },
          });
        },
        { isolationLevel: "Serializable" }
      );
    } catch (err) {
      if (err instanceof PartnerEntitlementError) {
        deny(res, err);
        return;
      }
      throw err;
    }

    // Journal d'audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        userName: req.user.name || "Membre",
        userRole: req.user.role,
        action: "COMMUNITY_JOINED",
        resource: "Community",
        resourceId: community.id,
        details: `A rejoint le cercle ${community.name}`,
        status: "success",
      },
    });

    sendSuccess(res, { message: `Bienvenue dans le cercle ${community.name} !`, member }, 201);
  } catch (err) {
    console.error("Erreur joinCommunity:", err);
    sendError(res, "Impossible de rejoindre ce cercle.", 500);
  }
}
