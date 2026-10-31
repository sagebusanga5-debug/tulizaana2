import { Router } from "express";
import {
  validateFinalizationCode,
  finalizePartnerAccount,
  generateFinalizationCode,
} from "../controllers/partner-finalization.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";

const router = Router();

// Limiteur pour la validation de code (public)
const FINALIZATION_LIMITER = rateLimit({
  name: "finalization",
  windowMs: 60_000,
  max: 10,
  message: "Trop de tentatives. Reessayez dans une minute.",
});

// Validation du code (public)
router.post("/validate", FINALIZATION_LIMITER, validateFinalizationCode);

// Finalisation du compte (public)
router.post("/finalize", FINALIZATION_LIMITER, finalizePartnerAccount);

// Generation de code (admin only)
router.post("/organizations/:organizationId/generate-code", requireAuth, requireRole(["superadmin", "admin"]), generateFinalizationCode);

export default router;
