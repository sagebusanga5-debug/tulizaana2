# Workflow base de données — Tulizaana

## Règles d'or

```text
schema.prisma + migration versionnée = source de vérité
```

Toute modification de schéma passe par une migration Prisma, jamais par du SQL manuel, jamais par `db push`, jamais par `migrate dev` sur la production.

## URLs

| Variable | Rôle | Cible |
| -------- | ---- | ----- |
| `DATABASE_URL` | application / transaction pooler | port 6543 (`pgbouncer=true`) |
| `DIRECT_URL` | Prisma CLI / migrations | port 5432 (`pgbouncer=false`) |

Le CLI Prisma (`migrate status`, `migrate deploy`, `migrate resolve`) utilise **`directUrl`**. Sans `DIRECT_URL`, toute commande Prisma échoue en `P1012`.

## Développement (local uniquement)

```text
prisma migrate dev        # uniquement sur une DB locale/dev
prisma generate
```

Ne jamais exécuter `migrate dev` contre Supabase.

## Production

```text
prisma migrate deploy     # applique les migrations versionnées
prisma migrate status     # vérifie l'état
prisma generate           # régénère le client
```

`migrate deploy` est idempotent : réexécuter un déploiement déjà appliqué est un no-op.

## Interdictions production

```text
prisma migrate reset
prisma db push
prisma db pull
prisma migrate dev
prisma studio
npm run db:seed
migrate resolve --rolled-back
SQL destructif manuel
```

## Scripts npm

```text
npm run prisma:migrate:dev     # développement local
npm run prisma:migrate:status  # lecture seule
npm run prisma:migrate:deploy  # production
npm run prisma:generate        # génération client
```

L'ancien script `prisma:migrate` (alias de `migrate dev`) a été retiré pour supprimer le piège ergonomique.

## Historique

```text
prisma/migrations/
  20260906000000_baseline_existing_database/
  20261003000000_partner_subscription_lifecycle/
  20261004000000_remove_legacy_tulizaana_db/

prisma/migrations-archive/
  20260907000000_initial_tulizaana_schema/   # obsolète, hors chaîne
```

`migration_lock.toml` n'est pas créé par Prisma 6.19.3 dans un workflow `deploy`/`resolve`. Son absence n'a pas produit de blocage, mais elle est signalée comme risque résiduel.

## Baseline

La migration `20260906000000_baseline_existing_database` est un instantané de l'état réel de la base. Elle n'est jamais exécutée : elle est déclarée appliquée via `prisma migrate resolve --applied`, qui écrit une ligne dans `_prisma_migrations` sans exécuter son SQL.

## Seed

Le seed est **one-shot** : les modèles utilisant `upsert` sont idempotents, mais `Post`, `Comment`, `PostMedia` et `AuditLog` utilisent `create` et doublent à chaque exécution.

Jamais de seed sur la production sans sauvegarde préalable et validation locale.

## RLS

Prisma ne gère pas RLS. Les policies Supabase sont hors périmètre des migrations Prisma. Toute modification de RLS doit être tracée séparément.
