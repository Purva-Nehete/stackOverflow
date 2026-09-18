import mongoose from "mongoose";

const postBookmarkSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "post", required: true },
  },
  { timestamps: true }
);

postBookmarkSchema.index({ userId: 1, postId: 1 }, { unique: true });
postBookmarkSchema.index({ postId: 1, createdAt: -1 });

export default mongoose.model("postBookmark", postBookmarkSchema);
