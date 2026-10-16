import { createClient, SupabaseClient } from "@supabase/supabase-js";

let serverSupabaseInstance: SupabaseClient | null = null;

/**
 * Resolves Supabase URL supporting standard and Vercel integration variables:
 * - SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_URL
 * - VITE_SUPABASE_URL
 */
export function resolveSupabaseUrl(): string | undefined {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;

  if (url && url.startsWith("https://") && !url.includes("your-project")) {
    return url.trim();
  }
  return undefined;
}

/**
 * Resolves Supabase Key supporting standard and Vercel integration variables:
 * - SUPABASE_SECRET_KEY (Vercel Integration Secret Key)
 * - SUPABASE_SERVICE_ROLE_KEY
 * - SUPABASE_PUBLISHABLE_KEY (Vercel Integration Publishable/Anon Key)
 * - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 * - SUPABASE_ANON_KEY
 * - VITE_SUPABASE_ANON_KEY
 */
export function resolveSupabaseKey(): string | undefined {
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (key && !key.includes("your-anon-key") && !key.includes("your_")) {
    return key.trim();
  }
  return undefined;
}

export function isSupabaseConfigured(): boolean {
  const url = resolveSupabaseUrl();
  const key = resolveSupabaseKey();
  return Boolean(url && key);
}

export function getServerSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (serverSupabaseInstance) {
    return serverSupabaseInstance;
  }

  const url = resolveSupabaseUrl()!;
  const key = resolveSupabaseKey()!;

  try {
    serverSupabaseInstance = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return serverSupabaseInstance;
  } catch (err) {
    console.warn("Failed to instantiate Supabase client:", err);
    return null;
  }
}

export async function checkSupabaseHealth(): Promise<{
  configured: boolean;
  url?: string;
  connected: boolean;
  status: "connected" | "not_configured" | "error";
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      connected: false,
      status: "not_configured",
    };
  }

  const client = getServerSupabase();
  if (!client) {
    return {
      configured: true,
      connected: false,
      status: "error",
      error: "Impossible d'initialiser le client Supabase",
    };
  }

  try {
    // Probe a basic Supabase API request with 3.5s timeout
    const probePromise = client.from("Community").select("id", { count: "exact", head: true });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Supabase connection timed out")), 3500)
    );

    await Promise.race([probePromise, timeoutPromise]);

    const rawUrl = resolveSupabaseUrl() || "";
    const sanitizedUrl = rawUrl.replace(
      /https:\/\/([^.]+)\..*/,
      "https://$1.supabase.co"
    );

    return {
      configured: true,
      url: sanitizedUrl,
      connected: true,
      status: "connected",
    };
  } catch (err: any) {
    const msg = err?.message || String(err);
    const isConnected = msg.includes("PGRST") || msg.includes("not found") || msg.includes("relation");

    return {
      configured: true,
      url: resolveSupabaseUrl(),
      connected: isConnected,
      status: isConnected ? "connected" : "error",
      error: isConnected ? undefined : msg,
    };
  }
}
