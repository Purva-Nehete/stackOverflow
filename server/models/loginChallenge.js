import mongoose from "mongoose";

const loginChallengeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    challengeHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    otpHash: { type: String, required: true, select: false },
    browser: { type: String, required: true, trim: true, maxlength: 120 },
    operatingSystem: { type: String, required: true, trim: true, maxlength: 120 },
    deviceType: { type: String, required: true, enum: ["desktop", "mobile", "tablet", "unknown"] },
    status: {
      type: String,
      enum: ["pending", "verified", "expired", "exhausted"],
      default: "pending",
      index: true,
    },
    attempts: { type: Number, default: 0, min: 0 },
    requestWindowStartedAt: { type: Date, default: Date.now },
    requestCount: { type: Number, default: 1, min: 0 },
    lastRequestedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

loginChallengeSchema.index({ userId: 1, status: 1, createdAt: -1 });

export default mongoose.model("loginChallenge", loginChallengeSchema);
