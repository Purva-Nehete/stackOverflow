import mongoose from "mongoose";

const paymentSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    plan: {
      type: String,
      enum: ["bronze", "silver", "gold"],
      required: true,
    },
    provider: {
      type: String,
      default: "razorpay",
    },
    paymentId: {
      type: String,
      required: true,
      unique: true,
    },
    orderId: String,
    signature: String,
    amount: Number,
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "refunded"],
      default: "created",
    },
    invoiceNumber: String,
    invoiceUrl: String,
    paidAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("payment", paymentSchema);
