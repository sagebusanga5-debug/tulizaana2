import { Router } from "express";
import {
  listCommunities,
  getCommunity,
  joinCommunity,
  createCommunity,
} from "../controllers/community.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", optionalAuth, listCommunities);

/**
 * Chantier 4 - la creation d'un cercle n'est plus une operation anonyme.
 * `optionalAuth` autorisait n'importe quel visiteur, et meme n'importe quelle
 * organisation dans le corps de la requete. Le controleur resout maintenant
 * l'organisation depuis l'identite serveur et verifie approbation, abonnement,
 * paiement et quota.
 */
router.post("/", requireAuth, createCommunity);

router.get("/:id", optionalAuth, getCommunity);
router.post("/:id/join", requireAuth, joinCommunity);

export default router;
