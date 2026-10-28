/**
 * Back Office central : operations d'administration reservees au serveur.
 *
 * Regle de conception : ce controleur ne lit JAMAIS un role, une adresse email ou
 * un identifiant d'organisation envoye par le client comme source d'autorisation.
 * `requireAuth` + `requireRole` ont deja verifie le JWT et relu le role courant en
 * base ; ici on ne fait qu'appliquer l'action et journaliser.
 */
import { Response } from "express";
import { getPrismaClient } from "../config/database.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { isKnownPartnerPlan } from "../../shared/partner-plans.js";
import { Decimal } from "@prisma/client/runtime/library.js";
import { sendValidationEmail } from "../services/email.service.js";

/** Roles acceptes par la validation d'une ressource. */
const ORGANIZATION_STATUSES = new Set([
  "pending",
  "under_review",
  "approved",
  "rejected",
  "suspended",
]);
const COMMUNITY_STATUSES = new Set(["active", "suspended", "archived"]);
const CAMPAIGN_STATUSES = new Set(["draft", "active", "completed", "paused"]);

/** Roles que le back-office peut attribuer. Liste fermee cote serveur. */
const ASSIGNABLE_ROLES = new Set([
  "member",
  "peer_helper",
  "professional",
  "moderator",
  "partner_admin",
  "admin",
  "superadmin",
]);

type Actor = NonNullable<AuthenticatedRequest["user"]>;

function currentActor(req: AuthenticatedRequest): Actor {
  return req.user as Actor;
}

async function writeAuditLog(
  actor: Actor,
  entry: {
    action: string;
    resource: string;
    resourceId?: string | null;
    details: string;
    status?: string;
    ipAddress?: string | null;
  }
): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) return;

  try {
    await prisma.auditLog.create({
      data: {
        userId: actor.id,
        userName: actor.name || actor.email || actor.id,
        userRole: actor.role,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId ?? null,
        details: entry.details,
        status: entry.status ?? "success",
        ipAddress: entry.ipAddress ?? null,
      },
    });
  } catch {
    // Le journal ne doit jamais faire echouer l'action metier deja acceptee.
  }
}

/**
 * GET /api/admin/overview
 * Compteurs du tableau de bord. Reserve aux administrateurs.
 */
export async function getAdminOverview(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "La base de donnees n'est pas encore connectee.", 503);
    return;
  }

  try {
    const [users, suspendedUsers, organizations, communities, campaigns, reports, logs] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isSuspended: true } }),
        prisma.organization.count(),
        prisma.community.count(),
        prisma.campaign.count(),
        prisma.moderationReport.count({ where: { status: { in: ["pending", "under_review"] } } }),
        prisma.auditLog.count(),
      ]);

    sendSuccess(res, {
      users,
      suspendedUsers,
      organizations,
      communities,
      campaigns,
      pendingReports: reports,
      auditLogs: logs,
    });
  } catch {
    sendError(res, "Impossible de charger les statistiques de la plateforme.", 500);
  }
}

/**
 * GET /api/admin/users
 * Liste paginee des comptes. Les mots de passe ne sont jamais renvoyes.
 */
export async function listAdminUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "La base de donnees n'est pas encore connectee.", 503);
    return;
  }

  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const role = typeof req.query.role === "string" ? req.query.role.trim() : "";
    const scope = typeof req.query.scope === "string" ? req.query.scope.trim() : "";

    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(scope === "suspended" ? { isSuspended: true } : {}),
        ...(scope === "active" ? { isSuspended: false } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { pseudonym: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        pseudonym: true,
        role: true,
        memberStatus: true,
        isSuspended: true,
        avatar: true,
        city: true,
        country: true,
        points: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    sendSuccess(res, users);
  } catch {
    sendError(res, "Impossible de charger la liste des utilisateurs.", 500);
  }
}

/**
 * PUT /api/admin/users/:id/access
 * Modifie le role et/ou la suspension d'un compte.
 *
 * Deux garde-fous serveur, independants de ce qu'envoie le client :
 *  - un administrateur ne peut pas retirer son propre acces (evite le verrouillage) ;
 *  - un changement de role exige `superadmin`, reserve a la direction de la plateforme.
 */
export async function updateUserAccess(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "La base de donnees n'est pas encore connectee.", 503);
    return;
  }

  const actor = currentActor(req);
  const targetId = req.params.id;
  const { role, isSuspended } = req.body ?? {};

  if (typeof role !== "string" && typeof isSuspended !== "boolean") {
    sendError(res, "Aucun changement d'acces valide n'a ete demande.", 400);
    return;
  }

  if (typeof role === "string" && !ASSIGNABLE_ROLES.has(role)) {
    sendError(res, "Role inconnu. Ce role ne peut pas etre attribue.", 400);
    return;
  }

  if (role !== undefined && actor.role !== "superadmin") {
    sendError(
      res,
      "Seul un super administrateur peut modifier le role d'un compte.",
      403
    );
    return;
  }

  if (targetId === actor.id && (isSuspended === true || (role !== undefined && role !== actor.role))) {
    sendError(
      res,
      "Vous ne pouvez pas retirer vos propres droits d'acces administrateur.",
      400
    );
    return;
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, role: true, isSuspended: true, email: true },
    });

    if (!target) {
      sendError(res, "Utilisateur introuvable.", 404);
      return;
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: {
        ...(role !== undefined ? { role } : {}),
        ...(typeof isSuspended === "boolean" ? { isSuspended } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        pseudonym: true,
        role: true,
        memberStatus: true,
        isSuspended: true,
      },
    });

    await writeAuditLog(actor, {
      action: role !== undefined ? "admin.user.role_changed" : "admin.user.suspension_changed",
      resource: "User",
      resourceId: targetId,
      details:
        role !== undefined
          ? `Role : ${target.role} -> ${role}`
          : `Suspension : ${target.isSuspended} -> ${isSuspended}`,
      ipAddress: req.ip,
    });

    sendSuccess(res, updated);
  } catch {
    sendError(res, "Impossible de mettre a jour les droits de cet utilisateur.", 500);
  }
}

/**
 * PUT /api/admin/organizations/:id/status
 * Validation, mise sous examen ou suspension d'une organisation partenaire.
 */
export async function updateOrganizationStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "La base de donnees n'est pas encore connectee.", 503);
    return;
  }

  const actor = currentActor(req);
  const { status, subscriptionPlan, invitationCode } = req.body ?? {};

  if (typeof status !== "string" || !ORGANIZATION_STATUSES.has(status)) {
    sendError(res, "Statut d'organisation invalide.", 400);
    return;
  }

  if (subscriptionPlan !== undefined && !isKnownPartnerPlan(subscriptionPlan)) {
    sendError(res, `Formule inconnue : ${subscriptionPlan}.`, 400);
    return;
  }

  try {
    const existing = await prisma.organization.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, status: true, contactEmail: true },
    });
    if (!existing) {
      sendError(res, "Organisation introuvable.", 404);
      return;
    }

    // Chantier 5 - la route back-office NE VALIDE AUCUN PAIEMENT. Le seul
    // chemin d'activation reste `PUT /api/organizations/:id/status` avec
    // `paymentStatus` + `activateSubscription` explicites. Toute entree dans
    // l'etat `approved` doit donc repartir de `pending` et sans abonnement
    // demarre, sinon une re-approbation heriterait d'un `validated` antérieur.
    const isFreshApproval = status === "approved" && existing.status !== "approved";

    const updated = await prisma.organization.update({
      where: { id: req.params.id },
      data: {
         status,
         ...(typeof subscriptionPlan === "string" ? { subscriptionPlan } : {}),
         ...(typeof subscriptionPlan === "string" || isFreshApproval
           ? { paymentStatus: "pending", subscriptionStartedAt: null }
           : {}),
         ...(isFreshApproval ? { validatedAt: new Date(), isVerified: true } : {}),
         ...(typeof invitationCode === "string" && invitationCode.trim()
           ? { invitationCode: invitationCode.trim() }
           : {}),
       },
      select: {
        id: true,
        name: true,
        status: true,
        subscriptionPlan: true,
        paymentStatus: true,
        validatedAt: true,
      },
    });

    await writeAuditLog(actor, {
      action: "admin.organization.status_changed",
      resource: "Organization",
      resourceId: req.params.id,
      details: `${existing.name} : ${existing.status} -> ${status}`,
      ipAddress: req.ip,
    });

    if (typeof invitationCode === "string" && invitationCode.trim() && existing.contactEmail) {
      await sendValidationEmail({
        to: existing.contactEmail,
        subject: `Validation de votre organisation ${existing.name} - Code d'invitation`,
        body: `Votre organisation ${existing.name} a ete validee. Code d'invitation: ${invitationCode.trim()}`,
      });
    }

    sendSuccess(res, updated);
  } catch {
    sendError(res, "Impossible de mettre a jour le statut de l'organisation.", 500);
  }
}

/**
 * PUT /api/admin/communities/:id/status
 * Activation, suspension ou archivage d'un cercle de soutien.
 */
export async function updateCommunityStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "La base de donnees n'est pas encore connectee.", 503);
    return;
  }

  const actor = currentActor(req);
  const { status } = req.body ?? {};

  if (typeof status !== "string" || !COMMUNITY_STATUSES.has(status)) {
    sendError(res, "Statut de cercle invalide.", 400);
    return;
  }

  try {
    const existing = await prisma.community.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, status: true },
    });
    if (!existing) {
      sendError(res, "Cercle introuvable.", 404);
      return;
    }

    const updated = await prisma.community.update({
      where: { id: req.params.id },
      data: { status },
      select: { id: true, name: true, status: true },
    });

    await writeAuditLog(actor, {
      action: "admin.community.status_changed",
      resource: "Community",
      resourceId: req.params.id,
      details: `${existing.name} : ${existing.status} -> ${status}`,
      ipAddress: req.ip,
    });

    sendSuccess(res, updated);
  } catch {
    sendError(res, "Impossible de mettre a jour le statut du cercle.", 500);
  }
}

/**
 * PUT /api/admin/campaigns/:id/status
 * Mise en activite, pause, cloture d'une campagne collective.
 */
export async function updateCampaignStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "La base de donnees n'est pas encore connectee.", 503);
    return;
  }

  const actor = currentActor(req);
  const { status } = req.body ?? {};

  if (typeof status !== "string" || !CAMPAIGN_STATUSES.has(status)) {
    sendError(res, "Statut de campagne invalide.", 400);
    return;
  }

  try {
    const existing = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      select: { id: true, title: true, status: true },
    });
    if (!existing) {
      sendError(res, "Campagne introuvable.", 404);
      return;
    }

    const updated = await prisma.campaign.update({
      where: { id: req.params.id },
      data: { status },
      select: {
        id: true,
        title: true,
        status: true,
        completedActivitiesCount: true,
        targetActivitiesCount: true,
      },
    });

    await writeAuditLog(actor, {
      action: "admin.campaign.status_changed",
      resource: "Campaign",
      resourceId: req.params.id,
      details: `${existing.title} : ${existing.status} -> ${status}`,
      ipAddress: req.ip,
    });

    sendSuccess(res, updated);
  } catch {
    sendError(res, "Impossible de mettre a jour le statut de la campagne.", 500);
  }
}

/**
 * DELETE /api/admin/campaigns/:id
 * Suppression definitive d'une campagne. Reservee au super administrateur.
 * Les contributions liees a la campagne sont supprimees dans la meme transaction.
 */
export async function deleteCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "La base de donnees n'est pas encore connectee.", 503);
    return;
  }

  const actor = currentActor(req);
  if (actor.role !== "superadmin") {
    sendError(res, "Seul un super administrateur peut supprimer definitivement une ressource.", 403);
    return;
  }

  try {
    const existing = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      select: { id: true, title: true },
    });
    if (!existing) {
      sendError(res, "Campagne introuvable.", 404);
      return;
    }

    await prisma.$transaction([
      prisma.campaignContribution.deleteMany({ where: { campaignId: existing.id } }),
      prisma.campaign.delete({ where: { id: existing.id } }),
    ]);

    await writeAuditLog(actor, {
      action: "admin.campaign.deleted",
      resource: "Campaign",
      resourceId: existing.id,
      details: `Suppression definitive de la campagne ${existing.title}`,
      status: "warning",
      ipAddress: req.ip,
    });

    sendSuccess(res, { id: existing.id, deleted: true });
  } catch {
    sendError(res, "Impossible de supprimer la campagne.", 500);
  }
}

/**
 * DELETE /api/admin/communities/:id
 * Un cercle hebergeant des membres ou des contenus n'est jamais detruit : il doit
 * d'abord etre archive, afin de ne pas detruire la parole des membres.
 */
export async function deleteCommunity(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "La base de donnees n'est pas encore connectee.", 503);
    return;
  }

  const actor = currentActor(req);
  if (actor.role !== "superadmin") {
    sendError(res, "Seul un super administrateur peut supprimer definitivement une ressource.", 403);
    return;
  }

  try {
    const existing = await prisma.community.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        _count: { select: { members: true, posts: true, campaigns: true } },
      },
    });
    if (!existing) {
      sendError(res, "Cercle introuvable.", 404);
      return;
    }

    const { members, posts, campaigns } = existing._count;
    if (members > 0 || posts > 0 || campaigns > 0) {
      sendError(
        res,
        `Ce cercle contient ${members} membre(s), ${posts} publication(s) et ${campaigns} campagne(s). ` +
          "Archivez-le plutot que de le supprimer definitivement.",
        409
      );
      return;
    }

    await prisma.community.delete({ where: { id: existing.id } });

    await writeAuditLog(actor, {
      action: "admin.community.deleted",
      resource: "Community",
      resourceId: existing.id,
      details: `Suppression definitive du cercle vide ${existing.name}`,
      status: "warning",
      ipAddress: req.ip,
    });

    sendSuccess(res, { id: existing.id, deleted: true });
  } catch {
    sendError(res, "Impossible de supprimer le cercle.", 500);
  }
}

/**
 * DELETE /api/admin/organizations/:id
 * Comme pour les cercles, une organisation rattachee a des communautes ou des
 * campagnes ne peut pas etre detruite.
 */
export async function deleteOrganization(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "La base de donnees n'est pas encore connectee.", 503);
    return;
  }

  const actor = currentActor(req);
  if (actor.role !== "superadmin") {
    sendError(res, "Seul un super administrateur peut supprimer definitivement une ressource.", 403);
    return;
  }

  try {
    const existing = await prisma.organization.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        _count: { select: { communities: true, campaigns: true } },
      },
    });
    if (!existing) {
      sendError(res, "Organisation introuvable.", 404);
      return;
    }

    const { communities, campaigns } = existing._count;
    if (communities > 0 || campaigns > 0) {
      sendError(
        res,
        `Cette organisation porte ${communities} cercle(s) et ${campaigns} campagne(s). ` +
          "Suspendez-la plutot que de la supprimer definitivement.",
        409
      );
      return;
    }

    await prisma.organizationAdmin.deleteMany({ where: { organizationId: existing.id } });
    await prisma.organization.delete({ where: { id: existing.id } });

    await writeAuditLog(actor, {
      action: "admin.organization.deleted",
      resource: "Organization",
      resourceId: existing.id,
      details: `Suppression definitive de l'organisation ${existing.name}`,
      status: "warning",
      ipAddress: req.ip,
    });

    sendSuccess(res, { id: existing.id, deleted: true });
  } catch {
    sendError(res, "Impossible de supprimer l'organisation.", 500);
  }
}

/**
 * GET /api/admin/audit-logs
 * Journal d'audit systeme, lisible uniquement par un administrateur.
 */
export async function listAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "La base de donnees n'est pas encore connectee.", 503);
    return;
  }

  try {
    const limit = Math.min(
      Math.max(Number.parseInt(String(req.query.limit ?? "100"), 10) || 100, 1),
      300
    );

    const logs = await prisma.auditLog.findMany({
      select: {
        id: true,
        userId: true,
        userName: true,
        userRole: true,
        action: true,
        resource: true,
        resourceId: true,
        details: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    sendSuccess(res, logs);
  } catch {
    sendError(res, "Impossible de charger le journal d'audit.", 500);
  }
}

const PLAN_CODES = new Set(["basic", "starter", "growth", "enterprise"]);
const REPORT_LEVELS = new Set(["basic", "intermediate", "advanced"]);

function assertPlanPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload plan invalide.");
  }
  const data = payload as Record<string, unknown>;
  const required = ["code", "name", "priceMonthly", "communitiesMax", "membersMax", "campaignsPerMonth", "reportLevel"];
  for (const key of required) {
    if (!(key in data)) {
      throw new Error(`Champ plan manquant : ${key}`);
    }
  }
  if (typeof data.code !== "string" || !PLAN_CODES.has(data.code)) {
    throw new Error("Code plan invalide.");
  }
  if (typeof data.name !== "string" || data.name.trim().length === 0) {
    throw new Error("Nom plan invalide.");
  }
  if (typeof data.priceMonthly !== "number" || data.priceMonthly < 0) {
    throw new Error("Prix invalide.");
  }
  if (!Number.isInteger((data.communitiesMax as number)) || (data.communitiesMax as number) < 0) {
    throw new Error("Quota communautes invalide.");
  }
  if (!Number.isInteger((data.membersMax as number)) || (data.membersMax as number) < 0) {
    throw new Error("Quota membres invalide.");
  }
  if (!Number.isInteger((data.campaignsPerMonth as number)) || (data.campaignsPerMonth as number) < 0) {
    throw new Error("Quota campagnes invalide.");
  }
  if (typeof data.reportLevel !== "string" || !REPORT_LEVELS.has(data.reportLevel)) {
    throw new Error("Niveau de rapport invalide.");
  }
}

export async function listPlans(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "La base de donnees n'est pas encore connectee.", 503);
    return;
  }

  try {
    const plans = await prisma.plan.findMany({
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        priceMonthly: true,
        currency: true,
        billingPeriod: true,
        communitiesMax: true,
        membersMax: true,
        campaignsPerMonth: true,
        reportLevel: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    sendSuccess(res, plans);
  } catch {
    sendError(res, "Impossible de charger les plans.", 500);
  }
}

export async function createPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "La base de donnees n'est pas encore connectee.", 503);
    return;
  }

  const actor = currentActor(req);
  if (actor.role !== "superadmin") {
    sendError(res, "Seul un super administrateur peut creer un plan.", 403);
    return;
  }

  try {
    assertPlanPayload(req.body);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Payload plan invalide.", 400);
    return;
  }

  try {
    const {
      code,
      name,
      description,
      priceMonthly,
      currency = "USD",
      billingPeriod = "monthly",
      communitiesMax,
      membersMax,
      campaignsPerMonth,
      reportLevel,
    } = req.body as Record<string, unknown>;

    const plan = await prisma.plan.create({
      data: {
        code: String(code),
        name: String(name),
        description: description ? String(description) : null,
        priceMonthly: new Decimal(priceMonthly as number),
        currency: String(currency),
        billingPeriod: String(billingPeriod),
        communitiesMax: Number(communitiesMax),
        membersMax: Number(membersMax),
        campaignsPerMonth: Number(campaignsPerMonth),
        reportLevel: String(reportLevel),
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        priceMonthly: true,
        currency: true,
        billingPeriod: true,
        communitiesMax: true,
        membersMax: true,
        campaignsPerMonth: true,
        reportLevel: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await writeAuditLog(actor, {
      action: "admin.plan.created",
      resource: "Plan",
      resourceId: plan.id,
      details: `Creation du plan ${plan.code}`,
      ipAddress: req.ip,
    });

    sendSuccess(res, plan, 201);
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "P2002") {
      sendError(res, "Un plan avec ce code existe deja.", 409);
      return;
    }
    console.error("Erreur createPlan:", err);
    sendError(res, "Impossible de creer le plan.", 500);
  }
}

export async function updatePlan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "La base de donnees n'est pas encore connectee.", 503);
    return;
  }

  const actor = currentActor(req);
  if (actor.role !== "superadmin") {
    sendError(res, "Seul un super administrateur peut modifier un plan.", 403);
    return;
  }

  const { id } = req.params;

  try {
    const existing = await prisma.plan.findUnique({
      where: { id },
      select: { id: true, code: true, name: true },
    });
    if (!existing) {
      sendError(res, "Plan introuvable.", 404);
      return;
    }

    const data: Record<string, unknown> = {};
    if (typeof req.body.name === "string") data.name = req.body.name;
    if (typeof req.body.description === "string") data.description = req.body.description;
    if (typeof req.body.priceMonthly === "number") data.priceMonthly = new Decimal(req.body.priceMonthly);
    if (typeof req.body.currency === "string") data.currency = req.body.currency;
    if (typeof req.body.billingPeriod === "string") data.billingPeriod = req.body.billingPeriod;
    if (typeof req.body.communitiesMax === "number") data.communitiesMax = Number(req.body.communitiesMax);
    if (typeof req.body.membersMax === "number") data.membersMax = Number(req.body.membersMax);
    if (typeof req.body.campaignsPerMonth === "number") data.campaignsPerMonth = Number(req.body.campaignsPerMonth);
    if (typeof req.body.reportLevel === "string") {
      if (!REPORT_LEVELS.has(req.body.reportLevel)) {
        sendError(res, "Niveau de rapport invalide.", 400);
        return;
      }
      data.reportLevel = req.body.reportLevel;
    }
    if (typeof req.body.active === "boolean") data.active = req.body.active;

    const plan = await prisma.plan.update({
      where: { id },
      data,
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        priceMonthly: true,
        currency: true,
        billingPeriod: true,
        communitiesMax: true,
        membersMax: true,
        campaignsPerMonth: true,
        reportLevel: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await writeAuditLog(actor, {
      action: "admin.plan.updated",
      resource: "Plan",
      resourceId: plan.id,
      details: `Plan mis a jour : ${existing.code}`,
      ipAddress: req.ip,
    });

    sendSuccess(res, plan);
  } catch {
    sendError(res, "Impossible de mettre a jour le plan.", 500);
  }
}

export async function activateDemo(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "La base de donnees n'est pas encore connectee.", 503);
    return;
  }

  const actor = currentActor(req);
  if (actor.role !== "superadmin") {
    sendError(res, "Seul un super administrateur peut activer une periode de decouverte.", 403);
    return;
  }

  try {
    const existing = await prisma.organization.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        status: true,
        demoUsed: true,
        subscriptionStartedAt: true,
      },
    });
    if (!existing) {
      sendError(res, "Organisation introuvable.", 404);
      return;
    }

    if (existing.status !== "approved") {
      sendError(res, "La periode de decouverte ne peut etre activée que pour une organisation agreee.", 409);
      return;
    }

    if (existing.demoUsed) {
      sendError(res, "Cette organisation a deja utilise sa periode de decouverte.", 409, "DEMO_ALREADY_USED");
      return;
    }

    if (existing.subscriptionStartedAt) {
      sendError(res, "Cette organisation possède deja un abonnement actif.", 409);
      return;
    }

    const now = new Date();
    const { demoStartedAt, demoExpiresAt } = {
      demoStartedAt: now,
      demoExpiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    };

    const updated = await prisma.organization.update({
      where: { id: existing.id },
      data: {
        demoUsed: true,
        demoStartedAt,
        demoExpiresAt,
        quotaCommunitiesMax: 1,
        quotaMembersMax: 20,
        quotaCampaignsMax: 1,
      },
      select: {
        id: true,
        name: true,
        demoUsed: true,
        demoStartedAt: true,
        demoExpiresAt: true,
        quotaCommunitiesMax: true,
        quotaMembersMax: true,
        quotaCampaignsMax: true,
      },
    });

    await writeAuditLog(actor, {
      action: "admin.demo.activated",
      resource: "Organization",
      resourceId: existing.id,
      details: `Periode de decouverte activée pour ${existing.name}`,
      ipAddress: req.ip,
    });

    sendSuccess(res, updated);
  } catch {
    sendError(res, "Impossible d'activer la periode de decouverte.", 500);
  }
}
