import mongoose from "mongoose";

const userschema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  password: { type: String, required: true },
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
  followersCount: { type: Number, default: 0, min: 0 },
  followingCount: { type: Number, default: 0, min: 0 },
});
export default mongoose.model("user", userschema);
