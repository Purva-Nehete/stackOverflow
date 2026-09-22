import mongoose from "mongoose";

const notificationSchema = mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    type: {
      type: String,
      enum: ["like", "comment", "reply", "mention", "follow", "moderation"],
      required: true,
    },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "post", default: null },
    commentId: { type: mongoose.Schema.Types.ObjectId, ref: "postComment", default: null },
    message: { type: String, required: true, trim: true, maxlength: 240 },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, createdAt: -1, _id: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("notification", notificationSchema);
