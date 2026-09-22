import mongoose from "mongoose";
import Notification from "../models/notification.js";

const encodeCursor = (notification) =>
  Buffer.from(
    JSON.stringify({
      id: String(notification._id),
      createdAt: notification.createdAt.toISOString(),
    })
  ).toString("base64url");

const decodeCursor = (value) => {
  if (!value) return null;

  try {
    const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    const createdAt = new Date(decoded.createdAt);
    if (!mongoose.Types.ObjectId.isValid(decoded.id) || Number.isNaN(createdAt.getTime())) {
      throw new Error("Invalid cursor");
    }
    return { id: new mongoose.Types.ObjectId(decoded.id), createdAt };
  } catch {
    const error = new Error("Invalid notification pagination cursor");
    error.statusCode = 400;
    throw error;
  }
};

const getCursorFilter = (cursor) => {
  if (!cursor) return null;
  return {
    $or: [
      { createdAt: { $lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
    ],
  };
};

export const getNotifications = async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Math.min(
      Number.isInteger(requestedLimit) && requestedLimit > 0 ? requestedLimit : 20,
      50
    );
    const cursor = decodeCursor(req.query.cursor);
    const filter = { recipientId: req.userid };
    const cursorFilter = getCursorFilter(cursor);
    if (cursorFilter) Object.assign(filter, cursorFilter);

    if (req.query.unread === "true") filter.isRead = false;
    if (req.query.unread === "false") filter.isRead = true;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate("actorId", "name");
    const hasMore = notifications.length > limit;
    const data = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore ? encodeCursor(data[data.length - 1]) : null;
    const unreadCount = await Notification.countDocuments({
      recipientId: req.userid,
      isRead: false,
    });

    return res.status(200).json({ data, nextCursor, hasMore, unreadCount, limit });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    console.error(error);
    return res.status(500).json({ message: "Unable to fetch notifications." });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipientId: req.userid,
      isRead: false,
    });
    return res.status(200).json({ unreadCount });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to fetch unread notifications." });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid notification ID." });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.userid },
      { $set: { isRead: true } },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found." });

    return res.status(200).json({ message: "Notification marked as read.", data: notification });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to update notification." });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipientId: req.userid, isRead: false },
      { $set: { isRead: true } }
    );
    return res.status(200).json({ message: "Notifications marked as read.", modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to update notifications." });
  }
};
