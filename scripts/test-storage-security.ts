/**
 * CHANTIER 6C - Sensitive Data & Browser Storage.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface TestResult {
  scenario: string;
  expected: string;
  status: "pass" | "fail";
  detail: string;
}

const results: TestResult[] = [];
let currentScenario = "";

function record(expected: string, condition: boolean, detail: string): void {
  results.push({ scenario: currentScenario, expected, status: condition ? "pass" : "fail", detail });
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SRC = path.resolve(ROOT, "src");

class FakeStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  keys(): string[] {
    return Object.keys(this.store);
  }

  getAll(): Record<string, string> {
    return { ...this.store };
  }
}

const fakeLocalStorage = new FakeStorage();
const fakeSessionStorage = new FakeStorage();
const originalLocalStorage = globalThis.localStorage;
const originalSessionStorage = globalThis.sessionStorage;
(globalThis as any).localStorage = fakeLocalStorage;
(globalThis as any).sessionStorage = fakeSessionStorage;

import {
  STORAGE_KEYS,
  clearSessionStorage,
  clearSensitiveStorage,
  clearAppStorage,
  clearAllTulizaanaStorage,
  getPreservedKeys,
} from "../src/utils/storage.js";

const allowedPersistentKeys = [
  STORAGE_KEYS.interfaceMode,
  STORAGE_KEYS.customBrandIcon,
  STORAGE_KEYS.preferredLang,
];

const forbiddenKeys = [
  "tlz_is_logged_in",
  "tlz_partner_auth",
  "tlz_current_user",
  "tlz_all_users",
  "tlz_organizations",
  "tlz_current_organization",
  "tlz_posts",
  "tlz_stories",
  "tlz_campaigns",
  "tlz_communities",
  "tlz_threads",
  "tlz_invitations",
  "tlz_reports",
  "tlz_notifications",
  "tlz_invitation_requests",
  "tlz_admin_audit_logs",
  "tlz_registered_users",
  "tlz_user_post_translations",
  "tlz_auth_token",
  "tlz_token",
  "token",
  "authToken",
  "jwt",
];

const forbiddenStorageKeyNames = forbiddenKeys.filter((key) => !["token", "authToken", "jwt"].includes(key));

function resetFakeStorage(): void {
  fakeLocalStorage.clear();
  fakeSessionStorage.clear();
}

function seedBothStorages(entries: Record<string, unknown>): void {
  resetFakeStorage();
  for (const [key, value] of Object.entries(entries)) {
    fakeLocalStorage.setItem(key, JSON.stringify(value));
    fakeSessionStorage.setItem(key, JSON.stringify(value));
  }
}

function readSourceFiles(dir: string): { file: string; source: string }[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: { file: string; source: string }[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...readSourceFiles(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push({ file: fullPath, source: fs.readFileSync(fullPath, "utf-8") });
    }
  }

  return files;
}

currentScenario = "Whitelist localStorage";
record(
  "seules les preferences non sensibles sont des STORAGE_KEYS actives",
  Object.values(STORAGE_KEYS).every((key) => allowedPersistentKeys.includes(key)),
  `cles actives: ${Object.values(STORAGE_KEYS).join(", ")}`
);

currentScenario = "clearSensitiveStorage supprime les anciennes donnees sensibles";
seedBothStorages({
  tlz_current_user: { id: "user-a", name: "Alice" },
  tlz_threads: [{ id: "thread-a", messages: ["secret-a"] }],
  tlz_reports: [{ id: "report-a", details: "signalement-a" }],
  tlz_all_users: [{ id: "user-a" }],
  tlz_registered_users: [{ email: "a@example.test", password: "secret" }],
  tlz_auth_token: "jwt.secret",
  [STORAGE_KEYS.interfaceMode]: "partner",
  [STORAGE_KEYS.preferredLang]: "fr",
});
clearSensitiveStorage();
record(
  "localStorage et sessionStorage ne contiennent plus de donnees sensibles legacy",
  forbiddenKeys.every((key) => !fakeLocalStorage.keys().includes(key) && !fakeSessionStorage.keys().includes(key)),
  `local=${fakeLocalStorage.keys().join(", ")} session=${fakeSessionStorage.keys().join(", ")}`
);

currentScenario = "Preferences preservees au logout applicatif";
seedBothStorages({
  tlz_current_user: { id: "user-a" },
  tlz_posts: [{ content: "prive" }],
  [STORAGE_KEYS.interfaceMode]: "user",
  [STORAGE_KEYS.customBrandIcon]: "https://example.test/icon.png",
  [STORAGE_KEYS.preferredLang]: "sw",
});
clearAppStorage();
record(
  "interfaceMode, customBrandIcon et preferredLang restent; le reste disparait",
  allowedPersistentKeys.every((key) => fakeLocalStorage.keys().includes(key)) &&
    forbiddenKeys.every((key) => !fakeLocalStorage.keys().includes(key)),
  `cles restantes: ${fakeLocalStorage.keys().join(", ")}`
);

currentScenario = "clearSessionStorage supprime les jetons et marques legacy";
seedBothStorages({
  tlz_partner_auth: "true",
  tlz_auth_token: "jwt.secret",
});
clearSessionStorage();
record(
  "aucun token ni indicateur auth ne reste en sessionStorage",
  forbiddenKeys.every((key) => !fakeSessionStorage.keys().includes(key)),
  `session=${fakeSessionStorage.keys().join(", ")}`
);

currentScenario = "Isolation poste partage User A -> User B";
seedBothStorages({
  tlz_current_user: { id: "user-a", name: "Alice" },
  tlz_threads: [{ id: "thread-a", messages: ["secret Alice"] }],
  tlz_reports: [{ id: "report-a", details: "Alice report" }],
});
clearAppStorage();
fakeLocalStorage.setItem(STORAGE_KEYS.interfaceMode, "user");
const afterSwitch = JSON.stringify(fakeLocalStorage.getAll());
record(
  "aucune valeur sensible de A ne survit dans le stockage de B",
  !afterSwitch.includes("Alice") && !afterSwitch.includes("secret Alice") && !afterSwitch.includes("report-a"),
  afterSwitch
);

currentScenario = "clearAllTulizaanaStorage supprime aussi les preferences";
seedBothStorages({
  [STORAGE_KEYS.interfaceMode]: "partner",
  [STORAGE_KEYS.customBrandIcon]: "https://example.test/icon.png",
  [STORAGE_KEYS.preferredLang]: "en",
});
clearAllTulizaanaStorage();
record(
  "aucune cle Tulizaana ne reste apres nettoyage complet",
  fakeLocalStorage.keys().length === 0,
  `cles restantes: ${fakeLocalStorage.keys().join(", ")}`
);

currentScenario = "getPreservedKeys retourne la liste blanche";
record(
  "liste blanche explicite et limitee",
  JSON.stringify(getPreservedKeys().sort()) === JSON.stringify([...allowedPersistentKeys].sort()),
  `preservees: ${getPreservedKeys().join(", ")}`
);

const sourceFiles = readSourceFiles(SRC);
const sourceWithoutStorageUtil = sourceFiles.filter((item) => !item.file.endsWith(path.join("utils", "storage.ts")));
const appSource = fs.readFileSync(path.resolve(ROOT, "src/App.tsx"), "utf-8");
const supabaseSource = fs.readFileSync(path.resolve(ROOT, "src/services/supabaseClient.ts"), "utf-8");
const viteSource = fs.readFileSync(path.resolve(ROOT, "vite.config.ts"), "utf-8");

currentScenario = "Sources frontend sans cles sensibles persistantes";
const forbiddenSourceHits = sourceWithoutStorageUtil.flatMap(({ file, source }) =>
  forbiddenStorageKeyNames
    .filter((key) => source.includes(key))
    .map((key) => `${path.relative(ROOT, file)}:${key}`)
);
record(
  "les anciennes cles sensibles ne sont presentes que dans la migration storage.ts",
  forbiddenSourceHits.length === 0,
  forbiddenSourceHits.join(", ") || "aucun hit"
);

currentScenario = "Aucune ecriture locale de donnees metier";
const illegalStorageWrites = sourceWithoutStorageUtil.flatMap(({ file, source }) => {
  const hits = [...source.matchAll(/localStorage\.setItem\(([^)]*)\)/g)]
    .map((match) => match[0])
    .filter(
      (call) =>
        !allowedPersistentKeys.some((key) => call.includes(key)) &&
        !call.includes("STORAGE_KEYS.interfaceMode") &&
        !call.includes("STORAGE_KEYS.preferredLang") &&
        !call.includes("STORAGE_KEYS.customBrandIcon") &&
        !call.includes("BRAND_ICON_STORAGE_KEY")
    );
  return hits.map((hit) => `${path.relative(ROOT, file)}:${hit}`);
});
record(
  "localStorage.setItem limite aux preferences autorisees",
  illegalStorageWrites.length === 0,
  illegalStorageWrites.join(" | ") || "aucune ecriture interdite"
);

currentScenario = "Aucun JWT dans localStorage/sessionStorage";
record(
  "pas de stockage JS persistant pour les jetons",
  !sourceWithoutStorageUtil.some(({ source }) => /(?:localStorage|sessionStorage)\.setItem\([^)]*(?:token|jwt|auth)/i.test(source)),
  "scan setItem token/jwt/auth"
);

currentScenario = "Logout nettoie stockage et etat React";
record(
  "handleLogout utilise clearAppStorage et resetSensitiveReactState",
  appSource.includes("clearAppStorage()") && appSource.includes("resetSensitiveReactState()"),
  "App.tsx doit nettoyer stockage legacy et memoire React"
);

currentScenario = "Supabase frontend ne persiste pas de session auth";
record(
  "persistSession=false, autoRefreshToken=false, detectSessionInUrl=false",
  supabaseSource.includes("persistSession: false") &&
    supabaseSource.includes("autoRefreshToken: false") &&
    supabaseSource.includes("detectSessionInUrl: false") &&
    !supabaseSource.includes("persistSession: true"),
  "configuration Supabase frontend"
);

currentScenario = "Service worker sans cache API sensible";
record(
  "vite-plugin-pwa ne configure pas de runtimeCaching API",
  !/runtimeCaching[\s\S]*urlPattern[\s\S]*\/api/.test(viteSource),
  "runtimeCaching ne doit viser que les assets statiques / fonts"
);

(globalThis as any).localStorage = originalLocalStorage;
(globalThis as any).sessionStorage = originalSessionStorage;

console.log("\n========================================");
console.log("CHANTIER 6C - Storage Security Tests");
console.log("========================================\n");

let passCount = 0;
let failCount = 0;

for (const r of results) {
  const icon = r.status === "pass" ? "PASS" : "FAIL";
  console.log(`[${icon}] ${r.scenario}`);
  console.log(`       Expected: ${r.expected}`);
  console.log(`       Detail:   ${r.detail}\n`);
  if (r.status === "pass") passCount++;
  else failCount++;
}

console.log("----------------------------------------");
console.log(`Total: ${results.length} | PASS: ${passCount} | FAIL: ${failCount}`);
console.log("----------------------------------------\n");

if (failCount > 0) {
  process.exitCode = 1;
}
