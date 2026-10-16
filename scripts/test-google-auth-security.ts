/**
 * Tests de securite du chantier 2 : POST /api/auth/google.
 *
 * Aucun vrai compte Google et aucune vraie cle Firebase de production ne sont
 * utilises.
 *
 * Strategie de test en deux niveaux, pour rester proche du code de production :
 *
 *  A. NIVEAU HTTP — l'application Express est demarree telle quelle (routes et
 *     controleurs de production, vrai firebase-admin). On envoie des jetons
 *     bidons : ils sont rejetes par une vraie verification de signature.
 *     Couvre l'exigence "aucune identite sans preuve cryptographique".
 *
 *  B. NIVEAU SERVICE — la regle metier (`resolveGoogleSignIn`) est appelee
 *     directement avec une identite Google deja PROUVEE et une base en memoire.
 *     Couvre la regle invitation, l'imposition du role et l'origine des donnees.
 *
 * Aucun module de production n'est neutralise ni modifie : on ne contourne
 * aucune verification de securite pour faire passer un test.
 *
 * Lancement : npx tsx scripts/test-google-auth-security.ts
 */

import http from "node:http";
import express from "express";
import jwt from "jsonwebtoken";

import {
  resolveGoogleSignIn,
  isInvitationUsable,
  GoogleAuthDatabase,
  GoogleIdentity,
  DEFAULT_MEMBER_ROLE,
} from "../server/services/googleAuth.service.js";
import {
  generateAuthToken,
  resolveJwtSecretForTest,
  __setSecretForTest,
} from "../server/middleware/auth.js";

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

const OLD_HARDCODED_SECRET = "tulizaana-secret-key-2026-production-salt";
const TEST_SECRET = "secret-de-test-uniquement-0123456789abcdefghijklmnop";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = TEST_SECRET;
__setSecretForTest(TEST_SECRET);

// ---------------------------------------------------------------------------
// Base en memoire conforme au contrat Prisma du service Google
// ---------------------------------------------------------------------------

const futureDate = () => new Date(Date.now() + 30 * 24 * 3600 * 1000);

const VALID_INVITATION = {
  id: "inv-valid",
  code: "TESTCODE-2026",
  communityId: "comm-test-1",
  organizationId: "org-test-1",
  status: "active",
  maxUses: 5,
  currentUses: 1,
  expiresAt: futureDate(),
};

const EXPIRED_INVITATION = {
  ...VALID_INVITATION,
  id: "inv-expired",
  code: "EXPIRED-2026",
  expiresAt: new Date(Date.now() - 3600 * 1000),
};

const EXHAUSTED_INVITATION = {
  ...VALID_INVITATION,
  id: "inv-exhausted",
  code: "USEDUP-2026",
  maxUses: 1,
  currentUses: 1,
};

const REVOKED_INVITATION = {
  ...VALID_INVITATION,
  id: "inv-revoked",
  code: "REVOKED-2026",
  status: "revoked",
};

const ADMIN_USER = {
  id: "user-admin",
  email: "admin@tulizaana.org",
  name: "Sage Busanga",
  pseudonym: "SuperAdmin_Tulizaana",
  role: "superadmin",
  memberStatus: "active_participant",
  isSuspended: false,
  avatar: null,
  bio: null,
  country: "RDC",
  city: "Kinshasa",
  isAnonymous: false,
  points: 500,
  communityMemberships: [],
  organizationAdmins: [],
};

function createFakeDatabase(seedUsers: any[] = []) {
  const users: any[] = [...seedUsers];
  const invitations: any[] = [
    { ...VALID_INVITATION },
    { ...EXPIRED_INVITATION },
    { ...EXHAUSTED_INVITATION },
    { ...REVOKED_INVITATION },
  ];
  const memberships: any[] = [];
  let counter = 0;

  const database: GoogleAuthDatabase & {
    users: any[];
    invitations: any[];
    memberships: any[];
  } = {
    users,
    invitations,
    memberships,

    user: {
      findFirst: async (args: unknown) => {
        const where = (args as any)?.where || {};
        const emailEquals = where?.email?.equals;

        if (typeof emailEquals !== "string") {
          // Une recherche par un autre champ (name, id...) serait une
          // regression : c'est ce qui permettait de voler une session.
          throw new Error("Recherche par un champ autre que email : non autorisee.");
        }

        const target = emailEquals.trim().toLowerCase();
        const found = users.find((u) => String(u.email).toLowerCase() === target);
        return found ? JSON.parse(JSON.stringify(found)) : null;
      },
      create: async (args: unknown) => {
        counter += 1;
        const record = {
          id: `user-created-${counter}`,
          memberStatus: "active_participant",
          isSuspended: false,
          country: null,
          city: null,
          bio: null,
          isAnonymous: false,
          points: 0,
          communityMemberships: [],
          organizationAdmins: [],
          ...(args as any).data,
        };
        users.push(record);
        return JSON.parse(JSON.stringify(record));
      },
    },

    invitation: {
      findUnique: async (args: unknown) => {
        const code = (args as any)?.where?.code;
        const found = invitations.find((i) => i.code === code);
        return found ? JSON.parse(JSON.stringify(found)) : null;
      },
      update: async (args: unknown) => {
        const id = (args as any)?.where?.id;
        const data = (args as any)?.data || {};
        const found = invitations.find((i) => i.id === id);
        if (found) {
          if (typeof data.currentUses?.increment === "number") {
            found.currentUses += data.currentUses.increment;
          }
          if (data.status) {
            found.status = data.status;
          }
        }
        return found ? JSON.parse(JSON.stringify(found)) : null;
      },
    },

    communityMember: {
      findUnique: async (args: unknown) => {
        const key = (args as any)?.where?.communityId_userId;
        if (!key) return null;
        const found = memberships.find(
          (m) => m.communityId === key.communityId && m.userId === key.userId
        );
        return found ? JSON.parse(JSON.stringify(found)) : null;
      },
      create: async (args: unknown) => {
        const record = { id: `membership-${memberships.length + 1}`, ...(args as any).data };
        memberships.push(record);
        return JSON.parse(JSON.stringify(record));
      },
    },
  } as any;

  return database;
}

// ---------------------------------------------------------------------------
// Identites Google simulees (deja "verifiees" : ce sont des jetons de test)
// ---------------------------------------------------------------------------

const invitedIdentity: GoogleIdentity = {
  firebaseUid: "firebase-uid-invited",
  email: "membre.invite@exemple.org",
  emailVerified: true,
  displayName: "Membre Invite",
  photoUrl: "https://example.org/avatar.png",
};

const guestIdentity: GoogleIdentity = {
  firebaseUid: "firebase-uid-guest",
  email: "inconnu.sans.invitation@exemple.org",
  emailVerified: true,
  displayName: "Inconnu Sans Invitation",
  photoUrl: null,
};

const unverifiedIdentity: GoogleIdentity = {
  firebaseUid: "firebase-uid-unverified",
  email: "nonverifie@exemple.org",
  emailVerified: false,
  displayName: "Email Non Verifie",
  photoUrl: null,
};

// ===========================================================================
// A. NIVEAU HTTP — application reelle, vraie verification de signature
// ===========================================================================

console.log("\n=== CHANTIER 2 : tests de securite POST /api/auth/google ===\n");
console.log("--- Niveau A : HTTP, application de production, vrais controleurs ---");

const { default: authRoutes } = await import("../server/routes/auth.routes.js");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

const server = app.listen(0, "127.0.0.1");
await new Promise<void>((resolve) => server.once("listening", () => resolve()));
const port = (server.address() as any).port;

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Promise<{ status: number; payload: any }>((resolve, reject) => {
    const payload = JSON.stringify(body ?? {});
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": String(Buffer.byteLength(payload)),
          ...headers,
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
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
    req.write(payload);
    req.end();
  });
}

// S1 : aucun token
  currentScenario = "1. POST sans token -> 401";
  {
    const r = await post("/api/auth/google", { email: "admin@tulizaana.org", role: "superadmin" });
    record("401", r.status === 401, `recu ${r.status} : ${JSON.stringify(r.payload).slice(0, 110)}`);
    record("aucun jeton emis", r.payload?.data?.token === undefined, "aucune session accordee");
  }

  // S2 : token arbitraire
  currentScenario = "2. token arbitraire -> 401";
  {
    const r = await post(
      "/api/auth/google",
      { email: "admin@tulizaana.org" },
      { Authorization: "Bearer ceci-nest-pas-un-token-firebase" }
    );
    record("401", r.status === 401, `recu ${r.status} : ${JSON.stringify(r.payload).slice(0, 110)}`);
  }

  // S3 : token signe avec une fausse cle (structure JWT valide, signature fausse)
  currentScenario = "3. token Firebase invalide -> 401";
  {
    const forgedJwt = jwt.sign({ sub: "firebase-uid-attacker", email: "admin@tulizaana.org" }, "signature-fabulee");
    const r = await post(
      "/api/auth/google",
      { email: "admin@tulizaana.org" },
      { Authorization: `Bearer ${forgedJwt}` }
    );
    record("401", r.status === 401, `recu ${r.status} : ${JSON.stringify(r.payload).slice(0, 110)}`);
  }

  // S4 : email admin dans le body, sans token
  currentScenario = "4. email admin dans le body sans token -> 401";
  {
    const r = await post("/api/auth/google", {
      email: "admin@tulizaana.org",
      displayName: "Sage Busanga",
      uid: "firebase-uid-invited",
      role: "superadmin",
      invitationCode: "TESTCODE-2026",
    });
    record("401", r.status === 401, `recu ${r.status} : ${JSON.stringify(r.payload).slice(0, 110)}`);
    record("aucun jeton emis", r.payload?.data?.token === undefined, "aucune session accordee");
  }

  // S5 : email admin + faux token
  currentScenario = "5. email admin + faux token -> 401";
  {
    const r = await post(
      "/api/auth/google",
      { email: "admin@tulizaana.org", role: "superadmin", invitationCode: "TESTCODE-2026" },
      { Authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhdHRhY2tlciJ9.fake" }
    );
    record("401", r.status === 401, `recu ${r.status} : ${JSON.stringify(r.payload).slice(0, 110)}`);
    record("aucun jeton emis", r.payload?.data?.token === undefined, "aucune session accordee");
  }

// S10 : le JWT produit est refuse par l'ancien secret en dur du chantier 1
currentScenario = "10. JWT signe avec le JWT_SECRET du chantier 1";
{
  const token = generateAuthToken({
    id: "user-created-test",
    email: "membre.invite@exemple.org",
    role: DEFAULT_MEMBER_ROLE,
    name: "Membre Invite",
    pseudo: "Membre",
  });

  let verifiedWithTestSecret = false;
  try {
    const decoded = jwt.verify(token, resolveJwtSecretForTest());
    verifiedWithTestSecret = Boolean(decoded);
  } catch {
    verifiedWithTestSecret = false;
  }
  record("signature valide avec le JWT_SECRET configure", verifiedWithTestSecret, "verification reussie");

  let acceptedByOldSecret = true;
  try {
    jwt.verify(token, OLD_HARDCODED_SECRET);
  } catch {
    acceptedByOldSecret = false;
  }
  record(
    "ancien secret en dur rejete",
    !acceptedByOldSecret,
    "le secret du depot ne verifie plus aucun jeton"
  );

  let acceptedByForeignSecret = true;
  try {
    jwt.verify(token, "autre-secret-que-lattaquant-connait-01234567890");
  } catch {
    acceptedByForeignSecret = false;
  }
  record("secret tiers rejete", !acceptedByForeignSecret, "signature non reproductible");
}

// Non-regression : la connexion classique existe toujours
currentScenario = "bonus. POST /api/auth/login toujours disponible";
{
  const r = await post("/api/auth/login", { identifier: "inconnu", password: "peu-importe" });
  record(
    "route presente (503 BDD non configuree, pas 404/500)",
    r.status === 503 || r.status === 401 || r.status === 200,
    `recu ${r.status} : ${JSON.stringify(r.payload).slice(0, 90)}`
  );
}

server.close();

// ===========================================================================
// B. NIVEAU SERVICE — regle metier avec identite Google prouvee
// ===========================================================================

console.log("--- Niveau B : regle invitation / role / origine des donnees ---");

// S6 : authentifie Google, SANS invitation
currentScenario = "6. Google authentifie sans invitation -> refus";
{
  const db = createFakeDatabase([{ ...ADMIN_USER }]);
  const outcome = await resolveGoogleSignIn({ identity: guestIdentity, database: db });

  record("refus", outcome.status === "forbidden", `statut : ${outcome.status}`);
  record(
    "aucun compte cree",
    !db.users.some((u) => String(u.email).toLowerCase() === guestIdentity.email),
    "la base reste sans ce compte"
  );
}

// S6b : invitations invalides (expiree, epuisee, revoquee, inconnue)
currentScenario = "6b. invitation invalide -> refus";
{
  for (const [label, code] of [
    ["expiree", "EXPIRED-2026"],
    ["epuisee", "USEDUP-2026"],
    ["revoquee", "REVOKED-2026"],
    ["inconnue", "CODE-QUI-EXISTE-PAS"],
  ] as const) {
    const db = createFakeDatabase();
    const outcome = await resolveGoogleSignIn({ identity: guestIdentity, invitationCode: code, database: db });
    record(`refus sur invitation ${label}`, outcome.status === "forbidden", `statut : ${outcome.status}`);
    record(
      `aucun compte cree (${label})`,
      db.users.length === 0,
      `${db.users.length} utilisateur(s) en base`
    );
  }
}

// S7 : authentifie Google AVEC invitation valide
currentScenario = "7. Google authentifie + invitation valide -> acces autorise";
{
  const db = createFakeDatabase([{ ...ADMIN_USER }]);
  const outcome = await resolveGoogleSignIn({
    identity: invitedIdentity,
    invitationCode: "TESTCODE-2026",
    database: db,
  });

  record("authentifie", outcome.status === "authenticated", `statut : ${outcome.status}`);

  if (outcome.status === "authenticated") {
    record(
      "email issu du token verifie",
      outcome.user.email === invitedIdentity.email,
      `email : ${outcome.user.email}`
    );
    record(
      "nom issu du token verifie",
      outcome.user.name === invitedIdentity.displayName,
      `nom : ${outcome.user.name}`
    );
    record(
      "avatar issu du token verifie",
      outcome.user.avatar === invitedIdentity.photoUrl,
      `avatar : ${outcome.user.avatar}`
    );
    record(
      "role impose par le serveur",
      outcome.user.role === DEFAULT_MEMBER_ROLE,
      `role : ${outcome.user.role}`
    );
    record(
      "adhere au cercle de l'invitation",
      db.memberships.some((m) => m.communityId === VALID_INVITATION.communityId),
      `${db.memberships.length} adhesion(s)`
    );

    const invitationAfter = db.invitations.find((i) => i.code === "TESTCODE-2026");
    record(
      "utilisation du code consommee",
      invitationAfter?.currentUses === 2,
      `currentUses : ${invitationAfter?.currentUses}`
    );

    // Second appel : idempotent, pas de doublon.
    const again = await resolveGoogleSignIn({
      identity: invitedIdentity,
      invitationCode: "TESTCODE-2026",
      database: db,
    });
    record(
      "reconnexion sans code acceptee",
      again.status === "authenticated",
      `statut : ${again.status}`
    );
    const accountsForThisEmail = db.users.filter(
      (u) => String(u.email).toLowerCase() === invitedIdentity.email
    ).length;
    record(
      "aucun doublon de compte",
      accountsForThisEmail === 1,
      `${accountsForThisEmail} compte(s) pour cet email (${db.users.length} en base au total)`
    );
    record(
      "adhesion toujours unique",
      db.memberships.filter((m) => m.communityId === VALID_INVITATION.communityId).length === 1,
      `${db.memberships.length} adhesion(s)`
    );
  }
}

// S8 : le client ne peut pas choisir son role
currentScenario = "8. role choisi par le client -> impossible";
{
  // L'API publique ne prend aucun role ; on verifie qu'aucune voie de service
  // ne permet de l'influencer, et que le role est toujours la constante serveur.
  const db = createFakeDatabase();
  const outcome = await resolveGoogleSignIn({
    identity: invitedIdentity,
    invitationCode: "TESTCODE-2026",
    database: db,
  });

  if (outcome.status === "authenticated") {
    record(
      "role = member, jamais superadmin",
      outcome.user.role === "member" && outcome.user.role !== "superadmin",
      `role : ${outcome.user.role}`
    );
  } else {
    record("role = member, jamais superadmin", false, `statut inattendu : ${outcome.status}`);
  }
}

// S9 : le client ne peut pas choisir l'email d'un tiers
currentScenario = "9. email d'un tiers -> impossible";
{
  const db = createFakeDatabase([{ ...ADMIN_USER }]);
  const outcome = await resolveGoogleSignIn({
    identity: invitedIdentity,
    invitationCode: "TESTCODE-2026",
    database: db,
  });

  if (outcome.status === "authenticated") {
    record(
      "email = celui du token, pas celui du body",
      outcome.user.email === invitedIdentity.email,
      `email : ${outcome.user.email}`
    );
    record(
      "le compte admin n'a pas ete vole",
      outcome.user.email !== ADMIN_USER.email && outcome.user.id !== ADMIN_USER.id,
      `id : ${outcome.user.id}`
    );
    record(
      "le role admin n'est pas reutilisable",
      outcome.user.role !== ADMIN_USER.role,
      `role obtenu : ${outcome.user.role}`
    );
  } else {
    record("email = celui du token", false, `statut inattendu : ${outcome.status}`);
  }
}

// S7b : email Google non verifie
currentScenario = "7b. email Google non verifie -> refus";
{
  const db = createFakeDatabase();
  const outcome = await resolveGoogleSignIn({
    identity: unverifiedIdentity,
    invitationCode: "TESTCODE-2026",
    database: db,
  });
  record("refus", outcome.status === "forbidden", `statut : ${outcome.status}`);
  record("aucun compte cree", db.users.length === 0, "base intacte");
}

// S11 : compte suspendu
currentScenario = "11. compte suspendu -> refus";
{
  const suspended = {
    ...ADMIN_USER,
    id: "user-suspended",
    email: "suspendu@exemple.org",
    role: "member",
    isSuspended: true,
  };
  const db = createFakeDatabase([suspended]);
  const outcome = await resolveGoogleSignIn({
    identity: {
      firebaseUid: "uid-suspended",
      email: "suspendu@exemple.org",
      emailVerified: true,
      displayName: "Compte Suspendu",
      photoUrl: null,
    },
    database: db,
  });
  record("refus", outcome.status === "forbidden", `statut : ${outcome.status}`);
}

// S12 : la regle d'expiration est partagee avec /api/auth/register
currentScenario = "12. regle d'invitation partagee avec register";
{
  record("invitation valide acceptee", isInvitationUsable(VALID_INVITATION), "reference");
  record("invitation expiree refusee", !isInvitationUsable(EXPIRED_INVITATION), "reference");
  record("invitation epuisee refusee", !isInvitationUsable(EXHAUSTED_INVITATION), "reference");
  record("invitation revoquee refusee", !isInvitationUsable(REVOKED_INVITATION), "reference");
  record("invitation absente refusee", !isInvitationUsable(null), "reference");
}

// ---------------------------------------------------------------------------
// Rapport
// ---------------------------------------------------------------------------

console.log("");
for (const r of results) {
  const icon = r.status === "pass" ? "OK  " : "FAIL";
  console.log(`[${icon}] ${r.scenario}`);
  console.log(`        attendu : ${r.expected}`);
  console.log(`        detail  : ${r.detail}`);
}

const failures = results.filter((r) => r.status === "fail");
console.log(`\n=== ${results.length - failures.length}/${results.length} verifications reussies ===`);

if (failures.length > 0) {
  console.log("\nVERIFICATIONS EN ECHEC :");
  for (const f of failures) {
    console.log(` - ${f.scenario} | attendu: ${f.expected} | ${f.detail}`);
  }
  process.exit(1);
}

console.log("Tous les scenarios de securite passent.");
process.exit(0);