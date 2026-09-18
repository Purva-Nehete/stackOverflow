import express from "express";
import { getHashtagPosts, getTrendingHashtags } from "../controller/discovery.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/trending", getTrendingHashtags);
router.get("/:tag/posts", optionalAuth, getHashtagPosts);

export default router;
