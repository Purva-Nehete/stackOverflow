import mongoose from "mongoose";
import Bookmark from "../models/bookmark.js";
import Question from "../models/question.js";
import Subscription from "../models/subscription.js";

const bookmarkLimits = {
  free: 5,
  bronze: 25,
};

const getCurrentPlan = async (userId) => {
  const subscription = await Subscription.findOne({
    userId,
    status: "active",
  }).sort({ createdAt: -1 });
  const isCurrent = subscription?.currentPeriodEnd > new Date();
  return isCurrent ? subscription.plan : "free";
};

export const addBookmark = async (req, res) => {
  const { questionId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(400).json({ message: "Invalid question id" });
  }

  try {
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const existingBookmark = await Bookmark.findOne({
      userId: req.userid,
      questionId,
    });
    if (existingBookmark) {
      return res.status(409).json({ message: "Question already bookmarked" });
    }

    const planKey = await getCurrentPlan(req.userid);
    const bookmarkCount = await Bookmark.countDocuments({ userId: req.userid });
    const limit = bookmarkLimits[planKey];

    if (Number.isFinite(limit) && bookmarkCount >= limit) {
      return res.status(403).json({
        message: "Bookmark limit reached",
        plan: planKey,
        limit,
        used: bookmarkCount,
      });
    }

    const bookmark = await Bookmark.create({
      userId: req.userid,
      questionId,
    });

    return res.status(201).json({ data: bookmark, plan: planKey });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Question already bookmarked" });
    }
    return res.status(500).json({ message: "Unable to add bookmark" });
  }
};

export const removeBookmark = async (req, res) => {
  const { questionId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(400).json({ message: "Invalid question id" });
  }

  try {
    const bookmark = await Bookmark.findOneAndDelete({
      userId: req.userid,
      questionId,
    });

    if (!bookmark) {
      return res.status(404).json({ message: "Bookmark not found" });
    }

    return res.status(200).json({ message: "Bookmark removed" });
  } catch (error) {
    return res.status(500).json({ message: "Unable to remove bookmark" });
  }
};

export const getBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.userid })
      .populate("questionId")
      .sort({ createdAt: -1 });

    return res.status(200).json({ data: bookmarks });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load bookmarks" });
  }
};
