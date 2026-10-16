import { Router } from "express";
import {
  verifyInvitationCode,
  requestInvitation,
  generateInvitation,
  listInvitationRequests,
  handleInvitationRequest,
  verifyInvitationLink,
  acceptInvitationCode,
  acceptInvitationLink,
  createInvitationLink,
} from "../controllers/invitation.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";

const router = Router();

/**
 * Chantier 5 - `verify` ne consomme pas d'usage mais repondait avec des statuts
 * distinguables sur un espace de 2^24, sans plafond : c'etait un oracle
 * d'enumeration de codes. La cadence est desormais contrainte.
 */
router.post(
  "/verify",
  rateLimit({
    name: "invitation-verify",
    windowMs: 60_000,
    max: 10,
    message: "Trop de verifications. Reessayez dans une minute.",
  }),
  verifyInvitationCode
);

router.post(
  "/links/verify",
  rateLimit({
    name: "invitation-link-verify",
    windowMs: 60_000,
    max: 10,
    message: "Trop de verifications. Reessayez dans une minute.",
  }),
  verifyInvitationLink
);

router.post(
  "/request",
  rateLimit({
    name: "invitation-request",
    windowMs: 10 * 60_000,
    max: 5,
    message: "Trop de demandes envoyees. Reessayez plus tard.",
  }),
  requestInvitation
);

router.post("/accept/code", requireAuth, acceptInvitationCode);
router.post("/accept/link", requireAuth, acceptInvitationLink);

router.get(
  "/requests",
  requireAuth,
  requireRole(["superadmin", "admin"]),
  listInvitationRequests
);
router.put(
  "/requests/:id/status",
  requireAuth,
  requireRole(["superadmin", "admin"]),
  handleInvitationRequest
);
router.post(
  "/generate",
  requireAuth,
  requireRole(["superadmin", "admin"]),
  generateInvitation
);

router.post(
  "/links",
  requireAuth,
  requireRole(["superadmin", "admin", "partner_admin"]),
  createInvitationLink
);

export default router;
