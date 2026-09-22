import mongoose from "mongoose";

const postReportSchema = mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
      required: true,
    },
    reason: {
      type: String,
      enum: ["spam", "harassment", "hate", "sexual", "violence", "misinformation", "other"],
      required: true,
    },
    details: { type: String, default: "", trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected"],
      default: "pending",
      index: true,
    },
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
    reviewNote: { type: String, default: "", trim: true, maxlength: 1000 },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

postReportSchema.index({ reporterId: 1, postId: 1 }, { unique: true });
postReportSchema.index({ status: 1, createdAt: -1, _id: -1 });
postReportSchema.index({ postId: 1, createdAt: -1 });

export default mongoose.model("postReport", postReportSchema);
