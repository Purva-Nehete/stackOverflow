import mongoose from "mongoose";
import ReputationActivity from "../models/reputationActivity.js";
import ReputationTransfer from "../models/reputationTransfer.js";
import user from "../models/auth.js";
import {
  createReputationTransfer,
  getUtcDayRange,
} from "../services/reputationLedger.js";
import { reputationRules, getPrivilegeAvailability } from "../config/reputationRules.js";

const parseLimit = (value, fallback = 20) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 50) : fallback;
};

const parseOffset = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? Math.min(parsed, 10000) : 0;
};

const serializeTransfer = (transfer) => ({
  id: transfer._id,
  senderId: transfer.senderId,
  receiverId: transfer.receiverId,
  amount: transfer.amount,
  reason: transfer.reason,
  status: transfer.status,
  createdAt: transfer.createdAt,
  completedAt: transfer.completedAt,
});

const serializeActivity = (activity) => ({
  id: activity._id,
  amount: activity.amount,
  balanceAfter: activity.balanceAfter,
  eventType: activity.eventType,
  relatedContentId: activity.relatedContentId,
  actorId: activity.actorId,
  createdAt: activity.createdAt,
});

export const getReputationSummary = async (req, res) => {
  try {
    const existingUser = await user.findById(req.userid).select("reputationBalance");
    if (!existingUser) return res.status(404).json({ message: "User not found." });
    const reputation = Number.isFinite(existingUser.reputationBalance)
      ? existingUser.reputationBalance
      : reputationRules.balance.minimum;

    return res.status(200).json({
      data: {
        reputation,
        privileges: getPrivilegeAvailability(reputation),
      },
    });
  } catch (error) {
    console.error("getReputationSummary error:", error);
    return res.status(500).json({ message: "Unable to load reputation." });
  }
};

export const getPublicReputationSummary = async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID." });
  }

  try {
    const existingUser = await user
      .findById(userId)
      .select("name joinDate reputationBalance");
    if (!existingUser) return res.status(404).json({ message: "User not found." });
    const reputation = Number.isFinite(existingUser.reputationBalance)
      ? existingUser.reputationBalance
      : reputationRules.balance.minimum;

    return res.status(200).json({
      data: {
        user: {
          id: existingUser._id,
          name: existingUser.name,
          joinDate: existingUser.joinDate,
        },
        reputation,
        privileges: getPrivilegeAvailability(reputation),
      },
    });
  } catch (error) {
    console.error("getPublicReputationSummary error:", error);
    return res.status(500).json({ message: "Unable to load public reputation." });
  }
};

export const transferReputation = async (req, res) => {
  const receiverId = req.body?.receiverId;
  const amount = Number(req.body?.amount);
  const reason = req.body?.reason;

  try {
    const transfer = await createReputationTransfer({
      senderId: req.userid,
      receiverId,
      amount,
      reason,
    });
    return res.status(201).json({
      message: "Reputation transferred successfully.",
      data: serializeTransfer(transfer),
    });
  } catch (error) {
    const validationMessages = [
      "valid sender and receiver",
      "different users",
      "outside the allowed range",
      "reason is required",
      "reason is too long",
      "More than 50 reputation",
      "Insufficient reputation",
      "Daily reputation transfer limit",
      "not found",
    ];
    if (validationMessages.some((message) => error.message.includes(message))) {
      return res.status(400).json({ message: error.message });
    }
    console.error("transferReputation error:", error);
    return res.status(500).json({ message: "Unable to transfer reputation." });
  }
};

export const listTransferRecipients = async (req, res) => {
  const query = String(req.query.query || "").trim();
  const limit = parseLimit(req.query.limit, 10);
  const filters = { _id: { $ne: req.userid } };
  if (query) {
    const pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filters.$or = [{ name: pattern }, { email: pattern }];
  }

  try {
    const recipients = await user
      .find(filters)
      .select("name email reputationBalance")
      .sort({ name: 1 })
      .limit(limit)
      .lean();
    return res.status(200).json({
      data: recipients.map((recipient) => ({
        id: recipient._id,
        name: recipient.name,
        email: recipient.email,
        reputation: Number.isFinite(recipient.reputationBalance)
          ? recipient.reputationBalance
          : reputationRules.balance.minimum,
      })),
    });
  } catch (error) {
    console.error("listTransferRecipients error:", error);
    return res.status(500).json({ message: "Unable to load transfer recipients." });
  }
};

export const listReputationTransfers = async (req, res) => {
  const limit = parseLimit(req.query.limit);
  const offset = parseOffset(req.query.offset);
  const userId = new mongoose.Types.ObjectId(req.userid);

  try {
    const transfers = await ReputationTransfer.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .sort({ createdAt: -1, _id: -1 })
      .skip(offset)
      .limit(limit + 1)
      .lean();
    const hasMore = transfers.length > limit;
    const data = hasMore ? transfers.slice(0, limit) : transfers;

    return res.status(200).json({
      data: data.map(serializeTransfer),
      hasMore,
      limit,
      offset,
      nextOffset: hasMore ? offset + limit : null,
    });
  } catch (error) {
    console.error("listReputationTransfers error:", error);
    return res.status(500).json({ message: "Unable to load transfer history." });
  }
};

export const listReputationActivity = async (req, res) => {
  const limit = parseLimit(req.query.limit);
  const offset = parseOffset(req.query.offset);
  try {
    const activity = await ReputationActivity.find({ userId: req.userid })
      .sort({ createdAt: -1, _id: -1 })
      .skip(offset)
      .limit(limit + 1)
      .lean();
    const hasMore = activity.length > limit;
    const data = hasMore ? activity.slice(0, limit) : activity;
    return res.status(200).json({
      data: data.map(serializeActivity),
      hasMore,
      limit,
      offset,
      nextOffset: hasMore ? offset + limit : null,
    });
  } catch (error) {
    console.error("listReputationActivity error:", error);
    return res.status(500).json({ message: "Unable to load reputation history." });
  }
};

export const listPublicReputationActivity = async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID." });
  }

  const limit = parseLimit(req.query.limit);
  const offset = parseOffset(req.query.offset);
  try {
    const activity = await ReputationActivity.find({ userId })
      .select("amount balanceAfter eventType relatedContentId actorId createdAt")
      .sort({ createdAt: -1, _id: -1 })
      .skip(offset)
      .limit(limit + 1)
      .lean();
    const hasMore = activity.length > limit;
    const data = hasMore ? activity.slice(0, limit) : activity;
    return res.status(200).json({
      data: data.map(serializeActivity),
      hasMore,
      limit,
      offset,
      nextOffset: hasMore ? offset + limit : null,
    });
  } catch (error) {
    console.error("listPublicReputationActivity error:", error);
    return res.status(500).json({ message: "Unable to load public reputation history." });
  }
};

export const getDailyTransferAllowance = async (req, res) => {
  try {
    const { start, end } = getUtcDayRange();
    const totals = await ReputationTransfer.aggregate([
      {
        $match: {
          senderId: new mongoose.Types.ObjectId(req.userid),
          status: "completed",
          createdAt: { $gte: start, $lt: end },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const transferred = totals[0]?.total || 0;
    return res.status(200).json({
      data: {
        transferred,
        remaining: Math.max(0, reputationRules.transfers.maximumPerUtcDay - transferred),
        limit: reputationRules.transfers.maximumPerUtcDay,
      },
    });
  } catch (error) {
    console.error("getDailyTransferAllowance error:", error);
    return res.status(500).json({ message: "Unable to load transfer allowance." });
  }
};
