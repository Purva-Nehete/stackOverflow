import mongoose from "mongoose";

const userschema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  preferredLanguage: {
    type: String,
    enum: ["en", "es", "hi", "pt", "zh", "fr"],
    default: "en",
  },
  pendingLanguageChange: { type: String, default: null },
  languageOtpHash: { type: String, default: null },
  languageOtpChannel: {
    type: String,
    enum: ["email", "mobile", null],
    default: null,
  },
  languageOtpRequestedAt: { type: Date, default: null },
  languageOtpExpiry: { type: Date, default: null },
  languageOtpAttempts: { type: Number, default: 0, min: 0 },
  languageOtpRequestWindowStartedAt: { type: Date, default: null },
  languageOtpRequestCount: { type: Number, default: 0, min: 0 },
  password: { type: String, required: true, select: false },
  about: { type: String },
  tags: { type: [String] },
  joinDate: { type: Date, default: Date.now },
  forgotPasswordRequestedAt: { type: Date, default: null },
  subscriptionPlan: {
    type: String,
    enum: ["free", "bronze", "silver", "gold"],
    default: "free",
  },
  subscriptionStatus: {
    type: String,
    enum: ["inactive", "active", "cancelled", "past_due", "expired"],
    default: "inactive",
  },
  subscriptionId: { type: String, default: null },
  subscriptionStartDate: { type: Date, default: null },
  subscriptionEndDate: { type: Date, default: null },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  role: {
    type: String,
    enum: ["user", "moderator", "admin"],
    default: "user",
  },
  suspendedUntil: { type: Date, default: null },
  suspensionReason: { type: String, default: "", trim: true, maxlength: 1000 },
  followersCount: { type: Number, default: 0, min: 0 },
  followingCount: { type: Number, default: 0, min: 0 },
});
export default mongoose.model("user", userschema);
