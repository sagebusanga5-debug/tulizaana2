import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';

const rawSupabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

export const isSupabaseClientConfigured = Boolean(
  rawSupabaseUrl &&
  rawSupabaseKey &&
  rawSupabaseUrl.startsWith('https://') &&
  !rawSupabaseUrl.includes('your-project')
);

export const supabase: SupabaseClient | null = isSupabaseClientConfigured
  ? createClient(rawSupabaseUrl, rawSupabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;

/**
 * Helper to check frontend Supabase configuration status.
 * Ne touche aucune table métier : vérifie seulement la présence et la forme
 * des variables d'environnement.
 */
export function getSupabaseFrontendConfigStatus(): {
  configured: boolean;
  message: string;
} {
  if (!isSupabaseClientConfigured) {
    return {
      configured: false,
      message: 'Variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY non configurees.',
    };
  }
  return {
    configured: true,
    message: 'Client Supabase frontend configure (URL + clé publique).',
  };
}
