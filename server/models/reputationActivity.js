import mongoose from "mongoose";
import { reputationRules } from "../config/reputationRules.js";

const reputationActivitySchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      immutable: true,
      index: true,
    },
    amount: { type: Number, required: true, immutable: true },
    balanceAfter: { type: Number, required: true, min: 0, immutable: true },
    eventType: {
      type: String,
      enum: Object.values(reputationRules.eventTypes),
      required: true,
      immutable: true,
    },
    eventKey: { type: String, required: true, unique: true, immutable: true },
    relatedContentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      immutable: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
      immutable: true,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null, immutable: true },
  },
  { timestamps: true }
);

reputationActivitySchema.index({ userId: 1, createdAt: -1, _id: -1 });
reputationActivitySchema.index({ eventType: 1, createdAt: -1 });

export default mongoose.model("reputationActivity", reputationActivitySchema);
