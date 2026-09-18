import mongoose from "mongoose";

const postShareSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "post", required: true },
  },
  { timestamps: true }
);

postShareSchema.index({ userId: 1, postId: 1 }, { unique: true });
postShareSchema.index({ postId: 1, createdAt: -1 });

export default mongoose.model("postShare", postShareSchema);
