import { Response } from "express";
import { getPrismaClient } from "../config/database.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";
import {
  PUBLIC_ORGANIZATION_SELECT,
  PARTNER_ORGANIZATION_SELECT,
  toPublicOrganization,
  toPartnerOrganization,
} from "../services/organization-dto.js";
import {
  generateUniqueOrganizationSlug,
} from "../services/public-profile.service.js";
import {
  PartnerEntitlementError,
  applySubscriptionChange,
  countUsedCampaignsThisMonth,
  countUsedCommunities,
  describeEntitlements,
  isKnownPaymentStatus,
  isOrganizationManager,
  deny,
  currentCivilMonthWindow,
} from "../services/partner-entitlements.service.js";
import { planDefaults, isKnownPartnerPlan } from "../../shared/partner-plans.js";

/**
 * Liste des organisations partenaires approuvees ou en attente.
 */
export async function listOrganizations(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de donnees non connectee.", 503);
    return;
  }

  try {
    const { status, type, search } = req.query;

    const isSuperAdmin = req.user && req.user.role === "superadmin";

    // Si non-admin, on ne renvoie que les organisations approuvees
    const statusFilter = isSuperAdmin && status && typeof status === "string"
      ? status
      : "approved";

    const organizations = await prisma.organization.findMany({
      where: {
        status: statusFilter,
        ...(type && typeof type === "string" && { type }),
        ...(search && typeof search === "string" && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { domain: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      select: {
        ...PUBLIC_ORGANIZATION_SELECT,
        communities: {
          // Seuls les cercles effectivement publics comptent dans le profil
          // public : un compteur de cercle ferme est deja une information
          // sensible sur l'activite d'une organisation.
          where: { status: "active", isPrivate: false },
          select: { id: true },
        },
        campaigns: {
          where: { status: "active" },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = organizations.map((org) =>
      toPublicOrganization(org, {
        numberOfActiveCampaigns: org.campaigns.length,
        numberOfPublicCommunities: org.communities.length,
      })
    );

    sendSuccess(res, formatted);
  } catch (err) {
    console.error("Erreur listOrganizations:", err);
    sendError(res, "Impossible de recuperer les organisations.", 500);
  }
}

/**
 * Profil PUBLIC d'une organisation approuvee.
 *
 * Le modele Prisma brut n'est jamais renvoye : tout passe par
 * `toPublicOrganization()`. Une organisation non approuvee est invisible (404),
 * donc une candidature en attente ne peut pas etre devinee.
 */
export async function getOrganization(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de donnees non connectee.", 503);
    return;
  }

  try {
    const { id } = req.params;

    // Chantier 5 - un slug ou un ID peut designer l'organisation. On resout
    // d'abord, puis on verifie le statut pour ne pas reveler l'existence.
    const resolved = await prisma.organization.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    });
    if (!resolved) {
      sendError(res, "Organisation introuvable.", 404, "FORBIDDEN_RESOURCE");
      return;
    }

    const organization = await prisma.organization.findUnique({
      where: { id: resolved.id },
      select: PUBLIC_ORGANIZATION_SELECT,
    });

    if (!organization || organization.status !== "approved") {
      sendError(res, "Organisation introuvable.", 404, "FORBIDDEN_RESOURCE");
      return;
    }

    const [communities, campaigns] = await Promise.all([
      prisma.community.count({
        where: { organizationId: resolved.id, status: "active", isPrivate: false },
      }),
      prisma.campaign.count({ where: { organizationId: resolved.id, status: "active" } }),
    ]);

    sendSuccess(
      res,
      toPublicOrganization(organization, {
        numberOfActiveCampaigns: campaigns,
        numberOfPublicCommunities: communities,
      })
    );
  } catch (err) {
    console.error("Erreur getOrganization:", err);
    sendError(res, "Erreur lors de la recuperation de l'organisation.", 500);
  }
}

/**
 * Profil de GESTION d'une organisation : quotas reels, abonnement, contacts.
 *
 * Reserve aux administrateurs de cette organisation (`OrganizationAdmin`) et
 * au superadmin. Pour tout autre appelant la reponse est 404 et non 403, afin
 * que cet endpoint ne serve pas d'oracle d'existence.
 */
export async function getOrganizationManage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de donnees non connectee.", 503);
    return;
  }

  if (!req.user) {
    sendError(res, "Authentification requise.", 401);
    return;
  }

  try {
    const { id } = req.params;

    const organization = await prisma.organization.findUnique({
      where: { id },
      select: PARTNER_ORGANIZATION_SELECT,
    });

    if (!organization) {
      sendError(res, "Organisation introuvable.", 404, "FORBIDDEN_RESOURCE");
      return;
    }

    const isSuperAdmin = req.user.role === "superadmin";
    const isManager = isSuperAdmin || (await isOrganizationManager(prisma, req.user.id, id));

    if (!isManager) {
      // 404 volontaire : ne pas reveler l'existence d'une ressource.
      sendError(res, "Organisation introuvable.", 404, "FORBIDDEN_RESOURCE");
      return;
    }

    const now = new Date();
    const [communities, campaignsThisMonth, members] = await Promise.all([
      countUsedCommunities(prisma, id),
      countUsedCampaignsThisMonth(prisma, id, now),
      prisma.communityMember.count({
        where: { community: { organizationId: id }, status: "active" },
      }),
    ]);

    const entitlements = describeEntitlements(organization, { communities, campaignsThisMonth }, now);

    sendSuccess(
      res,
      toPartnerOrganization(
        organization,
        { communities, campaignsThisMonth, members },
        {
          canPerformSubscriptionActions: entitlements.canPerformSubscriptionActions,
          blockedBy: entitlements.blockedBy,
          expired: entitlements.subscription.expired,
          paymentValidated: entitlements.subscription.paymentValidated,
        },
        now
      )
    );
  } catch (err) {
    console.error("Erreur getOrganizationManage:", err);
    sendError(res, "Erreur lors de la recuperation du profil de gestion.", 500);
  }
}

/**
 * Depot d'une demande de partenariat pour une ONG ou un centre de sante.
 *
 * C'est une CANDIDATURE PUBLIQUE : elle reste accessible sans authentification,
 * comme auparavant. En revanche, la requete cliente ne peut plus choisir :
 *
 *   - `status`                    -> impose `pending`
 *   - `subscriptionPlan`          -> impose `basic`
 *   - `quotaCommunitiesMax`       -> impose la valeur `basic` du catalogue
 *   - `quotaMembersMax`           -> idem
 *   - `quotaCampaignsMax`         -> idem
 *   - `paymentStatus`             -> impose `pending`
 *   - `subscriptionStartedAt`     -> impose NULL
 *
 * L'approbation et l'attribution finale des quotas restent des operations
 * administratives.
 */
export async function createOrganization(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de donnees non connectee.", 503);
    return;
  }

  try {
    const {
      name,
      acronym,
      domain,
      mission,
      description,
      type = "ong",
      country,
      city,
      address,
      responsibleName,
      responsibleTitle,
      contactEmail,
      contactPhone,
      // Volontairement NON destructures ci-dessous :
      // `status`, `subscriptionPlan`, `quota*`, `paymentStatus`,
      // `subscriptionStartedAt` et `subscriptionExpiresAt` sont ignores.
    } = req.body;

    if (!name || !domain || !mission || !contactEmail || !contactPhone || !responsibleName) {
      sendError(res, "Tous les champs legaux obligatoires doivent etre renseignes.", 400);
      return;
    }

    // Valeurs par defaut de la formule d'entree. Elles servent a la
    // configuration de la candidature, jamais a une autorisation : l'octroi
    // reel des droits passe uniquement par une decision administrative.
    const defaults = planDefaults("basic");

    // Chantier 8.5 - le slug public est genere côté serveur à partir du nom.
    // Il est stable et unique ; un changement de nom ne le recrée pas.
    const slug = await generateUniqueOrganizationSlug(name);

    const organization = await prisma.organization.create({
      data: {
        name: name.trim(),
        slug,
        acronym: acronym ? acronym.trim().toUpperCase() : null,
        domain: domain.trim(),
        mission: mission.trim(),
        description: description ? description.trim() : mission.trim(),
        type,
        country: country || "RDC",
        city: city || "Kinshasa",
        address: address ? address.trim() : null,
        responsibleName: responsibleName.trim(),
        responsibleTitle: responsibleTitle ? responsibleTitle.trim() : null,
        contactEmail: contactEmail.trim().toLowerCase(),
        contactPhone: contactPhone.trim(),
        // Impose par le serveur.
        status: "pending",
        subscriptionPlan: "basic",
        quotaCommunitiesMax: defaults.quotaCommunitiesMax,
        quotaMembersMax: defaults.quotaMembersMax,
        quotaCampaignsMax: defaults.quotaCampaignsMax,
        paymentStatus: "pending",
        subscriptionStartedAt: null,
        subscriptionExpiresAt: null,
      },
    });

    // Journal d'audit
    await prisma.auditLog.create({
      data: {
        userName: responsibleName,
        userRole: "applicant",
        action: "ORGANIZATION_APPLICATION_SUBMITTED",
        resource: "Organization",
        resourceId: organization.id,
        details: `Candidature de l'organisation ${name} (${domain}) deposee.`,
        status: "success",
      },
    });

    sendSuccess(
      res,
      {
        message:
          "Votre demande de partenariat a ete enregistree avec succes. Notre equipe d'agrement vous contactera sous 48h.",
        organization,
      },
      201
    );
  } catch (err) {
    console.error("Erreur createOrganization:", err);
    sendError(res, "Erreur lors de la creation de la demande de partenariat.", 500);
  }
}

/**
 * Mise a jour du statut d'une organisation et de son abonnement.
 *
 * Autorisation : `requireAuth` + `requireRole(["superadmin"])` dans les routes.
 * Le controleur ne teste PLUS `req.user.role` : la relecture en base du
 * role et de `isSuspended` est faite une seule fois, par le middleware.
 *
 * L'approbation n'active pas l'abonnement : il faut `activateSubscription`
 * pour demarrer l'abonnement. Aucun paiement n'est simule : sans
 * `paymentStatus` explicite, la valeur reste `pending`.
 */
export async function updateOrganizationStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de donnees non connectee.", 503);
    return;
  }

  if (!req.user) {
    sendError(res, "Authentification requise.", 401);
    return;
  }

  try {
    const { id } = req.params;
    const {
      status,
      subscriptionPlan,
      quotaCommunitiesMax,
      quotaMembersMax,
      quotaCampaignsMax,
      paymentStatus,
      activateSubscription,
      subscriptionMonths,
    } = req.body;

    if (subscriptionPlan !== undefined && !isKnownPartnerPlan(subscriptionPlan)) {
      sendError(res, `Formule inconnue : ${subscriptionPlan}.`, 400);
      return;
    }

    if (paymentStatus !== undefined && paymentStatus !== null && !isKnownPaymentStatus(paymentStatus)) {
      sendError(res, `Etat de paiement inconnu : ${paymentStatus}.`, 400);
      return;
    }

    const existing = await prisma.organization.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      sendError(res, "Organisation introuvable.", 404, "FORBIDDEN_RESOURCE");
      return;
    }

    const data: Record<string, unknown> = {};

    if (status) {
      data.status = status;
    }
    if (status === "approved") {
      data.validatedAt = new Date();
    }

    if (subscriptionPlan !== undefined) {
      // `applySubscriptionChange` remet `paymentStatus` a `pending` si aucun
      // etat n'est fourni : un changement de formule n'herite jamais d'un
      // ancien `validated`.
      const change = applySubscriptionChange({
        subscriptionPlan,
        quotaCommunitiesMax,
        quotaMembersMax,
        quotaCampaignsMax,
        paymentStatus,
        startSubscription: Boolean(activateSubscription),
      });
      Object.assign(data, change);
    } else {
      // Adjustment de quotas ou de paiement sans changement de formule.
      // L'etat de paiement n'est touche que si un superadmin l'a fourni.
      if (quotaCommunitiesMax !== undefined && quotaCommunitiesMax !== null) {
        data.quotaCommunitiesMax = Number(quotaCommunitiesMax);
      }
      if (quotaMembersMax !== undefined && quotaMembersMax !== null) {
        data.quotaMembersMax = Number(quotaMembersMax);
      }
      if (quotaCampaignsMax !== undefined && quotaCampaignsMax !== null) {
        data.quotaCampaignsMax = Number(quotaCampaignsMax);
      }
      if (paymentStatus !== undefined) {
        data.paymentStatus = paymentStatus;
      }
      if (activateSubscription) {
        data.subscriptionStartedAt = new Date();
      }
    }

    if (activateSubscription) {
      const months = Number(subscriptionMonths);
      if (Number.isFinite(months) && months > 0 && months <= 120) {
        const expires = new Date();
        expires.setMonth(expires.getMonth() + Math.floor(months));
        data.subscriptionExpiresAt = expires;
      }
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: data as Parameters<typeof prisma.organization.update>[0]["data"],
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        userName: req.user.name || "SuperAdmin",
        userRole: "superadmin",
        action: "ORGANIZATION_STATUS_UPDATED",
        resource: "Organization",
        resourceId: id,
        details: `Statut de l'organisation mis a jour : ${status || updated.status}`,
        status: "success",
      },
    });

    sendSuccess(res, updated);
  } catch (err) {
    if (err instanceof PartnerEntitlementError) {
      deny(res, err);
      return;
    }
    console.error("Erreur updateOrganizationStatus:", err);
    sendError(res, "Erreur lors de la mise a jour de l'organisation.", 500);
  }
}

/**
 * Demande de changement de formule par un partenaire.
 *
 * Aucun paiement n'est simule et aucun prestataire de paiement n'est invente :
 * le projet n'en possede pas. Cette route ne change donc NI la formule, NI les
 * quotas, NI l'etat de paiement. Elle enregistre l'INTENTION dans le journal
 * d'audit, qui est le seul endroit ou une demande peut etre tracee sans
 * ajouter de modele.
 *
 * Consequence : `subscription selected` ne devient jamais
 * `subscription active`. Le passage a l'etat actif passe uniquement par la
 * route superadmin `PUT /:id/status`, qui doit fournir explicitement
 * `paymentStatus`, `subscriptionExpiresAt` et `activateSubscription`.
 */
export async function requestSubscriptionChange(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de donnees non connectee.", 503);
    return;
  }

  if (!req.user) {
    sendError(res, "Authentification requise.", 401);
    return;
  }

  try {
    const { id } = req.params;
    const { requestedPlan } = req.body ?? {};

    if (!isKnownPartnerPlan(requestedPlan)) {
      sendError(res, `Formule inconnue : ${requestedPlan}.`, 400);
      return;
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
      select: PARTNER_ORGANIZATION_SELECT,
    });

    if (!organization) {
      sendError(res, "Organisation introuvable.", 404, "FORBIDDEN_RESOURCE");
      return;
    }

    if (!(await isOrganizationManager(prisma, req.user.id, id))) {
      sendError(res, "Organisation introuvable.", 404, "FORBIDDEN_RESOURCE");
      return;
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        userName: req.user.name || "Partenaire",
        userRole: req.user.role,
        action: "PARTNER_SUBSCRIPTION_CHANGE_REQUESTED",
        resource: "Organization",
        resourceId: id,
        details:
          `Demande de changement de formule vers « ${requestedPlan} » pour ` +
          `${organization.name} (formule actuelle : ${organization.subscriptionPlan}). ` +
          `Aucun changement applique : le paiement doit etre valide par la plateforme.`,
        status: "pending",
      },
    });

    sendSuccess(res, {
      message:
        "Votre demande de changement de formule a ete transmise a la plateforme. " +
        "Elle ne modifie ni vos quotas ni votre abonnement tant que le paiement n'a pas ete valide.",
      requestedPlan,
      currentPlan: organization.subscriptionPlan,
      subscriptionUnchanged: true,
    });
  } catch (err) {
    console.error("Erreur requestSubscriptionChange:", err);
    sendError(res, "Erreur lors de l'enregistrement de la demande.", 500);
  }
}

/**
 * Organizations reellement gerees par l'appelant.
 *
 * Source unique : la table `OrganizationAdmin`. Le client ne fournit jamais la
 * liste : il ne fait que choisir parmi celles-ci, et toute organisation choisie
 * est reverifiee cote serveur a chaque mutation.
 */
export async function listMyManagedOrganizations(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de donnees non connectee.", 503);
    return;
  }

  if (!req.user) {
    sendError(res, "Authentification requise.", 401);
    return;
  }

  try {
    const links = await prisma.organizationAdmin.findMany({
      where: { userId: req.user.id },
      select: {
        role: true,
        organization: {
          select: {
            id: true,
            name: true,
            acronym: true,
            logo: true,
            status: true,
            subscriptionPlan: true,
            planId: true,
            quotaCommunitiesMax: true,
            quotaMembersMax: true,
            quotaCampaignsMax: true,
            subscriptionStartedAt: true,
            subscriptionExpiresAt: true,
            paymentStatus: true,
            demoUsed: true,
            demoStartedAt: true,
            demoExpiresAt: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const now = new Date();
    const { gte, lt } = currentCivilMonthWindow(now);

    const payload = await Promise.all(
      links.map(async (link) => {
        const org = link.organization;
        const [communities, campaignsThisMonth] = await Promise.all([
          prisma.community.count({ where: { organizationId: org.id } }),
          prisma.campaign.count({ where: { organizationId: org.id, startDate: { gte, lt } } }),
        ]);

        const entitlements = describeEntitlements(
          org as Parameters<typeof describeEntitlements>[0],
          { communities, campaignsThisMonth },
          now
        );

        return {
          id: org.id,
          name: org.name,
          acronym: org.acronym,
          logo: org.logo,
          partnerRole: link.role,
          status: org.status,
          subscriptionPlan: org.subscriptionPlan,
          paymentStatus: org.paymentStatus,
          subscriptionExpiresAt: org.subscriptionExpiresAt
            ? org.subscriptionExpiresAt.toISOString()
            : null,
          canPerformSubscriptionActions: entitlements.canPerformSubscriptionActions,
          blockedBy: entitlements.blockedBy,
          quotas: entitlements.quotas,
        };
      })
    );

    sendSuccess(res, payload);
  } catch (err) {
    console.error("Erreur listMyManagedOrganizations:", err);
    sendError(res, "Erreur lors de la recuperation de vos organisations.", 500);
  }
}
