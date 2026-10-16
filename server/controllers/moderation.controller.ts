import { Response } from "express";
import { getPrismaClient } from "../config/database.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { resolveReadableCommunityId } from "../services/community-access.service.js";

/** Types de cible reconnus. Liste fermee cote serveur. */
const MODERATION_TARGET_TYPES = new Set([
  "post",
  "comment",
  "user",
  "story",
  "crisis_sos",
]);

/**
 * Gravites qu'un appelant peut declarer. `critical_sos` en est volontairement
 * absente : elle se derive du type de cible, jamais du corps de la requete.
 */
const PUBLIC_SEVERITIES = new Set(["low", "medium", "high"]);
const REPORT_STATUSES = new Set(["pending", "under_review", "resolved", "dismissed"]);

async function resolveReportCommunityId(
  prisma: NonNullable<ReturnType<typeof getPrismaClient>>,
  userId: string | undefined,
  targetType: string,
  targetId: string,
  requestedCommunityId: unknown
): Promise<string | null | undefined> {
  let communityId: string | null = null;

  if (targetType === "post") {
    const post = await prisma.post.findUnique({
      where: { id: targetId },
      select: { communityId: true },
    });
    communityId = post?.communityId ?? null;
  } else if (targetType === "comment") {
    const comment = await prisma.comment.findUnique({
      where: { id: targetId },
      select: { post: { select: { communityId: true } } },
    });
    communityId = comment?.post?.communityId ?? null;
  } else if (targetType === "story") {
    const story = await prisma.story.findUnique({
      where: { id: targetId },
      select: { communityId: true },
    });
    communityId = story?.communityId ?? null;
  } else if (typeof requestedCommunityId === "string" && requestedCommunityId.trim()) {
    communityId = requestedCommunityId.trim();
  }

  if (!communityId) return null;

  const readable = await resolveReadableCommunityId(prisma, userId, communityId);
  return readable ? communityId : undefined;
}

/**
 * Signalement d'un contenu ou alerte SOS de crise psychologique.
 */
export async function createReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de données non connectée.", 503);
    return;
  }

  try {
    const {
      targetType, // 'post' | 'comment' | 'user' | 'story' | 'crisis_sos'
      targetId,
      reason,
      details,
      communityId,
      severity: requestedSeverity,
    } = req.body;

    if (!targetType || !targetId || !reason) {
      sendError(res, "Type de cible, identifiant et motif requis.", 400);
      return;
    }

    // Chantier 5 - `severity` etait ecrit tel quel et pilotait l'ecriture
    // d'une alerte dans le registre d'audit. Liste fermee des types et des
    // gravites ; `critical_sos` ne peut pas etre declare par un appelant.
    if (!MODERATION_TARGET_TYPES.has(targetType)) {
      sendError(res, "Type de cible inconnu.", 400);
      return;
    }

    // La gravite critique est une decision de la plateforme, pas une
    // declaration du client : elle est derivée du type de cible, jamais lue
    // dans le corps de la requete.
    const severity =
      targetType === "crisis_sos"
        ? "critical_sos"
        : PUBLIC_SEVERITIES.has(requestedSeverity)
          ? requestedSeverity
          : "medium";

    const cleanTargetId = String(targetId).trim().slice(0, 64);
    const reportCommunityId = await resolveReportCommunityId(
      prisma,
      req.user?.id,
      targetType,
      cleanTargetId,
      communityId
    );

    if (reportCommunityId === undefined) {
      sendError(res, "Contenu introuvable ou inaccessible.", 404, "FORBIDDEN_RESOURCE");
      return;
    }

    const cleanReason = String(reason).trim().slice(0, 500);
    const cleanDetails = details ? String(details).trim().slice(0, 2000) : null;

    const report = await prisma.moderationReport.create({
      data: {
        targetType,
        targetId: cleanTargetId,
        reason: cleanReason,
        details: cleanDetails,
        communityId: reportCommunityId,
        severity,
        status: "pending",
        reportedById: req.user ? req.user.id : null,
      },
    });

    // Journal d'audit pour les alertes critiques
    if (severity === "critical_sos" || severity === "high") {
      await prisma.auditLog.create({
        data: {
          userId: req.user ? req.user.id : null,
          // Un appelant anonyme n'est jamais journalise comme « systeme ».
          userName: req.user?.name || "Signalement anonyme",
          userRole: req.user?.role || "anonymous",
          action: "CRITICAL_MODERATION_ALERT",
          resource: "ModerationReport",
          resourceId: report.id,
          // Le motif est tronque : un texte libre place dans un journal
          // d'audit reste un vecteur d'injection si une console le rend en HTML.
          details: `Alerte prioritaire ${severity} pour ${targetType} #${report.targetId}`,
          status: "warning",
        },
      });
    }

    sendSuccess(
      res,
      {
        message:
          severity === "critical_sos"
            ? "Alerte SOS prise en compte. Des numéros d'urgence et professionnels d'écoute sont également mobilisables."
            : "Merci pour votre vigilance, notre équipe de modération bienveillante a été informée.",
        reportId: report.id,
      },
      201
    );
  } catch (err) {
    console.error("Erreur createReport:", err);
    sendError(res, "Erreur lors de la création du signalement.", 500);
  }
}

/**
 * Liste des signalements pour les modérateurs et coordinateurs.
 */
export async function listReports(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de données non connectée.", 503);
    return;
  }

  if (!req.user || !["superadmin", "moderator", "admin"].includes(req.user.role)) {
    sendError(res, "Accès réservé aux coordinateurs de modération.", 403);
    return;
  }

  try {
    const { status, severity } = req.query;

    const reports = await prisma.moderationReport.findMany({
      where: {
        ...(status && typeof status === "string" && REPORT_STATUSES.has(status) && { status }),
        ...(severity && typeof severity === "string" && (PUBLIC_SEVERITIES.has(severity) || severity === "critical_sos") && { severity }),
      },
      include: {
        community: { select: { name: true } },
        reporter: { select: { name: true, pseudonym: true } },
      },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 50,
    });

    sendSuccess(res, reports);
  } catch (err) {
    console.error("Erreur listReports:", err);
    sendError(res, "Impossible de charger les signalements.", 500);
  }
}

/**
 * Traitement d'un signalement (résolution ou rejet).
 */
export async function handleReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de données non connectée.", 503);
    return;
  }

  if (!req.user || !["superadmin", "moderator", "admin"].includes(req.user.role)) {
    sendError(res, "Accès réservé aux modérateurs.", 403);
    return;
  }

  try {
    const { id } = req.params;
    const { status, actionNotes } = req.body; // status: 'resolved' | 'dismissed' | 'under_review'

    if (!REPORT_STATUSES.has(status)) {
      sendError(res, "Statut de moderation invalide.", 400);
      return;
    }

    const existing = await prisma.moderationReport.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      sendError(res, "Signalement introuvable.", 404, "FORBIDDEN_RESOURCE");
      return;
    }
    const updated = await prisma.moderationReport.update({
      where: { id },
      data: {
        status,
        actionNotes: actionNotes ? actionNotes.trim() : null,
        actionTakenBy: req.user.id,
        resolvedAt: status === "resolved" ? new Date() : undefined,
      },
    });

    sendSuccess(res, updated);
  } catch (err) {
    console.error("Erreur handleReport:", err);
    sendError(res, "Erreur lors du traitement du signalement.", 500);
  }
}
