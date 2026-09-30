import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    country: { type: String, trim: true, maxlength: 100 },
    region: { type: String, trim: true, maxlength: 100 },
    city: { type: String, trim: true, maxlength: 100 },
    timezone: { type: String, trim: true, maxlength: 100 },
    source: { type: String, enum: ["provider", "none"], default: "none" },
  },
  { _id: false }
);

const loginActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    outcome: {
      type: String,
      enum: ["success", "failure", "verification_required", "verification_failed"],
      required: true,
      index: true,
    },
    isNewDevice: { type: Boolean, default: false },
    browser: { type: String, required: true, trim: true, maxlength: 120 },
    operatingSystem: { type: String, required: true, trim: true, maxlength: 120 },
    deviceType: { type: String, required: true, enum: ["desktop", "mobile", "tablet", "unknown"] },
    ipAddress: { type: String, required: true, trim: true, maxlength: 64, select: false },
    userAgent: { type: String, required: true, trim: true, maxlength: 512, select: false },
    location: { type: locationSchema, default: null },
    loggedInAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

loginActivitySchema.index({ userId: 1, loggedInAt: -1, _id: -1 });
loginActivitySchema.index({ outcome: 1, loggedInAt: -1 });
loginActivitySchema.index({ loggedInAt: 1 });

export default mongoose.model("loginActivity", loginActivitySchema);
