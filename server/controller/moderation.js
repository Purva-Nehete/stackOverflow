import mongoose from "mongoose";
import Post from "../models/post.js";
import PostReport from "../models/postReport.js";
import user from "../models/auth.js";
import { createNotification } from "../services/notification.js";

const allowedReasons = new Set([
  "spam",
  "harassment",
  "hate",
  "sexual",
  "violence",
  "misinformation",
  "other",
]);

const encodeCursor = (record) =>
  Buffer.from(
    JSON.stringify({ id: String(record._id), createdAt: record.createdAt.toISOString() })
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
    const error = new Error("Invalid moderation pagination cursor");
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

export const reportPost = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid post ID." });
    }
    const { reason, details = "" } = req.body || {};
    if (!allowedReasons.has(reason)) {
      return res.status(400).json({ message: "Invalid report reason." });
    }
    if (String(details).length > 1000) {
      return res.status(400).json({ message: "Report details cannot exceed 1000 characters." });
    }

    const post = await Post.findOne({ _id: req.params.id, isRemoved: false, deletedAt: null });
    if (!post) return res.status(404).json({ message: "Post not found." });
    if (String(post.authorId) === String(req.userid)) {
      return res.status(400).json({ message: "You cannot report your own post." });
    }

    let report;
    try {
      report = await PostReport.create({
        reporterId: req.userid,
        postId: post._id,
        reason,
        details: String(details).trim(),
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: "You have already reported this post." });
      }
      throw error;
    }

    await Post.findByIdAndUpdate(post._id, {
      $inc: { reportCount: 1 },
      $set: { moderationStatus: "flagged" },
    });

    return res.status(201).json({ message: "Report submitted.", data: report });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to report post." });
  }
};

export const listReports = async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Math.min(
      Number.isInteger(requestedLimit) && requestedLimit > 0 ? requestedLimit : 20,
      50
    );
    const status = req.query.status || "pending";
    if (!["pending", "confirmed", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid report status." });
    }

    const cursor = decodeCursor(req.query.cursor);
    const filter = { status };
    const cursorFilter = getCursorFilter(cursor);
    if (cursorFilter) Object.assign(filter, cursorFilter);

    const reports = await PostReport.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate("reporterId", "name")
      .populate("postId", "authorId authorName content isRemoved moderationStatus");
    const hasMore = reports.length > limit;
    const data = hasMore ? reports.slice(0, limit) : reports;
    const nextCursor = hasMore ? encodeCursor(data[data.length - 1]) : null;

    return res.status(200).json({ data, nextCursor, hasMore, limit, status });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    console.error(error);
    return res.status(500).json({ message: "Unable to fetch reports." });
  }
};

export const reviewReport = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid report ID." });
    }
    const { status, reviewNote = "" } = req.body || {};
    if (!["confirmed", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Review status must be confirmed or rejected." });
    }
    if (String(reviewNote).length > 1000) {
      return res.status(400).json({ message: "Review note cannot exceed 1000 characters." });
    }

    const report = await PostReport.findOne({ _id: req.params.id, status: "pending" });
    if (!report) return res.status(404).json({ message: "Pending report not found." });

    report.status = status;
    report.reviewNote = String(reviewNote).trim();
    report.reviewerId = req.userid;
    report.reviewedAt = new Date();
    await report.save();

    if (status === "confirmed") {
      await Post.findOneAndUpdate(
        { _id: report.postId, isRemoved: false },
        { $set: { moderationStatus: "flagged" } }
      );
    }

    return res.status(200).json({ message: "Report reviewed.", data: report });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to review report." });
  }
};

export const removePostForModeration = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid post ID." });
    }
    const reason = String(req.body?.reason || "").trim();
    if (!reason || reason.length > 1000) {
      return res.status(400).json({ message: "A removal reason from 1 to 1000 characters is required." });
    }

    const post = await Post.findOne({ _id: req.params.id, deletedAt: null });
    if (!post) return res.status(404).json({ message: "Post not found." });

    post.isRemoved = true;
    post.removedBy = req.userid;
    post.removedReason = reason;
    post.moderationStatus = "removed";
    post.deletedAt = new Date();
    await post.save();

    await createNotification({
      recipientId: post.authorId,
      actorId: req.userid,
      type: "moderation",
      postId: post._id,
      message: "Your post was removed by a moderator.",
    });

    return res.status(200).json({ message: "Post removed by moderation.", data: post });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to remove post." });
  }
};

export const suspendUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }
    if (String(req.params.id) === String(req.userid)) {
      return res.status(400).json({ message: "You cannot suspend yourself." });
    }

    const { reason, durationDays } = req.body || {};
    const parsedDuration = Number.parseInt(durationDays, 10);
    if (!reason || String(reason).trim().length > 1000) {
      return res.status(400).json({ message: "A suspension reason is required." });
    }
    if (!Number.isInteger(parsedDuration) || parsedDuration < 1 || parsedDuration > 3650) {
      return res.status(400).json({ message: "Suspension duration must be between 1 and 3650 days." });
    }

    const targetUser = await user.findById(req.params.id).select("role");
    if (!targetUser) return res.status(404).json({ message: "User not found." });
    if (targetUser.role === "admin") {
      return res.status(403).json({ message: "Administrators cannot be suspended." });
    }
    if (targetUser.role === "moderator" && req.moderatorRole !== "admin") {
      return res.status(403).json({ message: "Only an administrator can suspend a moderator." });
    }

    const suspendedUntil = new Date(Date.now() + parsedDuration * 24 * 60 * 60 * 1000);
    const updatedUser = await user.findByIdAndUpdate(
      req.params.id,
      { $set: { suspendedUntil, suspensionReason: String(reason).trim() } },
      { new: true }
    ).select("_id name suspendedUntil suspensionReason");

    await createNotification({
      recipientId: updatedUser._id,
      actorId: req.userid,
      type: "moderation",
      message: "Your account has been suspended by a moderator.",
    });

    return res.status(200).json({ message: "User suspended.", data: updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to suspend user." });
  }
};
