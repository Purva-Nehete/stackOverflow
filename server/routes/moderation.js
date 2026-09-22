import express from "express";
import {
  listReports,
  removePostForModeration,
  reviewReport,
  suspendUser,
} from "../controller/moderation.js";
import auth from "../middleware/auth.js";
import requireModerator from "../middleware/requireModerator.js";

const router = express.Router();

router.get("/reports", auth, requireModerator, listReports);
router.patch("/reports/:id", auth, requireModerator, reviewReport);
router.patch("/posts/:id/remove", auth, requireModerator, removePostForModeration);
router.patch("/users/:id/suspend", auth, requireModerator, suspendUser);

export default router;
