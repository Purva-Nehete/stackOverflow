import mongoose from "mongoose";
import Post from "../models/post.js";
import user from "../models/auth.js";
import Follow from "../models/follow.js";

const extractHashtags = (text = "") => {
  const matches = text.match(/#[\w-]+/g) || [];
  const normalized = matches
    .map((tag) => tag.replace(/^#/, "").trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(normalized)].slice(0, 20);
};

const isSafeMediaUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const isSafeStorageKey = (value) =>
  !value || /^[a-zA-Z0-9/_ .-]+$/.test(value);

const MAX_FEED_LIMIT = 50;

const encodeCursor = (post, sort) => {
  const cursor = {
    id: String(post._id),
    createdAt: post.createdAt.toISOString(),
  };

  if (sort === "trending") {
    cursor.engagementScore = post.engagementScore;
  }

  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
};

const decodeCursor = (value, sort) => {
  if (!value) return null;

  try {
    const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
      throw new Error("Invalid cursor ID");
    }

    const createdAt = new Date(decoded.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      throw new Error("Invalid cursor date");
    }

    if (sort === "trending" && !Number.isFinite(decoded.engagementScore)) {
      throw new Error("Invalid cursor score");
    }

    return {
      id: new mongoose.Types.ObjectId(decoded.id),
      createdAt,
      engagementScore: decoded.engagementScore,
    };
  } catch {
    const error = new Error("Invalid pagination cursor");
    error.statusCode = 400;
    throw error;
  }
};

const getCursorFilter = (cursor, sort) => {
  if (!cursor) return null;

  if (sort === "trending") {
    return {
      $or: [
        { engagementScore: { $lt: cursor.engagementScore } },
        {
          engagementScore: cursor.engagementScore,
          createdAt: { $lt: cursor.createdAt },
        },
        {
          engagementScore: cursor.engagementScore,
          createdAt: cursor.createdAt,
          _id: { $lt: cursor.id },
        },
      ],
    };
  }

  return {
    $or: [
      { createdAt: { $lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
    ],
  };
};

const getValidationError = ({
  content,
  media,
  codeSnippet,
  codeLanguage,
  postType,
  visibility,
}) => {
  const trimmedContent = String(content || "").trim();
  const trimmedCode = String(codeSnippet || "").trim();
  const mediaList = Array.isArray(media) ? media : [];

  if (!trimmedContent && !trimmedCode && mediaList.length === 0) {
    return "Post content, code snippet, or media is required.";
  }

  if (trimmedContent.length > 5000) {
    return "Post content cannot exceed 5000 characters.";
  }

  if (trimmedCode.length > 5000) {
    return "Code snippet cannot exceed 5000 characters.";
  }

  if (mediaList.length > 5) {
    return "A post can contain at most 5 media items.";
  }

  for (const mediaItem of mediaList) {
    if (!mediaItem || typeof mediaItem !== "object") {
      return "Each media item must be an object.";
    }

    if (mediaItem.type !== undefined && mediaItem.type !== "image") {
      return "Only image media is supported.";
    }

    if (typeof mediaItem.url !== "string" || !isSafeMediaUrl(mediaItem.url)) {
      return "Each image must use a valid HTTP or HTTPS URL.";
    }

    if (!isSafeStorageKey(mediaItem.storageKey)) {
      return "Invalid media storage key.";
    }

    for (const dimension of ["width", "height"]) {
      if (
        mediaItem[dimension] !== undefined &&
        mediaItem[dimension] !== null &&
        (!Number.isInteger(mediaItem[dimension]) ||
          mediaItem[dimension] < 1 ||
          mediaItem[dimension] > 10000)
      ) {
        return `Media ${dimension} must be an integer between 1 and 10000.`;
      }
    }
  }

  if (!["update", "showcase", "achievement"].includes(postType || "update")) {
    return "Invalid post type.";
  }

  if (visibility && !["public", "followers"].includes(visibility)) {
    return "Invalid visibility value.";
  }

  if (
    codeLanguage !== undefined &&
    !/^[a-zA-Z0-9+#.-]{1,50}$/.test(String(codeLanguage))
  ) {
    return "Invalid code language.";
  }

  return null;
};

export const createPost = async (req, res) => {
  try {
    const { content = "", postType = "update", media = [], codeSnippet = "", codeLanguage = "javascript", visibility = "public" } = req.body || {};

    const validationError = getValidationError({
      content,
      media,
      codeSnippet,
      codeLanguage,
      postType,
      visibility,
    });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existingUser = await user.findById(req.userid).select("name");
    if (!existingUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const hashtags = extractHashtags(String(content || ""));

    const newPost = await Post.create({
      authorId: req.userid,
      authorName: existingUser.name,
      content: String(content || "").trim(),
      postType,
      media: Array.isArray(media) ? media : [],
      codeSnippet: String(codeSnippet || "").trim(),
      codeLanguage,
      hashtags,
      visibility,
      isRemoved: false,
      moderationStatus: "active",
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      bookmarkCount: 0,
      reportCount: 0,
      engagementScore: 0,
    });

    return res.status(201).json({
      message: "Post created successfully.",
      data: newPost,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong while creating the post." });
  }
};

export const getFeed = async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Math.min(
      Number.isInteger(requestedLimit) && requestedLimit > 0 ? requestedLimit : 20,
      MAX_FEED_LIMIT
    );
    const sort = req.query.sort || "recent";
    const feed = req.query.feed || "public";

    if (!["recent", "trending"].includes(sort)) {
      return res.status(400).json({ message: "sort must be recent or trending" });
    }

    if (!["public", "following"].includes(feed)) {
      return res.status(400).json({ message: "feed must be public or following" });
    }

    if (feed === "following" && !req.userid) {
      return res.status(401).json({ message: "Authentication required for following feed." });
    }

    const cursor = decodeCursor(req.query.cursor, sort);

    const filter = {
      isRemoved: false,
      deletedAt: null,
    };

    if (feed === "public") {
      filter.visibility = "public";
    } else {
      const followedUsers = await Follow.find({ followerId: req.userid }).distinct("followingId");
      filter.authorId = { $in: [req.userid, ...followedUsers] };
      filter.visibility = { $in: ["public", "followers"] };
    }

    if (req.query.authorId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.authorId)) {
        return res.status(400).json({ message: "Invalid author ID." });
      }
      filter.authorId = req.query.authorId;
    }

    if (req.query.tag) {
      const tag = String(req.query.tag).replace(/^#/, "").trim().toLowerCase();
      if (!/^[\w-]{1,50}$/.test(tag)) {
        return res.status(400).json({ message: "Invalid hashtag." });
      }
      filter.hashtags = tag;
    }

    const cursorFilter = getCursorFilter(cursor, sort);
    if (cursorFilter) {
      Object.assign(filter, cursorFilter);
    }

    const sortOrder =
      sort === "trending"
        ? { engagementScore: -1, createdAt: -1, _id: -1 }
        : { createdAt: -1, _id: -1 };

    const posts = await Post.find(filter)
      .sort(sortOrder)
      .limit(limit + 1);

    const hasMore = posts.length > limit;
    const data = hasMore ? posts.slice(0, limit) : posts;

    return res.status(200).json({
      data,
      nextCursor: hasMore ? encodeCursor(data[data.length - 1], sort) : null,
      hasMore,
      pagination: {
        limit,
        sort,
        feed,
        hasMore,
        nextCursor: hasMore ? encodeCursor(data[data.length - 1], sort) : null,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: "Unable to fetch posts." });
  }
};

export const getAllPosts = getFeed;

export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid post ID." });
    }

    const post = await Post.findById(id);
    if (!post || post.isRemoved || post.deletedAt) {
      return res.status(404).json({ message: "Post not found." });
    }

    return res.status(200).json({ data: post });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to fetch post." });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid post ID." });
    }

    const post = await Post.findById(id);
    if (!post || post.isRemoved || post.deletedAt) {
      return res.status(404).json({ message: "Post not found." });
    }

    if (String(post.authorId) !== String(req.userid)) {
      return res.status(403).json({ message: "You can only edit your own post." });
    }

    const { content, postType, media, codeSnippet, codeLanguage, visibility } = req.body || {};
    const validationError = getValidationError({
      content: content ?? post.content,
      media: media ?? post.media,
      codeSnippet: codeSnippet ?? post.codeSnippet,
      codeLanguage: codeLanguage ?? post.codeLanguage,
      postType: postType ?? post.postType,
      visibility: visibility ?? post.visibility,
    });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const updatedFields = {
      ...(content !== undefined ? { content: String(content).trim() } : {}),
      ...(postType !== undefined ? { postType } : {}),
      ...(media !== undefined ? { media: Array.isArray(media) ? media : [] } : {}),
      ...(codeSnippet !== undefined ? { codeSnippet: String(codeSnippet).trim() } : {}),
      ...(codeLanguage !== undefined ? { codeLanguage } : {}),
      ...(visibility !== undefined ? { visibility } : {}),
      hashtags: content !== undefined ? extractHashtags(String(content)) : post.hashtags,
    };

    const updatedPost = await Post.findByIdAndUpdate(id, updatedFields, { new: true });

    return res.status(200).json({
      message: "Post updated successfully.",
      data: updatedPost,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to update post." });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid post ID." });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    if (String(post.authorId) !== String(req.userid)) {
      return res.status(403).json({ message: "You can only delete your own post." });
    }

    post.isRemoved = true;
    post.deletedAt = new Date();
    post.moderationStatus = "removed";
    await post.save();

    return res.status(200).json({
      message: "Post deleted successfully.",
      data: post,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to delete post." });
  }
};
