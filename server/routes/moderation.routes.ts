import { Router } from "express";
import {
  createReport,
  listReports,
  handleReport,
} from "../controllers/moderation.controller.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";

const router = Router();

/**
 * Chantier 5 - `severity` venait du corps sans liste fermee et pilotait
 * directement l'ecriture d'une alerte dans le registre d'audit. Un appelant
 * anonyme pouvait donc fabriquer autant d'alertes `critical_sos` que voulu, et
 * les rapports anonymes n'etaient pas auditables (`reportedById` nul). La
 * gravite critique est desormais reservee a la plateforme ; le depot public est
 * plafonne.
 */
router.post(
  "/reports",
  optionalAuth,
  rateLimit({
    name: "moderation-report",
    windowMs: 60_000,
    max: 5,
    message: "Trop de signalements envoyes. Reessayez dans une minute.",
  }),
  createReport
);

/**
 * La lecture et le traitement sont reserves a l'equipe de plateforme.
 * `partner_admin` est un role de tenant : il a sa propre surface dans
 * `/api/organizations`, il n'a pas le registre de moderation global.
 */
const moderationStaff = requireRole(["superadmin", "moderator", "admin"]);

router.get("/reports", requireAuth, moderationStaff, listReports);
router.put("/reports/:id", requireAuth, moderationStaff, handleReport);

export default router;