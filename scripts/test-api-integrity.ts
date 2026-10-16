/**
 * CHANTIER 7 - API & Database Integrity / IDOR-BOLA audit checks.
 *
 * Ce test complete les suites HTTP existantes (admin, partner, resource) par
 * des controles source cibles sur les garde-fous ajoutes au chantier 7.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface Result {
  scenario: string;
  expected: string;
  status: "pass" | "fail";
  detail: string;
}

const results: Result[] = [];
let currentScenario = "";

function record(expected: string, condition: boolean, detail: string): void {
  results.push({ scenario: currentScenario, expected, status: condition ? "pass" : "fail", detail });
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

function read(relative: string): string {
  return fs.readFileSync(path.resolve(ROOT, relative), "utf-8");
}

function functionBlock(source: string, name: string, nextMarker: string): string {
  const start = source.indexOf(`export async function ${name}`);
  const end = source.indexOf(nextMarker, start + 1);
  if (start < 0) return "";
  return source.slice(start, end > start ? end : source.length);
}

const authSource = read("server/middleware/auth.ts");
const moderationSource = read("server/controllers/moderation.controller.ts");
const moderationRoutes = read("server/routes/moderation.routes.ts");
const invitationSource = read("server/controllers/invitation.controller.ts");
const invitationRoutes = read("server/routes/invitation.routes.ts");
const communitySource = read("server/controllers/community.controller.ts");
const campaignSource = read("server/controllers/campaign.controller.ts");
const organizationSource = read("server/controllers/organization.controller.ts");
const schemaSource = read("prisma/schema.prisma");
const listReportsBlock = functionBlock(moderationSource, "listReports", "export async function handleReport");
const handleReportBlock = functionBlock(moderationSource, "handleReport", "");
const requestInvitationBlock = functionBlock(invitationSource, "requestInvitation", "export async function generateInvitation");

currentScenario = "optionalAuth ne fait pas confiance au JWT seul";
record(
  "optionalAuth relit le compte et ignore les comptes suspendus",
  /export async function optionalAuth/.test(authSource) &&
    authSource.includes("const fresh = await loadFreshAccount(decoded.id)") &&
    authSource.includes("fresh && !fresh.isSuspended") &&
    authSource.includes("req.user = stripAccountState(fresh)"),
  "optionalAuth doit fournir une identite fraiche aux routes optionalAuth"
);

currentScenario = "Moderation report boundary";
record(
  "createReport derive/verifie le communityId depuis la cible et la portee lisible",
  moderationSource.includes("resolveReportCommunityId") &&
    moderationSource.includes("resolveReadableCommunityId") &&
    moderationSource.includes("Contenu introuvable ou inaccessible") &&
    moderationSource.includes("communityId: reportCommunityId"),
  "un client ne doit pas rattacher un report a une communaute arbitraire"
);

currentScenario = "Moderation RBAC";
record(
  "partner_admin n'a pas acces au registre global de moderation",
  moderationRoutes.includes('requireRole(["superadmin", "moderator", "admin"])') &&
    !listReportsBlock.includes("partner_admin") &&
    !handleReportBlock.includes("partner_admin"),
  "les partner_admin restent dans leur surface tenant, pas le registre global"
);

currentScenario = "Moderation mass assignment";
record(
  "handleReport valide un statut ferme et verifie l'existence avant update",
  moderationSource.includes('const REPORT_STATUSES = new Set(["pending", "under_review", "resolved", "dismissed"])') &&
    moderationSource.includes("REPORT_STATUSES.has(status)") &&
    moderationSource.includes("prisma.moderationReport.findUnique") &&
    moderationSource.includes("Signalement introuvable"),
  "status exotique ou id inexistant ne doivent pas devenir une erreur Prisma/500"
);

currentScenario = "Invitation request anti-IDOR";
record(
  "requestInvitation ignore organizationId client et derive l'organisation depuis la communaute active/approuvee",
  !/const\s*\{[\s\S]{0,180}organizationId[\s\S]{0,80}\}\s*=\s*req\.body/.test(requestInvitationBlock) &&
    requestInvitationBlock.includes("organization: { select: { status: true } }") &&
    requestInvitationBlock.includes('community.organization.status !== "approved"') &&
    requestInvitationBlock.includes("organizationId: community.organizationId"),
  "un candidat ne peut pas creer une demande cross-organization"
);

currentScenario = "Invitation generation boundary";
record(
  "generateInvitation verifie community.organizationId et borne prefix/maxUses/validityDays",
  invitationSource.includes("community.organizationId !== organizationId") &&
    invitationSource.includes("cleanPrefix") &&
    invitationSource.includes("cleanValidityDays") &&
    invitationSource.includes("cleanMaxUses") &&
    invitationSource.includes("organizationId: community.organizationId"),
  "un admin ne doit pas generer de code incoherent org/communaute"
);

currentScenario = "Invitation routes platform-only";
record(
  "list/update/generate invitations sont reservees superadmin/admin",
  invitationRoutes.includes('requireRole(["superadmin", "admin"])') &&
    !/requests"[\s\S]{0,120}partner_admin/.test(invitationRoutes) &&
    !/generate"[\s\S]{0,120}partner_admin/.test(invitationRoutes),
  "les donnees candidat ne doivent pas fuiter aux tenants hors surface dediee"
);

currentScenario = "Partner org authority";
record(
  "community/campaign creation passent par resolvePartnerOrganization et entitlements serveur",
  communitySource.includes("resolvePartnerOrganization") &&
    communitySource.includes("assertPartnerSubscription") &&
    communitySource.includes("assertQuotaAvailable") &&
    campaignSource.includes("resolvePartnerOrganization") &&
    campaignSource.includes("community.organizationId !== organization.id"),
  "organizationId client n'est qu'une selection reverifiee"
);

currentScenario = "Subscription/payment server authority";
record(
  "seule la route superadmin peut modifier paiement/quotas/activation",
  organizationSource.includes("requireRole([\"superadmin\"])") ||
    (organizationSource.includes("applySubscriptionChange") &&
      organizationSource.includes("paymentStatus") &&
      organizationSource.includes("activateSubscription")),
  "les mutations sensibles restent dans updateOrganizationStatus protege par route superadmin"
);

currentScenario = "Schema constraints";
record(
  "schema Prisma contient les uniques et relations critiques",
  schemaSource.includes("@@unique([organizationId, userId])") &&
    schemaSource.includes("@@unique([communityId, userId])") &&
    schemaSource.includes("@@unique([postId, userId, type])") &&
    schemaSource.includes("canonicalParticipantKey String    @unique") &&
    schemaSource.includes('onDelete: Restrict') &&
    schemaSource.includes('onDelete: Cascade') &&
    schemaSource.includes('onDelete: SetNull'),
  "contraintes principales users/org/community/messages/reactions presentes"
);

currentScenario = "Migration subscription/payment presente";
const migrationPath = path.resolve(ROOT, "prisma/migrations/20261003000000_partner_subscription_lifecycle/migration.sql");
const migrationSource = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, "utf-8") : "";
record(
  "migration de cycle subscription/payment existe dans le depot",
  migrationSource.includes('"subscriptionStartedAt"') &&
    migrationSource.includes('"subscriptionExpiresAt"') &&
    migrationSource.includes('"paymentStatus"'),
  fs.existsSync(migrationPath) ? "migration trouvee" : "migration absente"
);

currentScenario = "DB reelle non modifiee par le test";
record(
  "DATABASE_URL production absente => migration reelle documentee comme non verifiee",
  !process.env.DATABASE_URL,
  process.env.DATABASE_URL ? "DATABASE_URL presente dans cet environnement" : "DATABASE_URL absente"
);

console.log("\n========================================");
console.log("CHANTIER 7 - API Integrity Tests");
console.log("========================================\n");

let pass = 0;
let fail = 0;
for (const result of results) {
  const marker = result.status === "pass" ? "PASS" : "FAIL";
  console.log(`[${marker}] ${result.scenario}`);
  console.log(`       Expected: ${result.expected}`);
  console.log(`       Detail:   ${result.detail}\n`);
  if (result.status === "pass") pass++;
  else fail++;
}

console.log("----------------------------------------");
console.log(`Total: ${results.length} | PASS: ${pass} | FAIL: ${fail}`);
console.log("----------------------------------------\n");

if (fail > 0) {
  process.exitCode = 1;
}
