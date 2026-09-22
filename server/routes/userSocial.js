import express from "express";
import {
  followUser,
  getFollowers,
  getFollowing,
  unfollowUser,
} from "../controller/userSocial.js";
import auth, { optionalAuth } from "../middleware/auth.js";
import requireActiveUser from "../middleware/requireActiveUser.js";
import rateLimit from "../middleware/rateLimit.js";

const router = express.Router();
const followLimit = rateLimit({ max: 30, message: "Follow action limit reached." });

router.post("/:id/follow", auth, requireActiveUser, followLimit, followUser);
router.delete("/:id/follow", auth, requireActiveUser, followLimit, unfollowUser);
router.get("/:id/followers", optionalAuth, getFollowers);
router.get("/:id/following", optionalAuth, getFollowing);

export default router;