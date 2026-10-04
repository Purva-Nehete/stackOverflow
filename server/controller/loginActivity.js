import mongoose from "mongoose";
import LoginActivity from "../models/loginActivity.js";

const allowedOutcomes = new Set(["success", "failure", "verification_required", "verification_failed"]);
const allowedDeviceTypes = new Set(["desktop", "mobile", "tablet", "unknown"]);

const encodeCursor = (record) =>
  Buffer.from(
    JSON.stringify({ id: String(record._id), loggedInAt: record.loggedInAt.toISOString() })
  ).toString("base64url");

const decodeCursor = (value) => {
  if (!value) return null;

  try {
    const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    const loggedInAt = new Date(decoded.loggedInAt);
    if (!mongoose.Types.ObjectId.isValid(decoded.id) || Number.isNaN(loggedInAt.getTime())) {
      throw new Error("Invalid cursor");
    }
    return { id: new mongoose.Types.ObjectId(decoded.id), loggedInAt };
  } catch {
    const error = new Error("Invalid login activity pagination cursor");
    error.statusCode = 400;
    throw error;
  }
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getCursorFilter = (cursor) => {
  if (!cursor) return null;
  return {
    $or: [
      { loggedInAt: { $lt: cursor.loggedInAt } },
      { loggedInAt: cursor.loggedInAt, _id: { $lt: cursor.id } },
    ],
  };
};

const parseDate = (value, fieldName) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error(`Invalid ${fieldName} date.`);
    error.statusCode = 400;
    throw error;
  }
  return date;
};

export const listLoginActivity = async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Math.min(
      Number.isInteger(requestedLimit) && requestedLimit > 0 ? requestedLimit : 20,
      50
    );
    const { outcome, deviceType, ipAddress, location, userId } = req.query;

    if (outcome && !allowedOutcomes.has(outcome)) {
      return res.status(400).json({ message: "Invalid login outcome." });
    }
    if (deviceType && !allowedDeviceTypes.has(deviceType)) {
      return res.status(400).json({ message: "Invalid device type." });
    }
    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const from = parseDate(req.query.from, "from");
    const to = parseDate(req.query.to, "to");
    if (from && to && from > to) {
      return res.status(400).json({ message: "The from date must be before the to date." });
    }

    const filter = {};
    if (outcome) filter.outcome = outcome;
    if (deviceType) filter.deviceType = deviceType;
    if (ipAddress) filter.ipAddress = String(ipAddress).slice(0, 64);
    if (userId) filter.userId = userId;
    if (from || to) filter.loggedInAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
    if (location) {
      const locationPattern = new RegExp(escapeRegex(String(location).slice(0, 100)), "i");
      filter.$or = [
        { "location.country": locationPattern },
        { "location.region": locationPattern },
        { "location.city": locationPattern },
      ];
    }

    const cursor = decodeCursor(req.query.cursor);
    const cursorFilter = getCursorFilter(cursor);
    if (cursorFilter) {
      filter.$and = filter.$or ? [{ $or: filter.$or }, cursorFilter] : [cursorFilter];
      delete filter.$or;
    }

    const activities = await LoginActivity.find(filter)
      .select("+ipAddress")
      .sort({ loggedInAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate("userId", "name email")
      .lean();
    const hasMore = activities.length > limit;
    const data = hasMore ? activities.slice(0, limit) : activities;
    const nextCursor = hasMore ? encodeCursor(data[data.length - 1]) : null;

    return res.status(200).json({
      data: data.map((activity) => ({
        id: activity._id,
        user: activity.userId,
        outcome: activity.outcome,
        isNewDevice: activity.isNewDevice,
        browser: activity.browser,
        operatingSystem: activity.operatingSystem,
        deviceType: activity.deviceType,
        ipAddress: activity.ipAddress,
        location: activity.location,
        loggedInAt: activity.loggedInAt,
      })),
      nextCursor,
      hasMore,
      limit,
    });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    console.error("listLoginActivity error:", error);
    return res.status(500).json({ message: "Unable to fetch login activity." });
  }
};
