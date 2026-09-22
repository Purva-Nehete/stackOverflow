import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controller/notification.js";
import auth from "../middleware/auth.js";
import rateLimit from "../middleware/rateLimit.js";

const router = express.Router();
const notificationLimit = rateLimit({ max: 120, message: "Notification request limit reached." });

router.get("/", auth, notificationLimit, getNotifications);
router.get("/unread-count", auth, notificationLimit, getUnreadCount);
router.patch("/:id/read", auth, notificationLimit, markNotificationRead);
router.post("/read-all", auth, notificationLimit, markAllNotificationsRead);

export default router;
