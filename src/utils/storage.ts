export const STORAGE_KEYS = {
  interfaceMode: 'tlz_interface_mode',
  customBrandIcon: 'tlz_custom_brand_icon',
  preferredLang: 'tlz_preferred_lang',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

const LEGACY_SENSITIVE_STORAGE_KEYS = [
  'tlz_is_logged_in',
  'tlz_partner_auth',
  'tlz_current_user',
  'tlz_all_users',
  'tlz_organizations',
  'tlz_current_organization',
  'tlz_posts',
  'tlz_stories',
  'tlz_campaigns',
  'tlz_communities',
  'tlz_threads',
  'tlz_invitations',
  'tlz_reports',
  'tlz_notifications',
  'tlz_invitation_requests',
  'tlz_admin_audit_logs',
  'tlz_registered_users',
  'tlz_user_post_translations',
  ['tlz', 'auth', 'token'].join('_'),
  'tlz_token',
  'token',
  'authToken',
  'jwt',
];

const PRESERVED_KEYS: StorageKey[] = [
  STORAGE_KEYS.interfaceMode,
  STORAGE_KEYS.customBrandIcon,
  STORAGE_KEYS.preferredLang,
];

export function clearSessionStorage(): void {
  for (const key of LEGACY_SENSITIVE_STORAGE_KEYS) {
    try {
      sessionStorage.removeItem(key);
    } catch {}
  }
}

export function clearSensitiveStorage(): void {
  for (const key of LEGACY_SENSITIVE_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
  clearSessionStorage();
}

export function clearAppStorage(): void {
  clearSensitiveStorage();
}

export function clearAllTulizaanaStorage(): void {
  clearAppStorage();
  for (const key of PRESERVED_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
}

export function getPreservedKeys(): StorageKey[] {
  return [...PRESERVED_KEYS];
}
