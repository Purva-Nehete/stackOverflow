import express from "express";
import {
  createPost,
  deletePost,
  getAllPosts,
  getPostById,
  updatePost,
} from "../controller/post.js";
import {
  bookmarkPost,
  createComment,
  createReply,
  deleteComment,
  getComments,
  likePost,
  removeBookmark,
  sharePost,
  unlikePost,
  updateComment,
} from "../controller/postInteraction.js";
import auth, { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, createPost);
router.get("/", optionalAuth, getAllPosts);
router.post("/:id/like", auth, likePost);
router.delete("/:id/like", auth, unlikePost);
router.post("/:id/bookmark", auth, bookmarkPost);
router.delete("/:id/bookmark", auth, removeBookmark);
router.post("/:id/share", auth, sharePost);
router.post("/:id/comments", auth, createComment);
router.get("/:id/comments", optionalAuth, getComments);
router.post("/comments/:commentId/replies", auth, createReply);
router.patch("/comments/:commentId", auth, updateComment);
router.delete("/comments/:commentId", auth, deleteComment);
router.get("/:id", getPostById);
router.patch("/:id", auth, updatePost);
router.delete("/:id", auth, deletePost);

export default router;
