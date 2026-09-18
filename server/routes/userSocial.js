import express from "express";
import {
  followUser,
  getFollowers,
  getFollowing,
  unfollowUser,
} from "../controller/userSocial.js";
import auth, { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/:id/follow", auth, followUser);
router.delete("/:id/follow", auth, unfollowUser);
router.get("/:id/followers", optionalAuth, getFollowers);
router.get("/:id/following", optionalAuth, getFollowing);

export default router;