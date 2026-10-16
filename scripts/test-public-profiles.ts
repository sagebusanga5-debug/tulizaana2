/**
 * Chantier 8.5 — profils publics. Par défaut, ce test ne contacte pas la base.
 * PUBLIC_PROFILE_DB_TEST=1 active uniquement les contrôles Supabase read-only.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { slugify } from "../server/services/public-profile.service.js";
import { toPublicOrganization } from "../server/services/organization-dto.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");
let passed = 0;
let failed = 0;
function check(name: string, run: () => void): void {
  try { run(); passed++; console.log(`[PASS] ${name}`); }
  catch (error) { failed++; console.error(`[FAIL] ${name}: ${error instanceof Error ? error.message : String(error)}`); }
}

console.log("\n=== CHANTIER 8.5 — TESTS STATIQUES / UNITAIRES ===\n");
const dtoSource = read("server/services/organization-dto.ts");
const orgController = read("server/controllers/organization.controller.ts");
const communityController = read("server/controllers/community.controller.ts");
const communityAccess = read("server/services/community-access.service.ts");
const migration = read("prisma/migrations/20261007000002_add_organization_slug/migration.sql");
const seed = read("prisma/seed.ts");
const invitationService = read("server/services/invitation.service.ts");

check("DTO: slug sélectionné et retourné", () => {
  assert.match(dtoSource, /PUBLIC_ORGANIZATION_SELECT[\s\S]*?slug:\s*true/);
  const dto = toPublicOrganization({ id: "org", slug: "panzi", name: "Panzi", acronym: null, logo: null, coverImage: null, type: "fondation", country: "RDC", city: "Bukavu", domain: "Santé", mission: "Aider", description: "Description", status: "approved", createdAt: new Date() }, { numberOfActiveCampaigns: 1, numberOfPublicCommunities: 0 });
  assert.equal(dto.slug, "panzi");
});
check("DTO: données privées absentes", () => {
  const dto = toPublicOrganization({ id: "org", slug: null, name: "N", acronym: null, logo: null, coverImage: null, type: "ong", country: "RDC", city: "K", domain: "D", mission: "M", description: "D", status: "approved", createdAt: new Date() }, { numberOfActiveCampaigns: 0, numberOfPublicCommunities: 0 }) as Record<string, unknown>;
  for (const field of ["contactEmail", "contactPhone", "address", "responsibleName", "subscriptionPlan", "planId", "paymentStatus", "subscriptionStartedAt", "subscriptionExpiresAt", "quotaCommunitiesMax", "quotaMembersMax", "quotaCampaignsMax", "demoUsed", "demoStartedAt", "demoExpiresAt", "OrganizationAdmin", "AuditLog"]) assert.equal(field in dto, false, field);
});
check("Organisation: ID/slug et approved", () => {
  assert.match(orgController, /OR:\s*\[\{ id \}, \{ slug: id \}\]/);
  assert.match(orgController, /organization\.status !== "approved"/);
});
check("Slug: normalisation, génération serveur et collision", () => {
  assert.equal(slugify(" Test Organisation "), "test-organisation");
  assert.equal(slugify("École & Santé"), "ecole-sante");
  assert.match(orgController, /generateUniqueOrganizationSlug\(name\)/);
  assert.match(read("server/services/public-profile.service.ts"), /candidate = `\$\{base\}\$\{SLUG_SEPARATOR\}\$\{suffix\}`/);
});
check("Communauté → organisation: slug public", () => {
  assert.match(communityController, /organization:\s*\{[\s\S]*?slug:\s*true/);
  assert.match(communityController, /organization:\s*community\.organization/);
});
check("Visibilité communauté: privée et organisation suspendue bloquées", () => {
  assert.match(communityAccess, /isPrivate:\s*false, organization:\s*\{ status: "approved" \}/);
  assert.match(communityAccess, /community\.organization\.status !== "approved"/);
  assert.match(communityAccess, /communityId_userId/);
});
check("Organisation → communautés: seulement publiques actives", () => {
  assert.match(orgController, /where: \{ status: "active", isPrivate: false \}/);
  assert.match(orgController, /organizationId: resolved\.id, status: "active", isPrivate: false/);
});
check("Migration: nullable, unique, non destructive", () => {
  assert.match(migration, /ADD COLUMN "slug" TEXT/);
  assert.match(migration, /CREATE UNIQUE INDEX "Organization_slug_key"/);
  assert.doesNotMatch(migration, /\b(DROP|DELETE|TRUNCATE)\b/i);
});
check("Seed: slugs Panzi et ALD-RDC idempotents", () => {
  for (const slug of ["panzi", "ald-rdc"]) { assert.match(seed, new RegExp(`slug:\\s*"${slug}"`)); assert.match(seed, new RegExp(`update:\\s*\\{ slug: "${slug}" \\}`)); }
});
check("Invitation 8.4: organisation et communauté restent contrôlées", () => {
  assert.match(invitationService, /link\.organization\.status !== "approved"/);
  assert.match(invitationService, /link\.community\.status !== "active"/);
});

async function runDatabaseChecks(): Promise<void> {
  if (process.env.PUBLIC_PROFILE_DB_TEST !== "1") { console.log("\n[SKIP] Supabase read-only: définissez PUBLIC_PROFILE_DB_TEST=1 si la base est joignable."); return; }
  const prisma = new PrismaClient();
  try {
    const panzi = await prisma.organization.findUnique({ where: { slug: "panzi" }, select: { slug: true, status: true } });
    assert.deepEqual(panzi, { slug: "panzi", status: "approved" });
    const indexes = await prisma.$queryRaw<Array<{ indexname: string }>>`SELECT indexname FROM pg_indexes WHERE tablename = 'Organization' AND indexname = 'Organization_slug_key'`;
    assert.equal(indexes.length, 1, "Organization_slug_key missing");
    console.log("[PASS] Supabase: Panzi et index unique du slug");
  } finally { await prisma.$disconnect(); }
}

await runDatabaseChecks();
console.log(`\nRésultat statique: ${passed} pass, ${failed} fail`);
if (failed > 0) process.exitCode = 1;
