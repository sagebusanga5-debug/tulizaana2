/** Tests de contrat et de securite de GET /api/search. */
import assert from "node:assert/strict";
import {
  normalizeSearchQuery,
  parseSearchTypes,
  search,
} from "../server/services/search.service.js";

async function main(): Promise<void> {
  assert.equal(normalizeSearchQuery("  soutien   psycho  "), "soutien psycho");
  assert.deepEqual(parseSearchTypes("communities,posts,communities"), ["communities", "posts"]);
  assert.equal(parseSearchTypes("messages"), null, "Les messages prives ne sont pas recherchables.");

  let receivedWhere: Record<string, unknown> | undefined;
  const prisma = {
    // Un membre a acces a un cercle prive : le filtre contient donc un OR qui
    // doit rester present apres ajout des predicates de recherche.
    communityMember: {
      findMany: async () => [{ communityId: "private-community", community: { isPrivate: true } }],
    },
    community: {
      findMany: async ({ where }: { where: Record<string, unknown> }) => {
        receivedWhere = where;
        return [];
      },
      count: async () => 0,
    },
  };

  const response = await search(prisma as any, {
    query: "soutien",
    userId: "member-1",
    types: ["communities"],
    page: 0,
    limit: 999,
  });

  assert.equal(response.page, 1, "La pagination est bornee inferieurement.");
  assert.equal(response.limit, 20, "La pagination est bornee a 20 resultats par type.");
  assert.equal((receivedWhere?.OR as unknown[]).length, 2, "Le filtre de visibilite prive reste actif.");
  assert.equal((receivedWhere?.AND as unknown[]).length, 1, "Les predicats textuels sont combines par AND.");
  assert.equal(response.results.communities?.total, 0);

  console.log("OK - recherche globale : validation, pagination et portee privee testees.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
