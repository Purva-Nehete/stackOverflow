import mongoose from "mongoose";
import { reputationRules } from "../config/reputationRules.js";

const reputationTransferSchema = mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      immutable: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      immutable: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: reputationRules.transfers.minimumAmount,
      max: reputationRules.transfers.maximumPerTransaction,
      immutable: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: reputationRules.transfers.reasonMaximumLength,
      immutable: true,
    },
    status: {
      type: String,
      enum: ["completed", "failed"],
      default: "completed",
      immutable: true,
    },
    completedAt: { type: Date, default: Date.now, immutable: true },
  },
  { timestamps: true }
);

reputationTransferSchema.index({ senderId: 1, createdAt: -1, _id: -1 });
reputationTransferSchema.index({ receiverId: 1, createdAt: -1, _id: -1 });

reputationTransferSchema.pre("validate", function validateParticipants(next) {
  if (String(this.senderId) === String(this.receiverId)) {
    this.invalidate("receiverId", "Sender and receiver must be different users.");
  }
  next();
});

export default mongoose.model("reputationTransfer", reputationTransferSchema);
