import { Router } from "express";
import { uploadMedia } from "../controllers/upload.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";

const router = Router();

const UPLOAD_RATE_LIMITER = rateLimit({
  name: "upload",
  windowMs: 60_000,
  max: 20,
  message: "Trop de televersements. Reessayez dans une minute.",
});

router.post("/", requireAuth, UPLOAD_RATE_LIMITER, uploadMedia);

export default router;