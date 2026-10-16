# CHANTIER 7.9 — RAPPORT DE RÉCONCILIATION

**Date :** 2026-10-04
**Nature :** audit et conception exclusivement. **Aucune modification** de la base, du schéma Prisma, des migrations ni d'un fichier applicatif.
**Commandes d'écriture :** aucune. SQL limité à `SELECT` sur `pg_catalog` / `information_schema`.

---

## 1. Verdict

```text
CHANTIER 7.9 — VALIDÉ
```

Toutes les comparaisons nécessaires ont été réalisées, dont le delta officiel via `prisma migrate diff`. Aucun `UNKNOWN` n'a été converti en `PASS`.

**Réserve de méthode (à lire) :** la variante `prisma migrate diff --from-migrations` n'a pas été exécutée, car elle exige une *shadow database*, ce qui implique un `CREATE DATABASE` sur le serveur — interdit par le cahier des charges. La comparaison « migrations ↔ base » a donc été réalisée par analyse statique exhaustive du SQL des deux migrations confrontée à l'inventaire `pg_catalog` complet de la base. Les deux méthodes sont équivalentes pour établir l'incompatibilité, et la deuxième est plus précise ici puisqu'elle énumère les divergences une à une.

---

## 2. Connexion DB

```text
DATABASE_URL   : OK   aws-1-eu-west-1.pooler.supabase.com:6543  (pooler transaction)
DIRECT_URL     : OK   aws-1-eu-west-1.pooler.supabase.com:5432  (pooler session)
TLS            : OK   sslmode=verify-full + sslrootcert=certs/supabase.crt
Prisma SELECT 1: OK   (établi au Chantier 7.7)
prisma validate: OK   "The schema at prisma\schema.prisma is valid"
```

Les migrations `migration.sql` ne contiennent aucun secret. Aucun secret n'est reproduit dans ce rapport.

Note technique : le `migrate diff` a été exécuté via `--from-schema-datasource` sur un schéma temporaire pointant vers `DIRECT_URL`, car PowerShell 5.1 scinde les arguments natifs contenant `&`. Le secret n'apparaît donc jamais dans une ligne de commande. Le fichier temporaire a été supprimé.

---

## 3. État réel PostgreSQL

| Élément | DB | Prisma | Migration | Verdict |
| --- | -- | ------ | --------- | ------- |
| Tables `public` | 19 | 18 modèles | 17 (mig. 1) | **écart** |
| `PostMedia` | présente | modèle présent | **absente** | divergente selon la source |
| `Post.type` / `Post.title` | présentes | déclarées | **absentes** | divergente selon la source |
| `Post.authorId` | NULLABLE | `String?` | `NOT NULL` | divergente selon la source |
| `Organization.subscriptionStartedAt` | **absente** | déclarée | présente (mig. 2) | **seul delta réel** |
| `Organization.subscriptionExpiresAt` | **absente** | déclarée | présente (mig. 2) | **seul delta réel** |
| `Organization.paymentStatus` | **absente** | déclarée | présente (mig. 2) | **seul delta réel** |
| `tulizaana_db` | présente | **absente** | absente | **à trancher** |
| `ModerationReport.communityId` | présente | déclarée | absente | divergente selon la source |
| `MessageThread.canonicalParticipantKey` | présente | déclarée | absente | divergente selon la source |
| Clés étrangères | 29 | 29 | 26 | divergente selon la source |
| Index | 85 | — | ~48 | divergente selon la source |
| Enum | 0 | 0 | 0 | conforme |
| Vues / triggers | 0 / 0 | — | — | conforme |
| Séquences | 1 (`tulizaana_db_id_seq`) | — | 0 | **à trancher** |
| `_prisma_migrations` | **absente** | — | — | **cause du blocage** |
| RLS activée | 19 / 19 | non géré par Prisma | non prévu | **hors périmètre Prisma** |
| Policies RLS | **0** | non géré par Prisma | non prévu | **observation sécurité** |

### 3.1 Source de vérité identifiée

Découverte déterminante : **`prisma/supabase_init.sql`** (489 lignes) est le DDL généré par Prisma qui a **réellement créé cette base**. Vérification :

```text
prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
diffé contre prisma/supabase_init.sql
-> ÉCART EXACT : 3 lignes ajoutées
   "subscriptionStartedAt" TIMESTAMP(3)
   "subscriptionExpiresAt" TIMESTAMP(3)
   "paymentStatus"          TEXT
-> AUCUNE autre différence
```

Donc :

```text
base réelle            == prisma/supabase_init.sql
schema.prisma          == base réelle + 3 colonnes
prisma/migrations/...  == un AUTRE schéma, jamais appliqué
```

Les deux `migration.sql` ont été écrits à la même seconde que `supabase_init.sql` (26/09/2026 18:00:30) mais décrivent un schéma différent — 17 tables, `ON DELETE CASCADE` partout, sans `PostMedia`. Ils ont été rédigés à la main (aucun `prisma/migrations/migration_lock.toml` n'existe, ce qu'un `prisma migrate dev` aurait toujours produit).

---

## 4. Delta `DATABASE → SCHEMA.PRISMA`

Sortie intégrale, non résumée, de la commande officielle :

```sql
-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "paymentStatus" TEXT,
ADD COLUMN     "subscriptionExpiresAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionStartedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "tulizaana_db";
```

### 4.1 Correction d'une hypothèse du Chantier 7.8

Le Chantier 7.8 supposait que le delta se limiterait aux 3 colonnes. **Cette hypothèse était incomplète** : le delta contient aussi `DROP TABLE "tulizaana_db"`. Prisma considère cette table comme extraneous et la détruirait.

Point rassurant : `prisma migrate deploy` ne rejoue que le SQL des fichiers de migration et ne fait jamais de diff. `tulizaana_db` ne sera donc **pas** supprimée par `migrate deploy`. Elle le serait en revanche par `migrate dev`, `db push`, ou tout SQL produit par `migrate diff`.

### 4.2 A. Éléments dans Prisma mais absents de PostgreSQL

```text
Organization.subscriptionStartedAt   TIMESTAMP(3) NULLABLE
Organization.subscriptionExpiresAt   TIMESTAMP(3) NULLABLE
Organization.paymentStatus           TEXT NULLABLE
```

Uniquement cela. Aucune colonne, aucun index, aucune contrainte, aucun enum manquant.

### 4.3 B. Éléments dans PostgreSQL mais absents de Prisma

```text
tulizaana_db  (table)
tulizaana_db_id_seq  (sequence)
```

### 4.4 C. Éléments présents dans les deux mais différents

**Aucun.** Pour les colonnes, types, nullabilité, valeurs par défaut, clés primaires, clés étrangères, `ON DELETE`, `ON UPDATE`, index uniques et index ordinaires, la base et `schema.prisma` sont strictement identiques.

C'est le résultat le plus important du chantier : la base est la matérialisation fidèle du modèle. Le problème n'est pas la base, c'est l'historique de migrations.

---

## 5. Migration 1

```text
20260907000000_initial_tulizaana_schema
-> INCOMPATIBLE
```

Incompatible dans les deux sens :

- **Vers l'avant** : son `CREATE TABLE "User"` échouerait, la table existant déjà. Prisma l'inscrirait comme `failed` et laisserait un historique cassé.
- **Vers l'arrière** : même sur une base vide, elle produirait un schéma ne correspondant pas au modèle.

| Élément | Migration | Database | Schema.prisma | Verdict |
| --- | --- | --- | --- | --- |
| `PostMedia` (table) | absente | présente | modèle présent | migration fausse |
| `Post.type` | absente | présente | déclarée | migration fausse |
| `Post.title` | absente | présente | déclarée | migration fausse |
| `Post.authorId` | NOT NULL | NULLABLE | `String?` | migration fausse |
| `Post.communityId` ON DELETE | CASCADE | RESTRICT | `Restrict` | migration fausse |
| `Post.authorId` ON DELETE | CASCADE | SET NULL | `SetNull` | migration fausse |
| `Post_communityId_idx` | `(communityId)` | `(communityId, createdAt DESC)` | `@@index([communityId, createdAt(sort: Desc)])` | migration fausse |
| `Community.organizationId` ON DELETE | CASCADE | RESTRICT | `Restrict` | migration fausse |
| `Campaign.organizationId` ON DELETE | CASCADE | RESTRICT | `Restrict` | migration fausse |
| `Campaign.communityId` ON DELETE | CASCADE | RESTRICT | `Restrict` | migration fausse |
| `Story.communityId` ON DELETE | CASCADE | RESTRICT | `Restrict` | migration fausse |
| `Invitation.organizationId` ON DELETE | CASCADE | RESTRICT | `Restrict` | migration fausse |
| `Invitation.communityId` ON DELETE | CASCADE | RESTRICT | `Restrict` | migration fausse |
| `InvitationRequest.organizationId` ON DELETE | CASCADE | RESTRICT | `Restrict` | migration fausse |
| `InvitationRequest.communityId` ON DELETE | CASCADE | RESTRICT | `Restrict` | migration fausse |
| `Comment.authorId` ON DELETE | CASCADE | SET NULL | `SetNull` | migration fausse |
| `Story.authorId` ON DELETE | CASCADE | SET NULL | `SetNull` | migration fausse |
| `Message.senderId` ON DELETE | CASCADE | SET NULL | `SetNull` | migration fausse |
| `Message.receiverId` ON DELETE | CASCADE | SET NULL | `SetNull` | migration fausse |
| `CampaignContribution.userId` ON DELETE | CASCADE | SET NULL | `SetNull` | migration fausse |
| `ModerationReport.communityId` | absente | présente | déclarée | migration fausse |
| `MessageThread_canonicalParticipantKey_key` | absent | présent | déclaré | migration fausse |
| `CommunityMember_communityId_status_idx` | absent | présent | déclaré | migration fausse |
| `Message_threadId_createdAt_idx` | absent | présent | déclaré | migration fausse |
| `ModerationReport_status_severity_createdAt_idx` | absent | présent | déclaré | migration fausse |
| Nombre de tables | 17 | 18 | 18 | — |

**Verdict :** cette migration décrit un schéma qui n'a jamais existé dans cette base. Elle est un artefact de développement périmé. Elle doit être **archivée, pas corrigée**.

---

## 6. Migration 2

```text
20261003000000_partner_subscription_lifecycle
-> À APPLIQUER
```

| Colonne | Migration | Database | Schema.prisma | Preuve |
| --- | --- | --- | --- | --- |
| `Organization.subscriptionStartedAt` | `TIMESTAMP(3)` NULLABLE | **absente** | déclarée `DateTime?` | `migrate diff` émet `ADD COLUMN` |
| `Organization.subscriptionExpiresAt` | `TIMESTAMP(3)` NULLABLE | **absente** | déclarée `DateTime?` | idem |
| `Organization.paymentStatus` | `TEXT` NULLABLE | **absente** | déclarée `String?` | idem |

Preuve complémentaire : `public."Organization"` ne compte que **24 colonnes**, et aucune ne s'appelle `subscriptionStartedAt`, `subscriptionExpiresAt` ou `paymentStatus`.

C'est la **seule** migration existante qui soit applicable telle quelle : strictement additive, sur des colonnes absentes, sans `NOT NULL`, sans backfill, donc sans risque sur les données. Aucun des autres champs évoqués dans le cahier des charges n'est présent dans cette migration : ni `subscriptionStatus`, ni quotas, ni `organizationPlan`, ni `communityQuota`. Les quotas existent déjà, créés par la migration 1 (`quotaCommunitiesMax`, `quotaMembersMax`, `quotaCampaignsMax`).

---

## 7. `tulizaana_db`

```text
STATUS :          LEGACY — artefact de test manuel, sans valeur applicative
ORIGINE PROBABLE : création manuelle via l'éditeur SQL du tableau de bord Supabase
RISQUE :          MODÉRÉ — `migrate dev`, `db push` ou tout SQL issu de `migrate diff`
                   la SUPPRIMENT sans préavis
ACTION RECOMMANDÉE: décision explicite au Chantier 7.10, hors périmètre de `migrate deploy`
```

Structure :

```text
id          bigint        NOT NULL   (defaut : sequence tulizaana_db_id_seq)
created_at  timestamptz   NOT NULL   DEFAULT now()
PK          tulizaana_db_pkey (id)
Index       tulizaana_db_pkey (unique)
Lignes      0
Sequence    tulizaana_db_id_seq  ->  last_value = 1, is_called = false (jamais utilisee)
```

Indices d'origine, tous convergents :

1. **Commentaire PostgreSQL** posé sur la table : *« application web qui connecte les personnes souffrant des problèmes de santé fortement stigmatisé en Afrique »*. C'est la description du projet Tulizaana, pas un commentaire technique. Une table de brouillon nommée d'après le projet.
2. La fonction `rls_auto_enable` existe dans `public`. C'est la fonctionCharacteristic de l'éditeur SQL Supabase, qui active RLS automatiquement. Aucun workflow Prisma ne la crée.
3. RLS est activé sur les 19 tables, ce qu'aucune migration Prisma ne fait.
4. Aucune clé étrangère entrante ou sortante : table isolée.
5. Séquence créée mais jamais consommée (`is_called = false`).
6. Aucune référence dans le dépôt : ni `schema.prisma`, ni `seed.ts`, ni script SQL, ni documentation.

Options au 7.10 :

| Option | Effet | Avis |
| --- | --- | --- |
| Ne rien faire | `migrate deploy` est sans danger ; `migrate dev` la détruirait | acceptable à court terme, piège à long terme |
| La modéliser dans `schema.prisma` | plus de drift, mais légitime une table parasite | **déconseillé** |
| `DROP TABLE` dans une migration explicite, après `pg_dump` | suppression nette et tracée | **recommandé**, sous réserve d'autorisation |

Aucune suppression n'a été effectuée. La table est intacte.

---

## 8. Données

```text
AUCUNE DONNEE METIER. Base entièrement vide.
```

| Table | Lignes | | Table | Lignes |
| --- | --- | --- | --- | --- |
| User | 0 | | Campaign | 0 |
| Organization | 0 | | CampaignContribution | 0 |
| OrganizationAdmin | 0 | | Invitation | 0 |
| Community | 0 | | InvitationRequest | 0 |
| CommunityMember | 0 | | MessageThread | 0 |
| Post | 0 | | Message | 0 |
| PostMedia | 0 | | ModerationReport | 0 |
| Comment | 0 | | AuditLog | 0 |
| Reaction | 0 | | tulizaana_db | 0 |
| Story | 0 | | | |

Cela **autorise** une stratégie de baseline non destructive, mais ne constitue en aucun cas une autorisation de réinitialiser.

---

## 9. Stratégies évaluées

| Stratégie | Faisabilité | Risque | Recommandation |
| --- | --- | --- | --- |
| **A — Baseline de la base existante** | **Impossible telle quelle** | — | Rejetée : aucune migration existante ne décrit la base. Il faudrait d'abord en créer une, ce qui transforme A en B. |
| **B — Nouvelle migration baseline propre** | **Oui** | **Faible** | **RECOMMANDÉE** |
| **C — Reconstruction de l'historique** | Oui | **Élevé** | Rejetée : régénérer la baseline depuis le `schema.prisma` actuel ferait宣告 les 3 colonnes comme déjà appliquées alors qu'elles sont absentes. `migrate status` afficherait « up to date » sur une base non conforme. |

---

## 10. STRATÉGIE RECOMMANDÉE

**Stratégie B, avec un point d'exigence non négociable.**

> Créer une migration de référence dont le `migration.sql` est **exactement** le contenu de `prisma/supabase_init.sql`, c'est-à-dire l'état réellement présent en base **sans** les 3 colonnes de la migration 2 ; archiver la migration 1 périmée ; conserver la migration 2 ; enregistrer la référence comme appliquée ; puis déployer.

Pourquoi elle est préférable :

1. **Elle est fidèle à l'historique réel.** La référence décrit ce qui existe, preuve par le diff à 3 lignes près. Elle ne prétend pas que des colonnes sont créées alors qu'elles ne le sont pas — c'est précisément le piège de la stratégie C.
2. **Elle préserve la migration 2**, qui est correcte et dont l'application est un `ALTER TABLE ... ADD COLUMN` à faible risque sur 3 colonnes NULLables, base vide.
3. **Zéro perte de données.** Aucun `DROP`, aucun `TRUNCATE`, aucune réécriture de table. La base ne subit que 3 ajouts de colonnes.
4. **Elle répare définitivement la chaîne** `migrations = source historique` / `schema.prisma = état désiré` / `database = état appliqué`.
5. **Elle est réversible et traçable** : les deux migrations d'origine sont archivées, pas supprimées.

Point d'exigence : le `migration.sql` de la référence **ne doit pas contenir** les 3 colonnes. Si la référence incluait `schema.prisma` dans son état actuel, `migrate deploy` n'ajouterait jamais ces colonnes et la base resterait non conforme.

---

## 11. PLAN EXACT DU CHANTIER 7.10

### Étape 1 — Sauvegarde avant toute écriture

```powershell
# Sauvegarde complete, hors base (aucune ecriture sur Supabase)
pg_dump --dbname="$env:DIRECT_URL" --file="C:\sauvegardes\tulizaana_avant_710.sql" --schema-only
# puis, pour la donnee :
pg_dump --dbname="$env:DIRECT_URL" --file="C:\sauvegardes\tulizaana_avant_710_data.sql"
```

Contrôle : `Test-Path C:\sauvegardes\tulizaana_avant_710.sql` doit renvoyer `True`.

### Étape 2 — Archiver la migration 1 périmée

```powershell
New-Item -ItemType Directory -Force prisma\_archive
Move-Item prisma\migrations\20260907000000_initial_tulizaana_schema prisma\_archive\20260907000000_initial_tulizaana_schema
```

Contrôle : `prisma\migrations` ne contient plus que `20261003000000_partner_subscription_lifecycle`.

### Étape 3 — Créer la migration de référence

```powershell
New-Item -ItemType Directory prisma\migrations\20260906000000_baseline_existing_database
Copy-Item prisma\supabase_init.sql prisma\migrations\20260906000000_baseline_existing_database\migration.sql
```

Contrôle : le fichier doit faire 489 lignes et **ne pas** contenir `subscriptionStartedAt`.

```powershell
Select-String -Path prisma\migrations\20260906000000_baseline_existing_database\migration.sql `
              -Pattern 'subscription|paymentStatus'
# attendu : AUCUNE correspondance
```

### Étape 4 — Vérifier le contenu du dossier de migrations

```powershell
npx prisma migrate diff `
  --from-migrations prisma\migrations `
  --to-schema-datamodel prisma/schema.prisma `
  --shadow-database-url $env:DIRECT_URL `
  --script
```

Contrôle : la sortie doit être **exactement** les 3 `ADD COLUMN` de la section 4, sans `DROP TABLE` et sans `CREATE TABLE`.

Si ce contrôle échoue, **STOP** : ne pas poursuivre.

### Étape 5 — Enregistrer la référence comme appliquée

```powershell
npx prisma migrate resolve --applied 20260906000000_baseline_existing_database
```

Contrôle :

```sql
SELECT migration_name, finished_at IS NOT NULL AS finished, rolled_back_at
FROM "_prisma_migrations" ORDER BY started_at;
```

Attendu : une ligne, `20260906000000_baseline_existing_database`, `finished = true`, `rolled_back_at` NULL.

### Étape 6 — Vérifier l'état intermédiaire

```powershell
npx prisma migrate status
```

Attendu : la référence est appliquée, `20261003000000_partner_subscription_lifecycle` est la seule `PENDING`.

Si ce n'est pas le cas, **STOP**.

### Étape 7 — Appliquer la migration 2

```powershell
npx prisma migrate deploy
```

C'est la seule écriture sur la base de tout le chantier : 3 `ADD COLUMN` sur `Organization`.

### Étape 8 — Validation post-déploiement

```powershell
npx prisma migrate status
```

Attendu : `Database schema is up to date`.

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name='Organization'
  AND column_name IN ('subscriptionStartedAt','subscriptionExpiresAt','paymentStatus');
```

Attendu : 3 lignes, toutes `is_nullable = YES`.

```sql
SELECT to_regclass('public.tulizaana_db') IS NOT NULL;   -- attendu : true (table preservee)
SELECT to_regclass('public._prisma_migrations') IS NOT NULL; -- attendu : true
SELECT count(*) FROM "_prisma_migrations" WHERE rolled_back_at IS NOT NULL; -- attendu : 0
SELECT count(*) FROM "User";  -- attendu : 0, aucune donnee perdue
```

### Étape 9 — Prisma et projet

```powershell
npx prisma generate
npm run typecheck
npm run build
npm run test:auth
npm run test:auth-cookie-security
npm run test:admin-security
npm run test:partner-security
npm run test:resource-security
npm run test:storage-security
npm run test:api-integrity
npm run test:seed
```

Tous ces scripts existent dans `package.json`. Aucun test n'écrit dans la base Supabase : les suites surchargent `DATABASE_URL` vers `127.0.0.1`. `npm run test:seed` se limite à vérifier des identifiants et n'exécute pas `prisma/seed.ts` ; ne pas lancer `npm run db:seed` sans décision explicite, car le seed crée des données réelles.

### Étape 10 — Trancher le sort de `tulizaana_db`

Décision à documenter séparément. Si suppression retenue : `pg_dump` puis migration explicite contenant `DROP TABLE "tulizaana_db";`, déployée via `migrate deploy`. Aucune suppression directe en SQL.

---

## 12. FICHIERS À MODIFIER AU 7.10

```text
CREER    prisma\migrations\20260906000000_baseline_existing_database\migration.sql
         (copie de prisma\supabase_init.sql)

DEPLACER prisma\migrations\20260907000000_initial_tulizaana_schema
      -> prisma\_archive\20260907000000_initial_tulizaana_schema

INCHANGE prisma\migrations\20261003000000_partner_subscription_lifecycle\migration.sql
INCHANGE prisma\schema.prisma
INCHANGE prisma\supabase_init.sql
INCHANGE .env / .env.example / certs\supabase.crt
INCHANGE server\** src\** scripts\**
```

Éventuellement créé par Prisma : `prisma\migrations\migration_lock.toml` (actuellement absent ; contient `provider = "postgresql"`).

Aucune commande SQL manuelle n'est nécessaire.

---

## 13. RISQUES RESTANTS

Risques réellement observés, sans extrapolation :

1. **`tulizaana_db` sera détruite par `migrate dev` ou `db push`.** Risque élevé d'erreur future, aujourd'hui contenu tant que seul `migrate deploy` est utilisé. Le corriger en étape 10.
2. **RLS activée sur les 19 tables avec 0 policy.** `anon` et `authenticated` disposent de `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE` sur ces tables. RLS sans policy bloque par défaut l'accès via PostgREST, donc l'accès direct par clé `anon` est denied — c'est un repli sûr, mais toute intention de lire ces tables depuis le client via l'API Supabase échouera silencieusement. `service_role` et Prisma, eux, contournent RLS. **Prisma ne gère pas RLS** : ces politiques ne figureront dans aucune migration.
3. **`prisma/migrations/migration_lock.toml` absent.** Une commande Prisma de migration le créera. Tant qu'il manque, rien ne garantit formellement le provider dans l'historique.
4. **Dérive future entre `schema.prisma` et la base.** Le cycle `migrate dev` n'a jamais servi ici. À réinstaurer après le 7.10, sur un environnement de développement et non sur la base de production.
5. **Aucun test d'intégration contre la vraie base.** Les 8 suites de sécurité tournent sur `127.0.0.1` et ne valident donc pas le comportement réel du schéma.
6. **`prisma/seed.ts` écrit dans `PostMedia`.** Il n'a jamais pu être exécuté puisque la table n'existait pas dans l'historique ; il est désormais exécutable mais n'a jamais été validé contre la base réelle.

---

## 14. COMMANDES INTERDITES PENDANT LE 7.10

```text
INTERDIT ABSOLU
  prisma migrate reset
  prisma db push
  prisma db pull
  DROP TABLE / DROP SCHEMA / DROP DATABASE
  TRUNCATE / DELETE / UPDATE / INSERT
  migration resolve --rolled-back
  toute ecriture SQL manuelle hors migration

INTERDIT PAR CAUTUNE
  prisma migrate dev          (detecte le drift et detruit tulizaana_db)
  prisma studio               (risque d'ecriture accidentelle)
  prisma migrate diff --from-url DIRECT_URL --to-empty --script
                               (produit un SQL de DROP de TOUT le schema public)
  npm run prisma:migrate      (alias de `migrate dev` dans package.json)
  npm run db:seed             (cree des donnees reelles)

AUTORISE
  prisma migrate status / validate / generate
  prisma migrate diff ... --script        (lecture seule)
  prisma migrate deploy                   (une seule fois, etape 7)
  prisma migrate resolve --applied        (une seule fois, etape 5)
  SQL en SELECT pur
```

Attention particulière : `package.json` définit `"prisma:migrate": "prisma migrate dev"`. Ne pas utiliser ce script sur la base Supabase.

---

## 15. TRAÇABILITÉ DU CHANTIER

```text
Base PostgreSQL       : AUCUNE MODIFICATION
schema.prisma         : INCHANGE
migration.sql x2      : INCHANGES (26/09 et 03/10)
supabase_init.sql     : INCHANGE
Fichiers applicatifs  : INCHANGES
Fichiers créés        : CHANTIER-7.9-RAPPORT.md
Fichier temporaire    : tmp79-direct.prisma (supprime)
Commandes d'ecriture  : AUCUNE
Secrets dans le rapport : AUCUN
```