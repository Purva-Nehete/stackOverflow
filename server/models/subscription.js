import mongoose from "mongoose";

const subscriptionSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    plan: {
      type: String,
      enum: ["free", "bronze", "silver", "gold"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["inactive", "active", "cancelled", "expired", "past_due"],
      default: "inactive",
    },
    razorpayCustomerId: String,
    razorpaySubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    lastPaymentId: String,
    nextBillingDate: Date,
  },
  { timestamps: true }
);

export default mongoose.model("subscription", subscriptionSchema);
