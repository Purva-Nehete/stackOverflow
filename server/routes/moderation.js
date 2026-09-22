import express from "express";
import {
  listReports,
  removePostForModeration,
  reviewReport,
  suspendUser,
} from "../controller/moderation.js";
import auth from "../middleware/auth.js";
import requireModerator from "../middleware/requireModerator.js";
import rateLimit from "../middleware/rateLimit.js";

const router = express.Router();
const moderationLimit = rateLimit({ max: 60, message: "Moderation request limit reached." });

router.get("/reports", auth, requireModerator, moderationLimit, listReports);
router.patch("/reports/:id", auth, requireModerator, moderationLimit, reviewReport);
router.patch("/posts/:id/remove", auth, requireModerator, moderationLimit, removePostForModeration);
router.patch("/users/:id/suspend", auth, requireModerator, moderationLimit, suspendUser);

export default router;
