import type { PrismaClient } from "@prisma/client";
import {
  PartnerEntitlementError,
  assertPartnerSubscription,
  resolvePartnerOrganization,
} from "./partner-entitlements.service.js";

export const MIN_ANONYMIZED_GROUP_SIZE = 5;
export const REPORT_LEVELS = ["basic", "intermediate", "advanced"] as const;
export type ReportLevel = (typeof REPORT_LEVELS)[number];
export type SafeMetric = number | { suppressed: true };

export function anonymizeMetric(value: number, groupSize: number): SafeMetric {
  return groupSize < MIN_ANONYMIZED_GROUP_SIZE ? { suppressed: true } : value;
}

export function validateReportPeriod(startValue: unknown, endValue: unknown, now = new Date()): { start: Date; end: Date } {
  const start = typeof startValue === "string" ? new Date(startValue) : new Date("");
  const end = typeof endValue === "string" ? new Date(endValue) : new Date("");
  const maxDurationMs = 366 * 24 * 60 * 60 * 1000;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end || end > now || end.getTime() - start.getTime() > maxDurationMs) {
    throw new Error("INVALID_REPORT_PERIOD");
  }
  return { start, end };
}

export async function resolveReportAuthority(prisma: PrismaClient, userId: string, requestedOrganizationId?: string) {
  const organization = await resolvePartnerOrganization(prisma, userId, requestedOrganizationId);
  assertPartnerSubscription(organization);
  const plan = await prisma.plan.findUnique({ where: { id: organization.planId || "" }, select: { reportLevel: true, active: true } });
  const reportLevel = plan?.active ? plan.reportLevel.toLowerCase() : null;
  if (!reportLevel || !REPORT_LEVELS.includes(reportLevel as ReportLevel)) {
    throw new PartnerEntitlementError("SUBSCRIPTION_REQUIRED", "Votre formule ne donne pas acces aux rapports partenaires.", 403);
  }
  return { organization, level: reportLevel as ReportLevel };
}

export async function generatePartnerReport(
  prisma: PrismaClient,
  input: { userId: string; userName?: string; userRole?: string; organizationId?: string; communityId?: string; periodStart: unknown; periodEnd: unknown }
) {
  const { start, end } = validateReportPeriod(input.periodStart, input.periodEnd);
  const { organization, level } = await resolveReportAuthority(prisma, input.userId, input.organizationId);
  const communityWhere = input.communityId ? { id: input.communityId, organizationId: organization.id } : { organizationId: organization.id };
  if (input.communityId) {
    const community = await prisma.community.findFirst({ where: communityWhere, select: { id: true } });
    if (!community) throw new PartnerEntitlementError("FORBIDDEN_RESOURCE", "Communaute introuvable.", 404);
  }

  const scope = input.communityId ? { communityId: input.communityId } : { community: { organizationId: organization.id } };
  const inPeriod = { gte: start, lte: end };
  const [activeCommunities, activeMembers, newMembers, posts, stories, comments, reactions, campaigns, contributions, completedActivities] = await Promise.all([
    prisma.community.count({ where: { ...communityWhere, status: "active" } }),
    prisma.communityMember.count({ where: { status: "active", community: communityWhere, joinedAt: { lte: end } } }),
    prisma.communityMember.count({ where: { status: "active", community: communityWhere, joinedAt: inPeriod } }),
    prisma.post.count({ where: { ...scope, createdAt: inPeriod } }),
    prisma.story.count({ where: { ...scope, createdAt: inPeriod } }),
    prisma.comment.count({ where: { createdAt: inPeriod, post: scope } }),
    prisma.reaction.count({ where: { createdAt: inPeriod, post: scope } }),
    prisma.campaign.count({ where: { organizationId: organization.id, ...(input.communityId ? { communityId: input.communityId } : {}), createdAt: inPeriod } }),
    prisma.campaignContribution.count({ where: { createdAt: inPeriod, campaign: { organizationId: organization.id, ...(input.communityId ? { communityId: input.communityId } : {}) } } }),
    prisma.campaign.aggregate({ _sum: { completedActivitiesCount: true }, where: { organizationId: organization.id, ...(input.communityId ? { communityId: input.communityId } : {}), createdAt: inPeriod } }),
  ]);

  const protectedMetric = (value: number) => anonymizeMetric(value, activeMembers);
  const data = {
    schemaVersion: 1,
    period: { start: start.toISOString(), end: end.toISOString() },
    level,
    summary: {
      activeCommunities,
      activeMembers: protectedMetric(activeMembers),
      newMembers: protectedMetric(newMembers),
      posts: protectedMetric(posts),
      stories: protectedMetric(stories),
      comments: protectedMetric(comments),
      reactions: protectedMetric(reactions),
      campaigns,
    },
    engagement: { comments: protectedMetric(comments), reactions: protectedMetric(reactions) },
    campaigns: { total: campaigns, contributions: protectedMetric(contributions), completedActivities: protectedMetric(completedActivities._sum.completedActivitiesCount || 0) },
    ...(level === "basic" ? {} : { evolution: { newMembers: protectedMetric(newMembers), posts: protectedMetric(posts) } }),
  };
  const visiblePosts = typeof data.summary.posts === "number" ? data.summary.posts : null;
  const insights = visiblePosts === null ? [] : visiblePosts > 0
    ? [{ type: "engagement", title: "Activite communautaire", description: "Des publications ont ete partagees durant la periode.", metric: "posts", direction: "up" }]
    : [{ type: "engagement", title: "Activite a renforcer", description: "Aucune publication agregee n'a ete observee durant la periode.", metric: "posts", direction: "down" }];
  const recommendations = visiblePosts === null ? [] : visiblePosts > 0
    ? [{ type: "animation", description: "Maintenir une animation communautaire reguliere." }]
    : [{ type: "animation", description: "Planifier une activite communautaire adaptee a la periode a venir." }];

  const report = await prisma.report.create({ data: { organizationId: organization.id, communityId: input.communityId || null, periodStart: start, periodEnd: end, level, status: "generated", data, insights, recommendations, generatedBy: input.userId } });
  await prisma.auditLog.create({ data: { userId: input.userId, userName: input.userName || input.userId, userRole: input.userRole || "partner_admin", action: "PARTNER_REPORT_GENERATED", resource: "Report", resourceId: report.id, details: `Rapport ${level} genere pour organisation=${organization.id}; communaute=${input.communityId || "all"}; periode=${start.toISOString()}..${end.toISOString()}.`, status: "success" } });
  return report;
}
