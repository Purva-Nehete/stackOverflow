import mongoose from "mongoose";
import Post from "../models/post.js";
import PostLike from "../models/postLike.js";
import PostBookmark from "../models/postBookmark.js";
import PostShare from "../models/postShare.js";
import PostComment from "../models/postComment.js";
import user from "../models/auth.js";

const parsePostId = (value) => mongoose.Types.ObjectId.isValid(value);

const getActivePost = async (postId) => {
  if (!parsePostId(postId)) return null;
  return Post.findOne({ _id: postId, isRemoved: false, deletedAt: null });
};

const interactionResponse = (post, extra = {}) => ({
  postId: post._id,
  likeCount: post.likeCount,
  commentCount: post.commentCount,
  shareCount: post.shareCount,
  bookmarkCount: post.bookmarkCount,
  ...extra,
});

const encodeCommentCursor = (comment) =>
  Buffer.from(
    JSON.stringify({
      id: String(comment._id),
      createdAt: comment.createdAt.toISOString(),
    })
  ).toString("base64url");

const decodeCommentCursor = (value) => {
  if (!value) return null;

  try {
    const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    const createdAt = new Date(decoded.createdAt);
    if (!mongoose.Types.ObjectId.isValid(decoded.id) || Number.isNaN(createdAt.getTime())) {
      throw new Error("Invalid cursor");
    }
    return { id: new mongoose.Types.ObjectId(decoded.id), createdAt };
  } catch {
    const error = new Error("Invalid comment pagination cursor");
    error.statusCode = 400;
    throw error;
  }
};

const commentCursorFilter = (cursor) => {
  if (!cursor) return null;
  return {
    $or: [
      { createdAt: { $lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
    ],
  };
};

export const likePost = async (req, res) => {
  try {
    const post = await getActivePost(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    let created = false;
    try {
      await PostLike.create({ userId: req.userid, postId: post._id });
      created = true;
    } catch (error) {
      if (error.code !== 11000) throw error;
    }

    if (created) {
      await Post.findByIdAndUpdate(post._id, {
        $inc: { likeCount: 1, engagementScore: 1 },
      });
    }

    const updatedPost = await Post.findById(post._id);
    return res.status(200).json({
      message: created ? "Post liked." : "Post was already liked.",
      data: interactionResponse(updatedPost, { liked: true }),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to like post." });
  }
};

export const unlikePost = async (req, res) => {
  try {
    const post = await getActivePost(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    const deleted = await PostLike.findOneAndDelete({ userId: req.userid, postId: post._id });
    if (deleted) {
      await Post.findOneAndUpdate(
        { _id: post._id, likeCount: { $gt: 0 } },
        { $inc: { likeCount: -1, engagementScore: -1 } }
      );
    }

    const updatedPost = await Post.findById(post._id);
    return res.status(200).json({
      message: deleted ? "Post unliked." : "Post was not liked.",
      data: interactionResponse(updatedPost, { liked: false }),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to unlike post." });
  }
};

export const bookmarkPost = async (req, res) => {
  try {
    const post = await getActivePost(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    let created = false;
    try {
      await PostBookmark.create({ userId: req.userid, postId: post._id });
      created = true;
    } catch (error) {
      if (error.code !== 11000) throw error;
    }

    if (created) {
      await Post.findByIdAndUpdate(post._id, { $inc: { bookmarkCount: 1 } });
    }

    const updatedPost = await Post.findById(post._id);
    return res.status(200).json({
      message: created ? "Post bookmarked." : "Post was already bookmarked.",
      data: interactionResponse(updatedPost, { bookmarked: true }),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to bookmark post." });
  }
};

export const removeBookmark = async (req, res) => {
  try {
    const post = await getActivePost(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    const deleted = await PostBookmark.findOneAndDelete({ userId: req.userid, postId: post._id });
    if (deleted) {
      await Post.findOneAndUpdate(
        { _id: post._id, bookmarkCount: { $gt: 0 } },
        { $inc: { bookmarkCount: -1 } }
      );
    }

    const updatedPost = await Post.findById(post._id);
    return res.status(200).json({
      message: deleted ? "Bookmark removed." : "Post was not bookmarked.",
      data: interactionResponse(updatedPost, { bookmarked: false }),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to remove bookmark." });
  }
};

export const sharePost = async (req, res) => {
  try {
    const post = await getActivePost(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    let created = false;
    try {
      await PostShare.create({ userId: req.userid, postId: post._id });
      created = true;
    } catch (error) {
      if (error.code !== 11000) throw error;
    }

    if (created) {
      await Post.findByIdAndUpdate(post._id, {
        $inc: { shareCount: 1, engagementScore: 3 },
      });
    }

    const updatedPost = await Post.findById(post._id);
    return res.status(200).json({
      message: created ? "Post shared." : "Post was already shared.",
      data: interactionResponse(updatedPost, { shared: true }),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to share post." });
  }
};

export const createComment = async (req, res) => {
  try {
    const post = await getActivePost(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    const content = String(req.body?.content || "").trim();
    if (!content || content.length > 2000) {
      return res.status(400).json({ message: "Comment must contain 1 to 2000 characters." });
    }

    let parentComment = null;
    if (req.body?.parentCommentId) {
      if (!parsePostId(req.body.parentCommentId)) {
        return res.status(400).json({ message: "Invalid parent comment ID." });
      }
      parentComment = await PostComment.findOne({
        _id: req.body.parentCommentId,
        postId: post._id,
        isRemoved: false,
        deletedAt: null,
      });
      if (!parentComment) {
        return res.status(404).json({ message: "Parent comment not found." });
      }
      if (parentComment.parentCommentId) {
        return res.status(400).json({ message: "Replies can only be one level deep." });
      }
    }

    const author = await user.findById(req.userid).select("name");
    if (!author) return res.status(404).json({ message: "User not found." });

    const comment = await PostComment.create({
      postId: post._id,
      authorId: req.userid,
      authorName: author.name,
      parentCommentId: parentComment?._id || null,
      content,
    });

    await Post.findByIdAndUpdate(post._id, {
      $inc: { commentCount: 1, engagementScore: 2 },
    });

    return res.status(201).json({ message: "Comment created.", data: comment });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to create comment." });
  }
};

export const createReply = async (req, res, next) => {
  try {
    if (!parsePostId(req.params.commentId)) {
      return res.status(400).json({ message: "Invalid parent comment ID." });
    }

    const parentComment = await PostComment.findOne({
      _id: req.params.commentId,
      isRemoved: false,
      deletedAt: null,
    }).select("postId");

    if (!parentComment) {
      return res.status(404).json({ message: "Parent comment not found." });
    }

    req.params.id = String(parentComment.postId);
    req.body = { ...req.body, parentCommentId: req.params.commentId };
    return createComment(req, res, next);
  } catch (error) {
    return next(error);
  }
};

export const getComments = async (req, res) => {
  try {
    const post = await getActivePost(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Math.min(
      Number.isInteger(requestedLimit) && requestedLimit > 0 ? requestedLimit : 20,
      50
    );
    const cursor = decodeCommentCursor(req.query.cursor);
    const filter = { postId: post._id, isRemoved: false, deletedAt: null };
    const cursorFilter = commentCursorFilter(cursor);
    if (cursorFilter) Object.assign(filter, cursorFilter);

    const comments = await PostComment.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1);
    const hasMore = comments.length > limit;
    const data = hasMore ? comments.slice(0, limit) : comments;
    const nextCursor = hasMore ? encodeCommentCursor(data[data.length - 1]) : null;

    return res.status(200).json({ data, nextCursor, hasMore, limit });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    console.error(error);
    return res.status(500).json({ message: "Unable to fetch comments." });
  }
};

export const updateComment = async (req, res) => {
  try {
    if (!parsePostId(req.params.commentId)) {
      return res.status(400).json({ message: "Invalid comment ID." });
    }
    const content = String(req.body?.content || "").trim();
    if (!content || content.length > 2000) {
      return res.status(400).json({ message: "Comment must contain 1 to 2000 characters." });
    }

    const comment = await PostComment.findOne({ _id: req.params.commentId, isRemoved: false, deletedAt: null });
    if (!comment) return res.status(404).json({ message: "Comment not found." });
    if (String(comment.authorId) !== String(req.userid)) {
      return res.status(403).json({ message: "You can only edit your own comment." });
    }

    comment.content = content;
    await comment.save();
    return res.status(200).json({ message: "Comment updated.", data: comment });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to update comment." });
  }
};

export const deleteComment = async (req, res) => {
  try {
    if (!parsePostId(req.params.commentId)) {
      return res.status(400).json({ message: "Invalid comment ID." });
    }
    const comment = await PostComment.findOne({ _id: req.params.commentId, isRemoved: false, deletedAt: null });
    if (!comment) return res.status(404).json({ message: "Comment not found." });
    if (String(comment.authorId) !== String(req.userid)) {
      return res.status(403).json({ message: "You can only delete your own comment." });
    }

    comment.isRemoved = true;
    comment.deletedAt = new Date();
    await comment.save();
    await Post.findOneAndUpdate(
      { _id: comment.postId, commentCount: { $gt: 0 } },
      { $inc: { commentCount: -1 } }
    );

    return res.status(200).json({ message: "Comment deleted." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to delete comment." });
  }
};
