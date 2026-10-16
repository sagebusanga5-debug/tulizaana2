import { Response } from "express";
import { getPrismaClient } from "../config/database.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { normalizeSearchQuery, parseSearchTypes, search } from "../services/search.service.js";

/** GET /api/search?q=...&types=organizations,communities&page=1&limit=20 */
export async function globalSearch(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de donnees non connectee.", 503);
    return;
  }

  const query = typeof req.query.q === "string" ? normalizeSearchQuery(req.query.q) : "";
  if (query.length < 2) {
    sendError(res, "La recherche doit contenir au moins 2 caracteres.", 400, "INVALID_SEARCH_QUERY");
    return;
  }
  const types = parseSearchTypes(req.query.types);
  if (!types) {
    sendError(res, "Type de recherche invalide.", 400, "INVALID_SEARCH_TYPE");
    return;
  }

  const numberParam = (value: unknown, fallback: number) =>
    typeof value === "string" && /^\d+$/.test(value) ? Number(value) : fallback;
  const page = numberParam(req.query.page, 1);
  const limit = numberParam(req.query.limit, 20);

  try {
    const response = await search(prisma, { query, userId: req.user?.id, types, page, limit });
    sendSuccess(res, response);
  } catch (error) {
    console.error("Erreur globalSearch:", error);
    sendError(res, "Impossible d'effectuer la recherche.", 500);
  }
}
