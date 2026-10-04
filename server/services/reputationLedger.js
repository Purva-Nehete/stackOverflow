import mongoose from "mongoose";
import user from "../models/auth.js";
import ReputationActivity from "../models/reputationActivity.js";
import ReputationTransfer from "../models/reputationTransfer.js";
import { reputationRules } from "../config/reputationRules.js";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const getUtcDayRange = (date = new Date()) => {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

export const validateTransferInput = ({ senderId, receiverId, amount, reason }) => {
  if (!isValidObjectId(senderId) || !isValidObjectId(receiverId)) {
    throw new Error("A valid sender and receiver are required.");
  }
  if (String(senderId) === String(receiverId)) {
    throw new Error("Sender and receiver must be different users.");
  }
  if (
    !Number.isInteger(amount) ||
    amount < reputationRules.transfers.minimumAmount ||
    amount > reputationRules.transfers.maximumPerTransaction
  ) {
    throw new Error("Transfer amount is outside the allowed range.");
  }
  if (typeof reason !== "string" || !reason.trim()) {
    throw new Error("A transfer reason is required.");
  }
  if (reason.trim().length > reputationRules.transfers.reasonMaximumLength) {
    throw new Error("Transfer reason is too long.");
  }
};

export const recordReputationChange = async ({
  userId,
  amount,
  eventType,
  eventKey,
  relatedContentId = null,
  actorId = null,
  metadata = null,
}) => {
  if (!isValidObjectId(userId) || !Number.isInteger(amount) || !eventKey) {
    throw new Error("Invalid reputation change.");
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const existingActivity = await ReputationActivity.findOne({ eventKey }).session(session);
      if (existingActivity) {
        result = { activity: existingActivity, duplicate: true };
        return;
      }

      const account = await user.findById(userId).session(session);
      if (!account) throw new Error("User not found.");

      const nextBalance = Math.max(
        reputationRules.balance.minimum,
        account.reputationBalance + amount
      );
      const appliedAmount = nextBalance - account.reputationBalance;
      account.reputationBalance = nextBalance;
      await account.save({ session });

      const activity = await ReputationActivity.create(
        [
          {
            userId,
            amount: appliedAmount,
            balanceAfter: nextBalance,
            eventType,
            eventKey,
            relatedContentId,
            actorId,
            metadata,
          },
        ],
        { session }
      );
      result = { activity: activity[0], duplicate: false };
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const createReputationTransfer = async ({
  senderId,
  receiverId,
  amount,
  reason,
  occurredAt = new Date(),
}) => {
  validateTransferInput({ senderId, receiverId, amount, reason });
  const session = await mongoose.startSession();

  try {
    let transfer;
    await session.withTransaction(async () => {
      const sender = await user.findById(senderId).session(session);
      const receiver = await user.findById(receiverId).session(session);
      if (!sender || !receiver) throw new Error("Sender or receiver not found.");
      if (sender.reputationBalance <= reputationRules.transfers.minimumReputationExclusive) {
        throw new Error("More than 50 reputation is required to transfer points.");
      }
      if (sender.reputationBalance < amount) {
        throw new Error("Insufficient reputation balance.");
      }

      const { start, end } = getUtcDayRange(occurredAt);
      const dailyTransfers = await ReputationTransfer.aggregate([
        {
          $match: {
            senderId: sender._id,
            status: "completed",
            createdAt: { $gte: start, $lt: end },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).session(session);
      const transferredToday = dailyTransfers[0]?.total || 0;
      if (
        transferredToday + amount > reputationRules.transfers.maximumPerUtcDay
      ) {
        throw new Error("Daily reputation transfer limit exceeded.");
      }

      sender.reputationBalance -= amount;
      receiver.reputationBalance += amount;
      await sender.save({ session });
      await receiver.save({ session });

      const createdTransfers = await ReputationTransfer.create(
        [{ senderId, receiverId, amount, reason: reason.trim(), status: "completed" }],
        { session }
      );
      transfer = createdTransfers[0];

      await ReputationActivity.create(
        [
          {
            userId: senderId,
            amount: -amount,
            balanceAfter: sender.reputationBalance,
            eventType: reputationRules.eventTypes.reputationTransferSent,
            eventKey: `transfer:${transfer._id}:sent`,
            actorId: receiverId,
            metadata: { transferId: transfer._id, reason: reason.trim() },
          },
          {
            userId: receiverId,
            amount,
            balanceAfter: receiver.reputationBalance,
            eventType: reputationRules.eventTypes.reputationTransferReceived,
            eventKey: `transfer:${transfer._id}:received`,
            actorId: senderId,
            metadata: { transferId: transfer._id, reason: reason.trim() },
          },
        ],
        { session }
      );
    });
    return transfer;
  } finally {
    await session.endSession();
  }
};

export { getUtcDayRange };
