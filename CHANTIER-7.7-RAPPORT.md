# CHANTIER 7.7 — RAPPORT FINAL
## Correction des endpoints PostgreSQL Supabase et validation Prisma

**Date :** 2026-10-04
**Portée :** configuration de connexion PostgreSQL uniquement — aucun modèle, aucune migration, aucune donnée, aucun controller, aucun middleware d'authentification, aucun frontend.
**Règle d'or :** aucune désactivation de TLS ou de la validation des certificats.

---

## A. Configuration

```text
Project ref:            zrpmbsknudinjjryjinm

DATABASE_URL host:      aws-1-eu-west-1.pooler.supabase.com
DATABASE_URL port:      6543   (pooler, mode transaction)
DATABASE_URL params:    pgbouncer=true
                        sslmode=verify-full
                        sslrootcert=certs/supabase.crt

DIRECT_URL host:        aws-1-eu-west-1.pooler.supabase.com
DIRECT_URL port:        5432   (pooler, mode session)
DIRECT_URL params:      pgbouncer=false
                        sslmode=verify-full
                        sslrootcert=certs/supabase.crt

database:               postgres
username:               postgres.zrpmbsknudinjjryjinm
password:               <jamais affiché>
```

Variables également repointées sur le même hôte : `POSTGRES_PRISMA_URL`, `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_HOST`.

### A.1 Cause racine

Le blocage n'était **ni le TLS, ni le mot de passe, ni l'encodage** : c'était le **shard du pooler**.

```text
Ancien hôte : aws-0-eu-west-1.pooler.supabase.com   -> 34.241.16.247, 108.128.216.176, 52.209.89.87
Nouvel hôte : aws-1-eu-west-1.pooler.supabase.com  -> 18.202.64.2, 54.247.26.119, 54.229.189.117
```

Sur `aws-0`, Supavisor répondait `CXX000 M(ENOTFOUND) tenant/user postgres.zrpmbsknudinjjryjinm not found` — le tenant est shardsé sur `aws-1`. Le TLS passait déjà dans les deux cas, ce qui masquait la cause réelle.

Écart supplémentaire constaté entre `.env` et `.env.example` : les deux fichiers portaient **deux mots de passe différents** de 14 caractères. La valeur de `.env` est celle qui fonctionne ; `.env.example` portait une valeur erronée. Aucun des deux n'est reproduit ici.

---

## B. Résultats

Chaîne exécutée dans l'ordre imposé, sans court-circuit.

```text
DNS 6543:                PASS   aws-1-eu-west-1.pooler.supabase.com -> 18.202.64.2, 54.247.26.119, 54.229.189.117
DNS 5432:                PASS   (même hôte)
TCP 6543:                PASS
TCP 5432:                PASS
TLS 6543:                PASS   TLSv1.3 / TLS_AES_256_GCM_SHA384
TLS 5432:                PASS   TLSv1.3 / TLS_AES_256_GCM_SHA384
certificate validation: PASS   authorized=true, authorizationError=(none)
                         leaf CN=*.pooler.supabase.com
                         issuer CN=Supabase Intermediate 2021 CA
                         racine CN=Supabase Root 2021 CA = certs/supabase.crt
                         SAN: DNS:*.pooler.supabase.com, DNS:*.pooler.supabase.co
hostname validation:    PASS   aws-1-eu-west-1.pooler.supabase.com ∈ SAN

PostgreSQL SELECT 1:     PASS   psql (PostgreSQL) 18.3, sslmode=verify-full,
                                sslrootcert=certs/supabase.crt  ->  1  (exit 0)
                                testé sur 5432 et sur 6543

Prisma SELECT 1:         PASS   via DATABASE_URL (6543) -> [{"?column?":1}]
                                via DIRECT_URL   (5432) -> [{"?column?":1}]
Prisma initialization:   PASS
disconnect:              PASS

Prisma migrate status:   PASS
                         Datasource "db": PostgreSQL database "postgres",
                         schema "public" at "aws-1-eu-west-1.pooler.supabase.com:5432"
                         2 migrations found in prisma/migrations
```

### B.1 Preuve que la validation TLS est réellement imposée

Trois exécutions `psql` sur le même endpoint, seule la variable `PGSSLROOTCERT` changeant :

```text
sslrootcert = certs/DOES_NOT_EXIST.crt   -> ECHEC  exit=2
              "le fichier de certificat racine ... n'existe pas"

sslrootcert = <vide, magasin systeme>     -> ECHEC  exit=2
              "le fichier de certificat racine ... root.crt n'existe pas"

sslrootcert = certs/supabase.crt          -> SUCCES SELECT 1 -> 1, exit=0
```

La vérification est donc bien active : sans la CA officielle, la connexion est refusée. `sslmode=require`, `rejectUnauthorized=false` et `NODE_TLS_REJECT_UNAUTHORIZED=0` n'apparaissent nulle part dans le projet.

### B.2 Correction appliquée à `prisma/schema.prisma` (justifiée)

Avant correction, `schema.prisma` ne déclarait que `url = env("DATABASE_URL")`. `prisma migrate status` **se bloquait indéfiniment** sur le pooler en mode transaction (timeout 300 s, aucune sortie) :

```text
Datasource "db": PostgreSQL database "postgres", schema "public"
                at "aws-1-eu-west-1.pooler.supabase.com:6543"
<blocage definitif>
```

Raison technique : les opérations Prisma CLI prennent un verrou consultatif PostgreSQL (`pg_advisory_lock`) pour la table `_prisma_migrations`. En mode transaction, le pooler ne garantit pas le même backend entre deux instructions, donc l'attente du verrou ne se résout jamais. C'est précisément le cas d'usage pour lequel Supabase publie `DIRECT_URL`.

Ajout, limité au bloc `datasource` :

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Après ajout, `migrate status` répond immédiatement et résout la source sur le port 5432. **Aucun modèle, aucune relation et aucun champ n'ont été touchés.**

---

## C. Migrations

```text
local migration files:      OK      2 répertoires présents
                                    20260907000000_initial_tulizaana_schema/migration.sql
                                    20261003000000_partner_subscription_lifecycle/migration.sql
database migration state:   KNOWN   table _prisma_migrations lisible
database accessible:        YES

20260907000000_initial_tulizaana_schema:          PENDING
20261003000000_partner_subscription_lifecycle:    PENDING
migrations en attente:      OUI (2)
```

Sortie de `prisma migrate status` :

```text
2 migrations found in prisma/migrations
Following migrations have not yet been applied:
20260907000000_initial_tulizaana_schema
20261003000000_partner_subscription_lifecycle
```

**Aucune migration n'a été appliquée.** Les fichiers `prisma/migrations/*` n'ont pas été modifiés (dates du 26/09 et du 03/10).

Commandes interdites, jamais exécutées : `migrate deploy`, `migrate reset`, `migrate dev`, `db push`, `db pull`.

---

## D. Sécurité

```text
.env ignored:                    YES   .gitignore:7 -> .env*
.env.example contains real secrets: NO   (OUI avant remediation, voir ci-dessous)
Git tracks secrets:              NO
```

**Git root réel :** `C:/Users/HP` — le dépôt est le dossier utilisateur, pas le projet.

```text
git rev-parse --show-toplevel            -> C:/Users/HP
git ls-files -- <projet>  | wc -l       -> 0
```

Le projet est **intégrement non suivi**. Par conséquent :

```text
.env                        NON suivi  (et de toute facon ignore par .gitignore)
.env.example                NON suivi  (mais explicitement des-ignore : .gitignore:8 -> !.env.example)
certs/supabase.crt          NON suivi  (non ignore) — CA publique, versionnable
```

Aucune rotation de mot de passe ni réécriture d'historique n'a été entreprise.

### D.1 Remediation `.env.example`

Avant ce chantier, `.env.example` contenait des secrets **réels** alors qu'il est explicitement inclus au versionnement (`.gitignore:8` : `!.env.example`). C'était le point le plus grave du chantier.

Secrets réels qui ont été retirés :

```text
mot de passe PostgreSQL          present dans 4 URL + POSTGRES_PASSWORD  -> [YOUR-PASSWORD]
SUPABASE_SECRET_KEY              cle d'administration reelle (210 car.)  -> [YOUR-SUPABASE-SECRET-KEY]
CLOUDINARY_API_SECRET            valeur reelle                           -> [YOUR-CLOUDINARY-API-SECRET]
```

Conservé volontairement (valeurs publiques par architecture) :

```text
SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL, VITE_SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_ANON_KEY
POSTGRES_USER, POSTGRES_HOST, POSTGRES_DATABASE, PORT
CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_CLOUD_NAME
```

`CLOUDINARY_API_KEY="123456789012345"` est une valeur de démonstration factice préexistante, pas un secret (le secret est `CLOUDINARY_API_SECRET`, retiré).

Scan résiduel après remediation : **aucune valeur réelle hors placeholder**.

### D.2 Point de vigilance restant

La clé Supabase d'administration et les clés Cloudinary étaient présentes dans `.env.example`. Elles restent inchangées **dans `.env`**, qui est bien ignoré par Git. Comme le projet n'est suivi par aucun dépôt, il n'y a pas de fuite déjà committée — mais le risque se matérialiserait dès le premier `git add`. Le placeholding a été appliqué avant toute mise en version.

---

## E. Fichiers modifiés

```text
.env                        MODIFIE
                            - 5 occurrences aws-0 -> aws-1 (4 URL + POSTGRES_HOST)
                            - DIRECT_URL ajoutee (aws-1:5432, sslmode=verify-full,
                              sslrootcert=certs/supabase.crt, pgbouncer=false)
                            - sslmode=verify-full / sslrootcert conserves partout
                            - mot de passe inchange

.env.example                MODIFIE
                            - 5 occurrences aws-0 -> aws-1
                            - DIRECT_URL ajoutee avec placeholder
                            - secrets reels remplaces par des placeholders
                            - hote POSTGRES_HOST mis a jour

prisma/schema.prisma       MODIFIE  (bloc datasource uniquement)
                            + directUrl = env("DIRECT_URL")
                            + 6 lignes de commentaire explicatives
                            Aucun modele, champ ou relation touche
```

Fichiers **non** modifiés :

```text
certs/supabase.crt                intact (1367 octets, CA officielle)
prisma/migrations/*                intact
prisma/seed.ts                    intact
server/**                          intact
src/**                             intact
scripts/**                         intact
package.json                       intact
.gitignore                         intact
```

Fichiers temporaires de diagnostic : crees puis supprimes (0 restant).

### E.1 Vérifications projet

```text
npm run typecheck                 exit=0
npm run build                     exit=0   (prisma generate + vite build + esbuild)

npm run test:auth                     exit=0   44/44
npm run test:auth-cookie-security     exit=0   28/28
npm run test:admin-security           exit=0   42/42
npm run test:partner-security         exit=0   114/114
npm run test:resource-security        exit=0   21/21
npm run test:storage-security         exit=0   13/13
npm run test:seed                     exit=0   34/34
npm run test:api-integrity            exit=0   12/12
```

Aucune suite de test n'a été modifiée. Ces suites surchargent toutes `DATABASE_URL` vers `127.0.0.1` : **aucune donnée Supabase n'a été écrite par les tests**.

---

## F. Verdict

```text
PostgreSQL fonctionne:                 OUI
Prisma fonctionne:                     OUI
SELECT 1 fonctionne:                   OUI  (natif psql et Prisma, 2 URL)
migrate status fonctionne:             OUI
aucune faille TLS introduite:          OUI  (verify-full conserve et prouve actif)
aucun secret reel dans .env.example:   OUI
aucune migration / donnee modifiee:    OUI

CHANTIER 7.7 — VALIDÉ
```

### Suite

La base est joignable et vide de schéma applicatif : les deux migrations sont **PENDING**. L'application des migrations reste une décision hors de ce chantier et devra se faire via `prisma migrate deploy` sur le port 5432 (`DIRECT_URL`), jamais via le pooler transactionnel.