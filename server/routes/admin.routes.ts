/**
 * Routes du Back Office central.
 *
 * Chaque route passe par `requireAuth` (JWT verifie) puis `requireRole`, qui relit
 * le role et l'etat de suspension directement en base. Aucun header, query
 * parameter ou corps de requete ne peut a lui seul accorder un acces.
 */
import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  getAdminOverview,
  listAdminUsers,
  updateUserAccess,
  updateOrganizationStatus,
  updateCommunityStatus,
  updateCampaignStatus,
  deleteCampaign,
  deleteCommunity,
  deleteOrganization,
  listAuditLogs,
  listPlans,
  createPlan,
  updatePlan,
  activateDemo,
} from "../controllers/admin.controller.js";

const router = Router();

/** Toute la surface admin exige un jeton valide ET un role admin relu en base. */
router.use(requireAuth);

/**
 * Back-office de la PLATEFORME.
 *
 * Chantier 5 - `partner_admin` est un role de tenant : il designe le gerant
 * d'une organisation partenaire via `OrganizationAdmin`. L'accorder ici lui
 * ouvrait le back-office entier : export des 200 profils utilisateurs avec
 * email et ville, journal d'audit complet, et mutations de statut sur les
 * organisations, cercles et campagnes de TOUTES les organisations. Ce role
 * n'a donc plus acces a cette surface ; son espace est `/api/organizations`.
 */
const platformStaff = requireRole(["superadmin", "admin", "moderator"]);
const superAdminOnly = requireRole(["superadmin"]);

router.get("/overview", platformStaff, getAdminOverview);
router.get("/users", platformStaff, listAdminUsers);
router.get("/audit-logs", platformStaff, listAuditLogs);

// Statuts : modération des organisations, cercles et campagnes.
router.put("/organizations/:id/status", platformStaff, updateOrganizationStatus);
router.put("/communities/:id/status", platformStaff, updateCommunityStatus);
router.put("/campaigns/:id/status", platformStaff, updateCampaignStatus);

// Droits d'acces : lecture/contrôle réservé au super administrateur.
router.put("/users/:id/access", superAdminOnly, updateUserAccess);

// Suppressions definitives : direction de la plateforme uniquement.
router.delete("/organizations/:id", superAdminOnly, deleteOrganization);
router.delete("/communities/:id", superAdminOnly, deleteCommunity);
router.delete("/campaigns/:id", superAdminOnly, deleteCampaign);

router.get("/plans", superAdminOnly, listPlans);
router.post("/plans", superAdminOnly, createPlan);
router.put("/plans/:id", superAdminOnly, updatePlan);
router.post("/organizations/:id/demo", superAdminOnly, activateDemo);

export default router;