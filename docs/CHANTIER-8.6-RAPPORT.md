# Chantier 8.6 — Recherche globale

## Verdict

**Termine et deploye.** `GET /api/search` est disponible, avec une recherche
multi-entites qui respecte la meme portee de lecture que les endpoints existants.

## Contrat

```
GET /api/search?q=...&types=organizations,communities,campaigns,posts,users&page=1&limit=20
```

- `q` est obligatoire et contient au minimum deux caracteres ; les espaces sont
  normalises et la longueur est bornee a 100 caracteres.
- `types` est une liste fermee. L'absence de type interroge les cinq categories.
- `page` commence a 1 ; `limit` est borne entre 1 et 20, **par type**.
- La reponse retourne `query`, `types`, `page`, `limit` et une page `items` /
  `total` pour chaque type demande.
- `src/services/api.ts` expose `api.search(query, options)` et les types publics
  sont dans `src/types.ts`.

## Securite et confidentialite

- La route utilise `optionalAuth` : l'anonyme peut chercher les ressources
  publiques, tandis qu'un membre obtient seulement les ressources auxquelles il
  a reellement acces.
- Communautes, campagnes et publications reutilisent
  `buildReadableCommunityFilter`. Pour une communaute privee, la condition
  « publique **ou** membre actif » est conservee et combinee avec la recherche
  textuelle, jamais ecrasee par elle.
- Organisations : uniquement `approved`, et restitution reduite au DTO public.
- Campagnes : uniquement `active` et `completed`, dans un cercle lisible.
- Publications : uniquement dans un cercle lisible ; le resultat ne contient ni
  auteur, ni commentaire, ni donnee medicale.
- Utilisateurs : comptes non suspendus et non anonymes, ayant une adhesion active
  dans au moins un cercle lisible. Aucun email, telephone, role ni adhesions ne
  sont restitues.
- Les messages prives ne sont pas un type autorise et ne sont jamais interroges.

## Fichiers livres

- `server/services/search.service.ts`
- `server/controllers/search.controller.ts`
- `server/routes/search.routes.ts`
- `server.ts` (montage `/api/search`)
- `src/services/api.ts` et `src/types.ts`
- `scripts/test-global-search.ts`
- `prisma/migrations/20261010000000_add_search_indexes/migration.sql`

## Base Supabase

La migration `20261010000000_add_search_indexes` a ete deployee avec succes.
Elle ajoute les index `text_pattern_ops` demandes sur les champs de recherche
principaux de `Organization`, `Community`, `Campaign`, `Post` et `User`.

Le seed a ete execute avec succes. Les organisations et cercles de base ont ete
crees/mis a jour. Les comptes, adhesions, invitations et publications de
demonstration ont ete volontairement ignores : aucun des secrets
`DEMO_*_PASSWORD` ni `ADMIN_SEED_PASSWORD` n'etait configure.

## Verification

- `npm.cmd run typecheck` : passe.
- `npm.cmd run test:global-search` : passe (validation des types, borne a 20,
  pagination et preservation de la portee privee).
- Build de production execute apres generation Prisma ; les artefacts `dist`
  ont ete regeneres.
- Suites existantes passees : `test:admin-security`, `test:partner-security`,
  `test:resource-security`, `test:storage-security`, `test:api-integrity`,
  `test:public-profiles`, `test:auth-cookie-security`.

Deux suites historiques ne sont pas vertes dans cet environnement, sans lien
avec la recherche : `test:auth` tente une connexion TLS a la base configuree et
attend un 503 mais recoit un 500 ; `test:seed` ne parvient pas a materialiser
son double Prisma, ce qui fait echouer ses assertions de seed. Aucun changement
du chantier 8.6 ne touche l'authentification ou le seed.
