import { Router } from "express";
import { listStories, createStory } from "../controllers/story.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", optionalAuth, listStories);
router.post("/", requireAuth, createStory);

export default router;
