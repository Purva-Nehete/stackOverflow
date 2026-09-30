import mongoose from "mongoose";

const trustedDeviceSchema = new mongoose.Schema(
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
    lastUsedAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

trustedDeviceSchema.index({ userId: 1, status: 1, lastUsedAt: -1 });

export default mongoose.model("trustedDevice", trustedDeviceSchema);
