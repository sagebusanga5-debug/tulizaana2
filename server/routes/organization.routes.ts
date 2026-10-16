import { Router } from "express";
import {
  listOrganizations,
  getOrganization,
  getOrganizationManage,
  createOrganization,
  updateOrganizationStatus,
  listMyManagedOrganizations,
  requestSubscriptionChange,
} from "../controllers/organization.controller.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

/**
 * Chantier 4 - Routes organisation.
 *
 * `GET /` et `GET /:id` restent publiques et ne renvoient plus que le DTO
 * public d'une organisation approuvee (aucune donnee de gestion).
 *
 * `POST /` reste une candidature publique sans authentification, mais le
 * serveur impose `status=pending`, la formule d'entree et ses quotas.
 */
router.get("/", optionalAuth, listOrganizations);
router.get("/mine", requireAuth, listMyManagedOrganizations);
router.post("/", createOrganization);

/**
 * Profil de gestion. 404 pour un non-administrateur, afin de ne pas reveler
 * l'existence d'une organisation.
 */
router.get("/:id/manage", requireAuth, getOrganizationManage);

/**
 * Demande de changement de formule.
 *
 * N'applique AUCUN changement : ni formule, ni quotas, ni etat de paiement. La
 * demande est tracee dans le journal d'audit et attend une validation
 * administrative. Aucun paiement n'est simule.
 */
router.post("/:id/subscription-request", requireAuth, requestSubscriptionChange);

/**
 * Mise a jour du statut et de l'abonnement : superadmin uniquement.
 * L'autorisation est faite ici, une seule fois. Le controleur ne teste plus
 * `req.user.role`, qui pourrait etre perime dans le JWT.
 *
 * `PUT` et non `PATCH` : methode attendue par `organizationsApi.updateStatus`
 * dans `src/services/api.ts`.
 */
router.put(
  "/:id/status",
  requireAuth,
  requireRole(["superadmin"]),
  updateOrganizationStatus
);

/**
 * Place apres `/:id/manage` pour ne pas etre capture par un parametre de route.
 * Le profil public n'est servi que pour une organisation approuvee.
 */
router.get("/:id", optionalAuth, getOrganization);

export default router;