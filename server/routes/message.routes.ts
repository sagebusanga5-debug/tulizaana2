import { Router } from "express";
import {
  listThreads,
  getThreadMessages,
  sendMessage,
} from "../controllers/message.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";

const router = Router();

router.get("/threads", requireAuth, listThreads);
router.get("/threads/:threadId", requireAuth, getThreadMessages);

router.post(
  "/",
  requireAuth,
  rateLimit({
    name: "message-send",
    windowMs: 60_000,
    max: 30,
    message: "Trop de messages envoyes. Reessayez dans une minute.",
  }),
  sendMessage
);

export default router;
