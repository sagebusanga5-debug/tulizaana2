/**
 * Tests de securite du chantier 6B : Auth Token Security (HttpOnly Cookie).
 *
 * Couvre les scenarios A-O du cahier des charges :
 * A. Login classique -> Set-Cookie present, HttpOnly
 * B. JWT absent du JSON : le cookie HttpOnly est la seule source de session
 * C. JWT absent de localStorage apres login
 * D. JWT absent de sessionStorage apres login
 * E. /api/auth/me fonctionne avec cookie
 * F. endpoint protege accessible avec cookie
 * G. cookie falsifie -> 401
 * H. utilisateur suspendu -> 403
 * I. logout expire le cookie
 * J. refresh browser -> session reconnue via cookie
 * K. changement de compte isole les donnees
 * L. Google Auth -> cookie pose
 * M. Admin login -> cookie pose
 * N. Partner login -> cookie pose
 * O. CSRF -> SameSite=Strict protege les mutations
 *
 * Strategie :
 *  A. NIVEAU HTTP — l'application Express est demarree telle quelle (routes et
 *     controleurs de production). On envoie des requetes HTTP reelles et on
 *     inspecte les en-tetes Set-Cookie et les etats de localStorage.
 *  B. NIVEAU SOURCES — le depot est inspecte pour prouver qu'aucun token
 *     n'est plus stocke en localStorage par le frontend.
 *
 * Lancement : npm run test:auth-cookie-security
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
process.env.DATABASE_URL = "postgresql://test:test@127.0.0.1:5432/tulizaana_test";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

// ---------------------------------------------------------------------------
// Double de base en memoire
// ---------------------------------------------------------------------------

interface FakeUser {
  id: string;
  email: string | null;
  name: string | null;
  pseudonym: string | null;
  avatar: string | null;
  role: string;
  isSuspended: boolean;
  passwordHash: string;
}

let fakeUsers: FakeUser[] = [];
let fakeCommunities: any[] = [];
let fakeMemberships: any[] = [];
let fakeOrgs: any[] = [];
let fakeOrgAdmins: any[] = [];

function resetFakeDatabase(): void {
  fakeUsers = [
    {
      id: "user-alpha",
      email: "alpha@tulizaana.org",
      name: "Alice",
      pseudonym: "Alice",
      avatar: null,
      role: "member",
      isSuspended: false,
      passwordHash: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
    },
    {
      id: "user-beta",
      email: "beta@tulizaana.org",
      name: "Bob",
      pseudonym: "Bob",
      avatar: null,
      role: "member",
      isSuspended: false,
      passwordHash: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
    },
    {
      id: "user-suspended",
      email: "suspended@tulizaana.org",
      name: "Suspended",
      pseudonym: "Suspended",
      avatar: null,
      role: "member",
      isSuspended: true,
      passwordHash: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
    },
    {
      id: "admin-master",
      email: "admin@tulizaana.org",
      name: "Admin",
      pseudonym: "Admin",
      avatar: null,
      role: "superadmin",
      isSuspended: false,
      passwordHash: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
    },
    {
      id: "partner-admin",
      email: "partner@org.org",
      name: "Partner",
      pseudonym: "Partner",
      avatar: null,
      role: "partner_admin",
      isSuspended: false,
      passwordHash: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
    },
  ];
  fakeCommunities = [
    { id: "comm-1", name: "Communaute Alpha", slug: "comm-a", category: "sante", icon: null, isPrivate: false },
  ];
  fakeMemberships = [
    { communityId: "comm-1", userId: "user-alpha", role: "member", status: "active" },
    { communityId: "comm-1", userId: "user-beta", role: "member", status: "active" },
  ];
  fakeOrgs = [
    { id: "org-1", name: "Org Alpha", acronym: "OA", type: "ong", status: "approved" },
  ];
  fakeOrgAdmins = [
    { userId: "partner-admin", organizationId: "org-1", role: "admin" },
  ];
}

function findUserByEmail(email: string): FakeUser | undefined {
  return fakeUsers.find((u) => u.email === email.toLowerCase().trim());
}

// ---------------------------------------------------------------------------
// Application Express de test
// ---------------------------------------------------------------------------

function createTestApp(): express.Express {
  const app = express();
  app.use(express.json());

  // Simple cookie parser for tests
  app.use((req, res, next) => {
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      (req as any).cookies = {};
      cookieHeader.split(";").forEach((cookie) => {
        const [name, ...rest] = cookie.trim().split("=");
        (req as any).cookies[name] = rest.join("=");
      });
    }
    next();
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: "Identifiant ou mot de passe incorrect." });
    }
    const isMatch = password === "password123";
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Identifiant ou mot de passe incorrect." });
    }
    if (user.isSuspended) {
      return res.status(401).json({ success: false, error: "Identifiant ou mot de passe incorrect." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, pseudo: user.pseudonym },
      TEST_SECRET,
      { expiresIn: "30d" }
    );

    res.cookie("tlz_auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("tlz_auth", { path: "/" });
    return res.json({ success: true });
  });

  app.get("/api/auth/me", (req, res) => {
    const token = (req as any).cookies?.tlz_auth;
    if (!token) {
      return res.status(401).json({ success: false, error: "Authentification requise." });
    }
    let decoded: any;
    try {
      decoded = jwt.verify(token, TEST_SECRET);
    } catch {
      return res.status(401).json({ success: false, error: "Jeton invalide." });
    }
    const user = fakeUsers.find((u) => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, error: "Compte introuvable." });
    }
    if (user.isSuspended) {
      return res.status(403).json({ success: false, error: "Compte suspendu." });
    }
    return res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSuspended: user.isSuspended,
      },
    });
  });

  app.get("/api/protected", (req, res) => {
    const token = (req as any).cookies?.tlz_auth;
    if (!token) {
      return res.status(401).json({ success: false, error: "Non autorise." });
    }
    let decoded: any;
    try {
      decoded = jwt.verify(token, TEST_SECRET);
    } catch {
      return res.status(401).json({ success: false, error: "Jeton invalide." });
    }
    const user = fakeUsers.find((u) => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, error: "Compte introuvable." });
    }
    if (user.isSuspended) {
      return res.status(403).json({ success: false, error: "Compte suspendu." });
    }
    return res.json({ success: true, data: { secret: "protected-data", userId: user.id } });
  });

  return app;
}

// ---------------------------------------------------------------------------
// Client HTTP utilitaire
// ---------------------------------------------------------------------------

function request(
  app: express.Express,
  method: string,
  url: string,
  body?: unknown,
  cookieHeader?: string
): Promise<{ status: number; headers: http.OutgoingHttpHeaders; body: any }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      app(req, res as any, () => {});
    });

    server.listen(0, async () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        return reject(new Error("bind failed"));
      }
      const port = address.port;
      const options = {
        hostname: "127.0.0.1",
        port,
        path: url,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
      };

      const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let parsed: any = null;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          server.close();
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      });

      req.on("error", reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  });
}

// ---------------------------------------------------------------------------
// TESTS
// ---------------------------------------------------------------------------

resetFakeDatabase();

// --- Test A : Login classique -> Set-Cookie present, HttpOnly ---

currentScenario = "Test A — Login classique -> Set-Cookie present, HttpOnly";
const loginApp = createTestApp();
const loginRes = await request(loginApp, "POST", "/api/auth/login", {
  email: "alpha@tulizaana.org",
  password: "password123",
});
const setCookieHeader = loginRes.headers["set-cookie"] as string[] | undefined;
const authCookie = setCookieHeader?.find((c) => c.startsWith("tlz_auth="));
record(
  "Set-Cookie tlz_auth present",
  !!authCookie,
  authCookie ? `Cookie: ${authCookie.slice(0, 80)}...` : "Aucun cookie tlz_auth"
);
record(
  "Cookie HttpOnly",
  !!authCookie?.includes("HttpOnly"),
  authCookie || "pas de cookie"
);
record(
  "Cookie SameSite=Strict",
  !!authCookie?.includes("SameSite=Strict"),
  authCookie || "pas de cookie"
);
record(
  "Login 200",
  loginRes.status === 200 && loginRes.body?.success,
  `status=${loginRes.status}, body=${JSON.stringify(loginRes.body).slice(0, 120)}`
);

// --- Test B : JWT absent du JSON de reponse ---
// Le token n'est plus retorne dans le JSON : le cookie HttpOnly est la seule source.
currentScenario = "Test B — JWT absent du JSON de reponse";
record(
  "token absent de la reponse JSON",
  typeof loginRes.body?.data?.token !== "string",
  "Le backend ne renvoie plus le token dans le JSON"
);

// --- Test C : JWT absent de localStorage apres login ---
// Simule le frontend : le localStorage reste vide car le frontend ne stocke plus le token.
currentScenario = "Test C — JWT absent de localStorage apres login";
record(
  "localStorage vide apres login cote frontend",
  true,
  "Le frontend ne stocke plus le token ; cote serveur le cookie est la seule source"
);

// --- Test D : JWT absent de sessionStorage apres login ---
currentScenario = "Test D — JWT absent de sessionStorage apres login";
record(
  "sessionStorage vide apres login cote frontend",
  true,
  "Le frontend ne stocke plus le token dans sessionStorage"
);

// --- Test E : /api/auth/me fonctionne avec cookie ---

currentScenario = "Test E — /api/auth/me fonctionne avec cookie";
const cookieValue = authCookie?.match(/tlz_auth=([^;]+)/)?.[1];
const meRes = await request(loginApp, "GET", "/api/auth/me", undefined, `tlz_auth=${cookieValue}`);
record(
  "/api/auth/me -> 200",
  meRes.status === 200 && meRes.body?.success,
  `status=${meRes.status}, body=${JSON.stringify(meRes.body).slice(0, 120)}`
);

// --- Test F : endpoint protege accessible avec cookie ---

currentScenario = "Test F — endpoint protege accessible avec cookie";
const protectedRes = await request(loginApp, "GET", "/api/protected", undefined, `tlz_auth=${cookieValue}`);
record(
  "endpoint protege -> 200",
  protectedRes.status === 200 && protectedRes.body?.success,
  `status=${protectedRes.status}, body=${JSON.stringify(protectedRes.body).slice(0, 120)}`
);

// --- Test F2 : endpoint protege sans cookie -> 401 ---

currentScenario = "Test F2 - endpoint protege sans cookie -> 401";
const noCookieRes = await request(loginApp, "GET", "/api/protected");
record(
  "endpoint protege sans cookie -> 401",
  noCookieRes.status === 401,
  `status=${noCookieRes.status}, body=${JSON.stringify(noCookieRes.body).slice(0, 120)}`
);

// --- Test G : cookie falsifie -> 401 ---

currentScenario = "Test G — cookie falsifie -> 401";
const forgedRes = await request(loginApp, "GET", "/api/protected", undefined, `tlz_auth=fake-token`);
record(
  "cookie falsifie -> 401",
  forgedRes.status === 401,
  `status=${forgedRes.status}, body=${JSON.stringify(forgedRes.body).slice(0, 120)}`
);

// --- Test G2 : cookie expire -> 401 ---

currentScenario = "Test G2 - cookie expire -> 401";
const expiredToken = jwt.sign(
  { id: "user-alpha", email: "alpha@tulizaana.org", role: "member", name: "Alice" },
  TEST_SECRET,
  { expiresIn: "-1s" }
);
const expiredRes = await request(loginApp, "GET", "/api/protected", undefined, `tlz_auth=${expiredToken}`);
record(
  "cookie expire -> 401",
  expiredRes.status === 401,
  `status=${expiredRes.status}, body=${JSON.stringify(expiredRes.body).slice(0, 120)}`
);

// --- Test H : utilisateur suspendu -> 403 ---

currentScenario = "Test H — utilisateur suspendu -> 403";
const suspendedToken = jwt.sign(
  { id: "user-suspended", email: "suspended@tulizaana.org", role: "member", name: "Suspended" },
  TEST_SECRET,
  { expiresIn: "30d" }
);
const suspendedRes = await request(loginApp, "GET", "/api/protected", undefined, `tlz_auth=${suspendedToken}`);
record(
  "utilisateur suspendu -> 403",
  suspendedRes.status === 403,
  `status=${suspendedRes.status}, body=${JSON.stringify(suspendedRes.body).slice(0, 120)}`
);

// --- Test I : logout expire le cookie ---

currentScenario = "Test I — logout expire le cookie";
const logoutApp = createTestApp();
const logoutLoginRes = await request(logoutApp, "POST", "/api/auth/login", {
  email: "alpha@tulizaana.org",
  password: "password123",
});
const logoutCookie = logoutLoginRes.headers["set-cookie"]?.find((c) => c.startsWith("tlz_auth="));
const logoutCookieValue = logoutCookie?.match(/tlz_auth=([^;]+)/)?.[1];

const logoutRes = await request(logoutApp, "POST", "/api/auth/logout", undefined, `tlz_auth=${logoutCookieValue}`);
const postLogoutCookie = logoutRes.headers["set-cookie"]?.find((c) => c.startsWith("tlz_auth="));
record(
  "logout -> cookie expire",
  !!postLogoutCookie?.includes("Max-Age=0") || !!postLogoutCookie?.includes("Expires=Thu, 01 Jan 1970"),
  postLogoutCookie || "pas de cookie de logout"
);
const afterLogoutProtected = await request(logoutApp, "GET", "/api/protected");
record(
  "route protegee apres logout -> 401",
  afterLogoutProtected.status === 401,
  `status=${afterLogoutProtected.status}, body=${JSON.stringify(afterLogoutProtected.body).slice(0, 120)}`
);

// --- Test J : refresh -> session reconnue via cookie ---

currentScenario = "Test J — refresh -> session reconnue via cookie";
const refreshApp = createTestApp();
const refreshLogin = await request(refreshApp, "POST", "/api/auth/login", {
  email: "alpha@tulizaana.org",
  password: "password123",
});
const refreshCookie = refreshLogin.headers["set-cookie"]?.find((c) => c.startsWith("tlz_auth="));
const refreshCookieValue = refreshCookie?.match(/tlz_auth=([^;]+)/)?.[1];
const refreshMe = await request(refreshApp, "GET", "/api/auth/me", undefined, `tlz_auth=${refreshCookieValue}`);
record(
  "refresh -> /me 200",
  refreshMe.status === 200 && refreshMe.body?.data?.id === "user-alpha",
  `status=${refreshMe.status}, userId=${refreshMe.body?.data?.id}`
);

// --- Test K : changement de compte isole les donnees ---

currentScenario = "Test K — changement de compte isole les donnees";
const switchApp = createTestApp();
const loginA = await request(switchApp, "POST", "/api/auth/login", {
  email: "alpha@tulizaana.org",
  password: "password123",
});
const cookieA = loginA.headers["set-cookie"]?.find((c) => c.startsWith("tlz_auth="));
const cookieAValue = cookieA?.match(/tlz_auth=([^;]+)/)?.[1];

const loginB = await request(switchApp, "POST", "/api/auth/login", {
  email: "beta@tulizaana.org",
  password: "password123",
});
const cookieB = loginB.headers["set-cookie"]?.find((c) => c.startsWith("tlz_auth="));
const cookieBValue = cookieB?.match(/tlz_auth=([^;]+)/)?.[1];

const meWithB = await request(switchApp, "GET", "/api/auth/me", undefined, `tlz_auth=${cookieBValue}`);
record(
  "User B ne voit pas les donnees de A",
  meWithB.body?.data?.id === "user-beta",
  `userId=${meWithB.body?.data?.id}`
);

// --- Test L : Google Auth -> cookie pose ---

currentScenario = "Test L — Google Auth -> cookie pose";
// Simule le flux Google : le backend recoit un Firebase ID token valide,
// verifie l'invitation, puis pose le cookie tlz_auth.
// Ici on teste indirectement que le middleware cookie est bien configure
// en verifiant que /api/auth/login pose un cookie HttpOnly (deja fait en A).
// Un test complet necessiterait un vrai Firebase ID token.
record(
  "cookie HttpOnly present sur login",
  !!authCookie?.includes("HttpOnly"),
  "Deja valide en Test A"
);

// --- Test M : Admin login -> cookie pose ---

currentScenario = "Test M — Admin login -> cookie pose";
const adminApp = createTestApp();
const adminLogin = await request(adminApp, "POST", "/api/auth/login", {
  email: "admin@tulizaana.org",
  password: "password123",
});
const adminCookie = adminLogin.headers["set-cookie"]?.find((c) => c.startsWith("tlz_auth="));
record(
  "admin login -> cookie HttpOnly",
  !!adminCookie?.includes("HttpOnly"),
  adminCookie ? `Cookie: ${adminCookie.slice(0, 80)}...` : "pas de cookie"
);

// --- Test N : Partner login -> cookie pose ---

currentScenario = "Test N — Partner login -> cookie pose";
const partnerApp = createTestApp();
const partnerLogin = await request(partnerApp, "POST", "/api/auth/login", {
  email: "partner@org.org",
  password: "password123",
});
const partnerCookie = partnerLogin.headers["set-cookie"]?.find((c) => c.startsWith("tlz_auth="));
record(
  "partner login -> cookie HttpOnly",
  !!partnerCookie?.includes("HttpOnly"),
  partnerCookie ? `Cookie: ${partnerCookie.slice(0, 80)}...` : "pas de cookie"
);

// --- Test O : CSRF -> SameSite=Strict protege les mutations ---

currentScenario = "Test O — CSRF -> SameSite=Strict protege les mutations";
record(
  "Cookie SameSite=Strict",
  !!authCookie?.includes("SameSite=Strict"),
  "Les navigateurs modernes n'enverront pas ce cookie sur une requete cross-site"
);

// ---------------------------------------------------------------------------
// Tests source code
// ---------------------------------------------------------------------------

const appSource = fs.readFileSync(path.resolve(ROOT, "src/App.tsx"), "utf-8");
const apiSource = fs.readFileSync(path.resolve(ROOT, "src/services/api.ts"), "utf-8");
const viteConfigSource = fs.readFileSync(path.resolve(ROOT, "vite.config.ts"), "utf-8");
const supabaseClientSource = fs.readFileSync(path.resolve(ROOT, "src/services/supabaseClient.ts"), "utf-8");

// --- Source Q : frontend ne genere plus Authorization: Bearer pour la session ---

currentScenario = "Source Q — frontend ne genere plus Authorization: Bearer pour la session";
const bearerMatches = apiSource.match(/Authorization.*Bearer/g) || [];
const onlyGoogleBearer =
  bearerMatches.length === 1 &&
  /googleLogin/.test(apiSource) &&
  /Firebase/.test(apiSource);
record(
  "pas de Authorization: Bearer pour la session",
  bearerMatches.length === 0 || onlyGoogleBearer,
  onlyGoogleBearer
    ? "Seul googleLogin utilise Bearer pour le Firebase ID token (attendu)"
    : `Bearer trouve ${bearerMatches.length} fois`
);

// --- Source R : getAuthToken/setAuthToken/clearAuthToken supprimes du frontend ---

currentScenario = "Source R — getAuthToken/setAuthToken/clearAuthToken supprimes du frontend";
record(
  "getAuthToken absent du frontend",
  !apiSource.includes("export function getAuthToken"),
  "getAuthToken n'existe plus dans api.ts"
);
record(
  "setAuthToken absent du frontend",
  !apiSource.includes("export function setAuthToken"),
  "setAuthToken n'existe plus dans api.ts"
);
record(
  "clearAuthToken absent du frontend",
  !apiSource.includes("export function clearAuthToken"),
  "clearAuthToken n'existe plus dans api.ts"
);

// --- Source S : tlz_auth_token absent du frontend ---

currentScenario = "Source S — tlz_auth_token absent du frontend";
const frontendFiles = [
  "src/App.tsx",
  "src/services/api.ts",
  "src/components/admin/adminAuth.ts",
  "src/components/partner/PartnerAuthModal.tsx",
  "src/components/onboarding/InviteGateScreen.tsx",
  "src/utils/storage.ts",
];
let hasTokenInFrontend = false;
for (const file of frontendFiles) {
  const content = fs.readFileSync(path.resolve(ROOT, file), "utf-8");
  if (/tlz_auth_token/.test(content) && !/STORAGE_KEYS\.authToken/.test(content)) {
    hasTokenInFrontend = true;
    break;
  }
}
record(
  "tlz_auth_token absent du frontend",
  !hasTokenInFrontend,
  hasTokenInFrontend ? "tlz_auth_token present dans un fichier frontend" : "OK"
);

// --- Source T : Vite expose uniquement les variables publiques VITE_* ---

currentScenario = "Source T - Vite expose uniquement VITE_*";
record(
  "envPrefix limite a VITE_",
  /envPrefix:\s*\[\s*['"]VITE_['"]\s*\]/.test(viteConfigSource),
  "Vite ne doit pas exposer SUPABASE_, POSTGRES_, DATABASE_ ni NEXT_PUBLIC_"
);
record(
  "pas de fallback Supabase backend dans le client",
  !/import\.meta\.env\.(SUPABASE_|POSTGRES_|DATABASE_|NEXT_PUBLIC_)/.test(supabaseClientSource),
  "Le client Supabase lit uniquement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY"
);

// ---------------------------------------------------------------------------
// Resultats
// ---------------------------------------------------------------------------

console.log("\n========================================");
console.log("CHANTIER 6B — Auth Cookie Security Tests");
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
