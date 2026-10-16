/**
 * Génération et normalisation des slugs publics (Chantier 8.5).
 *
 * Règles :
 * - Le slug est généré côté serveur à partir du nom.
 * - Aucun slug fourni par le frontend n'est accepté aveuglément.
 * - Stable : un changement de nom ne recrée pas le slug sauf si explicitement demandé.
 * - URL-safe, unique, collisions gérées.
 */

import { getPrismaClient } from "../config/database.js";

const SLUG_SEPARATOR = "-";

function normalizeBaseSlug(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, SLUG_SEPARATOR)
    .replace(new RegExp(`${SLUG_SEPARATOR}+$`), "")
    .replace(new RegExp(`^${SLUG_SEPARATOR}`), "");
}

function truncateSlug(base: string, maxLength = 64): string {
  if (base.length <= maxLength) return base;
  return base.slice(0, maxLength).replace(new RegExp(`${SLUG_SEPARATOR}+$`), "");
}

export function slugify(name: string): string {
  const base = truncateSlug(normalizeBaseSlug(name));
  return base.length > 0 ? base : "organisation";
}

export async function generateUniqueOrganizationSlug(
  baseName: string,
  excludeId?: string
): Promise<string> {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error("Base de données non connectée.");
  }

  const base = slugify(baseName);
  let candidate = base;
  let suffix = 1;

  while (true) {
    const existing = await prisma.organization.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || (excludeId && existing.id === excludeId)) {
      return candidate;
    }

    suffix += 1;
    candidate = `${base}${SLUG_SEPARATOR}${suffix}`;
  }
}

export async function generateUniqueCommunitySlug(
  baseName: string,
  excludeId?: string
): Promise<string> {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error("Base de données non connectée.");
  }

  const base = slugify(baseName);
  let candidate = base;
  let suffix = 1;

  while (true) {
    const existing = await prisma.community.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || (excludeId && existing.id === excludeId)) {
      return candidate;
    }

    suffix += 1;
    candidate = `${base}${SLUG_SEPARATOR}${suffix}`;
  }
}

export function isSlugAvailableFormat(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}