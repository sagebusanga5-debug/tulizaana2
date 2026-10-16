import { Router } from "express";
import { createPartnerReport, getPartnerReport, listPartnerReports } from "../controllers/partner-report.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole(["partner_admin", "admin", "superadmin"]));
router.post("/", createPartnerReport);
router.get("/", listPartnerReports);
router.get("/:id", getPartnerReport);
export default router;
