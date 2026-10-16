import { Router } from "express";
import {
  listCampaigns,
  getCampaign,
  createCampaign,
  contributeToCampaign,
} from "../controllers/campaign.controller.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", optionalAuth, listCampaigns);
router.get("/:id", optionalAuth, getCampaign);
router.post(
  "/",
  requireAuth,
  requireRole(["superadmin", "partner_admin", "admin"]),
  createCampaign
);
// Chantier 5 - une contribution incrementait le compteur de la campagne et le
// score de l'appelant. La route etait en `optionalAuth` : un script anonyme
// pouvait gonfler indefiniment les metriques d'une organisation et les points
// d'un compte. Elle exige desormais une session authentifiee.
router.post("/:id/contribute", requireAuth, contributeToCampaign);

export default router;
