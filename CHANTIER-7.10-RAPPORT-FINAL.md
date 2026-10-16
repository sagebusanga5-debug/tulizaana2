# CHANTIER 7.10 — RAPPORT FINAL DE CLÔTURE DU CHANTIER 7

**Date :** 2026-10-04
**Nature :** réconciliation effective Prisma ↔ PostgreSQL. **Première et unique** modification de la base Supabase de production de tout le Chantier 7.
**Portée réelle :** 2 écritures Prisma sur la base, strictement limitées à la création de `_prisma_migrations` et à 3 `ADD COLUMN` NULLables. Aucun `DROP`, aucun `DELETE`, aucun `UPDATE`, aucun `TRUNCATE`.

---

## 1. Verdict

```text
CHANTIER 7 — VALIDÉ
```

Le Chantier 7 est clôturé. La chaîne de migrations est réconciliée, déployée et vérifiée sur la base réelle. Les réserves sont listées en section 10 et n'invalident pas le verdict.

**Réserve de méthode 1 (à lire).** La mécanique `baseline → resolve --applied → deploy` a été répétée intégralement sur une instance PostgreSQL **isolée** reproduisant l'état réel avant toute écriture sur Supabase. L'instance de rehearsal était en PostgreSQL 18.3, la production en 17.6. Le DDL employé étant standard et la répétition réellement effectuée sur la 17.6 de production, cette différence de version n'affecte pas le résultat — mais la rehearsal n'est pas un essai à l'identique du serveur.

**Réserve de méthode 2 (à lire).** La preuve de restaurabilité de la sauvegarde a échoué sur 3 instructions portant sur l'extension `supabase_vault`, inexistante sur un PostgreSQL standard. Ces 3 instructions concernent une extension gérée par Supabase et **non** des données du projet ; tout le périmètre `public` s'est restauré intégralement. La sauvegarde est donc jugée restaurable pour le périmètre qui la concerne.

---

## 2. Connexion DB

```text
DATABASE_URL   : OK   aws-1-eu-west-1.pooler.supabase.com:6543  (pooler transaction)
DIRECT_URL     : OK   aws-1-eu-west-1.pooler.supabase.com:5432  (pooler session)
TLS            : OK   sslmode=verify-full + sslrootcert=certs/supabase.crt
Prisma migrate : OK   Datasource "db" → pooler.supabase.com:5432
```

**Fait technique nouveau et important :** les opérations CLI de Prisma (`migrate status`, `resolve`, `deploy`) n'empruntent **pas** `DATABASE_URL` mais **`directUrl`**. L'absence de `DIRECT_URL` fait échouer toute commande Prisma avec `P1012 Environment variable not found: DIRECT_URL`. C'est cohérent avec le choix de `directUrl` : les migrations exigent le mode session, indisponible en port 6543.

Aucun secret n'est reproduit dans ce rapport. Le mot de passe n'a été lu qu'en mémoire, jamais journalisé, jamais passé en ligne de commande : les outils natifs ont reçu la connexion via `PGUSER` / `PGPASSWORD` / `PGHOST` / `PGPORT` / `PGDATABASE`, et Prisma via `.env`.

---

## 3. Découverte de méthode : deux pièges PowerShell 5.1

Les deux ont coûté une itération chacun et sont consignés pour être évités.

| Piège | Symptôme | Correctif retenu |
| ----- | -------- | ---------------- |
| `pgbouncer` dans l'URL | `pg_dump` / `psql` : `paramètre de la requête URI invalide : pgbouncer` | `pgbouncer` est un paramètre **propriétaire Prisma**, pas libpq. Il est retiré pour les outils natifs, conservé pour Prisma. |
| Guillemets mangés par PowerShell | `SELECT count(*) FROM public."User"` est arrivé `public.user` → `relation does not exist` | PowerShell 5.1 retire les guillemets des arguments natifs. Tout SQLcontaining des identifiants entre guillemets est désormais passé par **un fichier `-f`**, jamais par `-c`. |

Conséquence de méthode : les dénombrements ont été refaits par blocs `DO … RAISE NOTICE` exécutés depuis un fichier SQL, ce qui supprime tout assemblage d'identifiant côté client.

---

## 4. Phase A — rehearsal en PostgreSQL isolé

Aucune instance PostgreSQL isolée n'existait : le serveur local (18.3, port 5432) exige un mot de passe inconnu, donc inutilisable. Une instance **dédiée** a été créée avec `initdb`, authentification `trust`, sur le port 55432, puis détruite à la fin.

```text
initdb -D <temp>\pg710\data -U postgres --auth=trust --encoding=UTF8
port 55432   aucune modification du serveur local existant
```

**Fidélité de la reproduction de l'état réel :**

| Contrôle | Attendu | Obtenu |
| -------- | ------- | ------ |
| tables `public` | 18 | 18 |
| colonnes lifecycle | 0 | 0 |
| `_prisma_migrations` | absente | absente |

`prisma/supabase_init.sql` s'est chargé sans aucune dépendance externe : **ni rôle Supabase (`anon`, `authenticated`, `service_role`), ni fonction `auth.uid()`, ni RLS, ni extension**. La migration baseline est donc exécutable partout.

**Delta mesuré entre l'état réel et `schema.prisma` :**

```sql
ALTER TABLE "Organization" ADD COLUMN     "paymentStatus" TEXT,
 ADD COLUMN     "subscriptionExpiresAt" TIMESTAMP(3),
  ADD COLUMN     "subscriptionStartedAt" TIMESTAMP(3);
```

C'est la confirmation formelle que `supabase_init.sql` est la bonne source de baseline, et que cette baseline **ne doit pas** contenir les colonnes lifecycle.

**Cycle complet, sur les fichiers réellement livrés :**

| Étape | Commande | Résultat |
| ----- | -------- | -------- |
| 1 | `migrate status` | 2 migrations en attente |
| 2 | `migrate resolve --applied 20260906000000_baseline_existing_database` | `marked as applied`, exit 0 |
| 3 | `migrate status` | seule la lifecycle reste en attente |
| 4 | `migrate deploy` | `Applying migration 20261003000000_partner_subscription_lifecycle`, exit 0 |
| 5 | état final | 2 migrations `APPLIED`, 0 échec, 3 colonnes `text` / `timestamp without time zone`, toutes `nullable=YES` |
| 6 | `migrate status` | `Database schema is up to date!` |
| 7 | **idempotence** : 2ᵉ `migrate deploy` | `No pending migrations to apply.` — toujours 2 lignes enregistrées |
| 8 | `migrate diff --from-url … --to-schema-datamodel` | `This is an empty migration.` → **parité totale** |

---

## 5. Fichiers livrés

```text
CRÉÉ    prisma\migrations\20260906000000_baseline_existing_database\migration.sql
        (recopie de prisma\supabase_init.sql + en-tête de traçabilité)

DÉPLACÉ prisma\migrations\20260907000000_initial_tulizaana_schema\
     →  prisma\migrations-archive\20260907000000_initial_tulizaana_schema\
        580 lignes, contenu strictement inchangé

CHAÎNE DE DÉPLOIEMENT RÉSULTANTE
        20260906000000_baseline_existing_database
        20261003000000_partner_subscription_lifecycle

INCHANGÉ  prisma\schema.prisma          (18 677 o)
INCHANGÉ  prisma\supabase_init.sql      (21 247 o)
INCHANGÉ  prisma\migrations\20261003000000_partner_subscription_lifecycle\migration.sql
INCHANGÉ  .env / .env.example / certs\supabase.crt
INCHANGÉ  server\**  src\**  scripts\**  package.json
```

### 5.1 Pourquoi la baseline n'est pas « appliquée » mais « déclarée »

L'en-tête de `20260906000000_baseline_existing_database\migration.sql` documente que cette migration **n'exécute rien** : elle est installée par `prisma migrate resolve --applied`, qui écrit une ligne dans `_prisma_migrations` sans exécuter une seule instruction. C'est indispensable — la base étant déjà peuplée, toute exécution aurait été une erreur.

### 5.2 Pourquoi l'obsolète est archivée et non supprimée

`20260907000000_initial_tulizaana_schema` est conservée **intacte** hors de `prisma/migrations/`, donc hors de toute chaîne de déploiement, pour rester consultable. Rappel de sa disqualification : 17 `CREATE TABLE` seulement, modèle `PostMedia` ignoré, aucune référence à `tulizaana_db`.

### 5.3 Contenu strict de la baseline

Exclut **volontairement** :

- les 3 colonnes lifecycle, absentes de l'état réel capturé, ajoutées par la migration suivante, additive et postérieure ;
- `tulizaana_db`, ni créée, ni supprimée, ni déplacée.

---

## 6. Phase B — sauvegarde avant écriture

Emplacement **hors dépôt**, conformément à l'exigence :

```text
C:\Users\HP\Downloads\chantier710-backups\
  tulizaana-supabase-20261004-182308-avant-ecriture.dump   348 145 o  (format custom)
  tulizaana-supabase-20261004-182308-avant-schema.sql     252 233 o  (SQL lisible)
```

Cible : `DIRECT_URL`, port 5432, `pgbouncer=false` — mode session, seule cible exploitable par `pg_dump` (`pgbouncer=true` sur le port 6543 ne l'est pas).

**Inventaire inmediatamente avant écriture :**

| Mesure | Valeur |
| ------ | ------ |
| tables `public` | 19 |
| colonnes lifecycle | 0 |
| tables sous RLS | 19 |
| `_prisma_migrations` | absente |

**Preuve de restaurabilité** — l'archive a été restaurée dans une base locale jetable :

```text
pg_restore exit=1   (3 erreurs ignorées : extension supabase_vault uniquement)
tables_public=19   rls_active=19   index_public=85   foreign_keys=29
tulizaana_db=true  lifecycle_cols=0
```

Le périmètre `public` est intégralement restauré, index et clés étrangères compris.

---

## 7. Phase C — écritures sur Supabase

Exactement quatre commandes, dans cet ordre. Aucune autre.

| # | Commande | Nature | Résultat |
| - | -------- | ------ | -------- |
| 1 | `prisma migrate status` | lecture seule | 2 migrations en attente |
| 2 | `prisma migrate resolve --applied 20260906000000_baseline_existing_database` | **écriture** | `marked as applied.` — exit 0 |
| 3 | `prisma migrate deploy` | **écriture** | `Applying migration 20261003000000_partner_subscription_lifecycle` — exit 0 |
| 4 | `prisma migrate deploy` | lecture (idempotence) | `No pending migrations to apply.` — exit 0 |

Le `deploy` n'a appliqué **que** la migration lifecycle. La baseline n'a jamais été exécutée, seulement déclarée.

---

## 8. État final vérifié sur Supabase

| Contrôle | Avant | Après | Attendu | Verdict |
| -------- | ----- | ----- | ------- | ------- |
| tables `public` | 19 | 20 | 19 + `_prisma_migrations` | conforme |
| tables métier non vides | 0 | 0 | 0 | **aucune perte** |
| lignes métier | 0 | 0 | 0 | **aucune perte** |
| lignes `_prisma_migrations` | — | 2 | 2 | conforme |
| colonnes lifecycle | 0 | 3 | 3 | conforme |
| `paymentStatus` | — | `text` NULLABLE | `String?` | conforme |
| `subscriptionStartedAt` | — | `timestamp without time zone` NULLABLE | `DateTime?` | conforme |
| `subscriptionExpiresAt` | — | `timestamp without time zone` NULLABLE | `DateTime?` | conforme |
| migrations appliquées | — | 2 | 2 | conforme |
| migrations en échec | — | 0 | 0 | conforme |
| migrations en attente | — | 0 | 0 | conforme |
| tables sous RLS | 19 | 20 | +1 | conforme |
| index `public` | 85 | 86 | 85 + 1 PK | conforme |
| clés étrangères | 29 | 29 | 29 | **inchangé** |
| `tulizaana_db` | présente | présente | conservée | conforme |
| schémas natifs Supabase | 7 | 7 | 7 | **intacts** |
| `prisma migrate status` | — | `Database schema is up to date!` | — | conforme |

Les trois écarts apparents sont expliqués et attendus : `tables = 20` et `index = 86` parce que `_prisma_migrations` et sa clé primaire viennent de s'ajouter ; `lignes = 2` parce que ce sont les deux enregistrements de migration. **Les 19 tables métier sont toujours vides.**

### 8.1 Parité : un écart résiduel volontaire

```text
prisma migrate diff --from-schema-datasource prisma/schema.prisma \
                    --to-schema-datamodel   prisma/schema.prisma --script

  -- DropTable
  DROP TABLE "tulizaana_db";
```

**La base n'est donc pas en parité stricte avec `schema.prisma`, et ne doit pas y être.** `tulizaana_db` existe en base, n'est modélisée ni dans `schema.prisma` ni dans la baseline. La suppression a été écartée du périmètre du 7.10 : elle doit rester une décision séparée, sauvegardée et livrée par sa propre migration. Aucun modèle Prisma ne correspond à cette table : l'application ne la référence pas.

Ce point est sans danger opérationnel : `migrate deploy` ne synchronise jamais le datamodel, il n'applique que les fichiers de migration. Le `DROP` ne peut donc pas survenir tant que seul `migrate deploy` est utilisé.

---

## 9. Non-régression

```text
npm run typecheck   exit 0
npm run build       exit 0   (PWA 19 entrées, server.cjs 189,0 ko)

npm run test:auth                 PASS   Tous les scénarios de sécurité passent
npm run test:admin-security      PASS
npm run test:partner-security    PASS   114/114 contrôles
npm run test:resource-security   PASS   21/21 scénarios
npm run test:storage-security    PASS   13/13
npm run test:api-integrity       PASS   12/12
npm run test:auth-cookie-security PASS  28/28
npm run test:seed                PASS
```

`test:api-integrity` valide explicitement `Migration subscription/payment presente` **et** `DB réelle non modifiée par le test` : la migration est bien en place, et la suite n'altère pas la base.

---

## 10. RISQUES RESTANTS

Aucun n'a été introduit par le 7.10 ; tous existaient déjà et sont reportés tels quels, sauf le point 6.

1. **`tulizaana_db` sera détruite par `migrate dev` ou `db push`.** Risque élevé, aujourd'hui contenu tant que seul `migrate deploy` est utilisé. **Non corrigé, volontairement.** `package.json` définit `"prisma:migrate": "prisma migrate dev"` : c'est un piège actif. À traiter dans un chantier dédié, après sauvegarde et validation locale.
2. **RLS activée sur 20 tables avec 0 policy nommée.** `anon` et `authenticated` ont les droits `SELECT`/`INSERT`/`UPDATE`/`DELETE`/`TRUNCATE`, mais RLS sans policy bloque l'accès via PostgREST. Repli sûr, mais tout accès client via l'API Supabase échouera silencieusement. Prisma et `service_role` contournent RLS. **Prisma ne gère pas RLS** : ces politiques ne figureront dans aucune migration.
3. **`prisma/migrations/migration_lock.toml` toujours absent** après `resolve` et `deploy`. Aucun blocage observé, mais rien ne garantit formellement le provider dans l'historique.
4. **Dérive future entre `schema.prisma` et la base.** Le cycle `migrate dev` n'a jamais servi ici. À réinstaurer sur un environnement de développement, jamais sur la base de production.
5. **`prisma/seed.ts` écrit dans `PostMedia`.** La table existe désormais et le seed est exécutable, mais il **n'a jamais été validé contre la base réelle** ; `test:seed` ne contrôle que les identifiants, il n'écrit rien.
6. **Le mot de passe de la base est apparu en clair dans la sortie console d'une commande de masquage** que j'ai écrite, lors de l'inspection de `.env`. Il est donc présent dans le transcript de session. Le masque a été corrigé immédiatement, mais **il faut faire tourner le mot de passe de la base si ce compte est réel**. Ce point n'est pas une réserve théorique : c'est la seule conséquence réellement dommageable du Chantier 7.10.
7. **Aucune suite d'intégration contre la vraie base.** Les 8 suites tournent sur `127.0.0.1` et ne valident donc pas le comportement réel du schéma sur Supabase.

---

## 11. Commandes à ne jamais utiliser sur cette base

```text
INTERDIT ABSOLU
  prisma migrate reset          prisma db push          prisma db pull
  DROP TABLE / DROP SCHEMA / DROP DATABASE
  TRUNCATE / DELETE / UPDATE / INSERT
  migrate resolve --rolled-back
  toute écriture SQL manuelle hors migration

INTERDIT PAR CAUTUNE
  prisma migrate dev            détecte le drift et détruit tulizaana_db
  prisma studio                 risque d'écriture accidentelle
  npm run prisma:migrate        alias de `migrate dev`
  npm run db:seed               crée des données réelles

AUTORISÉ
  prisma migrate status / validate / generate
  prisma migrate diff ... --script      (lecture seule)
  prisma migrate deploy                (idempotent, vérifié deux fois)
  prisma migrate resolve --applied     (déjà fait ; ne pas rejouer)
  SQL en SELECT pur
```

---

## 12. TRAÇABILITÉ DU CHANTIER 7

```text
7.5  paramétrage et certificat CA Supabase   OK
7.7  connexion réelle à PostgreSQL          OK
7.8  réconciliation du schéma Prisma         BLOQUÉ (rapport conservé)
7.9  audit read-only, 22 divergences        VALIDÉ (rapport conservé)
7.10 réconciliation effective et déploiement VALIDÉ (ce rapport)

Base PostgreSQL Supabase
  ÉCRITURES      : 2 (resolve --applied, deploy)
  TABLES SUPPRIMÉES : 0
  LIGNES MODIFIÉES  : 0
  COLONNES AJOUTÉES: 3, toutes NULLABLE, sur Organization
  ÉTAT FINAL       : Database schema is up to date!

Fichiers créés      : prisma\migrations\20260906000000_baseline_existing_database\migration.sql
                      CHANTIER-7.10-RAPPORT-FINAL.md
Fichiers déplacés   : 20260907000000_initial_tulizaana_schema → migrations-archive\
Fichiers inchangés  : schema.prisma, supabase_init.sql, .env, .env.example,
                      certs\supabase.crt, server\**, src\**, scripts\**, package.json
Fichiers temporaires: tmp79-direct.prisma (supprimé au 7.9)
Secrets dans le rapport : AUCUN
```