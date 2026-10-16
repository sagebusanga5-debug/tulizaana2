/**
 * Tests de securite du chantier 4 : Portail partenaire.
 *
 * Aucun vrai compte, aucune vraie base de production, aucune vraie cle de
 * paiement. Aucun paiement n'est simule.
 *
 * Strategie identique au chantier 3, en deux niveaux :
 *
 *  A. NIVEAU HTTP - l'application Express est demarree telle quelle (vraies
 *     routes, vrais controleurs, vrai middleware `requireAuth` / `requireRole`,
 *     vrai service d'entitlements). Seule la base est remplacee par un double
 *     en memoire, injectee par le mecanisme normal de Prisma
 *     (`globalThis.__prismaClient`). Aucune verification de securite n'est
 *     contournee.
 *
 *  B. NIVEAU SOURCES - le depot est inspecte pour prouver que les
 *     contre-mesures ne sont pas seulement presentees mais reellement utilisees.
 *
 * Point central : un jeton JWT portant `role: "superadmin"` ne suffit pas, et
 * surtout un corps de requete portant `subscriptionPlan: "enterprise"` ou
 * `organizationId: "<autre org>"` ne change RIEN. L'autorite est la ligne
 * `Organization` relue en base.
 *
 * Lancement : npm run test:partner-security
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

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = TEST_SECRET;
// URL configuree uniquement pour que `getPrismaClient()` accepte de rendre le
// double injecte ; aucune connexion reseau n'est etablie.
process.env.DATABASE_URL = "postgresql://test:test@127.0.0.1:5432/tulizaana_test";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

// ---------------------------------------------------------------------------
// Double de base en memoire, conforme au contrat Prisma utilise par les
// controleurs et le service d'entitlements.
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
let fakeOrganizations: any[] = [];
let fakeOrganizationAdmins: any[] = [];
let fakeCommunities: any[] = [];
let fakeCampaigns: any[] = [];
let fakeCommunityMembers: any[] = [];
let fakeAuditLogs: any[] = [];

const PAST = new Date(Date.now() - 60 * 60 * 1000);
const FUTURE = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

/** Organisation de reference : approuvee, abonnement actif, paiement valide. */
function makeOrganization(overrides: Partial<any> = {}): any {
  return {
    id: "org-alpha",
    name: "Organisation Alpha",
    acronym: "ALPHA",
    logo: null,
    coverImage: null,
    type: "ong",
    country: "RDC",
    city: "Kinshasa",
    address: "Adresse confidentielle Alpha",
    domain: "Sante communautaire",
    mission: "Mission Alpha",
    description: "Description Alpha",
    responsibleName: "Responsable Alpha",
    responsibleTitle: "Directrice",
    contactEmail: "private@alpha.org",
    contactPhone: "+243 99 000 0001",
    status: "approved",
    subscriptionPlan: "starter",
    quotaCommunitiesMax: 5,
    quotaMembersMax: 500,
    quotaCampaignsMax: 2,
    subscriptionStartedAt: PAST,
    subscriptionExpiresAt: FUTURE,
    paymentStatus: "validated",
    validatedAt: PAST,
    createdAt: PAST,
    ...overrides,
  };
}

function resetFakeDatabase(): void {
  fakeUsers = [
    { id: "user-superadmin", email: "root@admin.test", name: "Super Admin", pseudonym: null, avatar: null, role: "superadmin", isSuspended: false },
    // Partenaire ne gerant qu'UNE organisation : la resolution est automatique.
    { id: "user-alpha", email: "ref@alpha.org", name: "Ref Alpha", pseudonym: null, avatar: null, role: "partner_admin", isSuspended: false },
    { id: "user-beta", email: "ref@beta.org", name: "Ref Beta", pseudonym: null, avatar: null, role: "partner_admin", isSuspended: false },
    // Partenaire gerant PLUSIEURES organisations : la selection doit rester
    // verifiee cote serveur.
    { id: "user-multi", email: "multi@test.org", name: "Ref Multi", pseudonym: null, avatar: null, role: "partner_admin", isSuspended: false },
    { id: "user-orphan", email: "orphan@test.org", name: "Orphan", pseudonym: null, avatar: null, role: "partner_admin", isSuspended: false },
  ];

  fakeOrganizations = [
    makeOrganization(),
    // Organisation d'un second partenaire : sert aux tests d'isolation.
    makeOrganization({
      id: "org-beta",
      name: "Organisation Beta",
      acronym: "BETA",
      contactEmail: "private@beta.org",
    }),
    // Deuxieme organisation geree par le meme partenaire multi-organisations.
    makeOrganization({ id: "org-gamma", name: "Organisation Gamma" }),
  ];

  fakeOrganizationAdmins = [
    { id: "oa-1", organizationId: "org-alpha", userId: "user-alpha", role: "owner", createdAt: PAST },
    { id: "oa-2", organizationId: "org-beta", userId: "user-beta", role: "owner", createdAt: PAST },
    { id: "oa-3", organizationId: "org-alpha", userId: "user-multi", role: "owner", createdAt: PAST },
    { id: "oa-4", organizationId: "org-gamma", userId: "user-multi", role: "admin", createdAt: PAST },
  ];

  fakeCommunities = [
    {
      id: "comm-alpha-1",
      name: " Cercle Alpha 1",
      slug: "cercle-alpha-1",
      description: "d",
      mission: "m",
      rules: [],
      icon: "heart",
      coverImage: null,
      // Chantier 8.5 : le compteur public des communautés d'une organisation
      // ne comptabilise que les cercles publics (isPrivate = false). Le mock
      // doit donc exposer une communauté publique pour que le test 8a du
      // profil public organisation vérifie correctement le compteur.
      isPrivate: false,
      category: "sante_mentale",
      organizationId: "org-alpha",
      status: "active",
      createdAt: PAST,
    },
    {
      id: "comm-beta-1",
      name: "Cercle Beta 1",
      slug: "cercle-beta-1",
      description: "d",
      mission: "m",
      rules: [],
      icon: "heart",
      coverImage: null,
      isPrivate: true,
      category: "sante_mentale",
      organizationId: "org-beta",
      status: "active",
      createdAt: PAST,
    },
  ];

  fakeCampaigns = [
    {
      id: "camp-alpha-1",
      organizationId: "org-alpha",
      communityId: "comm-alpha-1",
      title: "Campagne Alpha",
      description: "d",
      category: "sante_mentale",
      durationDays: 14,
      startDate: new Date(),
      endDate: null,
      status: "active",
      targetActivitiesCount: 5,
      completedActivitiesCount: 0,
      rewardBadge: null,
      activities: [],
      createdAt: PAST,
    },
  ];

  fakeCommunityMembers = [
    // Chantier 5 - les cercles de ce produit sont fermes (`isPrivate: true`).
    // Le responsable d'une organisation en est donc membre, comme le ferait
    // `createCommunity`. Ce n'est PAS une commodite de test : c'est la seule
    // maniere honnete de relire un cercle prive, puisque la lecture anonyme
    // doit maintenant etre refusee.
    {
      id: "cm-seed-1",
      communityId: "comm-alpha-1",
      userId: "user-alpha",
      role: "moderator",
      status: "active",
      joinedAt: PAST,
    },
    {
      id: "cm-seed-2",
      communityId: "comm-beta-1",
      userId: "user-beta",
      role: "moderator",
      status: "active",
      joinedAt: PAST,
    },
  ];
  fakeAuditLogs = [];
}

/** Prend en charge le `where` de Prisma sur les seules formes utilisees ici. */
function matches(row: any, where: any): boolean {
  if (!where) return true;
  for (const [key, expected] of Object.entries(where as Record<string, unknown>)) {
    if (expected === undefined) continue;
    const actual = row[key];
    if (expected && typeof expected === "object" && !(expected instanceof Date)) {
      const filter = expected as Record<string, unknown>;
      if ("gte" in filter || "lt" in filter) {
        const d = actual instanceof Date ? actual : new Date(actual);
        const gte = filter.gte as Date | undefined;
        const lt = filter.lt as Date | undefined;
        if (gte && d < new Date(gte)) return false;
        if (lt && d >= new Date(lt)) return false;
        continue;
      }
      if ("contains" in filter) {
        const hay = String(actual ?? "").toLowerCase();
        if (!hay.includes(String(filter.contains).toLowerCase())) return false;
        continue;
      }
      if ("in" in filter) {
        const list = filter.in as unknown[];
        if (!Array.isArray(list) || !list.includes(actual)) return false;
        continue;
      }
    }
    if (actual instanceof Date && expected instanceof Date) {
      if (actual.getTime() !== expected.getTime()) return false;
      continue;
    }
    if (actual !== expected) return false;
  }
  return true;
}

function applySelect(row: any, select: any, include: any = undefined): any {
  if (!select && !include) return { ...row };

  const out: any = {};

  if (select) {
    for (const [key, wanted] of Object.entries(select as Record<string, any>)) {
      if (!wanted) continue;
      if (key === "_count") continue;
      if (key === "organization" || key === "community") {
        const rel = row[key];
        out[key] = rel ? applySelect(rel, wanted) : undefined;
        continue;
      }
      out[key] = row[key];
    }
  } else {
    Object.assign(out, row);
  }

  // `include` : on resout les relations demandees a partir des doubles.
  if (include) {
    for (const [key, wantedRaw] of Object.entries(include as Record<string, any>)) {
      if (!wantedRaw) continue;
      const wanted = wantedRaw as Record<string, any>;

      if (key === "_count") {
        const counts: Record<string, number> = {};
        const ownerId = row.organizationId ?? row.id;
        for (const relKey of Object.keys(wanted.select ?? {})) {
          const source =
            relKey === "organization"
              ? fakeOrganizations
              : relKey === "campaigns"
                ? fakeCampaigns
                : relKey === "communities"
                  ? fakeCommunities
                  : [];
          counts[relKey] = source.filter(
            (r: any) => r.organizationId === ownerId || r.id === ownerId
          ).length;
        }
        out._count = counts;
        continue;
      }

      if (key === "organization") {
        const org = fakeOrganizations.find((o) => o.id === row.organizationId);
        out.organization = org ? applySelect(org, wanted.select) : undefined;
        continue;
      }

      if (key === "community") {
        const community = fakeCommunities.find((c) => c.id === row.communityId);
        out.community = community ? applySelect(community, wanted.select) : undefined;
        continue;
      }

      if (key === "members") {
        // Relation de membres : seule la forme utilisee par getCommunity.
        out.members = fakeCommunityMembers
          .filter((m) => m.communityId === row.id)
          .map((m) => ({
            role: m.role,
            user: fakeUsers.find((u) => u.id === m.userId) ?? null,
          }));
        continue;
      }

      if (key === "campaigns") {
        out.campaigns = fakeCampaigns
          .filter((c) => c.organizationId === row.organizationId)
          .map((c) => applySelect(c, wanted.select));
        continue;
      }

      if (key === "communities") {
        out.communities = fakeCommunities
          .filter((c) => c.organizationId === row.organizationId)
          .map((c) => applySelect(c, wanted.select));
        continue;
      }
    }
  }

  return out;
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

const fakeDatabase: any = {
  user: {
    findUnique: async ({ where }: any) => {
      const found = fakeUsers.find((u) => u.id === where.id);
      return found ? { ...found } : null;
    },
    findMany: async () => fakeUsers.map((u) => ({ ...u })),
  },
  organization: {
    findUnique: async ({ where, select, include }: any) => {
      const found = fakeOrganizations.find((o) => o.id === where.id);
      if (!found) return null;
      return applySelect(found, select, include);
    },
    findFirst: async ({ where, select, include }: any) => {
      // Chantier 8.5 : la résolution ID/slug utilise `findFirst({ OR: [{ id }, { slug }] })`.
      // Le mock doit supporter la clause OR exactement comme le mock communautés.
      const list = where.OR ?? [where];
      for (const clause of list) {
        const found = fakeOrganizations.find((o) => matches(o, clause));
        if (found) return applySelect(found, select, include);
      }
      return null;
    },
    findMany: async ({ where, select, include }: any) =>
      fakeOrganizations.filter((o) => matches(o, where)).map((o) => applySelect(o, select, include)),
    create: async ({ data }: any) => {
      const created = { id: nextId("org"), createdAt: new Date(), ...data };
      fakeOrganizations.push(created);
      return { ...created };
    },
    update: async ({ where, data }: any) => {
      const index = fakeOrganizations.findIndex((o) => o.id === where.id);
      if (index < 0) throw new Error("organisation introuvable");
      const current = fakeOrganizations[index];
      const updated = { ...current };
      for (const [key, value] of Object.entries(data)) {
        if (value === undefined) continue;
        if (value && typeof value === "object" && "set" in value) {
          updated[key] = value.set;
        } else {
          updated[key] = value;
        }
      }
      fakeOrganizations[index] = updated;
      return { ...updated };
    },
  },
  organizationAdmin: {
    findMany: async ({ where, select, orderBy }: any) => {
      let rows = fakeOrganizationAdmins.filter((o) => matches(o, where));
      rows = [...rows].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return rows.map((row) => {
        if (!select) return { ...row };
        const out: any = {};
        for (const [key, wanted] of Object.entries(select)) {
          if (!wanted) continue;
          if (key === "organization") {
            const org = fakeOrganizations.find((o) => o.id === row.organizationId);
            out.organization = org ? applySelect(org, wanted) : undefined;
            continue;
          }
          out[key] = row[key];
        }
        return out;
      });
    },
    findUnique: async ({ where }: any) => {
      const { organizationId, userId } = where.organizationId_userId;
      const found = fakeOrganizationAdmins.find(
        (o) => o.organizationId === organizationId && o.userId === userId
      );
      return found ? { ...found } : null;
    },
  },
  community: {
    findUnique: async ({ where, select, include }: any) => {
      const found = fakeCommunities.find((c) => c.id === where.id);
      return found ? applySelect(found, select, include) : null;
    },
    findFirst: async ({ where, select, include }: any) => {
      const list = where.OR ?? [where];
      for (const clause of list) {
        const found = fakeCommunities.find((c) => matches(c, clause));
        if (found) return applySelect(found, select, include);
      }
      return null;
    },
    findMany: async ({ where, select, include }: any) =>
      fakeCommunities.filter((c) => matches(c, where)).map((c) => applySelect(c, select, include)),
    count: async ({ where }: any = {}) =>
      fakeCommunities.filter((c) => matches(c, where)).length,
    create: async ({ data }: any) => {
      const created = { id: nextId("comm"), createdAt: new Date(), ...data };
      fakeCommunities.push(created);
      return { ...created };
    },
  },
  communityMember: {
    findUnique: async ({ where }: any) => {
      const { communityId, userId } = where.communityId_userId;
      const found = fakeCommunityMembers.find(
        (m) => m.communityId === communityId && m.userId === userId
      );
      return found ? { ...found } : null;
    },
    count: async ({ where }: any = {}) => {
      if (!where?.community?.organizationId) return fakeCommunityMembers.length;
      const orgId = where.community.organizationId;
      return fakeCommunityMembers.filter((m) =>
        fakeCommunities.some((c) => c.id === m.communityId && c.organizationId === orgId)
      ).length;
    },
    create: async ({ data }: any) => {
      const created = { id: nextId("cm"), ...data };
      fakeCommunityMembers.push(created);
      return { ...created };
    },
  },
  campaign: {
    findUnique: async ({ where, select, include }: any) => {
      const found = fakeCampaigns.find((c) => c.id === where.id);
      return found ? applySelect(found, select, include) : null;
    },
    findMany: async ({ where, select, include }: any) =>
      fakeCampaigns.filter((c) => matches(c, where)).map((c) => applySelect(c, select, include)),
    count: async ({ where }: any = {}) => fakeCampaigns.filter((c) => matches(c, where)).length,
    create: async ({ data }: any) => {
      const created = { id: nextId("camp"), createdAt: new Date(), ...data };
      fakeCampaigns.push(created);
      return { ...created };
    },
  },
  auditLog: {
    count: async () => fakeAuditLogs.length,
    findMany: async () => [...fakeAuditLogs],
    create: async ({ data }: any) => {
      fakeAuditLogs.push(data);
      return data;
    },
  },

  /**
   * Transaction interactive executee sequentiellement.
   *
   * Ce double n'implemente NI le verrouillage NI les conflits de transaction
   * PostgreSQL. Il ne peut donc PAS prouver la surete en concurrence : c'est
   * limite au seul invariant de sequentialite. Voir le test H, qui mesure ce
   * qui est reellement observable et declare la limite si elle existe.
   */
  $transaction: async (arg: any) => {
    if (typeof arg === "function") {
      return arg(fakeDatabase);
    }
    return Promise.all(arg);
  },
};

(globalThis as any).__prismaClient = fakeDatabase;

const { __setSecretForTest } = await import("../server/middleware/auth.js");
__setSecretForTest(TEST_SECRET);

const { default: organizationRoutes } = await import("../server/routes/organization.routes.js");
const { default: communityRoutes } = await import("../server/routes/community.routes.js");
const { default: campaignRoutes } = await import("../server/routes/campaign.routes.js");

// ---------------------------------------------------------------------------
// A. NIVEAU HTTP — application reelle, vraies routes, vrai middleware
// ---------------------------------------------------------------------------

console.log("\n=== CHANTIER 4 : tests de securite du portail partenaire ===\n");
console.log("--- Niveau A : HTTP, routes, controleurs et service de production ---");

const app = express();
app.use(express.json());
app.use("/api/organizations", organizationRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/campaigns", campaignRoutes);

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
  options: { body?: unknown; token?: string } = {}
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
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
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

function tokenFor(userId: string, claimedRole?: string): string {
  const user = fakeUsers.find((u) => u.id === userId)!;
  return jwt.sign(
    { id: user.id, email: user.email, role: claimedRole ?? user.role, name: user.name },
    TEST_SECRET,
    { expiresIn: "1h" }
  );
}

/** Cree une communaute en envoyant le nom attendu. */
async function createCommunity(token: string, name: string, extra: Record<string, unknown> = {}) {
  return httpCall("POST", "/api/communities", {
    token,
    body: { name, ...extra },
  });
}

async function createCampaign(token: string, body: Record<string, unknown>) {
  return httpCall("POST", "/api/campaigns", { token, body });
}

/** Repart d'un etat propre entre chaque scenario. */
function fresh(): void {
  resetFakeDatabase();
}

// ---------------------------------------------------------------------------
// Scenario 1 — aucun lien OrganizationAdmin
// ---------------------------------------------------------------------------
currentScenario = "1. Partenaire sans organisation associee";
fresh();
{
  const res = await createCommunity(tokenFor("user-orphan"), "Cercle orphelin");
  record(
    "PARTNER_NO_ORGANIZATION",
    res.status === 403 && res.payload?.code === "PARTNER_NO_ORGANIZATION",
    `recu ${res.status} / ${res.payload?.code}`
  );
  record(
    "aucune communaute creee",
    fakeCommunities.filter((c) => c.name === "Cercle orphelin").length === 0,
    `${fakeCommunities.length} communaute(s) en base`
  );
}

// ---------------------------------------------------------------------------
// Scenario 2 — organisation non approuvee
// ---------------------------------------------------------------------------
currentScenario = "2. Organisation en attente d'agrement";
fresh();
{
  fakeOrganizations[0].status = "pending";
  const res = await createCommunity(tokenFor("user-alpha"), "Cercle pending");
  record(
    "ORGANIZATION_NOT_APPROVED",
    res.status === 403 && res.payload?.code === "ORGANIZATION_NOT_APPROVED",
    `recu ${res.status} / ${res.payload?.code}`
  );
  record(
    "le statut reel est expose dans meta",
    res.payload?.meta?.status === "pending",
    `meta.status = ${res.payload?.meta?.status}`
  );
}

currentScenario = "2b. Organisation suspendue";
fresh();
{
  fakeOrganizations[0].status = "suspended";
  const res = await createCommunity(tokenFor("user-alpha"), "Cercle suspendu");
  record(
    "ORGANIZATION_NOT_APPROVED",
    res.status === 403 && res.payload?.code === "ORGANIZATION_NOT_APPROVED",
    `recu ${res.status} / ${res.payload?.code}`
  );
}

// ---------------------------------------------------------------------------
// Scenario 3 — abonnement / paiement / expiration
// ---------------------------------------------------------------------------
currentScenario = "3a. Abonnement jamais active (subscriptionStartedAt null)";
fresh();
{
  fakeOrganizations[0].subscriptionStartedAt = null;
  const res = await createCommunity(tokenFor("user-alpha"), "Cercle sans abonnement");
  record(
    "SUBSCRIPTION_REQUIRED malgre paymentStatus=validated",
    res.status === 403 && res.payload?.code === "SUBSCRIPTION_REQUIRED",
    `recu ${res.status} / ${res.payload?.code}`
  );
}

currentScenario = "3b. Paiement non valide (test F)";
fresh();
{
  fakeOrganizations[0].paymentStatus = "pending";
  const res = await createCommunity(tokenFor("user-alpha"), "Cercle paiement pending");
  record(
    "PAYMENT_PENDING malgre abonnement actif",
    res.status === 403 && res.payload?.code === "PAYMENT_PENDING",
    `recu ${res.status} / ${res.payload?.code}`
  );
}

currentScenario = "3c. Paiement en echec";
fresh();
{
  fakeOrganizations[0].paymentStatus = "failed";
  const res = await createCampaign(tokenFor("user-alpha"), {
    communityId: "comm-alpha-1",
    title: "Campagne",
    description: "d",
    category: "sante_mentale",
  });
  record(
    "PAYMENT_PENDING sur un paiement failed",
    res.status === 403 && res.payload?.code === "PAYMENT_PENDING",
    `recu ${res.status} / ${res.payload?.code}`
  );
}

currentScenario = "3d. Abonnement expire (test E)";
fresh();
{
  fakeOrganizations[0].subscriptionExpiresAt = PAST;
  const community = await createCommunity(tokenFor("user-alpha"), "Cercle expire");
  record(
    "SUBSCRIPTION_EXPIRED sur creation de communaute",
    community.status === 403 && community.payload?.code === "SUBSCRIPTION_EXPIRED",
    `recu ${community.status} / ${community.payload?.code}`
  );

  const campaign = await createCampaign(tokenFor("user-alpha"), {
    communityId: "comm-alpha-1",
    title: "Campagne expiree",
    description: "d",
    category: "sante_mentale",
  });
  record(
    "SUBSCRIPTION_EXPIRED sur creation de campagne",
    campaign.status === 403 && campaign.payload?.code === "SUBSCRIPTION_EXPIRED",
    `recu ${campaign.status} / ${campaign.payload?.code}`
  );

  // Preuve de la precision 15 : l'expiration ne supprime aucune ressource.
  // Chantier 5 - le cercle est prive : sa lecture se fait desormais en tant
  // que membre, et non anonymement. C'est la seule assertion qui prouve que
  // la ressource existe encore apres expiration.
  const read = await httpCall("GET", "/api/communities/comm-alpha-1", {
    token: tokenFor("user-alpha"),
  });
  record(
    "les ressources existantes restent lisibles apres expiration",
    read.status === 200,
    `GET /api/communities/comm-alpha-1 -> ${read.status}`
  );
  record(
    "aucune ressource supprimee",
    fakeCommunities.length === 2 && fakeCampaigns.length === 1,
    `${fakeCommunities.length} communaute(s), ${fakeCampaigns.length} campagne(s)`
  );
}

currentScenario = "3e. paymentStatus=validated seul ne suffit pas (test du cumul)";
fresh();
{
  // Les quatre conditions sont cohereentes SAUF l'approbation.
  fakeOrganizations[0].status = "pending";
  fakeOrganizations[0].subscriptionStartedAt = PAST;
  fakeOrganizations[0].subscriptionExpiresAt = FUTURE;
  fakeOrganizations[0].paymentStatus = "validated";

  const res = await createCommunity(tokenFor("user-alpha"), "Cercle non approuve");
  record(
    "validated + abonnement actif + non expire, mais status != approved -> refus",
    res.status === 403 && res.payload?.code === "ORGANIZATION_NOT_APPROVED",
    `recu ${res.status} / ${res.payload?.code}`
  );
}

// ---------------------------------------------------------------------------
// Scenario 4 — isolation de l'organisation (test C)
// ---------------------------------------------------------------------------
currentScenario = "4. Organisation falsifiee dans le corps (test C)";
fresh();
{
  // user-alpha ne gere QUE org-alpha. Un `organizationId` pointant vers une
  // autre organisation est REJETE, et non redirige silencieusement : un refus
  // explicite est plus sûr qu'un repli, car il ne masque jamais une tentative
  // de ciblage.
  const res = await createCommunity(tokenFor("user-alpha"), "Cercle beta injecte", {
    organizationId: "org-beta",
  });
  record(
    "une organisation non gerée est rejetee",
    res.status === 404 && res.payload?.code === "FORBIDDEN_RESOURCE",
    `recu ${res.status} / ${res.payload?.code}`
  );
  record(
    "aucune communaute creee dans org-beta",
    fakeCommunities.filter((c) => c.name === "Cercle beta injecte").length === 0,
    `${fakeCommunities.filter((c) => c.organizationId === "org-beta").length} communaute(s) dans org-beta`
  );
  record(
    "aucune communaute creee par ce scenario",
    fakeCommunities.length === 2,
    `${fakeCommunities.length} communaute(s)`
  );
}

currentScenario = "4bis. La communaute creee appartient toujours a l'organisation resolue";
fresh();
{
  // Sans organizationId dans le corps : la resolution serveur fait foi.
  const res = await createCommunity(tokenFor("user-alpha"), "Cercle alpha legitime");
  record(
    "creation rattachee a l'organisation resolue depuis OrganizationAdmin",
    res.status === 201 && res.payload?.data?.organizationId === "org-alpha",
    `recu ${res.status}, organizationId = ${res.payload?.data?.organizationId}`
  );
}

currentScenario = "4b. Un partenaire de B ne peut pas creer dans A";
fresh();
{
  const res = await createCommunity(tokenFor("user-beta"), "Cercle alpha injecte", {
    organizationId: "org-alpha",
  });
  record(
    "un partenaire de B ne peut pas creer dans A",
    res.status === 404 && res.payload?.code === "FORBIDDEN_RESOURCE",
    `recu ${res.status} / ${res.payload?.code}`
  );
  record(
    "org-beta reste intacte",
    fakeCommunities.filter((c) => c.organizationId === "org-beta").length === 1,
    `${fakeCommunities.filter((c) => c.organizationId === "org-beta").length} communaute(s) dans org-beta`
  );
}

currentScenario = "4c. Utilisateur gerant plusieurs organisations";
fresh();
{
  // user-multi gere org-alpha et org-gamma : les deux sont acceptables.
  const good = await createCommunity(tokenFor("user-multi"), "Cercle gamma", {
    organizationId: "org-gamma",
  });
  record(
    "une organisation reellement gerée est acceptee",
    good.status === 201 && good.payload?.data?.organizationId === "org-gamma",
    `recu ${good.status}, organizationId = ${good.payload?.data?.organizationId}`
  );

  const bad = await createCommunity(tokenFor("user-multi"), "Cercle beta", {
    organizationId: "org-beta",
  });
  record(
    "une organisation existante mais non gerée est rejetee",
    bad.status === 404 && bad.payload?.code === "FORBIDDEN_RESOURCE",
    `recu ${bad.status} / ${bad.payload?.code}`
  );

  // Sans selection explicite, la resolution est ambigue et doit etre refusee
  // plutot que de choisir arbitrairement une organisation.
  const ambiguous = await createCommunity(tokenFor("user-multi"), "Cercle ambigu");
  record(
    "sans selection, plusieurs organisations gerées donnent PARTNER_NO_ORGANIZATION",
    ambiguous.status === 403 && ambiguous.payload?.code === "PARTNER_NO_ORGANIZATION",
    `recu ${ambiguous.status} / ${ambiguous.payload?.code}`
  );
}

// ---------------------------------------------------------------------------
// Scenario 5 — campagnes : appartenance de la communaute
// ---------------------------------------------------------------------------
currentScenario = "5a. Campagne dans une communaute d'une autre organisation";
fresh();
{
  const res = await createCampaign(tokenFor("user-alpha"), {
    communityId: "comm-beta-1",
    title: "Campagne croisee",
    description: "d",
    category: "sante_mentale",
  });
  record(
    "FORBIDDEN_RESOURCE : la communaute existe mais n'appartient pas a l'organisation",
    res.status === 404 && res.payload?.code === "FORBIDDEN_RESOURCE",
    `recu ${res.status} / ${res.payload?.code}`
  );
  record(
    "aucune campagne croisee creee",
    fakeCampaigns.length === 1,
    `${fakeCampaigns.length} campagne(s)`
  );
}

currentScenario = "5b. Campagne dans une communaute inexistante";
fresh();
{
  const res = await createCampaign(tokenFor("user-alpha"), {
    communityId: "comm-inexistant",
    title: "Campagne fantome",
    description: "d",
    category: "sante_mentale",
  });
  record(
    "refus",
    res.status === 404 && res.payload?.code === "FORBIDDEN_RESOURCE",
    `recu ${res.status} / ${res.payload?.code}`
  );
}

currentScenario = "5c. organizationId falsifie sur une campagne";
fresh();
{
  const res = await createCampaign(tokenFor("user-alpha"), {
    organizationId: "org-beta",
    communityId: "comm-alpha-1",
    title: "Tentative de detournement",
    description: "d",
    category: "sante_mentale",
  });
  record(
    "un organizationId non gere est rejete, la campagne n'est pas creee",
    res.status === 404 && res.payload?.code === "FORBIDDEN_RESOURCE",
    `recu ${res.status} / ${res.payload?.code}`
  );
  record(
    "aucune campagne ajoutee",
    fakeCampaigns.length === 1,
    `${fakeCampaigns.length} campagne(s)`
  );
}

currentScenario = "5d. Le corps ne peut pas detournier l'organisation d'une campagne valide";
fresh();
{
  // Le corps tente org-beta, qui n'est pas geree : refus.
  const rejected = await createCampaign(tokenFor("user-alpha"), {
    organizationId: "org-beta",
    communityId: "comm-alpha-1",
    title: "Tentative de detournement",
    description: "d",
    category: "sante_mentale",
  });
  record(
    "tentative de detournement refusee",
    rejected.status === 404,
    `recu ${rejected.status}`
  );

  // Sans organizationId : la campagne est rattachee a l'organisation resolue.
  const accepted = await createCampaign(tokenFor("user-alpha"), {
    communityId: "comm-alpha-1",
    title: "Campagne legitime",
    description: "d",
    category: "sante_mentale",
  });
  record(
    "l'organisation de la campagne est DERIVEE de l'identite serveur",
    accepted.status === 201 && accepted.payload?.data?.organizationId === "org-alpha",
    `recu ${accepted.status}, organizationId = ${accepted.payload?.data?.organizationId}`
  );
}

// ---------------------------------------------------------------------------
// Scenario 6 — quotas
// ---------------------------------------------------------------------------
currentScenario = "6a. Quota de communities atteint (test G)";
fresh();
{
  fakeOrganizations[0].quotaCommunitiesMax = 1; // 1 existe deja
  const res = await createCommunity(tokenFor("user-alpha"), "Cercle en trop");
  record(
    "QUOTA_EXCEEDED avec le detail du quota",
    res.status === 403 &&
      res.payload?.code === "QUOTA_EXCEEDED" &&
      res.payload?.meta?.used === 1 &&
      res.payload?.meta?.max === 1,
    `recu ${res.status} / ${res.payload?.code} / meta=${JSON.stringify(res.payload?.meta)}`
  );
  record(
    "aucune communaute creee",
    fakeCommunities.length === 2,
    `${fakeCommunities.length} communaute(s)`
  );
}

currentScenario = "6b. Le quota n'est jamais augmente a la volee";
fresh();
{
  const before = fakeOrganizations[0].quotaCommunitiesMax;
  await createCommunity(tokenFor("user-alpha"), "Cercle 2");
  record(
    "quotaCommunitiesMax inchange apres une creation",
    fakeOrganizations[0].quotaCommunitiesMax === before,
    `avant ${before}, apres ${fakeOrganizations[0].quotaCommunitiesMax}`
  );
}

currentScenario = "6c. Quota mensuel de campagnes (test G)";
fresh();
{
  fakeOrganizations[0].quotaCampaignsMax = 1; // 1 existe deja ce mois-ci
  const res = await createCampaign(tokenFor("user-alpha"), {
    communityId: "comm-alpha-1",
    title: "Campagne en trop",
    description: "d",
    category: "sante_mentale",
  });
  record(
    "QUOTA_EXCEEDED sur le quota mensuel",
    res.status === 403 &&
      res.payload?.code === "QUOTA_EXCEEDED" &&
      res.payload?.meta?.quota === "campaignsPerMonth",
    `recu ${res.status} / ${res.payload?.code} / meta=${JSON.stringify(res.payload?.meta)}`
  );
}

currentScenario = "6d. Le mois civil borne le comptage (campagne d'un mois anterieur)";
fresh();
{
  // Une campagne du mois dernier ne doit pas consommer le quota du mois courant.
  fakeCampaigns[0].startDate = new Date(
    new Date().getFullYear(),
    new Date().getMonth() - 1,
    15
  );
  const res = await createCampaign(tokenFor("user-alpha"), {
    communityId: "comm-alpha-1",
    title: "Campagne du mois",
    description: "d",
    category: "sante_mentale",
  });
  record(
    "une campagne hors du mois courant ne consomme pas le quota",
    res.status === 201,
    `recu ${res.status} / ${res.payload?.code ?? "-"}`
  );
}

// ---------------------------------------------------------------------------
// Scenario 7 — falsification de la configuration (tests A, B, D)
// ---------------------------------------------------------------------------
currentScenario = "7a. Plan falsifie (test A)";
fresh();
{
  const before = { ...fakeOrganizations[0] };
  const res = await createCommunity(tokenFor("user-alpha"), "Cercle plan falsifie", {
    subscriptionPlan: "enterprise",
    quotaCommunitiesMax: 999999,
    quotaMembersMax: 999999,
    quotaCampaignsMax: 999999,
    paymentStatus: "validated",
    subscriptionStatus: "active",
  });
  record(
    "la creation reste bornee au quota REEL de l'organisation",
    res.status === 201,
    `recu ${res.status} / ${res.payload?.code ?? "-"}`
  );
  const after = fakeOrganizations.find((o) => o.id === "org-alpha")!;
  record(
    "quotaCommunitiesMax inchange par le corps (test B)",
    after.quotaCommunitiesMax === before.quotaCommunitiesMax,
    `avant ${before.quotaCommunitiesMax}, apres ${after.quotaCommunitiesMax}`
  );
  record(
    "quotaMembersMax inchange par le corps (test B)",
    after.quotaMembersMax === before.quotaMembersMax,
    `avant ${before.quotaMembersMax}, apres ${after.quotaMembersMax}`
  );
  record(
    "quotaCampaignsMax inchange par le corps (test B)",
    after.quotaCampaignsMax === before.quotaCampaignsMax,
    `avant ${before.quotaCampaignsMax}, apres ${after.quotaCampaignsMax}`
  );
  record(
    "subscriptionPlan inchange par le corps (test A)",
    after.subscriptionPlan === before.subscriptionPlan,
    `avant ${before.subscriptionPlan}, apres ${after.subscriptionPlan}`
  );
  record(
    "paymentStatus inchange par le corps (test D)",
    after.paymentStatus === before.paymentStatus,
    `avant ${before.paymentStatus}, apres ${after.paymentStatus}`
  );
  record(
    "subscriptionStartedAt inchange par le corps (test D)",
    String(after.subscriptionStartedAt) === String(before.subscriptionStartedAt),
    `avant ${before.subscriptionStartedAt}, apres ${after.subscriptionStartedAt}`
  );
}

currentScenario = "7b. Un partenaire en basic ne peut pas s'auto-attribuer enterprise";
fresh();
{
  fakeOrganizations[0].subscriptionPlan = "basic";
  fakeOrganizations[0].quotaCommunitiesMax = 1; // quota coherent avec basic
  const res = await createCommunity(tokenFor("user-alpha"), "Cercle escalade", {
    subscriptionPlan: "enterprise",
    quotaCommunitiesMax: 500,
  });
  record(
    "le quota de base reste applique meme en envoyant enterprise",
    res.status === 403 && res.payload?.code === "QUOTA_EXCEEDED",
    `recu ${res.status} / ${res.payload?.code}`
  );
  record(
    "subscriptionPlan toujours basic en base",
    fakeOrganizations[0].subscriptionPlan === "basic",
    `plan = ${fakeOrganizations[0].subscriptionPlan}`
  );
}

// ---------------------------------------------------------------------------
// Scenario 8 — profil public et donnees privees
// ---------------------------------------------------------------------------
currentScenario = "8a. Profil public sans fuite de donnees de gestion";
fresh();
{
  const res = await httpCall("GET", "/api/organizations/org-alpha");
  record("200 pour une organisation approuvee", res.status === 200, `recu ${res.status}`);

  const data = res.payload?.data ?? {};
  const FORBIDDEN_FIELDS = [
    "contactEmail",
    "contactPhone",
    "address",
    "responsibleName",
    "validatedAt",
    "quotaCommunitiesMax",
    "quotaMembersMax",
    "quotaCampaignsMax",
    "subscriptionPlan",
    "subscriptionStartedAt",
    "subscriptionExpiresAt",
    "paymentStatus",
    "numberOfMembers",
  ];
  const leaked = FORBIDDEN_FIELDS.filter((field) => field in data);
  record(
    "aucun champ de gestion ni sensible dans le DTO public",
    leaked.length === 0,
    leaked.length === 0 ? "aucun" : `FUITES : ${leaked.join(", ")}`
  );

  // Contre-verification sur la reponse JSON serialisee, pas sur l'objet.
  const raw = JSON.stringify(res.payload);
  const leakedRaw = FORBIDDEN_FIELDS.filter((field) => raw.includes(`"${field}"`));
  record(
    "aucune occurrence de ces noms dans le JSON brut",
    leakedRaw.length === 0,
    leakedRaw.length === 0 ? "aucune" : `present : ${leakedRaw.join(", ")}`
  );

  record(
    "les champs de presentation sont presents",
    data.name === "Organisation Alpha" && data.isVerified === true && typeof data.domain === "string",
    `name=${data.name}, isVerified=${data.isVerified}`
  );
  record(
    "les compteurs publics sont bornes aux ressources actives",
    data.counters?.numberOfActiveCampaigns === 1 && data.counters?.numberOfPublicCommunities === 1,
    `counters = ${JSON.stringify(data.counters)}`
  );
}

currentScenario = "8b. Une candidature en attente n'est pas devinable";
fresh();
{
  fakeOrganizations[0].status = "pending";
  const res = await httpCall("GET", "/api/organizations/org-alpha");
  record(
    "404 pour une organisation non approuvee",
    res.status === 404,
    `recu ${res.status}`
  );
}

currentScenario = "8c. /manage est reserve aux administrateurs de l'organisation";
fresh();
{
  const anonymous = await httpCall("GET", "/api/organizations/org-alpha/manage");
  record("401 sans jeton", anonymous.status === 401, `recu ${anonymous.status}`);

  const stranger = await httpCall("GET", "/api/organizations/org-alpha/manage", {
    token: tokenFor("user-beta"),
  });
  record(
    "404 (et non 403) pour un non-administrateur",
    stranger.status === 404 && stranger.payload?.code === "FORBIDDEN_RESOURCE",
    `recu ${stranger.status} / ${stranger.payload?.code}`
  );

  const manager = await httpCall("GET", "/api/organizations/org-alpha/manage", {
    token: tokenFor("user-alpha"),
  });
  record("200 pour l'administrateur", manager.status === 200, `recu ${manager.status}`);
  const data = manager.payload?.data ?? {};
  record(
    "le DTO de gestion contient les quotas reels et l'echeance",
    data.quotas?.communities?.max === 5 &&
      data.quotas?.campaignsPerMonth?.max === 2 &&
      typeof data.subscription?.expiresAt === "string",
    `quotas=${JSON.stringify(data.quotas?.communities)}, expiresAt=${data.subscription?.expiresAt}`
  );
}

// ---------------------------------------------------------------------------
// Scenario 9 — candidature publique
// ---------------------------------------------------------------------------
currentScenario = "9. Candidature publique : le client ne choisit rien";
fresh();
{
  const res = await httpCall("POST", "/api/organizations", {
    body: {
      name: "Nouvelle ONG",
      domain: "Sante",
      mission: "Mission",
      contactEmail: "contact@nouvelle.org",
      contactPhone: "+243 81 000 0000",
      responsibleName: "Responsable",
      // Tentatives d'elevation :
      status: "approved",
      subscriptionPlan: "enterprise",
      quotaCommunitiesMax: 25,
      quotaMembersMax: 50000,
      quotaCampaignsMax: 50,
      paymentStatus: "validated",
      subscriptionStartedAt: PAST.toISOString(),
    },
  });
  record("201", res.status === 201, `recu ${res.status}`);
  const created = fakeOrganizations.find((o) => o.name === "Nouvelle ONG");
  record(
    "status impose a pending",
    created?.status === "pending",
    `status = ${created?.status}`
  );
  record(
    "subscriptionPlan impose a basic",
    created?.subscriptionPlan === "basic",
    `plan = ${created?.subscriptionPlan}`
  );
  record(
    "quotaCommunitiesMax impose a la valeur basic (1)",
    created?.quotaCommunitiesMax === 1,
    `quotaCommunitiesMax = ${created?.quotaCommunitiesMax}`
  );
  record(
    "quotaMembersMax impose a la valeur basic (250)",
    created?.quotaMembersMax === 250,
    `quotaMembersMax = ${created?.quotaMembersMax}`
  );
  record(
    "quotaCampaignsMax impose a la valeur basic (1)",
    created?.quotaCampaignsMax === 1,
    `quotaCampaignsMax = ${created?.quotaCampaignsMax}`
  );
  record(
    "paymentStatus impose a pending",
    created?.paymentStatus === "pending",
    `paymentStatus = ${created?.paymentStatus}`
  );
  record(
    "subscriptionStartedAt impose a null",
    created?.subscriptionStartedAt === null,
    `subscriptionStartedAt = ${created?.subscriptionStartedAt}`
  );
}

currentScenario = "9b. Une candidature ne donne aucun acces partenaire";
fresh();
{
  await httpCall("POST", "/api/organizations", {
    body: {
      name: "ONG Sans Droit",
      domain: "Sante",
      mission: "Mission",
      contactEmail: "contact@sansdroit.org",
      contactPhone: "+243 81 000 0001",
      responsibleName: "Responsable",
    },
  });
  const created = fakeOrganizations.find((o) => o.name === "ONG Sans Droit");
  // Aucun lien OrganizationAdmin n'est cree par une candidature.
  const link = fakeOrganizationAdmins.find((o) => o.organizationId === created?.id);
  record(
    "aucun lien OrganizationAdmin cree par une candidature",
    link === undefined,
    link === undefined ? "aucun lien" : `lien ${link.id}`
  );
}

// ---------------------------------------------------------------------------
// Scenario 10 — activite superadmin et garde-fous d'abonnement
// ---------------------------------------------------------------------------
currentScenario = "10a. La route de statut exige le role relu en base";
fresh();
{
  const withStaleJwt = await httpCall("PUT", "/api/organizations/org-alpha/status", {
    token: tokenFor("user-alpha", "superadmin"),
    body: { status: "approved" },
  });
  record(
    "un jeton portant superadmin sans le role en base est refuse",
    withStaleJwt.status === 403,
    `recu ${withStaleJwt.status}`
  );

  const anonymous = await httpCall("PUT", "/api/organizations/org-alpha/status", {
    body: { status: "approved" },
  });
  record("401 sans jeton", anonymous.status === 401, `recu ${anonymous.status}`);

  const superadmin = await httpCall("PUT", "/api/organizations/org-alpha/status", {
    token: tokenFor("user-superadmin"),
    body: { status: "approved" },
  });
  record("200 pour le superadmin reel", superadmin.status === 200, `recu ${superadmin.status}`);
}

currentScenario = "10b. Approuver n'active pas l'abonnement (garde-fou principal)";
fresh();
{
  fakeOrganizations[0].subscriptionStartedAt = null;
  fakeOrganizations[0].paymentStatus = "pending";

  const approve = await httpCall("PUT", "/api/organizations/org-alpha/status", {
    token: tokenFor("user-superadmin"),
    body: { status: "approved" },
  });
  record("approbation acceptee", approve.status === 200, `recu ${approve.status}`);
  record(
    "l'approbation laisse paymentStatus a pending",
    fakeOrganizations[0].paymentStatus === "pending",
    `paymentStatus = ${fakeOrganizations[0].paymentStatus}`
  );
  record(
    "l'approbation ne demarre pas l'abonnement",
    fakeOrganizations[0].subscriptionStartedAt === null,
    `subscriptionStartedAt = ${fakeOrganizations[0].subscriptionStartedAt}`
  );

  const res = await createCommunity(tokenFor("user-alpha"), "Cercle post-approbation");
  record(
    "SUBSCRIPTION_REQUIRED malgre status=approved",
    res.status === 403 && res.payload?.code === "SUBSCRIPTION_REQUIRED",
    `recu ${res.status} / ${res.payload?.code}`
  );
}

currentScenario = "10c. Un changement de formule n'herite d'aucun validated (garde-fou 2)";
fresh();
{
  fakeOrganizations[0].paymentStatus = "validated";
  const res = await httpCall("PUT", "/api/organizations/org-alpha/status", {
    token: tokenFor("user-superadmin"),
    body: { subscriptionPlan: "growth" },
  });
  record("200", res.status === 200, `recu ${res.status}`);
  record(
    "paymentStatus remis a pending apres un changement de formule",
    fakeOrganizations[0].paymentStatus === "pending",
    `paymentStatus = ${fakeOrganizations[0].paymentStatus}`
  );
  record(
    "la formule a bien change",
    fakeOrganizations[0].subscriptionPlan === "growth",
    `plan = ${fakeOrganizations[0].subscriptionPlan}`
  );
  record(
    "les quotas negocies ne sont pas ecrases par le catalogue",
    fakeOrganizations[0].quotaCommunitiesMax === 5,
    `quotaCommunitiesMax = ${fakeOrganizations[0].quotaCommunitiesMax}`
  );

  const blocked = await createCommunity(tokenFor("user-alpha"), "Cercle apres changement");
  record(
    "PAYMENT_PENDING apres le changement de formule",
    blocked.status === 403 && blocked.payload?.code === "PAYMENT_PENDING",
    `recu ${blocked.status} / ${blocked.payload?.code}`
  );
}

currentScenario = "10d. Activation explicite de l'abonnement";
fresh();
{
  fakeOrganizations[0].subscriptionStartedAt = null;
  fakeOrganizations[0].paymentStatus = "pending";

  const res = await httpCall("PUT", "/api/organizations/org-alpha/status", {
    token: tokenFor("user-superadmin"),
    body: {
      paymentStatus: "validated",
      activateSubscription: true,
      subscriptionMonths: 12,
    },
  });
  record("200", res.status === 200, `recu ${res.status}`);
  record(
    "abonnement demarre",
    fakeOrganizations[0].subscriptionStartedAt !== null,
    `subscriptionStartedAt = ${fakeOrganizations[0].subscriptionStartedAt}`
  );
  record(
    "echeance a 12 mois",
    fakeOrganizations[0].subscriptionExpiresAt !== null,
    `expiresAt = ${fakeOrganizations[0].subscriptionExpiresAt}`
  );

  const created = await createCommunity(tokenFor("user-alpha"), "Cercle apres activation");
  record(
    "la creation redevient possible",
    created.status === 201,
    `recu ${created.status} / ${created.payload?.code ?? "-"}`
  );
}

// ---------------------------------------------------------------------------
// Scenario 11 — demande de changement de formule par un partenaire
// ---------------------------------------------------------------------------
currentScenario = "11. Demande de formule : aucun effet sur les droits";
fresh();
{
  const before = { ...fakeOrganizations[0] };
  const res = await httpCall("POST", "/api/organizations/org-alpha/subscription-request", {
    token: tokenFor("user-alpha"),
    body: { requestedPlan: "enterprise" },
  });
  record("200", res.status === 200, `recu ${res.status}`);
  record(
    "la reponse declare explicitement l'absence de changement",
    res.payload?.data?.subscriptionUnchanged === true,
    `subscriptionUnchanged = ${res.payload?.data?.subscriptionUnchanged}`
  );
  const after = fakeOrganizations.find((o) => o.id === "org-alpha")!;
  record(
    "ni formule, ni quotas, ni paiement modifies",
    after.subscriptionPlan === before.subscriptionPlan &&
      after.quotaCommunitiesMax === before.quotaCommunitiesMax &&
      after.quotaMembersMax === before.quotaMembersMax &&
      after.quotaCampaignsMax === before.quotaCampaignsMax &&
      after.paymentStatus === before.paymentStatus,
    `plan=${after.subscriptionPlan}, quotas=${after.quotaCommunitiesMax}/${after.quotaMembersMax}/${after.quotaCampaignsMax}`
  );
  record(
    "la demande est tracee dans le journal d'audit",
    fakeAuditLogs.some((log) => log.action === "PARTNER_SUBSCRIPTION_CHANGE_REQUESTED"),
    `${fakeAuditLogs.length} entree(s) de journal`
  );
}

// ---------------------------------------------------------------------------
// Scenario H — concurrence
// ---------------------------------------------------------------------------
currentScenario = "H. Concurrence : invariant used <= max";
fresh();
{
  // Une seule place disponible sur un quota de 2 (1 communaute existe deja
  // dans org-alpha). org-beta possede aussi une communaute : elle ne doit
  // PAS etre comptee, car le quota est scope a une organisation.
  fakeOrganizations[0].quotaCommunitiesMax = 2;

  const results = await Promise.all([
    createCommunity(tokenFor("user-alpha"), "Cercle concurrent A"),
    createCommunity(tokenFor("user-alpha"), "Cercle concurrent B"),
  ]);

  const successes = results.filter((r) => r.status === 201).length;
  // Mesure scopee a l'organisation concernee, comme le fait le backend.
  const used = fakeCommunities.filter((c) => c.organizationId === "org-alpha").length;
  const max = fakeOrganizations[0].quotaCommunitiesMax;

  record(
    `invariant dur : used <= max (${used} <= ${max})`,
    used <= max,
    `used=${used}, max=${max}, succes=${successes}, statuts=${results.map((r) => r.status).join(",")}`
  );

  // INTERDIT : d'affirmer « au plus une creation reussie » au-dela de ce que le
  // double peut prouver. Le double n'implemente ni verrou ni conflit de
  // transaction PostgreSQL, donc il ne peut pas valider la surete en
  // concurrence. Ce qui est mesure ici est uniquement l'invariant de
  // non-depassement, et le nombre de places reellement consommees est rapporte
  // tel quel, sans arrondi favorable.
  console.log(
    `        [H] creations reussies : ${successes}/2. Places consommees dans org-alpha : ${used - 1}/${max - 1}.`
  );
  console.log(
    "        [H] Limite assumee : ce double n'implemente ni verrou PostgreSQL ni conflit P2034."
  );
  console.log(
    "        [H] Il ne prouve donc PAS l'absence de place perdue en cas de course reelle."
  );
  console.log(
    "        [H] Contre-mesures non implementees : compteur atomique, ou UNIQUE (organizationId, quotaSlot)."
  );
}

// ---------------------------------------------------------------------------
// Scenario 12 — annulation de session
// ---------------------------------------------------------------------------
currentScenario = "12. Aucune creation de communaute sans jeton";
fresh();
{
  const res = await httpCall("POST", "/api/communities", {
    body: { name: "Cercle anonyme" },
  });
  record("401 sans jeton", res.status === 401, `recu ${res.status}`);
  record(
    "aucune communaute creee",
    fakeCommunities.length === 2,
    `${fakeCommunities.length} communaute(s)`
  );
}

server.close();

// ---------------------------------------------------------------------------
// B. NIVEAU SOURCES — preuve que les contre-mesures sont reellement en place
// ---------------------------------------------------------------------------

console.log("\n--- Niveau B : inspection des sources ---");

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

currentScenario = "B1. Aucune autorite de quota cote client";
{
  const appSource = withoutComments(readSource("src/App.tsx"));
  const banned = /newPlan\s*===\s*'enterprise'|plan\s*===\s*["']enterprise["']\s*\?[^;]*25/;
  record(
    "App.tsx ne derive plus un quota du nom d'un plan",
    !banned.test(appSource),
    banned.test(appSource) ? "derivation de quota presente" : "aucune derivation"
  );

  const subSource = withoutComments(readSource("src/components/partner/PartnerSubscription.tsx"));
  record(
    "PartnerSubscription ne derive plus un quota du nom d'un plan",
    !/enterprise'\s*\?\s*50000/.test(subSource),
    "aucune derivation"
  );
}

currentScenario = "B2. Le catalogue n'expose aucune fonction d'autorisation";
{
  const catalog = withoutComments(readSource("shared/partner-plans.ts"));
  // On cherche une fonction exportee d'autorisation, pas le mot "entitlement".
  const authorizationFunction =
    /export\s+(async\s+)?function\s+\w*(assert|authoriz|canPerform|isAllowed|entitle|hasRight)\w*/i.test(
      catalog
    );
  record(
    "aucune fonction d'autorisation exportee dans le catalogue",
    !authorizationFunction,
    authorizationFunction ? "fonction trouvee" : "aucune fonction d'autorisation"
  );

  const entitlements = withoutComments(readSource("server/services/partner-entitlements.service.ts"));
  record(
    "le service d'entitlements n'importe PAS le catalogue",
    !/partner-plans/.test(entitlements),
    /partner-plans/.test(entitlements) ? "import present" : "aucun import"
  );
}

currentScenario = "B3. Les champs de configuration ne sont jamais lus depuis req.body";
{
  const organizationController = withoutComments(
    readSource("server/controllers/organization.controller.ts")
  );
  const communityController = withoutComments(readSource("server/controllers/community.controller.ts"));
  const campaignController = withoutComments(readSource("server/controllers/campaign.controller.ts"));

  // Cible uniquement `createOrganization` : la candidature publique.
  const createOrgBody = organizationController.slice(
    organizationController.indexOf("export async function createOrganization"),
    organizationController.indexOf("export async function updateOrganizationStatus")
  );
  record(
    "createOrganization ne detruit pas `status` depuis req.body",
    !/const\s*\{[\s\S]*?\bstatus\b[\s\S]*?\}\s*=\s*req\.body/.test(createOrgBody),
    "absent"
  );
  record(
    "createOrganization ne detruit pas `subscriptionPlan` depuis req.body",
    !/const\s*\{[\s\S]*?\bsubscriptionPlan\b[\s\S]*?\}\s*=\s*req\.body/.test(createOrgBody),
    "absent"
  );
  record(
    "createOrganization n'ecrit jamais status depuis une variable du corps",
    !/status:\s*status\b/.test(createOrgBody),
    "absent"
  );
  record(
    "createOrganization impose explicitement status: 'pending'",
    /status:\s*"pending"/.test(createOrgBody),
    "impose"
  );
  record(
    "createOrganization impose explicitement paymentStatus: 'pending'",
    /paymentStatus:\s*"pending"/.test(createOrgBody),
    "impose"
  );
  record(
    "createOrganization ne detruit pas `quota*` depuis req.body",
    !/const\s*\{[\s\S]*?\bquotaCommunitiesMax\b[\s\S]*?\}\s*=\s*req\.body/.test(createOrgBody),
    "absent"
  );

  record(
    "createCommunity ne detruit pas `organizationId` comme identite",
    !/const\s*\{[^}]*\borganizationId\s*:\s*_/s.test(communityController) ||
      !/organizationId:\s*organizationId\b/.test(communityController),
    "absent"
  );
  record(
    "createCampaign n'ecrit jamais organizationId depuis le corps",
    !/organizationId:\s*organizationId\b/.test(campaignController),
    "absent"
  );
  record(
    "createCampaign verifie explicitement l'appartenance de la communaute",
    /community\.organizationId\s*!==\s*organization\.id/.test(campaignController),
    "verification presente"
  );
}

currentScenario = "B4. Plus de creation accessible sans authentification";
{
  const communityRoutes = readSource("server/routes/community.routes.ts");
  record(
    "POST /api/communities utilise requireAuth",
    /router\.post\(\s*"\/"\s*,\s*requireAuth/.test(communityRoutes),
    "requireAuth present"
  );
  record(
    "plus aucun optionalAuth sur POST /api/communities",
    !/router\.post\([^)]*optionalAuth/.test(communityRoutes),
    "aucun optionalAuth sur POST"
  );
}

currentScenario = "B5. Aucun test de role JWT dans les controleurs";
{
  const organizationController = withoutComments(
    readSource("server/controllers/organization.controller.ts")
  );
  record(
    "updateOrganizationStatus ne teste plus req.user.role === 'superadmin'",
    !/req\.user\.role\s*!==?\s*["']superadmin["']/.test(organizationController),
    "aucun test JWT inline"
  );
  const organizationRoutes = readSource("server/routes/organization.routes.ts");
  record(
    "la route de statut est protegee par requireRole(['superadmin'])",
    /requireRole\(\s*\[\s*["']superadmin["']\s*\]\s*\)/.test(organizationRoutes),
    "requireRole present"
  );
}

currentScenario = "B6. Le portail partenaire n'authentifie plus rien tout seul";
{
  const modal = withoutComments(readSource("src/components/partner/PartnerAuthModal.tsx"));
  record(
    "aucun code de demonstration dans PartnerAuthModal",
    !/ONG-2025|PANZI-REF|PARTNER-2025/.test(modal),
    "aucun code de demo"
  );
  record(
    "aucune acceptance par longueur de mot de passe",
    !/password\.length\s*>=\s*\d+/.test(modal),
    "aucune acceptance par longueur"
  );
  record(
    "la connexion passe par l'API serveur",
    /api\.partner\.login/.test(modal),
    "api.partner.login utilise"
  );
  record(
    "les organisations viennent du serveur",
    /api\.partner\.managedOrganizations/.test(modal),
    "api.partner.managedOrganizations utilise"
  );
}

currentScenario = "B7. Aucun indicateur de navigateur comme preuve d'acces";
{
  const appSource = withoutComments(readSource("src/App.tsx"));
  record(
    "plus aucun setItem('tlz_partner_auth', 'true')",
    !/tlz_partner_auth['"]\s*,\s*['"]true/.test(appSource),
    "absent"
  );
  record(
    "isPartnerAuthenticated n'est plus initialise depuis sessionStorage",
    !/useState<boolean>\(\(\)\s*=>\s*\{[\s\S]{0,200}?sessionStorage\.getItem\(\s*['"]tlz_partner_auth/.test(
      appSource
    ),
    "initialisation locale absente"
  );
}

currentScenario = "B8. Aucun paiement simule dans le client";
{
  const subSource = withoutComments(readSource("src/components/partner/PartnerSubscription.tsx"));
  record(
    "aucune declaration de paiement reussi",
    !/setPaymentSuccess/.test(subSource),
    "setPaymentSuccess absent"
  );
  record(
    "aucune confirmation de paiement automatique",
    !/Paiement valid/.test(subSource),
    "aucune confirmation automatique"
  );
  record(
    "aucune reference de transaction fabriquee",
    !/TLZ-TX-/.test(subSource),
    "aucune reference fabriquee"
  );
}

currentScenario = "B9. Aucun modele Prisma brut renvoye par un endpoint public";
{
  const organizationController = withoutComments(
    readSource("server/controllers/organization.controller.ts")
  );
  record(
    "getOrganization utilise toPublicOrganization",
    /toPublicOrganization\(/.test(organizationController),
    "DTO public utilise"
  );
  const dto = readSource("server/services/organization-dto.ts");
  record(
    "la selection publique ne contient aucun champ de gestion",
    !/contactEmail|contactPhone|responsibleName|quotaCommunitiesMax|subscriptionPlan/.test(
      dto.split("PUBLIC_ORGANIZATION_SELECT")[1]?.split("} as const")[0] ?? ""
    ),
    "selection publique propre"
  );
}

currentScenario = "B10. Aucun compteur de membres dans le profil public";
{
  const dto = readSource("server/services/organization-dto.ts");
  const publicSection = dto.slice(dto.indexOf("export function toPublicOrganization"));
  const countersSection = publicSection.slice(0, publicSection.indexOf("\n}"));
  record(
    "aucun numberOfMembers dans le DTO public",
    !/numberOfMembers/.test(countersSection),
    "absent"
  );
}

// ---------------------------------------------------------------------------
// Verdict
// ---------------------------------------------------------------------------

const failures = results.filter((r) => r.status === "fail");

console.log("\n--- Detail des controles ---");
let lastScenario = "";
for (const result of results) {
  if (result.scenario !== lastScenario) {
    console.log(`\n  ${result.scenario}`);
    lastScenario = result.scenario;
  }
  const icon = result.status === "pass" ? "PASS" : "ECHEC";
  console.log(`    [${icon}] ${result.expected} -> ${result.detail}`);
}

const passed = results.length - failures.length;
console.log("\n===============================================");
console.log(`  Chantier 4 : ${passed}/${results.length} controles passes`);
console.log(`  Echecs : ${failures.length}`);
console.log("===============================================\n");

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`ECHEC [${failure.scenario}] ${failure.expected} : ${failure.detail}`);
  }
  process.exit(1);
}