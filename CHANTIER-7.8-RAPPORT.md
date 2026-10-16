# CHANTIER 7.8 — RAPPORT FINAL
## Application contrôlée et validation des migrations Prisma

**Date :** 2026-10-04
**Portée :** migrations Prisma et schéma PostgreSQL.
**Décision :** `migrate deploy` **n'a pas été exécuté.** L'audit préalable a détecté une incohérence critique entre les fichiers de migration, `schema.prisma` et l'état réel de la base. Les phases 5 à 14 n'ont donc pas été atteintes.
**Règle appliquée :** `STOP — DOCUMENTE — NE RÉPARE PAS AUTOMATIQUEMENT`.
**Intégrité de la base :** préservée. Aucune commande d'écriture n'a été exécutée sur la base Supabase.

---

## A. Contexte

Le Chantier 7.7 a validé la connexion : DNS, TCP, TLS `verify-full` avec `certs/supabase.crt`, `psql SELECT 1`, Prisma `SELECT 1` et `prisma migrate status`. Les deux migrations applicatives restaient `PENDING`.

Objectif de ce chantier : appliquer proprement ces deux migrations sur la vraie base, puis valider.

---

## B. État avant migration

### B.1 Identité de la base (Phase 3 — conforme)

```text
host        : aws-1-eu-west-1.pooler.supabase.com
port        : 5432        (DIRECT_URL, conforme)
database    : postgres    (conforme)
user        : postgres.zrpmbsknudinjjryjinm   (conforme)
project ref : zrpmbsknudinjjryjinm             (conforme)
sslmode     : verify-full
sslrootcert : certs/supabase.crt
serveur     : PostgreSQL 17.6 on aarch64-unknown-linux-gnu
```

### B.2 `prisma migrate status` (Phase 2)

```text
Datasource "db": PostgreSQL database "postgres", schema "public"
                at "aws-1-eu-west-1.pooler.supabase.com:5432"
2 migrations found in prisma/migrations
Following migrations have not yet been applied:
20260907000000_initial_tulizaana_schema
20261003000000_partner_subscription_lifecycle
```

Les deux migrations sont bien `PENDING`, et la connexion utilisée est bien `DIRECT_URL` sur 5432.

### B.3 Audit des fichiers de migration (Phase 1)

```text
20260907000000_initial_tulizaana_schema/migration.sql        19782 octets, 580 lignes
20261003000000_partner_subscription_lifecycle/migration.sql  1051 octets,  21 lignes
```

Migration 1 : 17 `CREATE TABLE`, 48 `CREATE INDEX`, 26 `ADD FOREIGN KEY`, 1 `CREATE SCHEMA IF NOT EXISTS`.
Migration 2 : 3 `ADD COLUMN` sur `Organization`, toutes NULLables.

```text
Enums                : 0
Scan de destructivité: migration 1 -> aucune instruction destructive
                       migration 2 -> aucune instruction destructive
                       (aucun DROP / TRUNCATE / DELETE / UPDATE)
```

Les deux migrations sont **strictement additives et sûres** sur une base vide.

---

## C. Migration appliquée

```text
AUCUNE MIGRATION APPLIQUEE
```

`npx prisma migrate deploy` n'a pas été lancé. La Phase 4 impose un arrêt en cas d'incohérence critique avant migration.

---

## D. Résultat `migrate deploy`

```text
NON EXECUTÉ — voir section N (blocages)
```

---

## E. État `_prisma_migrations`

```text
_prisma_migrations existe : NON
SELECT ... FROM "_prisma_migrations" -> ERROR: relation "_prisma_migrations" does not exist
```

La table d'historique **n'existe pas dans la base**. Aucune migration n'y est enregistrée, ce qui est cohérent avec le `migrate status` ci-dessus, mais signifie que la base n'a jamais été construite par Prisma.

---

## F. Tables créées

Aucune table n'a été créée par ce chantier. La base contenait déjà **19 tables de base** dans le schéma `public` avant toute intervention :

```text
TABLE                     PRÉEXISTANTE   DANS migration 1   DANS schema.prisma
AuditLog                       OUI            OUI                 OUI
Campaign                       OUI            OUI                 OUI
CampaignContribution           OUI            OUI                 OUI
Comment                        OUI            OUI                 OUI
Community                      OUI            OUI                 OUI
CommunityMember                OUI            OUI                 OUI
Invitation                     OUI            OUI                 OUI
InvitationRequest              OUI            OUI                 OUI
Message                        OUI            OUI                 OUI
MessageThread                  OUI            OUI                 OUI
ModerationReport               OUI            OUI                 OUI
Organization                   OUI            OUI                 OUI
OrganizationAdmin              OUI            OUI                 OUI
Post                           OUI            OUI                 OUI
PostMedia                      OUI            NON                 OUI     <- écart
Reaction                       OUI            OUI                 OUI
Story                          OUI            OUI                 OUI
User                           OUI            OUI                 OUI
tulizaana_db                   OUI            NON                 NON     <- écart
```

La base contient par ailleurs les schémas Supabase natifs, intacts : `auth` (26 tables), `storage` (9), `realtime` (4), `graphql`, `vault`, `extensions`. Extensions : `pgcrypto`, `uuid-ossp`, `pg_stat_statements`, `supabase_vault`.

---

## G. Contraintes / relations / index

État relevé dans `public` (lecture seule) :

```text
tables de base   : 19
index            : 85
clés primaires   : 19
clés étrangères   : 29
enum             : 0
séquences        : tulizaana_db_id_seq
```

Les clés uniques sont présentes sous forme d'`UNIQUE INDEX` (27 au total, dont les 19 clés primaires), et non de contraintes `UNIQUE` — c'est le comportement normal de Prisma pour `@unique`.

Index de la migration 1 vérifiés présents :

```text
User_email_key          OUI
Community_slug_key      OUI
Invitation_code_key     OUI
User_email_idx          OUI
User_role_idx           OUI
```

### G.1 Divergences entre les migrations et la base réelle

C'est le cœur du blocage. Sur une base vide, `migrate deploy` produirait **un schéma différent** de `schema.prisma` :

```text
#  Colonne / contrainte                    migration.sql          base reelle + schema.prisma
1  PostMedia (table entiere)               ABSENTE                PRESENT (11 colonnes, PK, 3 index, FK)
2  Post.type                               ABSENTE                PRESENTE  (TEXT NOT NULL DEFAULT 'discussion')
3  Post.title                              ABSENTE                PRESENTE  (TEXT NULLABLE)
4  Post.authorId                           NOT NULL               NULLABLE
5  Post.authorId  ON DELETE               CASCADE                SET NULL
6  Post.communityId ON DELETE              CASCADE                RESTRICT
7  Post index communityId                  (communityId)          (communityId, createdAt DESC)
8  Community.organizationId ON DELETE      CASCADE                RESTRICT
9  Campaign.organizationId ON DELETE       CASCADE                RESTRICT
10 Campaign.communityId ON DELETE          CASCADE                RESTRICT
11 Story.communityId ON DELETE             CASCADE                RESTRICT
12 Invitation.organizationId ON DELETE     CASCADE                RESTRICT
13 Invitation.communityId ON DELETE        CASCADE                RESTRICT
14 InvitationRequest.organizationId        CASCADE                RESTRICT
15 InvitationRequest.communityId           CASCADE                RESTRICT
16 Comment.authorId ON DELETE              CASCADE                SET NULL
17 Story.authorId ON DELETE                CASCADE                SET NULL
18 Message.senderId ON DELETE              CASCADE                SET NULL
19 Message.receiverId ON DELETE            CASCADE                SET NULL
20 CampaignContribution.userId ON DELETE   CASCADE                SET NULL
21 ModerationReport.communityId            ABSENTE                PRESENTE (SET NULL)
22 MessageThread_canonicalParticipantKey_key ABSENT               PRESENT
```

L'index `Post_communityId_createdAt_idx` présent dans la base n'a aucun équivalent dans la migration 1.

**Conclusion :** la base a été créée à partir de `schema.prisma` par un mécanisme hors migrations (très probablement `prisma db push` à une étape antérieure), à un état de `schema.prisma` antérieur à l'ajout des colonnes de la migration 2. Les fichiers `migration.sql` sont restés en retard sur le modèle.

---

## H. Vérification migration `20261003000000`

```text
Migration 2 : 20261003000000_partner_subscription_lifecycle
Statut       : PENDING, et ABSENTE de la base

Colonnes attendues dans public."Organization" :
  subscriptionStartedAt   INTROUVEE   (attendu TIMESTAMP(3) NULLABLE)
  subscriptionExpiresAt   INTROUVEE   (attendu TIMESTAMP(3) NULLABLE)
  paymentStatus           INTROUVEE   (attendu TEXT NULLABLE)

Colonnes réellement présentes dans public."Organization" : 24
Déclaration dans schema.prisma : les 3 champs sont DÉCLARÉS et NULLABLE  -> cohérent
```

La migration 2 est **la seule migration qui pourrait encore être appliquée sans risque** : elle est purement additive, sur 3 colonnes absentes, et ne touche aucune donnée. C'est d'ailleurs exactement le seul écart résiduel entre `schema.prisma` et la base.

Elle reste cependant bloquée par l'absence d'historique : Prisma l-appliquerait après la migration 1, qui échouerait.

---

## I. Validation Prisma

```text
prisma generate            NON RE-EXECUTÉ (gated par la réussite de la migration)
Prisma SELECT 1            NON RE-EXECUTÉ (gated)
migrate status             PASS  (readonly)  -> 2 migrations PENDING
```

Aucune validation Prisma post-migration n'est possible : aucune migration n'a été appliquée.

---

## J. Tests projet

```text
typecheck   : NON RE-EXECUTÉ (gated — inchangé depuis le Chantier 7.7, où il était PASS)
build       : NON RE-EXECUTÉ (gated — inchangé depuis le Chantier 7.7, où il était PASS)
tests       : NON RE-EXECUTÉ (gated)
```

Aucun fichier du projet n'a été modifié par ce chantier, donc les résultats du Chantier 7.7 restent valables : `typecheck` exit=0, `build` exit=0, 8 suites de sécurité vertes.

Rappel de sécurité retenu pour la phase 12 si elle était atteinte : toutes les suites surchargent `DATABASE_URL` vers `127.0.0.1`, donc aucune n'écrirait dans la base Supabase.

---

## K. Données

```text
data modification : NONE
```

Comptage avant toute action, sur les tables applicatives :

```text
User           0 lignes
Organization   0 lignes
Community      0 lignes
Campaign       0 lignes
Post           0 lignes
PostMedia      0 lignes
tulizaana_db   0 lignes
```

La base est vide. Aucune donnée n'a été créée, modifiée, supprimée ou lue en écriture. Aucune donnée applicative préexistante n'a été découverte, donc aucun arrêt supplémentaire n'est requis de ce côté.

`prisma/seed.ts` n'a pas été exécuté : il écrit dans `PostMedia` (ligne 505) et aurait créé des données.

---

## L. Fichiers modifiés

```text
Fichiers du projet modifiés : AUCUN
Fichiers créés               : CHANTIER-7.8-RAPPORT.md (ce rapport)
Base PostgreSQL             : AUCUNE MODIFICATION
```

```text
prisma/schema.prisma                  intact
prisma/migrations/*/migration.sql    intacts (26/09 et 03/10)
certs/supabase.crt                    intact
.env / .env.example                   intacts
server/**  src/**  scripts/**        intacts
```

Aucun commit Git effectué.

---

## M. Sécurité

```text
.env ignoré par Git                : OUI  (.gitignore:7 -> .env*)
Git root                           : C:/Users/HP  (dossier utilisateur)
Fichiers du projet suivis par Git   : 0
TLS bypass                         : NONE
```

Aucun contournement TLS : `sslmode=verify-full` et `sslrootcert=certs/supabase.crt` ont été utilisés pour toutes les inspections en lecture seule, avec `psql` 18.3.

Aucun secret n'est reproduit dans ce rapport.

---

## N. Verdict

```text
CHANTIER 7.8 — BLOQUÉ
```

### N.1 Blocage 1 — `migrate deploy` échouerait dès la première instruction

La migration 1 commence par :

```sql
CREATE SCHEMA IF NOT EXISTS "public";
CREATE TABLE "User" ( ... );
```

`public."User"` existe déjà. `CREATE TABLE` n'est pas `CREATE TABLE IF NOT EXISTS` : PostgreSQL lèverait `ERROR: relation "User" already exists`. Prisma inscrirait alors la migration 1 comme **failed** dans une table `_prisma_migrations` qui n'existe pas encore, laissant un historique de migration cassé à réparer avec `prisma migrate resolve` — opération hors du périmètre autorisé de ce chantier.

C'est exactement le scénario que la consigne « la priorité absolue est de préserver l'intégrité de la base » impose d'éviter.

### N.2 Blocage 2 — les migrations sont obsolètes par rapport au modèle

22 divergences documentées en section G.1, dont 3 qui casseraient le modèle :

- la table `PostMedia` n'est créée par aucune migration, alors qu'elle est déclarée dans `schema.prisma` **et utilisée par `prisma/seed.ts:505`** ;
- les colonnes `Post.type` et `Post.title` sont absentes des migrations ;
- les comportements `ON DELETE` sont `CASCADE` dans les migrations là où le modèle exige `RESTRICT` ou `SET NULL`.

Appliquer ces migrations sur une base vide produirait un schéma non conforme au modèle.

### N.3 Blocage 3 — table `tulizaana_db` non modélisée

```text
tulizaana_db ( id bigint NOT NULL , created_at timestamptz NOT NULL DEFAULT now() )
sequence associee : tulizaana_db_id_seq
lignes           : 0
```

Ni `schema.prisma` ni les migrations ne connaissent cette table. Son origine est inconnue et elle devra être tranchée (à conserver comme modèle, ou à supprimer explicitement lors d'un chantier dédié).

### N.4 Cause probable

La base a été peuplée par `prisma db push` à une étape antérieure, sans historique de migration. D'où : tables créées conformes au modèle, mais migration 1 restée en retard et migration 2 jamais matérialisée.

### N.5 Voie de remédiation — décision requise, non exécutée

La base est vide et son schéma ne diffère de `schema.prisma` que par les **3 colonnes de la migration 2**. La remise en cohérence est possible **sans aucune perte de donnée**, mais sort du périmètre de ce chantier (il interdit de créer une migration).

Piste recommandée, non destructive et sans `DROP` :

```text
1. Produire le SQL de l'ecart reel base -> schema.prisma :
     npx prisma migrate diff \
       --from-url    "$DIRECT_URL" \
       --to-schema-datamodel prisma/schema.prisma \
       --script
   (produit ici exactement les 3 ADD COLUMN de la migration 2)

2. Reconcilier l'historique : creer une migration de reference ("baseline")
   refletant le schema deja en place, puis
     npx prisma migrate resolve --applied <baseline>

3. Reecrire ou archiver les deux migrations devenues fausses, afin que
   l'historique Prisma decrive exactement l'etat de la base.

4. npx prisma migrate deploy   (desormais sans risque : plus aucune table a creer)
```

Cette séquence doit être validée avant exécution : elle modifie `prisma/migrations/` et l'historique `_prisma_migrations`, ce qu'aucune phase de ce chantier n'autorise.

### N.6 Critères de validation du chantier

```text
[x] bonne base Supabase confirmee
[x] DIRECT_URL utilise le port 5432
[x] TLS verify-full actif
[x] certificat officiel conserve
[ ] migrate deploy termine avec succes      <- NON ATTEINT (non execute)
[ ] migration 1 APPLIED                     <- NON ATTEINT
[ ] migration 2 APPLIED                     <- NON ATTEINT
[ ] _prisma_migrations coherent             <- NON ATTEINT (table absente)
[ ] aucune migration failed                 <- NON ATTEINT (aucune executee)
[ ] migrate status = up to date             <- NON ATTEINT (2 PENDING)
[ ] tables attendues presentes              <- NON ATTEINT (non creees par les migrations)
[ ] contraintes principales presentes       <- NON ATTEINT
[ ] index principaux presents              <- NON ATTEINT
[ ] enums presents si prevus                <- sans objet (0 enum)
[ ] relations presentes                     <- NON ATTEINT
[ ] migration 2 verifiee                    <- NON ATTEINT (absente de la base)
[ ] prisma generate PASS                    <- NON ATTEINT
[ ] SELECT 1 PASS                           <- NON ATTEINT
[ ] typecheck PASS                          <- NON ATTEINT
[ ] build PASS                              <- NON ATTEINT
[ ] tests de securite PASS                  <- NON ATTEINT
[x] aucune donnee applicative supprimee
[x] aucune modification manuelle de la base
[x] aucun contournement TLS
```

Aucun résultat `UNKNOWN` n'a été converti en `PASS`.