import { Router } from "express";
import {
  listPosts,
  createPost,
  reactToPost,
  addComment,
  listComments,
} from "../controllers/post.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", optionalAuth, listPosts);
router.post("/", requireAuth, createPost);
router.post("/:id/react", requireAuth, reactToPost);
router.get("/:id/comments", optionalAuth, listComments);
router.post("/:id/comments", requireAuth, addComment);

export default router;
