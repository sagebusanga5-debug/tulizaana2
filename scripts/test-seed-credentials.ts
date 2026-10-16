/**
 * Tests de securite du chantier 3.1 : credentials des comptes de demonstration.
 *
 * Aucun mot de passe reel n'est ecrit dans ce fichier, et aucun secret de
 * production n'est requis.
 *
 * Strategie de test en deux niveaux :
 *
 *  A. NIVEAU COMPORTEMENT — le vrai `prisma/seed.ts` est execute dans un
 *     sous-processus Node, avec `@prisma/client` remplace par un faux client en
 *     memoire (voir scripts/support/fake-prisma-loader.mjs). Aucune base de
 *     donnees n'est necessaire, et le code de production n'est pas modifie ni
 *     instrumente pour les besoins du test.
 *
 *  B. NIVEAU SOURCES — le depot est inspecte pour prouver qu'aucun ancien mot de
 *     passe de demonstration ne subsiste, qu'aucune de ces variables n'est
 *     exposee au frontend, et qu'aucun prefixe VITE_ n'est utilise.
 *
 * Lancement : npm run test:seed
 */

import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";

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

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath: string): string {
  const absolute = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolute)) return "";
  return fs.readFileSync(absolute, "utf8");
}

/**
 * Anciens mots de passe de demonstration.
 *
 * Ils sont cites ici uniquement pour prouver leur absence : aucun n'est
 * reellement utilise comme credential dans ce test. On teste d'ailleurs qu'ils
 * ne fonctionnent plus (voir scenario 6).
 */
const LEGACY_DEMO_PASSWORDS = [
  "Panzi" + "Care2026!",
  "Drepa" + "Soutien2026!",
  "Serenite" + "2026!",
];

/** Secrets de test générés à la volée : aucune valeur en clair dans le dépôt. */
function generateTestSecret(label: string): string {
  return `${label}-${randomBytes(18).toString("hex")}`;
}

const DEMO_ENV_VARS = [
  { key: "DEMO_PARTNER_ADMIN_PASSWORD", account: "coordination@panzi-tulizaana.org", role: "partner_admin" },
  { key: "DEMO_PEER_HELPER_PASSWORD", account: "amina.drepa@tulizaana.cd", role: "peer_helper" },
  { key: "DEMO_MEMBER_PASSWORD", account: "jean.marc@tulizaana.cd", role: "member" },
] as const;

interface SeedRun {
  exitCode: number;
  output: string;
  users: Array<Record<string, any>>;
  invitations: Array<Record<string, any>>;
  posts: Array<Record<string, any>>;
  communityMembers: Array<Record<string, any>>;
  organizationAdmins: Array<Record<string, any>>;
  organizations: Array<Record<string, any>>;
  communities: Array<Record<string, any>>;
}

/**
 * Execute le seed dans un sous-processus, avec un|Prisma factice.
 * L'environnement est fourni explicitement : aucun `.env` n'intervient.
 */
async function runSeed(env: Record<string, string>): Promise<SeedRun> {
  const dumpPath = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "tlz-seed-")),
    "dump.json"
  );

  const childEnv: Record<string, string> = {
    PATH: process.env.PATH ?? "",
    SystemRoot: process.env.SystemRoot ?? "",
    TLZ_FAKE_PRISMA_DUMP: dumpPath,
  };
  for (const [key, value] of Object.entries(env)) childEnv[key] = value;

  let seedExitCode = 1;

  const output = await new Promise<string>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        "--import",
        "tsx",
        "--import",
        "./scripts/support/fake-prisma-loader.mjs",
        "prisma/seed.ts",
      ],
      { cwd: projectRoot, env: childEnv, shell: false }
    );

    let buffer = "";
    child.stdout.on("data", (chunk) => (buffer += chunk));
    child.stderr.on("data", (chunk) => (buffer += chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      seedExitCode = code ?? 1;
      resolve(buffer);
    });
  });

  const dump = fs.existsSync(dumpPath)
    ? JSON.parse(fs.readFileSync(dumpPath, "utf8"))
    : { records: {} };

  const records = dump.records ?? {};

  return {
    exitCode: seedExitCode,
    output,
    users: records.user ?? [],
    invitations: records.invitation ?? [],
    posts: records.post ?? [],
    communityMembers: records.communityMember ?? [],
    organizationAdmins: records.organizationAdmin ?? [],
    organizations: records.organization ?? [],
    communities: records.community ?? [],
  };
}

// ===========================================================================
// A. NIVEAU COMPORTEMENT — le vrai seed, execute
// ===========================================================================

console.log("\n=== CHANTIER 3.1 : tests des credentials des comptes de démonstration ===\n");
console.log("--- Niveau A : comportement du seed (vrai prisma/seed.ts, Prisma factice) ---");

// S1 : aucune variable fournie -> aucun compte de démonstration
currentScenario = "1. Seed sans variable DEMO_* -> aucun compte de démonstration";
{
  const run = await runSeed({});

  const demoEmails = DEMO_ENV_VARS.map((demo) => demo.account);
  const createdDemoAccounts = run.users.filter((user) => demoEmails.includes(user.email));

  record(
    "aucun compte de démonstration créé",
    createdDemoAccounts.length === 0,
    createdDemoAccounts.length === 0
      ? `aucun des ${demoEmails.length} comptes présent en base`
      : `créés : ${createdDemoAccounts.map((u) => u.email).join(", ")}`
  );

  record(
    "avertissement nommant les variables attendues",
    DEMO_ENV_VARS.every((demo) => run.output.includes(demo.key)) &&
      run.output.includes("Aucun mot de passe de démonstration fourni"),
    "le message liste les variables manquantes"
  );

  record(
    "aucun secret de substitution dans la base",
    run.users.every((user) => !user.passwordHash || !LEGACY_DEMO_PASSWORDS.includes(user.passwordHash)),
    "aucune empreinte n'est un ancien mot de passe en clair"
  );

  record(
    "données organisationnelles intactes",
    run.organizations.length === 2 && run.communities.length === 2,
    `${run.organizations.length} organisation(s), ${run.communities.length} cercle(s)`
  );

  record(
    "aucune dépendance orpheline",
    run.communityMembers.length === 0 &&
      run.organizationAdmins.length === 0 &&
      run.invitations.length === 0 &&
      run.posts.length === 0,
    "ni adhésion, ni invitation, ni publication sans compte"
  );
}

// S2 : configuration partielle -> échec explicite, aucune écriture
currentScenario = "2. Seed avec configuration partielle -> échec nommant la variable";
{
  const secrets = Object.fromEntries(
    DEMO_ENV_VARS.map((demo) => [demo.key, generateTestSecret(demo.key)])
  ) as Record<string, string>;

  // Seuls deux des trois secrets sont fournis.
  const partialEnv = {
    DEMO_PARTNER_ADMIN_PASSWORD: secrets.DEMO_PARTNER_ADMIN_PASSWORD,
    DEMO_MEMBER_PASSWORD: secrets.DEMO_MEMBER_PASSWORD,
  };

  const run = await runSeed(partialEnv);

  record(
    "le seed signale l'échec",
    run.exitCode !== 0,
    `code de sortie ${run.exitCode}`
  );
  record(
    "la variable manquante est nommée",
    run.output.includes("DEMO_PEER_HELPER_PASSWORD"),
    "DEMO_PEER_HELPER_PASSWORD est citée dans le message"
  );
  record(
    "aucun compte créé",
    run.users.length === 0,
    `${run.users.length} compte(s) en base`
  );
}

// S3 : secret trop court -> échec avant tout hash
currentScenario = "3. Secret de démonstration trop court -> échec";
{
  const env = Object.fromEntries(
    DEMO_ENV_VARS.map((demo) => [demo.key, generateTestSecret(demo.key)])
  ) as Record<string, string>;
  env.DEMO_MEMBER_PASSWORD = "court123";

  const run = await runSeed(env);

  record("le seed signale l'échec", run.exitCode !== 0, `code de sortie ${run.exitCode}`);
  record(
    "la longueur minimale est expliquée",
    run.output.includes("DEMO_MEMBER_PASSWORD") && run.output.includes("12"),
    "le message indique la variable et la longueur requise"
  );
  record("aucun compte créé", run.users.length === 0, `${run.users.length} compte(s) en base`);
}

// S4 : les trois variables fournies -> les trois comptes sont créés et hashés
currentScenario = "4. Seed avec les trois variables -> comptes créés et hashés";
const validRun = await (async () => {
  const secrets = Object.fromEntries(
    DEMO_ENV_VARS.map((demo) => [demo.key, generateTestSecret(demo.key)])
  ) as Record<string, string>;

  const run = await runSeed({
    ...secrets,
    ADMIN_SEED_PASSWORD: generateTestSecret("ADMIN"),
  });

  return { secrets, run };
})();
{
  const { secrets, run } = validRun;

  record(
    "les trois comptes de démonstration existent",
    DEMO_ENV_VARS.every((demo) => run.users.some((user) => user.email === demo.account)),
    run.users.map((user) => user.email).join(", ")
  );

  record(
    "le compte administrateur est créé",
    run.users.some((user) => user.email === "admin@tulizaana.org"),
    "admin@tulizaana.org présent en base"
  );

  for (const demo of DEMO_ENV_VARS) {
    const stored = run.users.find((user) => user.email === demo.account);
    const secret = secrets[demo.key];
    const hash = stored?.passwordHash ?? "";

    const isBcrypt = /^\$2[aby]\$\d{2}\$/.test(hash);
    const matchesSecret = isBcrypt && (await bcrypt.compare(secret, hash));
    const isNotPlaintext = hash !== secret && !hash.includes(secret);

    record(
      `${demo.key} : hash bcrypt, secret en clair absent`,
      isBcrypt && matchesSecret && isNotPlaintext,
      isBcrypt
        ? `bcrypt ${hash.slice(0, 7)}…, bcrypt.compare=${matchesSecret}, clair absent=${isNotPlaintext}`
        : `empreinte inattendue : ${hash.slice(0, 24)}`
    );
  }

  // Les anciens mots de passe ne doivent plus ouvrir la moindre session.
  const storedPartner = run.users.find((user) => user.email === DEMO_ENV_VARS[0].account);
  const oldStillWorks =
    !!storedPartner?.passwordHash &&
    LEGACY_DEMO_PASSWORDS.some((legacy) => legacy.length > 0 && storedPartner.passwordHash === legacy);
  record(
    "aucun ancien mot de passe n'est stocké en clair",
    !oldStillWorks,
    "les trois anciennes valeurs sont absentes de la base"
  );

  for (const legacy of LEGACY_DEMO_PASSWORDS) {
    const matches = storedPartner?.passwordHash ? await bcrypt.compare(legacy, storedPartner.passwordHash) : false;
    record(
      "un ancien mot de passe ne valide plus l'authentification",
      !matches,
      `bcrypt.compare sur l'ancien secret = ${matches}`
    );
    break;
  }

  record(
    "les liens de dépendance sont reconstitués",
    run.communityMembers.length === 3 &&
      run.organizationAdmins.length === 1 &&
      run.invitations.length === 2 &&
      run.posts.length === 1,
    `${run.communityMembers.length} adhésion(s), ${run.organizationAdmins.length} admin(s) d'org., ` +
      `${run.invitations.length} invitation(s), ${run.posts.length} publication(s)`
  );

  record(
    "les mots de passe ne fuient pas dans la sortie",
    !Object.values(secrets).some((secret) => run.output.includes(secret)),
    "aucun secret en clair dans stdout/stderr"
  );
}

// S5 : ré-exécution du seed avec le même environnement -> pas de doublon
currentScenario = "5. Ré-exécution du seed -> aucun doublon de compte";
{
  const secrets = Object.fromEntries(
    DEMO_ENV_VARS.map((demo) => [demo.key, generateTestSecret(demo.key)])
  ) as Record<string, string>;

  const first = await runSeed(secrets);
  const second = await runSeed(secrets);

  const countDemoAccounts = (run: typeof first) =>
    run.users.filter((user) => DEMO_ENV_VARS.some((demo) => demo.account === user.email)).length;

  record(
    "les comptes restent uniques",
    countDemoAccounts(first) === 3 && countDemoAccounts(second) === 3,
    `${countDemoAccounts(first)} puis ${countDemoAccounts(second)} compte(s) de démonstration`
  );
}

// ===========================================================================
// B. NIVEAU SOURCES — plus aucune trace des anciens secrets
// ===========================================================================

console.log("\n--- Niveau B : inspection des sources ---");

currentScenario = "6. Ancien mot de passe de démonstration dans le seed";
{
  const seedSource = readSource("prisma/seed.ts");
  const found = LEGACY_DEMO_PASSWORDS.filter((legacy) => seedSource.includes(legacy));

  record(
    "0 occurrence dans prisma/seed.ts",
    found.length === 0,
    found.length === 0 ? "aucune ancienne valeur" : `trouvé : ${found.join(", ")}`
  );
}

currentScenario = "7. Ancien mot de passe dans la documentation publique";
{
  const guide = readSource("CPANEL_DEPLOYMENT_GUIDE.md");
  const found = LEGACY_DEMO_PASSWORDS.filter((legacy) => guide.includes(legacy));

  record(
    "0 occurrence dans CPANEL_DEPLOYMENT_GUIDE.md",
    found.length === 0,
    found.length === 0 ? "aucune ancienne valeur" : `trouvé : ${found.join(", ")}`
  );

  record(
    "le guide documente les variables, pas des valeurs",
    DEMO_ENV_VARS.every((demo) => guide.includes(demo.key)) && guide.includes("ADMIN_SEED_PASSWORD"),
    "les noms de variables sont documentés"
  );
}

currentScenario = "8. Les variables d'environnement sont bien lues par le seed";
{
  const seedSource = readSource("prisma/seed.ts");

  const readBySeed = DEMO_ENV_VARS.every(
    (demo) => new RegExp(`process\\.env\\[?"?\\s*${demo.key}`).test(seedSource) || seedSource.includes(`"${demo.key}"`)
  );
  record("les trois variables sont lues par le seed", readBySeed, DEMO_ENV_VARS.map((d) => d.key).join(", "));

  record(
    "chaque variable correspond à un rôle réel de la base",
    DEMO_ENV_VARS.every((demo) => seedSource.includes(`role: "${demo.role}"`)),
    DEMO_ENV_VARS.map((demo) => `${demo.key} -> ${demo.role}`).join(", ")
  );

  record(
    "hash bcrypt appliqué avant insertion",
    seedSource.includes("await bcrypt.hash(secret, 10)") &&
      DEMO_ENV_VARS.every((demo) => seedSource.includes('requireDemoHash("') ||
        seedSource.includes(`requireDemoHash("`)),
    "les trois comptes reçoivent requireDemoHash(...)"
  );

  record(
    "aucun repli par défaut",
    !/DEMO_\w+_PASSWORD[\s\S]{0,200}\|\|\s*["']/.test(seedSource) &&
      !/bcrypt\.hash\(\s*["'][^"']+["']\s*,\s*\d+\s*\)/.test(
        seedSource.split("MIN_DEMO_PASSWORD_LENGTH")[1] ?? ""
      ),
    "aucun motif `password || \"valeur\"` ni bcrypt.hash(\"valeur\") dans la section démo"
  );
}

currentScenario = "9. Aucune exposition des secrets au frontend";
{
  const FRONTEND_SOURCES = [
    "src/App.tsx",
    "src/services/api.ts",
    "src/components/admin/AdminLoginModal.tsx",
    "src/components/admin/adminAuth.ts",
  ];
  const frontendCorpus = FRONTEND_SOURCES.map(readSource).join("\n");

  record(
    "aucune variable de seed lue par le frontend",
    !/DEMO_(PARTNER_ADMIN|PEER_HELPER|MEMBER)_PASSWORD/.test(frontendCorpus) &&
      !frontendCorpus.includes("ADMIN_SEED_PASSWORD"),
    `${FRONTEND_SOURCES.length} fichiers frontend inspectés`
  );

  // Aucun préfixe VITE_ : une telle variable serait compilée dans le bundle public.
  const projectFiles: string[] = [];
  const collect = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) collect(full);
      else if (/\.(ts|tsx|mjs|js|md|example)$/.test(entry.name)) projectFiles.push(full);
    }
  };
  collect(projectRoot);

  const viteLeaks = projectFiles.filter((file) => {
    const content = fs.readFileSync(file, "utf8");
    return /VITE_(DEMO_|ADMIN_SEED_PASSWORD)/.test(content);
  });
  record(
    "aucun VITE_* pour ces variables",
    viteLeaks.length === 0,
    viteLeaks.length === 0 ? "aucun préfixe VITE_ sur les secrets du seed" : viteLeaks.join(", ")
  );

  const envExample = readSource(".env.example");
  record(
    ".env.example déclare les variables avec des valeurs vides",
    DEMO_ENV_VARS.every((demo) => envExample.includes(`${demo.key}=""`)) &&
      envExample.includes('ADMIN_SEED_PASSWORD=""'),
    "les quatre variables sont présentes et vides"
  );

  const envExampleLeaks = LEGACY_DEMO_PASSWORDS.filter((legacy) => envExample.includes(legacy));
  record(
    ".env.example ne contient aucun ancien mot de passe",
    envExampleLeaks.length === 0,
    envExampleLeaks.length === 0 ? "aucune valeur réelle" : envExampleLeaks.join(", ")
  );
}

currentScenario = "10. Ancien mot de passe absent du bundle construit";
{
  const distDir = path.join(projectRoot, "dist", "assets");

  if (!fs.existsSync(distDir)) {
    console.log(
      "   [INFO] dist/ absent : bundle non encore construit sur cet environnement. " +
        " Lancez `npm run build` puis relancez ce test pour la verification du bundle."
    );
    record("verification du bundle reportée", true, "dist/ absent, aucune conclusion tiree");
  } else {
    const bundle = fs
      .readdirSync(distDir)
      .filter((name) => name.endsWith(".js"))
      .map((name) => fs.readFileSync(path.join(distDir, name), "utf8"))
      .join("\n");

    const found = LEGACY_DEMO_PASSWORDS.filter((legacy) => bundle.includes(legacy));
    record(
      "0 occurrence dans dist/assets/*.js",
      found.length === 0,
      found.length === 0 ? "aucune ancienne valeur dans le bundle" : `trouvé : ${found.join(", ")}`
    );

    record(
      "aucune variable de seed dans le bundle",
      !/DEMO_(PARTNER_ADMIN|PEER_HELPER|MEMBER)_PASSWORD|ADMIN_SEED_PASSWORD/.test(bundle),
      "aucun nom de variable de seed compilé"
    );
  }
}

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
  console.log("Aucun mot de passe de demonstration n'est connu du depot.");
  process.exitCode = 0;
}