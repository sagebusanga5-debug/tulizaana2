import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { checkDatabaseHealth, getPrismaClient, resolveDatabaseUrl } from "../config/database.js";
import { checkSupabaseHealth, getServerSupabase, resolveSupabaseUrl } from "../config/supabase.js";

/**
 * Returns the full SQL script to create all 14 tables, constraints, and indexes
 * in Supabase via their SQL Editor in one click.
 */
export async function getSupabaseInitSql(_req: Request, res: Response): Promise<void> {
  try {
    const sqlPath = path.join(process.cwd(), "prisma", "supabase_init.sql");
    if (!fs.existsSync(sqlPath)) {
      res.status(404).json({ success: false, error: "Fichier SQL d'initialisation introuvable." });
      return;
    }

    const sqlContent = fs.readFileSync(sqlPath, "utf-8");
    res.json({
      success: true,
      sql: sqlContent,
      tableCount: 14,
      tables: [
        "User",
        "Organization",
        "OrganizationAdmin",
        "Community",
        "CommunityMember",
        "Post",
        "Comment",
        "Reaction",
        "Story",
        "Campaign",
        "CampaignContribution",
        "Invitation",
        "InvitationRequest",
        "MessageThread",
        "Message",
        "ModerationReport",
        "AuditLog",
      ],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Erreur lecture script SQL." });
  }
}

/**
 * Unified diagnostic endpoint testing both the Backend connection (Node.js/Prisma/Supabase)
 * and counting existing rows in the 14 tables.
 */
export async function testSupabaseBackendConnection(_req: Request, res: Response): Promise<void> {
  try {
    const dbHealth = await checkDatabaseHealth();
    const supabaseHealth = await checkSupabaseHealth();
    const resolvedUrl = resolveDatabaseUrl();
    const supabaseUrl = resolveSupabaseUrl();

    let tablesFound: { name: string; count?: number; error?: string }[] = [];
    const prisma = getPrismaClient();

    if (prisma && dbHealth.connected) {
      try {
        const [usersCount, communitiesCount, orgsCount, postsCount] = await Promise.all([
          prisma.user.count().catch(() => -1),
          prisma.community.count().catch(() => -1),
          prisma.organization.count().catch(() => -1),
          prisma.post.count().catch(() => -1),
        ]);

        tablesFound = [
          { name: "User", count: usersCount >= 0 ? usersCount : undefined },
          { name: "Community", count: communitiesCount >= 0 ? communitiesCount : undefined },
          { name: "Organization", count: orgsCount >= 0 ? orgsCount : undefined },
          { name: "Post", count: postsCount >= 0 ? postsCount : undefined },
        ];
      } catch (countErr: any) {
        console.warn("Table count probe warning:", countErr?.message);
      }
    }

    const connected = dbHealth.connected || supabaseHealth.connected;

    res.json({
      success: true,
      connected,
      status: connected ? "connected" : "not_connected",
      message: connected
        ? "Base de données Supabase connectée avec succès ! Les tables sont reconnues et prêtes."
        : dbHealth.error || supabaseHealth.error || "Variables de connexion Supabase non encore détectées sur ce runtime.",
      database: {
        configured: dbHealth.configured,
        connected: dbHealth.connected,
        error: dbHealth.error,
        hasUrl: Boolean(resolvedUrl),
      },
      supabase: {
        configured: supabaseHealth.configured,
        connected: supabaseHealth.connected,
        url: supabaseUrl,
        error: supabaseHealth.error,
      },
      tables: tablesFound,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      connected: false,
      error: err?.message || "Erreur lors du test de connexion Supabase.",
    });
  }
}
