/**
 * Hook de resolution Node, reserve aux tests du seed (chantier 3.1).
 *
 * Remplace `@prisma/client` par le faux client en memoire. Le hook est charge
 * uniquement via `--import ./scripts/support/fake-prisma-loader.mjs`, donc
 * uniquement dans les processus de test.
 */

const FAKE_PRISMA_URL = new URL("./fake-prisma-client.mjs", import.meta.url).href;

export async function resolve(specifier, context, next) {
  if (specifier === "@prisma/client") {
    return { url: FAKE_PRISMA_URL, shortCircuit: true, format: "module" };
  }
  return next(specifier, context);
}