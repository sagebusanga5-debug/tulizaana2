/**
 * Point d'entree `--import` qui installe le faux PrismaClient.
 *
 * Usage (tests uniquement) :
 *   node --import tsx --import ./scripts/support/fake-prisma-loader.mjs prisma/seed.ts
 */

import { register } from "node:module";

register(new URL("./fake-prisma-hooks.mjs", import.meta.url).href);