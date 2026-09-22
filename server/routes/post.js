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
import { reportPost } from "../controller/moderation.js";
import auth, { optionalAuth } from "../middleware/auth.js";
import requireActiveUser from "../middleware/requireActiveUser.js";

const router = express.Router();

router.post("/", auth, requireActiveUser, createPost);
router.get("/", optionalAuth, getAllPosts);
router.post("/:id/like", auth, requireActiveUser, likePost);
router.delete("/:id/like", auth, requireActiveUser, unlikePost);
router.post("/:id/bookmark", auth, requireActiveUser, bookmarkPost);
router.delete("/:id/bookmark", auth, requireActiveUser, removeBookmark);
router.post("/:id/share", auth, requireActiveUser, sharePost);
router.post("/:id/reports", auth, requireActiveUser, reportPost);
router.post("/:id/comments", auth, requireActiveUser, createComment);
router.get("/:id/comments", optionalAuth, getComments);
router.post("/comments/:commentId/replies", auth, requireActiveUser, createReply);
router.patch("/comments/:commentId", auth, requireActiveUser, updateComment);
router.delete("/comments/:commentId", auth, requireActiveUser, deleteComment);
router.get("/:id", getPostById);
router.patch("/:id", auth, requireActiveUser, updatePost);
router.delete("/:id", auth, requireActiveUser, deletePost);

export default router;
