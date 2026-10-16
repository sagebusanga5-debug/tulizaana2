import { Response } from "express";
import { getPrismaClient } from "../config/database.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { PartnerEntitlementError, deny } from "../services/partner-entitlements.service.js";
import { generatePartnerReport, resolveReportAuthority } from "../services/partner-report.service.js";

function pageParams(query: Record<string, unknown>) {
  const page = typeof query.page === "string" ? Math.max(1, Number.parseInt(query.page, 10) || 1) : 1;
  const limit = typeof query.limit === "string" ? Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20)) : 20;
  return { page, limit, skip: (page - 1) * limit };
}

export async function createPartnerReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma || !req.user) { sendError(res, "Authentification requise.", !prisma ? 503 : 401); return; }
  try {
    const report = await generatePartnerReport(prisma, {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      organizationId: typeof req.body.organizationId === "string" ? req.body.organizationId : undefined,
      communityId: typeof req.body.communityId === "string" ? req.body.communityId : undefined,
      periodStart: req.body.periodStart,
      periodEnd: req.body.periodEnd,
    });
    sendSuccess(res, report, 201);
  } catch (error) {
    if (error instanceof PartnerEntitlementError) { deny(res, error); return; }
    if (error instanceof Error && error.message === "INVALID_REPORT_PERIOD") { sendError(res, "Periode de rapport invalide.", 400, "INVALID_REPORT_PERIOD"); return; }
    console.error("Erreur createPartnerReport:", error);
    sendError(res, "Impossible de generer le rapport.", 500);
  }
}

export async function listPartnerReports(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma || !req.user) { sendError(res, "Authentification requise.", !prisma ? 503 : 401); return; }
  try {
    const { organization } = await resolveReportAuthority(prisma, req.user.id, typeof req.query.organizationId === "string" ? req.query.organizationId : undefined);
    const { page, limit, skip } = pageParams(req.query);
    const where = { organizationId: organization.id };
    const [reports, total] = await Promise.all([
      prisma.report.findMany({ where, orderBy: { generatedAt: "desc" }, skip, take: limit, select: { id: true, communityId: true, periodStart: true, periodEnd: true, level: true, status: true, generatedAt: true } }),
      prisma.report.count({ where }),
    ]);
    sendSuccess(res, { reports, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    if (error instanceof PartnerEntitlementError) { deny(res, error); return; }
    console.error("Erreur listPartnerReports:", error); sendError(res, "Impossible de lister les rapports.", 500);
  }
}

export async function getPartnerReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma || !req.user) { sendError(res, "Authentification requise.", !prisma ? 503 : 401); return; }
  try {
    const { organization } = await resolveReportAuthority(prisma, req.user.id, typeof req.query.organizationId === "string" ? req.query.organizationId : undefined);
    const report = await prisma.report.findFirst({ where: { id: req.params.id, organizationId: organization.id } });
    if (!report) { sendError(res, "Rapport introuvable.", 404, "FORBIDDEN_RESOURCE"); return; }
    sendSuccess(res, report);
  } catch (error) {
    if (error instanceof PartnerEntitlementError) { deny(res, error); return; }
    console.error("Erreur getPartnerReport:", error); sendError(res, "Impossible de recuperer le rapport.", 500);
  }
}
