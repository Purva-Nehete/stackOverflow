import express from "express";
import {
  listReports,
  removePostForModeration,
  reviewReport,
  suspendUser,
} from "../controller/moderation.js";
import { listLoginActivity } from "../controller/loginActivity.js";
import auth from "../middleware/auth.js";
import requireAdmin from "../middleware/requireAdmin.js";
import requireModerator from "../middleware/requireModerator.js";
import rateLimit from "../middleware/rateLimit.js";

const router = express.Router();
const moderationLimit = rateLimit({ max: 60, message: "Moderation request limit reached." });
const loginActivityLimit = rateLimit({ max: 60, message: "Login activity request limit reached." });

router.get("/login-activity", auth, requireAdmin, loginActivityLimit, listLoginActivity);

router.get("/reports", auth, requireModerator, moderationLimit, listReports);
router.patch("/reports/:id", auth, requireModerator, moderationLimit, reviewReport);
router.patch("/posts/:id/remove", auth, requireModerator, moderationLimit, removePostForModeration);
router.patch("/users/:id/suspend", auth, requireModerator, moderationLimit, suspendUser);

export default router;
