import Post from "../models/post.js";
import { getFeed } from "./post.js";

const normalizeTag = (value) => {
  const tag = String(value || "").replace(/^#/, "").trim().toLowerCase();
  return /^[\w-]{1,50}$/.test(tag) ? tag : null;
};

export const getTrendingHashtags = async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Math.min(
      Number.isInteger(requestedLimit) && requestedLimit > 0 ? requestedLimit : 10,
      30
    );
    const days = Math.min(Math.max(Number.parseInt(req.query.days, 10) || 14, 1), 30);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const hashtags = await Post.aggregate([
      {
        $match: {
          isRemoved: false,
          deletedAt: null,
          visibility: "public",
          createdAt: { $gte: since },
          hashtags: { $exists: true, $ne: [] },
        },
      },
      { $unwind: "$hashtags" },
      {
        $set: {
          ageHours: {
            $divide: [{ $subtract: ["$$NOW", "$createdAt"] }, 60 * 60 * 1000],
          },
        },
      },
      {
        $set: {
          weightedScore: {
            $divide: [
              { $add: [{ $ifNull: ["$engagementScore", 0] }, 1] },
              { $pow: [{ $add: ["$ageHours", 2] }, 1.2] },
            ],
          },
        },
      },
      {
        $group: {
          _id: "$hashtags",
          score: { $sum: "$weightedScore" },
          postCount: { $sum: 1 },
          latestPostAt: { $max: "$createdAt" },
        },
      },
      { $sort: { score: -1, latestPostAt: -1, _id: 1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          tag: "$_id",
          score: { $round: ["$score", 4] },
          postCount: 1,
          latestPostAt: 1,
        },
      },
    ]);

    return res.status(200).json({
      data: hashtags,
      windowDays: days,
      limit,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to fetch trending hashtags." });
  }
};

export const getHashtagPosts = (req, res, next) => {
  const tag = normalizeTag(req.params.tag);
  if (!tag) return res.status(400).json({ message: "Invalid hashtag." });

  req.query.tag = tag;
  return getFeed(req, res, next);
};
