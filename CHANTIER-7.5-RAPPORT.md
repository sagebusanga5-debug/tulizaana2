# CHANTIER 7.5 — RAPPORT FINAL
## Certificat CA Supabase + validation Prisma

**Date :** 2026-10-04
**Portée :** Configuration TLS PostgreSQL (Prisma + Node) — aucun changement de schéma, de migration, de donnée métier, de controller, d'authentification ni de frontend.
**Règle d'or :** Aucune désactivation de TLS ni de la validation des certificats (`NODE_TLS_REJECT_UNAUTHORIZED=0`, `rejectUnauthorized=false`, `sslmode=require` en remplacement de `verify-full`).

---

## 1. CERTIFICAT

```text
certs/supabase.crt exists: YES
file size:                 1367 octets (1 bloc PEM, 23 lignes)
PEM format:                PASS
certificate parse:         PASS (Node crypto.X509Certificate — openssl absent de la machine)
validity period:           VALID  2021-04-28 10:56:53 GMT -> 2031-04-26 10:56:53 GMT
subject:                   C=US, ST=Delware, L=New Castle, O=Supabase Inc, CN=Supabase Root 2021 CA
issuer:                    C=US, ST=Delware, L=New Castle, O=Supabase Inc, CN=Supabase Root 2021 CA
                           (racine auto-signée, basicConstraints CA:true)
serialNumber:              6CBC4CA1DEB63F692D0A2024C67289C2D13D54F6
fingerprint256:            80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA
```

**Chaîne attendue confirmée sur le serveur :**

```text
leaf     CN=*.pooler.supabase.com        SAN DNS:*.pooler.supabase.com, DNS:*.pooler.supabase.co
   ↓
interm.  CN=Supabase Intermediate 2021 CA
   ↓
racine   CN=Supabase Root 2021 CA        = certs/supabase.crt
```

Le certificat CA est public : son contenu n'est pas un secret et peut être versionné.

---

## 2. TLS

### 2.1 Piège protocole découvert

Le pooler Supabase **n'est pas** un endpoint TLS brut. La négociation est :

```text
Client --SSLRequest (00000008 04D2162F)--> Serveur
Client <---------------- 'S' (0x53) ------ Serveur
Client ---------------- TLS 1.3 ----------> Serveur
```

Un `tls.connect()` direct échoue avec `ERR_SSL_WRONG_VERSION_NUMBER` / `F0430000 ... ssl3_get_record:wrong version number`.
C'est l'origine des diagnostics erronés des Chantiers 7.2–7.4 : le test TLS contournait le `SSLRequest` et concluait à tort que le port n'offrait pas TLS.

`openssl` n'étant pas installé sur cette machine Windows, toute la validation a été réalisée avec `node:tls` / `node:crypto` (mêmes contrôles, API standard).

### 2.2 Résultats

```text
TLS without CA:            FAIL — SELF_SIGNED_CERT_IN_CHAIN
                           "self-signed certificate in certificate chain"
TLS with Supabase CA:      PASS
certificate validation:    PASS  (authorized=true, authorizationError=(none))
hostname validation:       PASS  (aws-0-eu-west-1.pooler.supabase.com ∈ SAN *.pooler.supabase.com)
protocole / cipher:        TLSv1.3  /  TLS_AES_256_GCM_SHA384
leaf validTo:              2030-03-15... (Mar 11 15:56:33 2030 GMT)
```

Valide sur les ports **6543** (transaction) et **5432** (session).

**Preuve que la CA est réellement opposée :** la même connexion échoue avec `SELF_SIGNED_CERT_IN_CHAIN` sans la CA et réussit avec. Aucune CA tierce, aucun certificat auto-généré, aucun contournement.

---

## 3. PRISMA

### 3.1 Configuration existante

```text
Prisma CLI / @prisma/client : 6.19.3   (package.json : ^6.4.1)
generator client             : prisma-client-js
datasource db                : provider = "postgresql"
                               url      = env("DATABASE_URL")     (prisma/schema.prisma:11)
directUrl                    : absent
prisma.config.*              : absent (seul package.json#prisma = { seed }, déprécié en Prisma 7)
```

**URL réellement utilisée par Prisma :**

| Contexte | Variable | Source |
|---|---|---|
| CLI Prisma (`generate`, `migrate`, `db`) | `DATABASE_URL` | `prisma/schema.prisma:11` |
| Application au runtime | `POSTGRES_PRISMA_URL` en priorité 1, puis `POSTGRES_URL`, `DATABASE_URL`, `POSTGRES_URL_NON_POOLING` | `server/config/database.ts:51-55` |

Les deux chemins ont donc été traités.

### 3.2 Les trois URL inspectées (aucun credential affiché)

```text
=== DATABASE_URL ===   (celle utilisée par le CLI Prisma)
  hostname: aws-0-eu-west-1.pooler.supabase.com
  port:     6543
  database: postgres
  username: postgres.zrpmbsknudinjjryjinm
  password present: YES (14 caractères)
  SSL parameters: (aucun avant correction)
  CA configured: NO

=== POSTGRES_PRISMA_URL ===   (priorité 1 au runtime)
  hostname: aws-0-eu-west-1.pooler.supabase.com
  port:     6543
  database: postgres
  username: postgres.zrpmbsknudinjjryjinm
  password present: YES (14 caractères)
  SSL parameters: (aucun avant correction)
  CA configured: NO

=== POSTGRES_URL_NON_POOLING ===
  hostname: aws-0-eu-west-1.pooler.supabase.com
  port:     5432
  database: postgres
  username: postgres.zrpmbsknudinjjryjinm
  password present: YES (14 caractères)
  SSL parameters: (aucun avant correction)
  CA configured: NO
```

### 3.3 Résultat

```text
Prisma initialization: FAIL
TLS:                   négocié
PostgreSQL connection: FAIL — FATAL CXX000 (ENOTFOUND)
                       tenant/user postgres.zrpmbsknudinjjryjinm not found
SELECT 1:              FAIL
disconnect:            PASS
```

Aucune table métier interrogée.

### 3.4 Découverte : `sslrootcert` est ignoré par Prisma sous Windows

Le moteur Prisma 6.19.3 utilise **schannel** sous Windows et **ignore `sslrootcert`**. Contrôles par cas négatifs (3 exécutions chacun) :

```text
sslrootcert=certs/DOES_NOT_EXIST_AT_ALL.crt  -> comportement identique
sslrootcert=.env.example (texte brut)         -> comportement identique
sslrootcert=node_modules/typescript/package.json -> comportement identique
sslrootcert=certs/supabase.crt (valide)      -> comportement identique
```

Conclusion : sous Windows la validation de la CA ne peut pas être imposée **par Prisma**. Elle reste imposable par la pile Node (`node:tls`), ce qui est fait et vérifié. Sous Linux (cible cPanel), Prisma applique `sslrootcert` et la configuration sera réellement effective.

Le paramètre `sslmode=verify-full` a été conservé : il est correct, portable, et sans effet nuisible sous Windows.

---

## 4. MIGRATIONS

```text
prisma migrate status: NON EXECUTÉ
Raison: clause Phase 10 — « Uniquement si Prisma SELECT 1 = PASS ». SELECT 1 = FAIL.

20260907000000_initial_tulizaana_schema:          UNKNOWN
20261003000000_partner_subscription_lifecycle:    UNKNOWN
```

Les deux migrations existent bien sur le disque (`prisma/migrations/`). Rien n'a été appliqué.

Commandes explicitement **non** exécutées : `migrate deploy`, `migrate reset`, `db push`, `db pull`.

---

## 5. TESTS

```text
typecheck / build / auth / auth-cookie-security / admin-security /
partner-security / resource-security / storage-security / seed / api-integrity
```

**NON EXECUTÉS** — clause Phase 12 : « Si Prisma fonctionne et `migrate status` est accessible ». Aucune de ces deux conditions n'est remplie. Les scripts existent et sont nommés comme dans le brief (`test:auth` -> `scripts/test-google-auth-security.ts`, etc.). Aucun test n'a été modifié.

---

## 6. MODIFICATIONS

```text
.env modified:              YES
                            + sslmode=verify-full & sslrootcert=certs/supabase.crt
                              sur DATABASE_URL, POSTGRES_PRISMA_URL, POSTGRES_URL,
                              POSTGRES_URL_NON_POOLING
                            + 6 lignes de commentaire documentant la CA officielle
                            Mots de passe vérifiés inchangés (5 lignes PASSWORD= identiques
                            avant/après ; longueur du mot de passe URL : 14 -> 14)

.env.example modified:      YES  (mêmes paramètres, pour la parité de déploiement)

Prisma configuration modified: YES  (chaîne de connexion uniquement, dans .env)
schema.prisma modified:     NO
CA file added:              NO  (certs/supabase.crt déjà présent)
.gitignore modified:        NO  (non requis)
migration created:          NO
migration applied:          NO
database data modified:     NO
controller/auth/frontend modifiés: NO
```

### 6.1 Choix du chemin de la CA

```text
certs/supabase.crt
```

Chemin **relatif**, portable Windows / Linux / cPanel. Aucun chemin absolu `C:\Users\HP\`.
Prisma résout `sslrootcert` relativement au **CWD** : Prisma doit donc être lancé depuis la racine du projet — ce qui est déjà le cas des scripts npm (`build` → `prisma generate ...`, `start` → `node dist/server.cjs`).

### 6.2 Vérification Git

```text
git rev-parse --show-toplevel : C:/Users/HP      ← dépôt à la racine du dossier utilisateur
git check-ignore -v .env     : Downloads/Tulizaana-main/Tulizaana-main/.gitignore:7 : .env*
                              → .env n'est PAS suivi par Git : CONFIRMÉ
certs/supabase.crt           : NON ignoré, NON suivi
                              → CA publique : versionnement ACCEPTABLE
```

Aucun commit n'a été créé (hors périmètre).

---

## 7. ROOT CAUSE

Deux couches distinctes.

### Couche A — TLS (cible de ce chantier) : RÉSOLUE

Aucune CA n'était configurée dans les URL PostgreSQL et Prisma retombe par défaut sur `sslmode=require` (chiffrement sans validation). Avec la CA officielle et `verify-full`, la chaîne **et** le hostname se valident. Les diagnostics antérieurs étaient exacerbés par un test TLS qui sautait l'étape `SSLRequest` du protocole PostgreSQL.

### Couche B — NOUVEAU blocage, hors périmètre TLS : la référence projet Supabase n'existe pas

```text
Supavisor : CXX000 M(ENOTFOUND) tenant/user postgres.zrpmbsknudinjjryjinm not found

Reproduit à l'identique sur les 10 régions du pooler :
  us-east-1, us-west-1, us-west-2, eu-west-1, eu-west-2,
  eu-central-1, ap-southeast-1, ap-southeast-2, ap-northeast-1, ap-south-1

DNS :
  db.zrpmbsknudinjjryjinm.supabase.co        -> NXDOMAIN
  zrpmbsknudinjjryjinm.pooler.supabase.com   -> NXDOMAIN
  (*.supabase.co résout via un wildcard Cloudflare : sans valeur probante)

Contrôle de positivité du pooler :
  user=postgres seul -> CXX000 ENOIDENTIFIER
  "no tenant identifier provided (external_id or sni_hostname required)"
  → le pooler répond correctement ; il n'a simplement aucun tenant pour ce ref
```

L'erreur survient **avant** l'authentification : le mot de passe n'a jamais été évalué. Il n'est donc pas en cause.

**Le TLS passant ne prouve rien sur l'existence du projet** : Supavisor termine TLS avec le même certificat `*.pooler.supabase.com` pour tous les tenants. La validation de la CA est donc satisfied avant même que la résolution du tenant n'ait lieu.

### RESOLUTION

```text
TLS / validation certificat : RÉSOLU
  certs/supabase.crt + sslmode=verify-full + sslrootcert sur les 4 URL
  chaîne et hostname validés contre la CA officielle Supabase

Blocage restant : fournir des identifiants Supabase valides
  1. Relever le project ref réel dans le dashboard Supabase
     (Project Settings -> Database)
  2. Mettre à jour .env :
       DATABASE_URL, POSTGRES_PRISMA_URL, POSTGRES_URL, POSTGRES_URL_NON_POOLING
       POSTGRES_USER, POSTGRES_HOST
       SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL, VITE_SUPABASE_URL
     (et le mot de passe si celui-ci a été réinitialisé)
  3. Relancer SELECT 1

Aucun changement de code n'est nécessaire ensuite.
Sous Linux, la configuration CA sera réellement appliquée par Prisma.
```

---

## 8. POINTS SIGNALÉS (hors périmètre, non modifiés)

1. **`.env.example` contient le mot de passe réel en clair**, et `.gitignore` l'exclut explicitement de l'ignorance (`!.env.example`). S'il était versionné, le credential fuiterait. À remplacer par des placeholders — non fait ici, la modification de credentials étant interdite.
2. **Le dépôt Git est à la racine `C:\Users\HP`** (dossier utilisateur) et non à la racine du projet. Le projet entier est non suivi, et `git status` exécuté depuis le projet liste l'intégralité du dossier utilisateur. Un dépôt propre (`git init` dans `Tulizaana-main/`) serait nécessaire avant toute mise en version.
3. **`POSTGRES_URL_NON_POOLING` pointe vers le port 5432 du pooler** et non vers l'hôte direct. C'est valide (mode session de Supavisor), mais le nom est trompeur.

---

## 9. VERDICT

```text
CHANTIER 7.5 — BLOQUÉ
```

La partie TLS est **résolue et vérifiée** : la CA officielle Supabase valide la chaîne de certificats et le hostname. `SELECT 1` reste impossible pour une cause d'infrastructure (référence projet Supabase inexistante) qui ne relève pas de la configuration TLS.

Chantier 7 dans son ensemble **non déclaré validé**.