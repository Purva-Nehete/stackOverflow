import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    trustedDeviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "trustedDevice",
      default: null,
    },
    browser: { type: String, required: true, trim: true, maxlength: 120 },
    operatingSystem: { type: String, required: true, trim: true, maxlength: 120 },
    deviceType: { type: String, required: true, enum: ["desktop", "mobile", "tablet", "unknown"] },
    status: {
      type: String,
      enum: ["active", "revoked", "expired"],
      default: "active",
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
    lastActivityAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, trim: true, maxlength: 120, default: null },
  },
  { timestamps: true }
);

sessionSchema.index({ userId: 1, status: 1, lastActivityAt: -1 });

export default mongoose.model("session", sessionSchema);
