import mongoose from "mongoose";

const postCommentSchema = mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "post", required: true, index: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    authorName: { type: String, required: true, trim: true },
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "postComment",
      default: null,
    },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    isRemoved: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

postCommentSchema.index({ postId: 1, createdAt: -1, _id: -1 });
postCommentSchema.index({ parentCommentId: 1, createdAt: 1 });

export default mongoose.model("postComment", postCommentSchema);
