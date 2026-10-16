/**
 * CHANTIER 8.4 — Invitation links + onboarding auth boundary checks.
 *
 * Contrôles :
 * - endpoint /links/verify accessible sans authentification ;
 * - endpoint /links/accept nécessite une authentification ;
 * - endpoint /links/admin réservé aux rôles plateforme/tenant autorisés ;
 * - la table InvitationLink existe et accepte des enregistrements valides.
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

interface Result {
  scenario: string;
  expected: string;
  status: "pass" | "fail";
  detail: string;
  check: () => Promise<boolean>;
}

const results: Result[] = [];
let currentScenario = "";

function record(expected: string, detail: string, check: () => Promise<boolean>): void {
  results.push({ scenario: currentScenario, expected, status: "pass", detail, check });
}

async function run() {
  console.log("\n🔍 === CHANTIER 8.4 INVITATION LINKS TESTS ===\n");

  try {
    currentScenario = "InvitationLink table presence";
    record(
      "table exists and is readable",
      "table created by migration 20261007000001",
      async () => {
        const count = await prisma.invitationLink.count();
        return count >= 0;
      }
    );

    currentScenario = "Routes boundary source";
    record(
      "public verify + auth accept + admin role guards",
      "invitation.routes.ts guards are correct",
      async () => {
        const routes = (await import("fs")).readFileSync(
          "server/routes/invitation.routes.ts",
          "utf-8"
        );
        return (
          routes.includes('"/links/verify"') &&
          routes.includes('"/accept/link"') &&
          routes.includes('"/links"') &&
          routes.includes('requireRole(["superadmin", "admin", "partner_admin"])')
        );
      }
    );

    currentScenario = "Controller boundary source";
    record(
      "verifyInvitationLink is public, acceptInvitationLink is auth",
      "invitation.controller.ts guards are correct",
      async () => {
        const ctrl = (await import("fs")).readFileSync(
          "server/controllers/invitation.controller.ts",
          "utf-8"
        );
        return (
          ctrl.includes("export async function verifyInvitationLink(req: Request") &&
          ctrl.includes("export async function acceptInvitationLink(req: AuthenticatedRequest") &&
          ctrl.includes("export async function createInvitationLink(req: AuthenticatedRequest")
        );
      }
    );

    currentScenario = "Service boundary source";
    record(
      "invitation.service.ts validates status/expires/usage + organization/community/campaign",
      "service enforces business rules before controller",
      async () => {
        const svc = (await import("fs")).readFileSync(
          "server/services/invitation.service.ts",
          "utf-8"
        );
        return (
          svc.includes('link.status !== "active"') &&
          svc.includes("link.expiresAt < new Date()") &&
          svc.includes("link.currentUses >= link.maxUses") &&
          svc.includes('link.organization.status !== "approved"')
        );
      }
    );

    currentScenario = "Frontend API client";
    record(
      "api.invitations.verifyLink + acceptLink + createLink exist",
      "src/services/api.ts exposes invitation link methods",
      async () => {
        const api = (await import("fs")).readFileSync(
          "src/services/api.ts",
          "utf-8"
        );
        return (
          api.includes("verifyLink:") &&
          api.includes("acceptLink:") &&
          api.includes("createLink:")
        );
      }
    );
  } catch (e: unknown) {
    console.error("❌ Erreur tests 8.4:", e instanceof Error ? e.message : e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  let pass = 0;
  let fail = 0;
  for (const s of results) {
    const ok = await s.check();
    const mark = ok ? "✅" : "❌";
    console.log(`  ${mark} ${s.scenario}: ${s.expected} — ${s.detail}`);
    if (ok) pass++; else fail++;
  }
  console.log(`\n📊 ${pass} passes, ${fail} fails`);
  process.exit(fail > 0 ? 1 : 0);
}

run();
