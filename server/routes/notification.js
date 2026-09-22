import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controller/notification.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, getNotifications);
router.get("/unread-count", auth, getUnreadCount);
router.patch("/:id/read", auth, markNotificationRead);
router.post("/read-all", auth, markAllNotificationsRead);

export default router;
