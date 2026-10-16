import { Response } from "express";
import { Prisma } from "@prisma/client";
import { getPrismaClient } from "../config/database.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";
import {
  PartnerEntitlementError,
  assertPartnerSubscription,
  assertQuotaAvailable,
  countUsedCampaignsThisMonth,
  deny,
  resolvePartnerOrganization,
} from "../services/partner-entitlements.service.js";
import {
  buildReadableCommunityFilter,
  resolveReadableCommunityId,
} from "../services/community-access.service.js";

/**
 * Liste des campagnes et défis solidaires.
 */
export async function listCampaigns(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de données non connectée.", 503);
    return;
  }

  try {
    const { communityId, organizationId, status } = req.query;

    // Chantier 5 - `status` venait du client sans liste fermee et ecrasait le
    // defaut : `?status=draft` listait toutes les campagnes non publiees,
    // alors que le modele place `draft` par defaut.
    const PUBLIC_CAMPAIGN_STATUSES = ["active", "completed"];
    const KNOWN_CAMPAIGN_STATUSES = ["draft", "active", "completed", "paused"];
    const requestedStatus =
      status && typeof status === "string" && KNOWN_CAMPAIGN_STATUSES.includes(status)
        ? status
        : null;

    // Les brouillons et campagnes en pause ne sont visibles que de la plateforme.
    const isPlatformStaff =
      req.user?.role === "superadmin" || req.user?.role === "admin" || req.user?.role === "moderator";
    const allowedStatuses =
      requestedStatus && !PUBLIC_CAMPAIGN_STATUSES.includes(requestedStatus) && !isPlatformStaff
        ? PUBLIC_CAMPAIGN_STATUSES
        : requestedStatus
          ? [requestedStatus]
          : PUBLIC_CAMPAIGN_STATUSES;

    // Chantier 5 - une campagne herite de la portee de son cercle : une
    // campagne d'un cercle prive ou suspendu n'est plus listee par defaut.
    const readable = await buildReadableCommunityFilter(prisma, req.user?.id);

    const campaigns = await prisma.campaign.findMany({
      where: {
        community: readable,
        ...(communityId && typeof communityId === "string" && { communityId }),
        ...(organizationId && typeof organizationId === "string" && { organizationId }),
        status: { in: allowedStatuses },
      },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            acronym: true,
            logo: true,
          },
        },
        _count: {
          select: {
            contributions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const formatted = campaigns.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      durationDays: c.durationDays,
      startDate: c.startDate,
      endDate: c.endDate,
      status: c.status,
      targetActivitiesCount: c.targetActivitiesCount,
      completedActivitiesCount: c.completedActivitiesCount,
      rewardBadge: c.rewardBadge,
      activities: c.activities,
      community: c.community,
      organization: c.organization,
      contributionsCount: c._count.contributions,
      createdAt: c.createdAt,
    }));

    sendSuccess(res, formatted);
  } catch (err) {
    console.error("Erreur listCampaigns:", err);
    sendError(res, "Impossible de charger les campagnes.", 500);
  }
}

/**
 * Détails complets d'une campagne avec contributions récentes.
 */
export async function getCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de données non connectée.", 503);
    return;
  }

  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        community: true,
        // Chantier 5 - `organization: true` renvoyait la ligne `Organization`
        // entiere : `contactEmail`, `contactPhone`, `address`, `responsibleName`,
        // `paymentStatus`, `subscriptionPlan` et les trois quotas etaient
        // devolvus a tout appelant anonyme. Le projet avait deja interdit ces
        // champs dans `organization-dto.ts`. La selection est donc explicite.
        organization: {
          select: {
            id: true,
            name: true,
            acronym: true,
            logo: true,
          },
        },
        contributions: {
          orderBy: { createdAt: "desc" },
          take: 30,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                pseudonym: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: { contributions: true },
        },
      },
    });

    if (!campaign) {
      sendError(res, "Campagne solidaire introuvable.", 404);
      return;
    }

    // Chantier 5 - la portee du cercle s'applique aussi a la lecture d'une
    // campagne, et les etats non publies restent reserves a la plateforme.
    const readable = await resolveReadableCommunityId(
      prisma,
      req.user?.id,
      campaign.communityId
    );
    const isPlatformStaff =
      req.user?.role === "superadmin" || req.user?.role === "admin" || req.user?.role === "moderator";

    if (!readable || (!isPlatformStaff && !["active", "completed"].includes(campaign.status))) {
      sendError(res, "Campagne solidaire introuvable.", 404, "FORBIDDEN_RESOURCE");
      return;
    }

    // Chantier 5 - le cercle entier n'est pas renvoye : `community: true`
    // exposait `mission`, `rules` et `organizationId` d'un cercle ferme.
    const { community: fullCommunity, _count, ...rest } = campaign;

    sendSuccess(res, {
      ...rest,
      community: {
        id: fullCommunity.id,
        name: fullCommunity.name,
        slug: fullCommunity.slug,
        icon: fullCommunity.icon,
      },
      contributionsCount: _count.contributions,
      contributions: campaign.contributions.map((cb) => ({
        id: cb.id,
        authorName: cb.isAnonymous ? "Participant Solidaire" : (cb.user?.pseudonym || cb.authorName),
        authorAvatar: cb.isAnonymous ? null : (cb.user?.avatar || cb.authorAvatar),
        message: cb.message,
        activityTitle: cb.activityTitle,
        isAnonymous: cb.isAnonymous,
        createdAt: cb.createdAt,
      })),
    });
  } catch (err) {
    console.error("Erreur getCampaign:", err);
    sendError(res, "Erreur lors de la récupération de la campagne.", 500);
  }
}

/**
 * Nombre de tentatives en cas de conflit de transaction (P2034).
 * Voir la section « Tests de concurrence » du rapport pour la limite
 * residuelle du controle de quota mensuel, assumee et documentee.
 */
const CAMPAIGN_CREATION_ATTEMPTS = 3;

/**
 * Creation d'une nouvelle campagne par une organisation.
 *
 * Meme regle que pour les communautes : l'organisation est DERIVEE de
 * l'identite serveur (JWT -> User -> OrganizationAdmin -> Organization), jamais
 * lue dans le corps de la requete. `req.body.organizationId` est volontairement
 * absent du `destructure`.
 *
 * `communityId` reste accepte depuis la requete : c'est une ressource
 * selectionnee par le partenaire. Mais son existence ne suffit pas : le backend
 * verifie imperativement que `community.organizationId` correspond a
 * l'organisation resolue, sinon la requete est rejetee en 404.
 */
export async function createCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de données non connectée.", 503);
    return;
  }

  if (!req.user) {
    sendError(res, "Authentification requise.", 401);
    return;
  }

  try {
    const {
      communityId,
      title,
      description,
      category,
      durationDays = 14,
      targetActivitiesCount = 5,
      rewardBadge,
      activities = [],
      // `organizationId` n'est volontairement pas lu. L'organisation vient
      // exclusivement de l'identite serveur.
      organizationId: _organizationFromClient,
    } = req.body;

    if (!communityId || !title || !description || !category) {
      sendError(res, "Tous les champs obligatoires doivent être renseignés.", 400);
      return;
    }

    const organization = await resolvePartnerOrganization(
      prisma,
      req.user.id,
      typeof _organizationFromClient === "string" ? _organizationFromClient : null
    );

    // Approbation + abonnement defini + paiement valide + non expire.
    assertPartnerSubscription(organization);

    // La communaute existe-t-elle ET appartient-elle a cette organisation ?
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: { id: true, name: true, organizationId: true },
    });

    if (!community || community.organizationId !== organization.id) {
      sendError(
        res,
        "Cercle de soutien introuvable pour votre organisation.",
        404,
        "FORBIDDEN_RESOURCE"
      );
      return;
    }

    const createInTransaction = async () =>
      prisma.$transaction(
        async (tx) => {
          // Quota MENSUEL : borne au mois civil courant, scope a l'organisation.
          const used = await countUsedCampaignsThisMonth(tx, organization.id);
          assertQuotaAvailable("campaignsPerMonth", used, organization.quotaCampaignsMax);

          return tx.campaign.create({
            data: {
              organizationId: organization.id,
              communityId: community.id,
              title: title.trim(),
              description: description.trim(),
              category,
              durationDays: Number(durationDays) || 14,
              targetActivitiesCount: Number(targetActivitiesCount) || 5,
              rewardBadge: rewardBadge || "badge_serenite",
              activities: activities,
              status: "active",
              startDate: new Date(),
            },
            include: {
              community: { select: { name: true } },
              organization: { select: { name: true } },
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );

    let campaign: Awaited<ReturnType<typeof createInTransaction>> | undefined;
    let lastConflict: unknown = null;

    for (let attempt = 1; attempt <= CAMPAIGN_CREATION_ATTEMPTS; attempt += 1) {
      try {
        campaign = await createInTransaction();
        break;
      } catch (err) {
        if (err instanceof PartnerEntitlementError) throw err;

        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034") {
          lastConflict = err;
          continue;
        }
        throw err;
      }
    }

    if (!campaign) {
      console.warn("P2034 persistant sur creation de campagne:", lastConflict);
      sendError(
        res,
        "Création concurrente détectée, aucune place n'a pu être réservée. Réessayez dans un instant.",
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
        action: "CAMPAIGN_CREATED",
        resource: "Campaign",
        resourceId: campaign.id,
        details: `Création de la campagne ${campaign.title}`,
        status: "success",
      },
    });

    sendSuccess(res, campaign, 201);
  } catch (err) {
    if (err instanceof PartnerEntitlementError) {
      deny(res, err);
      return;
    }
    console.error("Erreur createCampaign:", err);
    sendError(res, "Erreur lors de la création de la campagne.", 500);
  }
}

/**
 * Contribution à une campagne (réalisation d'un défi, partage d'encouragement).
 */
export async function contributeToCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de données non connectée.", 503);
    return;
  }

  if (!req.user) {
    sendError(res, "Authentification requise pour contribuer.", 401);
    return;
  }

  try {
    const { id } = req.params;
    const { message, activityTitle, isAnonymous = false } = req.body;

    if (!message || message.trim().length === 0) {
      sendError(res, "Un message ou témoignage de participation est requis.", 400);
      return;
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: {
        id: true,
        communityId: true,
        status: true,
        completedActivitiesCount: true,
        targetActivitiesCount: true,
      },
    });

    if (!campaign) {
      sendError(res, "Campagne introuvable.", 404);
      return;
    }

    // Chantier 5 - aucune condition d'etat n'etait verifiee : la contribution
    // incrementait le compteur de n'importe quelle campagne, y compris en
    // `draft`, `paused` ou `completed`, et au-dela de l'objectif fixe.
    if (campaign.status !== "active") {
      sendError(res, "Cette campagne n'accepte plus de contribution.", 409, "FORBIDDEN_RESOURCE");
      return;
    }

    if (campaign.completedActivitiesCount >= campaign.targetActivitiesCount) {
      sendError(
        res,
        "L'objectif de cette campagne est atteint.",
        409,
        "FORBIDDEN_RESOURCE"
      );
      return;
    }

    // La contribution reste dans la portee du cercle de la campagne.
    const readable = await resolveReadableCommunityId(prisma, req.user.id, campaign.communityId);
    if (!readable) {
      sendError(res, "Campagne introuvable.", 404, "FORBIDDEN_RESOURCE");
      return;
    }

    const contribution = await prisma.$transaction(async (tx) => {
      const created = await tx.campaignContribution.create({
        data: {
          campaignId: campaign.id,
          // Une contribution anonyme ne porte plus de cle vers son auteur.
          userId: isAnonymous ? null : req.user!.id,
          authorName: req.user!.name || "Participant",
          authorAvatar: req.user!.avatar ?? null,
          message: message.trim().slice(0, 2000),
          activityTitle: activityTitle ? activityTitle.trim().slice(0, 200) : null,
          isAnonymous: Boolean(isAnonymous),
        },
      });

      // Incrémentation du compteur de participation
      await tx.campaign.update({
        where: { id: campaign.id },
        data: {
          completedActivitiesCount: { increment: 1 },
        },
      });

      // Bonus points de solidarité pour l'utilisateur
      await tx.user.update({
        where: { id: req.user!.id },
        data: {
          points: { increment: 15 },
          completedCampaigns: { increment: 1 },
        },
      });

      return created;
    });

    // La ligne brute n'est plus renvoyee : pour une contribution anonyme elle
    // porterait l'identifiant que l'interface vient de masquer.
    sendSuccess(
      res,
      {
        id: contribution.id,
        campaignId: contribution.campaignId,
        message: contribution.message,
        activityTitle: contribution.activityTitle,
        isAnonymous: contribution.isAnonymous,
        createdAt: contribution.createdAt,
      },
      201
    );
  } catch (err) {
    console.error("Erreur contributeToCampaign:", err);
    sendError(res, "Erreur lors de l'enregistrement de votre participation.", 500);
  }
}
