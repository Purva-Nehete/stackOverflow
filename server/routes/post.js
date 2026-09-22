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
import rateLimit from "../middleware/rateLimit.js";

const router = express.Router();
const postCreationLimit = rateLimit({ max: 10, message: "Post creation limit reached." });
const interactionLimit = rateLimit({ max: 60, message: "Interaction limit reached." });
const reportLimit = rateLimit({ max: 5, message: "Report submission limit reached." });

router.post("/", auth, requireActiveUser, postCreationLimit, createPost);
router.get("/", optionalAuth, getAllPosts);
router.post("/:id/like", auth, requireActiveUser, interactionLimit, likePost);
router.delete("/:id/like", auth, requireActiveUser, interactionLimit, unlikePost);
router.post("/:id/bookmark", auth, requireActiveUser, interactionLimit, bookmarkPost);
router.delete("/:id/bookmark", auth, requireActiveUser, interactionLimit, removeBookmark);
router.post("/:id/share", auth, requireActiveUser, interactionLimit, sharePost);
router.post("/:id/reports", auth, requireActiveUser, reportLimit, reportPost);
router.post("/:id/comments", auth, requireActiveUser, interactionLimit, createComment);
router.get("/:id/comments", optionalAuth, getComments);
router.post("/comments/:commentId/replies", auth, requireActiveUser, interactionLimit, createReply);
router.patch("/comments/:commentId", auth, requireActiveUser, interactionLimit, updateComment);
router.delete("/comments/:commentId", auth, requireActiveUser, interactionLimit, deleteComment);
router.get("/:id", getPostById);
router.patch("/:id", auth, requireActiveUser, interactionLimit, updatePost);
router.delete("/:id", auth, requireActiveUser, interactionLimit, deletePost);

export default router;
