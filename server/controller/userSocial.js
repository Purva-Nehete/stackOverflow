import mongoose from "mongoose";
import Follow from "../models/follow.js";
import user from "../models/auth.js";
import { createNotification } from "../services/notification.js";

const getUserId = (value) => mongoose.Types.ObjectId.isValid(value);

const encodeCursor = (record) =>
  Buffer.from(
    JSON.stringify({
      id: String(record._id),
      createdAt: record.createdAt.toISOString(),
    })
  ).toString("base64url");

const decodeCursor = (value) => {
  if (!value) return null;

  try {
    const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    const createdAt = new Date(decoded.createdAt);
    if (!getUserId(decoded.id) || Number.isNaN(createdAt.getTime())) {
      throw new Error("Invalid cursor");
    }
    return { id: new mongoose.Types.ObjectId(decoded.id), createdAt };
  } catch {
    const error = new Error("Invalid follow-list pagination cursor");
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

export const followUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    if (!getUserId(targetId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    if (String(req.userid) === String(targetId)) {
      return res.status(400).json({ message: "You cannot follow yourself." });
    }

    const targetUser = await user.findById(targetId).select("_id name");
    if (!targetUser) return res.status(404).json({ message: "User not found." });

    let created = false;
    try {
      await Follow.create({ followerId: req.userid, followingId: targetUser._id });
      created = true;
    } catch (error) {
      if (error.code !== 11000) throw error;
    }

    if (created) {
      await Promise.all([
        user.findByIdAndUpdate(req.userid, { $inc: { followingCount: 1 } }),
        user.findByIdAndUpdate(targetUser._id, { $inc: { followersCount: 1 } }),
      ]);
      await createNotification({
        recipientId: targetUser._id,
        actorId: req.userid,
        type: "follow",
        message: "Someone started following you.",
      });
    }

    const follower = await user.findById(req.userid).select("followingCount");
    const followed = await user.findById(targetUser._id).select("followersCount");

    return res.status(200).json({
      message: created ? "User followed." : "User already followed.",
      data: {
        following: true,
        followingCount: follower?.followingCount || 0,
        followersCount: followed?.followersCount || 0,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to follow user." });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    if (!getUserId(targetId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const deleted = await Follow.findOneAndDelete({
      followerId: req.userid,
      followingId: targetId,
    });

    if (deleted) {
      await Promise.all([
        user.findOneAndUpdate(
          { _id: req.userid, followingCount: { $gt: 0 } },
          { $inc: { followingCount: -1 } }
        ),
        user.findOneAndUpdate(
          { _id: targetId, followersCount: { $gt: 0 } },
          { $inc: { followersCount: -1 } }
        ),
      ]);
    }

    const followed = await user.findById(targetId).select("followersCount");
    return res.status(200).json({
      message: deleted ? "User unfollowed." : "User was not followed.",
      data: {
        following: false,
        followersCount: followed?.followersCount || 0,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to unfollow user." });
  }
};

const listRelationships = async ({ req, res, direction }) => {
  try {
    const targetId = req.params.id;
    if (!getUserId(targetId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const targetUser = await user.findById(targetId).select("_id");
    if (!targetUser) return res.status(404).json({ message: "User not found." });

    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Math.min(
      Number.isInteger(requestedLimit) && requestedLimit > 0 ? requestedLimit : 20,
      50
    );
    const cursor = decodeCursor(req.query.cursor);
    const filter = direction === "followers"
      ? { followingId: targetUser._id }
      : { followerId: targetUser._id };
    const cursorFilter = getCursorFilter(cursor);
    if (cursorFilter) Object.assign(filter, cursorFilter);

    const relationships = await Follow.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate(
        direction === "followers" ? "followerId" : "followingId",
        "name about followersCount followingCount"
      );

    const hasMore = relationships.length > limit;
    const data = hasMore ? relationships.slice(0, limit) : relationships;
    const nextCursor = hasMore ? encodeCursor(data[data.length - 1]) : null;

    return res.status(200).json({ data, nextCursor, hasMore, limit });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    console.error(error);
    return res.status(500).json({ message: "Unable to fetch follow list." });
  }
};

export const getFollowers = (req, res) =>
  listRelationships({ req, res, direction: "followers" });

export const getFollowing = (req, res) =>
  listRelationships({ req, res, direction: "following" });
