import express from "express";
import {
  createPost,
  deletePost,
  getAllPosts,
  getPostById,
  updatePost,
} from "../controller/post.js";
import auth, { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, createPost);
router.get("/", optionalAuth, getAllPosts);
router.get("/:id", getPostById);
router.patch("/:id", auth, updatePost);
router.delete("/:id", auth, deletePost);

export default router;
