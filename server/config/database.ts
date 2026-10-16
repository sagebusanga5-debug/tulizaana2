import { PrismaClient } from "@prisma/client";

// Global declaration for Prisma singleton in Node.js development mode
declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

/**
 * Lazy, singleton initialization for Prisma Client.
 * Avoids spawning multiple connection pools during dev mode reload cycles.
 * Safe fallback if DATABASE_URL or POSTGRES_* is not yet provided.
 */
let prismaInstance: PrismaClient | null = null;

/**
 * Helper to determine if a database URL contains an actual connection string
 * or merely an unconfigured placeholder/template.
 */
export function isConfiguredDatabaseUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("postgresql://") && !trimmed.startsWith("postgres://")) {
    return false;
  }
  // Detect standard placeholders (e.g. USER:PASSWORD, USER@HOST, @HOST)
  if (
    trimmed.includes("USER:PASSWORD") ||
    trimmed.includes("USER@HOST") ||
    trimmed.includes("@HOST/") ||
    trimmed.includes("@HOST:") ||
    trimmed.endsWith("@HOST") ||
    trimmed === "postgresql://" ||
    trimmed === "postgres://"
  ) {
    return false;
  }
  return true;
}

/**
 * Resolves the active PostgreSQL database URL.
 * Automatically recognizes Vercel-Supabase integration variables:
 * 1. POSTGRES_PRISMA_URL (Vercel-Supabase pooled connection for Prisma)
 * 2. POSTGRES_URL (Vercel-Supabase pooled connection)
 * 3. DATABASE_URL (Standard Prisma variable)
 * 4. POSTGRES_URL_NON_POOLING (Direct PostgreSQL connection)
 * 5. Reconstructed from discrete variables (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_DATABASE)
 */
export function resolveDatabaseUrl(): string | undefined {
  const candidates = [
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL_NON_POOLING,
  ];

  for (const candidate of candidates) {
    if (isConfiguredDatabaseUrl(candidate)) {
      return candidate?.trim();
    }
  }

  // Reconstruct if individual POSTGRES_* parameters are set
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  const host = process.env.POSTGRES_HOST;
  const db = process.env.POSTGRES_DATABASE || "postgres";

  if (user && password && host) {
    const encodedUser = encodeURIComponent(user);
    const encodedPass = encodeURIComponent(password);
    return `postgresql://${encodedUser}:${encodedPass}@${host}/${db}?sslmode=require`;
  }

  return undefined;
}

export function getPrismaClient(): PrismaClient | null {
  const url = resolveDatabaseUrl();
  if (!url) {
    return null;
  }

  // Synchronize process.env.DATABASE_URL so Prisma internals use the resolved connection string
  if (!process.env.DATABASE_URL || !isConfiguredDatabaseUrl(process.env.DATABASE_URL)) {
    process.env.DATABASE_URL = url;
  }

  try {
    if (process.env.NODE_ENV === "production") {
      if (!prismaInstance) {
        prismaInstance = new PrismaClient({
          log: ["error", "warn"],
        });
      }
      return prismaInstance;
    }

    // Development mode caching on globalThis to prevent multiple connection pools during reloads
    if (!globalThis.__prismaClient) {
      globalThis.__prismaClient = new PrismaClient({
        log: ["query", "error", "warn"],
      });
    }
    return globalThis.__prismaClient;
  } catch (err) {
    console.warn("PrismaClient failed to instantiate gracefully:", err);
    return null;
  }
}

/**
 * Check connectivity to PostgreSQL database.
 * Returns { configured, connected }.
 * Never throws and never leaks credentials so server startup is never blocked.
 */
export async function checkDatabaseHealth(): Promise<{
  configured: boolean;
  connected: boolean;
  error?: string;
}> {
  const resolvedUrl = resolveDatabaseUrl();
  const isConfigured = Boolean(resolvedUrl);

  if (!isConfigured) {
    return {
      configured: false,
      connected: false,
    };
  }

  const client = getPrismaClient();
  if (!client) {
    return {
      configured: true,
      connected: false,
      error: "Impossible d'instancier PrismaClient avec l'URL résolue.",
    };
  }

  try {
    // Quick probe query with a 3.5-second timeout to prevent blocking on unreachable remote hosts
    const probePromise = client.$queryRaw`SELECT 1`;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Connection timeout")), 3500)
    );

    await Promise.race([probePromise, timeoutPromise]);
    return {
      configured: true,
      connected: true,
    };
  } catch (err) {
    // Sanitize any error message to strictly prevent leaking credentials or connection strings
    const rawMessage = err instanceof Error ? err.message : String(err);
    const sanitized = rawMessage
      .replace(/:\/\/.*?@/g, "://***:***@")
      .split("\n")[0];

    return {
      configured: true,
      connected: false,
      error: sanitized.includes("timeout") ? "Database connection timed out." : "Database connection failed.",
    };
  }
}
