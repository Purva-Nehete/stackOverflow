import mongoose from "mongoose";

const postSchema = mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },
    postType: {
      type: String,
      enum: ["update", "showcase", "achievement"],
      default: "update",
    },
    media: [
      {
        url: { type: String, required: true, trim: true, maxlength: 2048 },
        type: { type: String, enum: ["image"], default: "image" },
        storageKey: { type: String, default: "", trim: true, maxlength: 512 },
        width: { type: Number, default: null, min: 1, max: 10000 },
        height: { type: Number, default: null, min: 1, max: 10000 },
      },
    ],
    codeSnippet: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },
    codeLanguage: {
      type: String,
      default: "javascript",
      trim: true,
      maxlength: 50,
      match: /^[a-zA-Z0-9+#.-]+$/,
    },
    hashtags: {
      type: [String],
      default: [],
      validate: {
        validator: (value) => Array.isArray(value) && value.length <= 20,
        message: "A post can have at most 20 hashtags.",
      },
    },
    visibility: {
      type: String,
      enum: ["public", "followers"],
      default: "public",
    },
    isRemoved: {
      type: Boolean,
      default: false,
    },
    removedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    removedReason: {
      type: String,
      default: "",
      trim: true,
    },
    moderationStatus: {
      type: String,
      enum: ["active", "flagged", "removed"],
      default: "active",
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    shareCount: {
      type: Number,
      default: 0,
    },
    bookmarkCount: {
      type: Number,
      default: 0,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    engagementScore: {
      type: Number,
      default: 0,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

postSchema.index({ isRemoved: 1, visibility: 1, createdAt: -1 });
postSchema.index({ authorId: 1, createdAt: -1 });
postSchema.index({ hashtags: 1, createdAt: -1 });

export default mongoose.model("post", postSchema);
