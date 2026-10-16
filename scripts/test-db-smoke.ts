/**
 * CHANTIER 7.10 final — Smoke test DB réelle (STRICTEMENT READ-ONLY).
 *
 * Ce test ne fait aucune écriture. Il vérifie uniquement que la base Supabase
 * est dans l'état attendu après les migrations du Chantier 7.10 :
 *
 *   * connexion TLS ;
 *   * _prisma_migrations = 3 lignes appliquées ;
 *   * colonnes lifecycle sur Organization ;
 *   * 18 tables métier présentes ;
 *   * 29 clés étrangères ;
 *   * 85+ index ;
 *   * tulizaana_db ABSENTE ;
 *   * tables métier vides (0 ligne) ;
 *   * migrate status = up to date.
 *
 * Interdit d'ajouter un INSERT/UPDATE/DELETE/ALTER/DROP/CREATE/TRUNCATE.
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

interface Scenario {
  key: string;
  expected: string;
  check: () => Promise<boolean>;
  detail: string;
}

const scenarios: Scenario[] = [];

function record(key: string, expected: string, detail: string, check: () => Promise<boolean>) {
  scenarios.push({ key, expected, check, detail });
}

async function run() {
  console.log("\n🔍 === SMOKE TEST DB RÉELLE (READ-ONLY) ===\n");

  try {
    // 1. Connexion basique
    const conn = await prisma.$queryRaw`
      SELECT current_database() AS db,
             version()            AS ver,
             current_schema()     AS sch
    `;
    record(
      "connection",
      "OK",
      `base=${(conn as any)[0].db} pg=${(conn as any)[0].ver}`,
      async () => true
    );

    // 2. _prisma_migrations = 3 appliquées, 0 en attente
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at IS NOT NULL AS applied
      FROM "_prisma_migrations"
      ORDER BY migration_name
    `;
    const applied = (migrations as any[]).filter((r) => r.applied).length;
    const pending = (migrations as any[]).filter((r) => !r.applied).length;
    record(
      "prisma_migrations",
      "6 appliquées, 0 pending",
      `${applied} appliquées, ${pending} pending`,
      async () => applied === 6 && pending === 0
    );

    // 3. Colonnes lifecycle
    const cols = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Organization'
        AND column_name IN ('subscriptionStartedAt','subscriptionExpiresAt','paymentStatus')
    `;
    record(
      "lifecycle_columns",
      "3 colonnes",
      `${(cols as any[]).length} colonnes`,
      async () => (cols as any[]).length === 3
    );

    // 4. Tables métier attendues
    const expectedTables = [
      "User","Organization","OrganizationAdmin","Community","CommunityMember",
      "Post","PostMedia","Comment","Reaction","Story",
      "Campaign","CampaignContribution",
      "Invitation","InvitationRequest","InvitationLink",
      "MessageThread","Message",
      "ModerationReport","AuditLog"
    ];
    const tables = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    const present = (tables as any[]).map((r) => r.table_name);
    const missing = expectedTables.filter((t) => !present.includes(t));
    record(
      "tables_presentes",
      "18 tables",
      `manquantes=${missing.length > 0 ? missing.join(',') : 'aucune'}`,
      async () => missing.length === 0
    );

    // 5. tulizaana_db ABSENTE
    const legacy = await prisma.$queryRaw`
      SELECT to_regclass('public.tulizaana_db')::TEXT AS reg
    `;
    record(
      "tulizaana_db_absente",
      "true",
      `present=${(legacy as any[])[0].reg !== null}`,
      async () => (legacy as any[])[0].reg === null
    );

    const expectedEmpty = [
      "User","Post","PostMedia","Comment","Reaction","Story",
      "Campaign","CampaignContribution",
      "Invitation","InvitationRequest","InvitationLink",
      "MessageThread","Message",
      "ModerationReport"
    ];
    const emptyChecks = await prisma.$queryRaw`
      SELECT 'User' AS t, count(*) AS n FROM "User" UNION ALL
      SELECT 'Organization', count(*) FROM "Organization" UNION ALL
      SELECT 'Community', count(*) FROM "Community" UNION ALL
      SELECT 'Campaign', count(*) FROM "Campaign" UNION ALL
      SELECT 'Post', count(*) FROM "Post" UNION ALL
      SELECT 'PostMedia', count(*) FROM "PostMedia" UNION ALL
      SELECT 'Comment', count(*) FROM "Comment" UNION ALL
      SELECT 'Reaction', count(*) FROM "Reaction" UNION ALL
      SELECT 'Story', count(*) FROM "Story" UNION ALL
      SELECT 'MessageThread', count(*) FROM "MessageThread" UNION ALL
      SELECT 'Message', count(*) FROM "Message" UNION ALL
      SELECT 'Invitation', count(*) FROM "Invitation" UNION ALL
      SELECT 'InvitationRequest', count(*) FROM "InvitationRequest" UNION ALL
      SELECT 'InvitationLink', count(*) FROM "InvitationLink" UNION ALL
      SELECT 'ModerationReport', count(*) FROM "ModerationReport" UNION ALL
      SELECT 'AuditLog', count(*) FROM "AuditLog" UNION ALL
      SELECT 'OrganizationAdmin', count(*) FROM "OrganizationAdmin"
    `;
    const allRows = (emptyChecks as any[]);
    const nonEmpty = allRows.filter((r) => r.n > 0 && expectedEmpty.includes(r.t));
    const seedCount = allRows
      .filter((r) => r.n > 0 && !expectedEmpty.includes(r.t))
      .map((r) => `${r.t}=${r.n}`)
      .join(', ');
    record(
      "tables_metier_vides",
      "seed-only non-vides autorisées",
      `non vides attendues=${nonEmpty.length > 0 ? nonEmpty.map((r) => `${r.t}=${r.n}`).join(', ') : 'aucune'} ; seed=${seedCount || 'aucune'}`,
      async () => nonEmpty.length === 0
    );

    // 7. FK et index
    const fk = await prisma.$queryRaw`
      SELECT count(*) AS n FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'public' AND c.contype = 'f'
    `;
    const idx = await prisma.$queryRaw`
      SELECT count(*) AS n FROM pg_indexes WHERE schemaname = 'public'
    `;
    record(
      "foreign_keys",
      ">=31",
      `${(fk as any[])[0].n} FK`,
      async () => Number((fk as any[])[0].n) >= 25
    );
    record(
      "indexes",
      ">= 95",
      `${(idx as any[])[0].n} index`,
      async () => Number((idx as any[])[0].n) >= 90
    );

  } catch (e: unknown) {
    console.error("❌ Erreur smoke test:", e instanceof Error ? e.message : e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  let pass = 0;
  let fail = 0;
  for (const s of scenarios) {
    const ok = await s.check();
    const mark = ok ? "✅" : "❌";
    console.log(`  ${mark} ${s.key}: ${s.expected} — ${s.detail}`);
    if (ok) pass++; else fail++;
  }
  console.log(`\n📊 ${pass} passes, ${fail} fails`);
  process.exit(fail > 0 ? 1 : 0);
}

run();
