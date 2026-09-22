import express from "express";
import {
  followUser,
  getFollowers,
  getFollowing,
  unfollowUser,
} from "../controller/userSocial.js";
import auth, { optionalAuth } from "../middleware/auth.js";
import requireActiveUser from "../middleware/requireActiveUser.js";

const router = express.Router();

router.post("/:id/follow", auth, requireActiveUser, followUser);
router.delete("/:id/follow", auth, requireActiveUser, unfollowUser);
router.get("/:id/followers", optionalAuth, getFollowers);
router.get("/:id/following", optionalAuth, getFollowing);

export default router;