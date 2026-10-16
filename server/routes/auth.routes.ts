import { Router } from "express";
import { register, login, getMe, updateProfile, googleSignIn, logout } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";

const router = Router();

/**
 * Chantier 5 - ces trois routes n'etaient protegees par aucun plafond.
 *
 * `login` etait une attaque par force brute en ligne : le cout du mot de passe
 * etait le seul frein. `register` creait un compte et un enregistrement de
 * journal par appel. `google` consommait le quota Firebase.
 *
 * La limite de `login` est double : par IP et par identifiant tente, ce qui
 * rend inutile la rotation d'adresses et interdit aussi de viser un compte
 * precis depuis une adresse unique.
 */
const authWriteLimiter = rateLimit({
  name: "auth-write",
  windowMs: 60_000,
  max: 10,
  message: "Trop de tentatives. Reessayez dans une minute.",
});

router.post("/register", authWriteLimiter, register);

router.post(
  "/login",
  rateLimit({
    name: "login-ip",
    windowMs: 60_000,
    max: 20,
    message: "Trop de tentatives de connexion. Reessayez dans une minute.",
  }),
  rateLimit({
    name: "login-id",
    windowMs: 15 * 60_000,
    max: 8,
    message: "Trop de tentatives sur ce compte. Reessayez plus tard.",
    scope: (req) => {
      const raw = (req.body ?? {}).identifier ?? (req.body ?? {}).email;
      return typeof raw === "string" ? raw.trim().toLowerCase().slice(0, 120) : null;
    },
  }),
  login
);

router.post("/google", authWriteLimiter, googleSignIn);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);
router.put("/profile", requireAuth, updateProfile);

export default router;