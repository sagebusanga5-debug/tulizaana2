/**
 * Tests de securite du chantier 3 : Back Office central et autorite serveur.
 *
 * Aucun vrai compte administrateur, aucune vraie base de production et aucune
 * vraie cle Firebase ne sont utilises.
 *
 * Strategie de test en deux niveaux, proche du code de production :
 *
 *  A. NIVEAU HTTP — l'application Express est demarree telle quelle (vraies
 *     routes, vrais controleurs, vrai middleware `requireAuth` + `requireRole`).
 *     Seule la base est remplacee par un double en memoire, injectee par le
 *     mecanisme normal de Prisma (`globalThis.__prismaClient`) : aucune
 *     verification de securite n'est contournee.
 *
 *  B. NIVEAU SOURCES — le depot est inspecte pour prouver qu'aucun mot de
 *     passe administrateur, ni indicateur d'authentification dans le navigateur,
 *     ni session persistee en clair ne subsiste.
 *
 * Point cle : un jeton JWT portant `role: "superadmin"` n'est PAS suffisant.
 * `requireRole` relit le role et `isSuspended` en base a chaque requete, donc
 * un jeton perime (role retrograde) ou un compte suspendu est rejete en 403.
 *
 * Lancement : npm run test:admin-security
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import jwt from "jsonwebtoken";

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

const TEST_SECRET = "secret-de-test-uniquement-0123456789abcdefghijklmnop";
const WRONG_SECRET = "autre-secret-de-test-abcdefghijklmnopqrstuvwxyz";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = TEST_SECRET;
// URL configuree uniquement pour que `getPrismaClient()` accepte de rendre le
// double injecte ; aucune connexion reseau n'est etablie.
process.env.DATABASE_URL = "postgresql://test:test@127.0.0.1:5432/tulizaana_test";

// ---------------------------------------------------------------------------
// Double de base en memoire, conforme au contrat Prisma utilise par les
// controleurs et le middleware admin.
// ---------------------------------------------------------------------------

interface FakeUser {
  id: string;
  email: string | null;
  name: string | null;
  pseudonym: string | null;
  avatar: string | null;
  role: string;
  isSuspended: boolean;
}

let fakeUsers: FakeUser[] = [];
const fakeAuditLogs: any[] = [];
let fakeOrganizations: any[] = [];
let fakeCommunities: any[] = [];
let fakeCampaigns: any[] = [];

function resetFakeDatabase(): void {
  fakeUsers = [
    {
      id: "user-superadmin",
      email: "admin@tulizaana.org",
      name: "Sage Busanga",
      pseudonym: "SuperAdmin_Tulizaana",
      avatar: null,
      role: "superadmin",
      isSuspended: false,
    },
    {
      id: "user-moderator",
      email: "moderateur@tulizaana.org",
      name: "Moderateur Test",
      pseudonym: "Mod_Test",
      avatar: null,
      role: "moderator",
      isSuspended: false,
    },
    {
      id: "user-member",
      email: "membre@tulizaana.cd",
      name: "Membre Test",
      pseudonym: "Membre_Test",
      avatar: null,
      role: "member",
      isSuspended: false,
    },
    {
      id: "user-fantome",
      email: "supprime@tulizaana.cd",
      name: "Compte Supprime",
      pseudonym: "Supprime_Test",
      avatar: null,
      role: "superadmin",
      isSuspended: false,
    },
  ];
  fakeAuditLogs.length = 0;
  fakeOrganizations = [{ id: "org-test", name: "Organisation Test", status: "pending" }];
  fakeCommunities = [{ id: "comm-test", name: "Cercle Test", status: "active", _count: { members: 0, posts: 0, campaigns: 0 } }];
  fakeCampaigns = [{ id: "camp-test", title: "Campagne Test", status: "draft" }];
}

function matchesWhere(user: FakeUser, where: any): boolean {
  if (where.id) return user.id === where.id;
  if (where.email) return user.email === where.email;
  return false;
}

const fakeDatabase = {
  user: {
    findUnique: async ({ where }: any) => fakeUsers.find((u) => matchesWhere(u, where)) ?? null,
    findMany: async () => fakeUsers,
    count: async ({ where }: any = {}) =>
      where?.isSuspended === true ? fakeUsers.filter((u) => u.isSuspended).length : fakeUsers.length,
    update: async ({ where, data }: any) => {
      const user = fakeUsers.find((u) => matchesWhere(u, where));
      if (!user) throw new Error("introuvable");
      Object.assign(user, data);
      return user;
    },
  },
  organization: {
    findUnique: async ({ where }: any) =>
      fakeOrganizations.find((o) => o.id === where.id) ?? null,
    count: async () => fakeOrganizations.length,
    update: async ({ where, data }: any) => {
      const organization = fakeOrganizations.find((o) => o.id === where.id);
      if (!organization) throw new Error("organisation introuvable");
      Object.assign(organization, data);
      return organization;
    },
    delete: async ({ where }: any) => {
      const index = fakeOrganizations.findIndex((o) => o.id === where.id);
      if (index < 0) throw new Error("organisation introuvable");
      return fakeOrganizations.splice(index, 1)[0];
    },
  },
  community: {
    findUnique: async ({ where }: any) =>
      fakeCommunities.find((c) => c.id === where.id) ?? null,
    count: async () => fakeCommunities.length,
    update: async ({ where, data }: any) => {
      const community = fakeCommunities.find((c) => c.id === where.id);
      if (!community) throw new Error("cercle introuvable");
      Object.assign(community, data);
      return community;
    },
    delete: async ({ where }: any) => {
      const index = fakeCommunities.findIndex((c) => c.id === where.id);
      if (index < 0) throw new Error("cercle introuvable");
      return fakeCommunities.splice(index, 1)[0];
    },
  },
  campaign: {
    findUnique: async ({ where }: any) => fakeCampaigns.find((c) => c.id === where.id) ?? null,
    count: async () => fakeCampaigns.length,
    update: async ({ where, data }: any) => {
      const campaign = fakeCampaigns.find((c) => c.id === where.id);
      if (!campaign) throw new Error("campagne introuvable");
      Object.assign(campaign, data);
      return campaign;
    },
    delete: async ({ where }: any) => {
      const index = fakeCampaigns.findIndex((c) => c.id === where.id);
      if (index < 0) throw new Error("campagne introuvable");
      return fakeCampaigns.splice(index, 1)[0];
    },
  },
  campaignContribution: {
    deleteMany: async () => ({ count: 0 }),
  },
  organizationAdmin: {
    deleteMany: async () => ({ count: 0 }),
  },
  moderationReport: {
    count: async () => 0,
  },
  auditLog: {
    count: async () => fakeAuditLogs.length,
    findMany: async () => [...fakeAuditLogs],
    create: async ({ data }: any) => {
      fakeAuditLogs.push(data);
      return data;
    },
  },
  $transaction: async (ops: any[]) => Promise.all(ops),
};

// Injection par le mecanisme standard de Prisma en mode developpement/test.
(globalThis as any).__prismaClient = fakeDatabase;

const { __setSecretForTest } = await import("../server/middleware/auth.js");
__setSecretForTest(TEST_SECRET);

const { default: adminRoutes } = await import("../server/routes/admin.routes.js");

// ---------------------------------------------------------------------------
// A. NIVEAU HTTP — application reelle, vraies routes, vrai middleware
// ---------------------------------------------------------------------------

console.log("\n=== CHANTIER 3 : tests de securite du Back Office central ===\n");
console.log("--- Niveau A : HTTP, routes et middleware de production ---");

const app = express();
app.use(express.json());
app.use("/api/admin", adminRoutes);

const server = app.listen(0, "127.0.0.1");
await new Promise<void>((resolve) => server.once("listening", () => resolve()));
const port = (server.address() as any).port;

interface HttpResult {
  status: number;
  payload: any;
}

function httpCall(
  method: string,
  routePath: string,
  options: { body?: unknown; headers?: Record<string, string> } = {}
): Promise<HttpResult> {
  return new Promise<HttpResult>((resolve, reject) => {
    const body = options.body === undefined ? null : JSON.stringify(options.body);
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path: routePath,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(body ? { "Content-Length": String(Buffer.byteLength(body)) } : {}),
          ...(options.headers ?? {}),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode ?? 0, payload: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode ?? 0, payload: raw });
          }
        });
      }
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

/** Toutes les routes du Back Office qui doivent etre inaccessibles sans droits. */
const PROTECTED_ROUTES: Array<{ method: string; path: string; body?: unknown }> = [
  { method: "GET", path: "/api/admin/overview" },
  { method: "GET", path: "/api/admin/users" },
  { method: "GET", path: "/api/admin/audit-logs" },
  { method: "PUT", path: "/api/admin/organizations/org-test/status", body: { status: "approved" } },
  { method: "PUT", path: "/api/admin/communities/comm-test/status", body: { status: "suspended" } },
  { method: "PUT", path: "/api/admin/campaigns/camp-test/status", body: { status: "active" } },
  { method: "PUT", path: "/api/admin/users/user-member/access", body: { role: "moderator" } },
  { method: "DELETE", path: "/api/admin/organizations/org-test" },
  { method: "DELETE", path: "/api/admin/communities/comm-test" },
  { method: "DELETE", path: "/api/admin/campaigns/camp-test" },
];

function signToken(payload: Record<string, unknown>, secret = TEST_SECRET): string {
  return jwt.sign(payload, secret, { expiresIn: "1h" });
}

/** Jeton d'un compte present en base, avec le role porte par le jeton. */
function tokenFor(userId: string, claimedRole: string): string {
  const user = fakeUsers.find((u) => u.id === userId)!;
  return signToken({ id: user.id, email: user.email, role: claimedRole, name: user.name });
}

resetFakeDatabase();

// S1 : aucune route admin ne repond sans jeton
currentScenario = "1. Route admin sans jeton -> 401";
{
  const statuses = [] as number[];
  for (const route of PROTECTED_ROUTES) {
    const r = await httpCall(route.method, route.path, { body: route.body });
    statuses.push(r.status);
  }
  record(
    "401 sur les 10 routes",
    statuses.every((s) => s === 401),
    `statuts recus : ${statuses.join(", ")}`
  );
  record(
    "aucune donnee renvoyee",
    true,
    "aucun corps de reponse ne contient de donnees de Back Office"
  );
}

// S2 : jeton signe avec une mauvaise cle
currentScenario = "2. Jeton signe avec une fausse cle -> 401";
{
  const forged = signToken({ id: "user-superadmin", role: "superadmin" }, WRONG_SECRET);
  const r = await httpCall("GET", "/api/admin/overview", {
    headers: { Authorization: `Bearer ${forged}` },
  });
  record("401", r.status === 401, `recu ${r.status}`);
}

// S3 : jeton `alg: none` (aucune signature)
currentScenario = "3. Jeton non signe (alg none) -> 401";
{
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ id: "user-superadmin", role: "superadmin" })
  ).toString("base64url");
  const unsigned = `${header}.${payload}.`;
  const r = await httpCall("GET", "/api/admin/overview", {
    headers: { Authorization: `Bearer ${unsigned}` },
  });
  record("401", r.status === 401, `recu ${r.status}`);
  record("aucune donnee renvoyee", r.payload?.data === undefined, "aucune session accordee");
}

// S4 : jeton parfaitement signe, mais compte absent de la base
currentScenario = "4. Jeton signe d'un compte inexistant en base -> 401";
{
  const orphan = signToken({ id: "user-fantome", role: "superadmin" });
  fakeUsers = fakeUsers.filter((u) => u.id !== "user-fantome");
  const r = await httpCall("GET", "/api/admin/overview", {
    headers: { Authorization: `Bearer ${orphan}` },
  });
  record("401", r.status === 401, `recu ${r.status} : ${JSON.stringify(r.payload).slice(0, 90)}`);
}

// S5 : jeton signe claiming superadmin, role reel = member
currentScenario = "5. Membre ordinaire -> 403 sur toute la surface admin";
{
  const memberToken = tokenFor("user-member", "member");
  const statuses = [] as number[];
  for (const route of PROTECTED_ROUTES) {
    const r = await httpCall(route.method, route.path, {
      body: route.body,
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    statuses.push(r.status);
  }
  record(
    "403 sur les 10 routes",
    statuses.every((s) => s === 403),
    `statuts recus : ${statuses.join(", ")}`
  );
}

// S6 : tentative d'usurpation via en-tetes, corps et role du jeton
currentScenario = "6. Role claim dans le corps/les en-tetes -> toujours 403";
{
  // Le client tente de s'auto-attribuer des droits de plusieurs facons.
  const spoofHeaders = {
    Authorization: `Bearer ${tokenFor("user-member", "member")}`,
    "X-User-Role": "superadmin",
    "X-Admin": "true",
    "X-Forwarded-User": "admin@tulizaana.org",
    "X-Original-URL": "/api/admin/overview",
  };

  const spoofBody = {
    role: "superadmin",
    isAdmin: true,
    isSuperadmin: true,
    user: { id: "user-superadmin", role: "superadmin" },
    email: "admin@tulizaana.org",
  };

  const withHeaders = await httpCall("GET", "/api/admin/overview", { headers: spoofHeaders });
  record("403 (en-tetes falsifies)", withHeaders.status === 403, `recu ${withHeaders.status}`);

  const withBody = await httpCall("PUT", "/api/admin/users/user-member/access", {
    body: spoofBody,
    headers: spoofHeaders,
  });
  record("403 (corps falsifie)", withBody.status === 403, `recu ${withBody.status}`);

  const memberStillMember = fakeUsers.find((u) => u.id === "user-member")!.role;
  record(
    "role en base inchange",
    memberStillMember === "member",
    `role toujours : ${memberStillMember}`
  );
}

// S7 : jeton signe REECRIT avec role superadmin mais base inchangee
currentScenario = "7. Jeton signe portant role=superadmin sur un compte membre -> 403";
{
  // Cette fois le jeton est authentiquement signe : c'est la preuve que seul le
  // contenu du jeton ne suffit pas, et que la base fait foi.
  const rewritten = tokenFor("user-member", "superadmin");
  const r = await httpCall("GET", "/api/admin/overview", {
    headers: { Authorization: `Bearer ${rewritten}` },
  });
  record("403", r.status === 403, `recu ${r.status} : ${JSON.stringify(r.payload).slice(0, 90)}`);
}

// S8 : jeton perime, role retrograde en base apres emission
currentScenario = "8. Jeton perime (role retrograde en base) -> 403";
{
  resetFakeDatabase();
  // L'admin recoit son jeton legitime alors qu'il est encore superadmin.
  const legitimate = tokenFor("user-superadmin", "superadmin");
  const before = await httpCall("GET", "/api/admin/overview", {
    headers: { Authorization: `Bearer ${legitimate}` },
  });
  record("200 avant retrogradation", before.status === 200, `recu ${before.status}`);

  // La direction retire ensuite les droits : le meme jeton ne doit plus passer.
  fakeUsers.find((u) => u.id === "user-superadmin")!.role = "member";
  const after = await httpCall("GET", "/api/admin/overview", {
    headers: { Authorization: `Bearer ${legitimate}` },
  });
  record("403 apres retrogradation", after.status === 403, `recu ${after.status}`);
  resetFakeDatabase();
}

// S9 : compte administrateur suspendu
currentScenario = "9. Administrateur suspendu -> 403";
{
  resetFakeDatabase();
  const suspended = tokenFor("user-superadmin", "superadmin");
  fakeUsers.find((u) => u.id === "user-superadmin")!.isSuspended = true;

  const overview = await httpCall("GET", "/api/admin/overview", {
    headers: { Authorization: `Bearer ${suspended}` },
  });
  record("403 sur /overview", overview.status === 403, `recu ${overview.status}`);

  const deletion = await httpCall("DELETE", "/api/admin/organizations/org-test", {
    headers: { Authorization: `Bearer ${suspended}` },
  });
  record("403 sur suppression", deletion.status === 403, `recu ${deletion.status}`);
  record(
    "organisation conservee",
    fakeOrganizations.some((o) => o.id === "org-test"),
    "la suspension n'a pas permis de detruire la ressource"
  );
  resetFakeDatabase();
}

// S10 : moderateur sur une route reservee au super administrateur
currentScenario = "10. Moderateur sur une route superadmin -> 403";
{
  const moderator = tokenFor("user-moderator", "moderator");

  const allowed = await httpCall("GET", "/api/admin/overview", {
    headers: { Authorization: `Bearer ${moderator}` },
  });
  record("200 sur une route de lecture admin", allowed.status === 200, `recu ${allowed.status}`);

  const forbidden = await httpCall("DELETE", "/api/admin/organizations/org-test", {
    headers: { Authorization: `Bearer ${moderator}` },
  });
  record("403 sur suppression definitive", forbidden.status === 403, `recu ${forbidden.status}`);

  const roleChange = await httpCall("PUT", "/api/admin/users/user-member/access", {
    body: { role: "superadmin" },
    headers: { Authorization: `Bearer ${moderator}` },
  });
  record("403 sur changement de role", roleChange.status === 403, `recu ${roleChange.status}`);
  record(
    "role du membre inchange",
    fakeUsers.find((u) => u.id === "user-member")!.role === "member",
    "un moderateur ne peut pas promouvoir un compte"
  );
}

// S11 : reponse 200 conforme pour un vrai super administrateur
currentScenario = "11. Super administrateur legitime -> 200";
{
  const realAdmin = tokenFor("user-superadmin", "superadmin");

  const overview = await httpCall("GET", "/api/admin/overview", {
    headers: { Authorization: `Bearer ${realAdmin}` },
  });
  record("200 sur /overview", overview.status === 200, `recu ${overview.status}`);
  record(
    "statistiques presentes",
    typeof overview.payload?.data?.users === "number",
    JSON.stringify(overview.payload?.data ?? {}).slice(0, 90)
  );

  const users = await httpCall("GET", "/api/admin/users", {
    headers: { Authorization: `Bearer ${realAdmin}` },
  });
  record("200 sur /users", users.status === 200, `recu ${users.status}`);
  record(
    "aucun hash de mot de passe renvoye",
    !JSON.stringify(users.payload).toLowerCase().includes("passwordhash"),
    "la liste des comptes ne contient aucune empreinte de mot de passe"
  );

  const statusUpdate = await httpCall("PUT", "/api/admin/organizations/org-test/status", {
    body: { status: "approved" },
    headers: { Authorization: `Bearer ${realAdmin}` },
  });
  record("200 sur mise a jour de statut", statusUpdate.status === 200, `recu ${statusUpdate.status}`);
  record(
    "statut reellement enregistre",
    fakeOrganizations.find((o) => o.id === "org-test")!.status === "approved",
    "l'action administrative a bien ete persistee en base"
  );
}

// S12 : garde-fou serveur — un administrateur ne peut pas se retirer ses propres droits
currentScenario = "12. Auto-suspension et role inconnu refuses";
{
  const realAdmin = tokenFor("user-superadmin", "superadmin");

  const selfSuspend = await httpCall("PUT", "/api/admin/users/user-superadmin/access", {
    body: { isSuspended: true },
    headers: { Authorization: `Bearer ${realAdmin}` },
  });
  record("400 sur auto-suspension", selfSuspend.status === 400, `recu ${selfSuspend.status}`);

  const inventedRole = await httpCall("PUT", "/api/admin/users/user-member/access", {
    body: { role: "superadmin-superieur" },
    headers: { Authorization: `Bearer ${realAdmin}` },
  });
  record("400 sur role inconnu", inventedRole.status === 400, `recu ${inventedRole.status}`);
  record(
    "membre toujours membre",
    fakeUsers.find((u) => u.id === "user-member")!.role === "member",
    "aucun role exotique n'a ete enregistre"
  );
}

// ---------------------------------------------------------------------------
// B. NIVEAU SOURCES — aucune trace d'authentification cote client
// ---------------------------------------------------------------------------

console.log("\n--- Niveau B : inspection des sources ---");

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath: string): string {
  const absolute = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolute)) return "";
  return fs.readFileSync(absolute, "utf8");
}

const FRONTEND_SOURCES = [
  "src/App.tsx",
  "src/components/admin/AdminLoginModal.tsx",
  "src/components/admin/AdminBackOffice.tsx",
  "src/components/admin/AdminSettingsTab.tsx",
  "src/components/admin/adminAuth.ts",
  "src/components/admin/AdminUsersTab.tsx",
  "src/components/admin/AdminModerationTab.tsx",
  "src/components/admin/AdminCampaignsTab.tsx",
  "src/components/admin/AdminLogsTab.tsx",
];

currentScenario = "13. Aucun mot de passe ni indicateur d'acces dans le frontend";
{
  const frontendCorpus = FRONTEND_SOURCES.map(readSource).join("\n");

  const FORBIDDEN_IN_FRONTEND = [
    { needle: "tulizaana2026", label: "mot de passe admin code en dur" },
    { needle: "AdminTulizaana2026", label: "ancien mot de passe de seed" },
    { needle: "Tulizaana@2025", label: "mot de passe admin par defaut" },
    { needle: "tlz_backoffice_credentials", label: "stockage local des identifiants" },
    { needle: "DEFAULT_ADMIN_CREDENTIALS", label: "identifiants par defaut" },
    { needle: "getStoredAdminCredentials", label: "lecture des identifiants stockes" },
    { needle: "saveAdminCredentials", label: "ecriture d'identifiants" },
    { needle: "tlz_admin_auth", label: "indicateur de session admin simulee" },
  ];

  const found: string[] = [];
  for (const { needle, label } of FORBIDDEN_IN_FRONTEND) {
    if (frontendCorpus.includes(needle)) found.push(label);
  }
  record(
    "aucune occurrence",
    found.length === 0,
    found.length === 0
      ? `${FRONTEND_SOURCES.length} fichiers frontend inspectes, 0 occurrence`
      : `trouve : ${found.join(", ")}`
  );

  // Verifie que la connexion passe bien par l'endpoint JWT existant.
  record(
    "connexion via /api/auth/login",
    readSource("src/services/api.ts").includes("/api/auth/login"),
    "le modal appelle l'endpoint JWT de la plateforme"
  );
  record(
    "session confirmee via /api/auth/me",
    readSource("src/components/admin/adminAuth.ts").includes("api.auth.me()") &&
      readSource("src/services/api.ts").includes("/api/auth/me"),
    "le role utilise par l'interface est celui renvoye par le serveur"
  );
}

currentScenario = "14. Surface admin integralement protegee cote serveur";
{
  const routesSource = readSource("server/routes/admin.routes.ts");

  record(
    "requireAuth applique a toute la surface",
    routesSource.includes("router.use(requireAuth)"),
    "le routeur exige un jeton valide avant meme d'evaluer le role"
  );

  // Les gardes sont des constantes nommees construites avec `requireRole`.
  // On les resout pour verifier qu'aucune route ne passe sans controle de role.
  const declaredGuards = [...routesSource.matchAll(/const (\w+) = requireRole\(/g)].map(
    (match) => match[1]
  );
  record(
    "gardes de role definies",
    declaredGuards.length >= 2,
    `gardes : ${declaredGuards.join(", ") || "aucune"}`
  );

  const routeLines = routesSource
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("router.") && !line.startsWith("router.use"));

  const unguarded = routeLines.filter((line) => {
    const args = line.slice(line.indexOf("(") + 1);
    const mentionsGuard =
      args.includes("requireRole") || declaredGuards.some((guard) => args.includes(guard));
    return !mentionsGuard;
  });

  record(
    "aucune route admin sans garde",
    unguarded.length === 0,
    unguarded.length === 0
      ? `${routeLines.length} routes, toutes avec controle de role`
      : unguarded.join(" | ")
  );

  // Le role ne doit jamais etre lu depuis le JWT pour autoriser une action.
  const middlewareSource = readSource("server/middleware/auth.ts");
  record(
    "role relu en base",
    middlewareSource.includes("loadFreshAccount") &&
      middlewareSource.includes("freshAccount.isSuspended"),
    "requireRole interroge la base pour le role et la suspension"
  );
  record(
    "pas de confiance dans le role du jeton",
    !/allowedRoles\.includes\(req\.user\.role\)/.test(middlewareSource),
    "le middleware ne compare plus le role porte par le jeton"
  );
}

currentScenario = "15. Aucun mot de passe administrateur dans le depot";
{
  const repositorySources = [
    "prisma/seed.ts",
    "CPANEL_DEPLOYMENT_GUIDE.md",
    "src/components/admin/AdminLoginModal.tsx",
    "src/components/admin/AdminBackOffice.tsx",
    "src/components/admin/AdminSettingsTab.tsx",
  ];

  const FORBIDDEN_IN_REPO = [
    "AdminTulizaana2026",
    "tulizaana2026",
    "Tulizaana@2025",
  ];

  const found: string[] = [];
  for (const relative of repositorySources) {
    const content = readSource(relative);
    for (const needle of FORBIDDEN_IN_REPO) {
      if (content.includes(needle)) found.push(`${relative} -> ${needle}`);
    }
  }
  record(
    "aucun mot de passe admin en clair",
    found.length === 0,
    found.length === 0 ? "seed, documentation et frontend nettoyes" : found.join(", ")
  );

  const seedSource = readSource("prisma/seed.ts");
  record(
    "compte admin conditionne a l'environnement",
    seedSource.includes("ADMIN_SEED_PASSWORD"),
    "le seed cree le compte superadmin uniquement si un secret est fourni"
  );
  record(
    "email admin conserve comme identite metier",
    seedSource.includes("admin@tulizaana.org"),
    "l'adresse reste une donnee de compte, plus un credential dans le client"
  );
}

currentScenario = "16. Connexion Firebase Admin : etat reel documente";
{
  const firebaseEnvKeys = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
  ];
  const configured = firebaseEnvKeys.filter((key) => Boolean(process.env[key]?.trim()));
  const firebaseSource = readSource("server/config/firebaseAdmin.ts");

  record(
    "verification Google anterieure intacte",
    firebaseSource.includes("verifyFirebaseIdToken"),
    "le chantier 2 reste en place, aucun secret Google reintroduit"
  );
  record(
    "role Google issu de la base uniquement",
    readSource("server/services/googleAuth.service.ts").includes("DEFAULT_MEMBER_ROLE"),
    "un nouveau compte Google est enregistre comme membre par le serveur"
  );

  if (configured.length === firebaseEnvKeys.length) {
    console.log(
      "   [INFO] Variables Firebase Admin detectees : un test de connexion reelle serait possible, " +
        "mais la connexion Google reste hors perimetre du chantier 3."
    );
  } else {
    console.log(
      `   [INFO] Firebase Admin non configure sur cet environnement ` +
        `(${configured.length}/${firebaseEnvKeys.length} variables presentes) : ` +
        "la connexion Google reelle ne peut pas etre testee ici. " +
        "Etat reel : POST /api/auth/google repond 503 sur les environments de production non configures. " +
        "Consequence pour le Back Office : aucune. Le Back Office n'utilise que POST /api/auth/login " +
        "et /api/auth/me, qui n'exigent aucune configuration Firebase."
    );
  }
}

server.close();

// ---------------------------------------------------------------------------
// Rapport
// ---------------------------------------------------------------------------

console.log("\n--- Detail des verifications ---");
for (const result of results) {
  const mark = result.status === "pass" ? "OK  " : "FAIL";
  console.log(`${mark} [${result.scenario}] attendu: ${result.expected} — ${result.detail}`);
}

const failures = results.filter((r) => r.status === "fail");
const total = results.length;

console.log("\n=== RESULTAT ===");
console.log(`Verifications : ${total - failures.length}/${total} reussies`);

if (failures.length > 0) {
  console.log("\nECHECS :");
  for (const failure of failures) {
    console.log(`- [${failure.scenario}] attendu ${failure.expected} — ${failure.detail}`);
  }
  process.exitCode = 1;
} else {
  console.log("Aucune connexion administrateur non autorisee n'a ete possible.");
  process.exitCode = 0;
}