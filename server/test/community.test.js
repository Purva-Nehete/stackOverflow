import assert from "node:assert/strict";
import { describe, it } from "node:test";
import mongoose from "mongoose";
import user from "../models/auth.js";
import Post from "../models/post.js";
import PostComment from "../models/postComment.js";
import PostReport from "../models/postReport.js";
import Follow from "../models/follow.js";
import Notification from "../models/notification.js";
import { serializePublicPost } from "../services/postSerializer.js";
import rateLimit from "../middleware/rateLimit.js";

const objectId = () => new mongoose.Types.ObjectId();

const responseStub = () => {
  const headers = {};
  return {
    headers,
    statusCode: 200,
    body: null,
    setHeader(name, value) {
      headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
};

describe("community data contracts", () => {
  it("applies safe defaults and validates post content fields", async () => {
    const post = new Post({
      authorId: objectId(),
      authorName: "Ada",
      content: "A useful update #nodejs",
      media: [{ url: "https://example.com/image.webp", type: "image", width: 800, height: 600 }],
      codeSnippet: "console.log('hello')",
      codeLanguage: "javascript",
    });

    await assert.doesNotReject(() => post.validate());
    assert.equal(post.isRemoved, false);
    assert.equal(post.moderationStatus, "active");
    assert.equal(post.likeCount, 0);
    assert.equal(post.commentCount, 0);
  });

  it("rejects invalid code language and media dimensions", async () => {
    const post = new Post({
      authorId: objectId(),
      authorName: "Ada",
      content: "Update",
      codeLanguage: "javascript<script>",
      media: [{ url: "https://example.com/image.webp", width: 0, height: 600 }],
    });

    await assert.rejects(() => post.validate(), (error) => error.name === "ValidationError");
  });

  it("keeps moderation fields private in public post responses", () => {
    const post = {
      _id: objectId(),
      content: "Visible content",
      reportCount: 2,
      isRemoved: false,
      removedBy: objectId(),
      removedReason: "internal note",
      moderationStatus: "active",
      deletedAt: null,
    };

    const publicPost = serializePublicPost(post);
    assert.equal(publicPost.content, "Visible content");
    assert.equal("reportCount" in publicPost, false);
    assert.equal("removedBy" in publicPost, false);
    assert.equal("removedReason" in publicPost, false);
    assert.equal("moderationStatus" in publicPost, false);
    assert.equal("deletedAt" in publicPost, false);
  });

  it("defines unique relationship indexes for abuse-resistant actions", () => {
    const followIndexes = Follow.schema.indexes();
    const reportIndexes = PostReport.schema.indexes();
    const likeIndexes = Post.schema.indexes();

    assert.ok(followIndexes.some(([fields, options]) => fields.followerId === 1 && fields.followingId === 1 && options.unique));
    assert.ok(reportIndexes.some(([fields, options]) => fields.reporterId === 1 && fields.postId === 1 && options.unique));
    assert.ok(likeIndexes.some(([fields]) => fields.isRemoved === 1 && fields.visibility === 1));
  });
});

describe("community moderation schemas", () => {
  it("accepts supported report reasons and defaults reports to pending", async () => {
    const report = new PostReport({ reporterId: objectId(), postId: objectId(), reason: "spam" });
    await assert.doesNotReject(() => report.validate());
    assert.equal(report.status, "pending");
  });

  it("rejects unsupported report reasons", async () => {
    const report = new PostReport({ reporterId: objectId(), postId: objectId(), reason: "not-a-reason" });
    await assert.rejects(() => report.validate(), (error) => error.name === "ValidationError");
  });

  it("defaults new users and comments to safe states", async () => {
    const newUser = new user({ name: "Ada", email: "ada@example.com", password: "hashed" });
    const comment = new PostComment({ postId: objectId(), authorId: objectId(), authorName: "Ada", content: "Nice work" });

    await assert.doesNotReject(() => newUser.validate());
    await assert.doesNotReject(() => comment.validate());
    assert.equal(newUser.role, "user");
    assert.equal(newUser.suspendedUntil, null);
    assert.equal(comment.isRemoved, false);
  });

  it("supports only the documented notification types", async () => {
    const notification = new Notification({
      recipientId: objectId(),
      actorId: objectId(),
      type: "moderation",
      message: "Your post was reviewed.",
    });

    await assert.doesNotReject(() => notification.validate());
    assert.equal(notification.isRead, false);
  });
});

describe("rate limiting", () => {
  it("allows the configured request count and rejects the next request", () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 2, message: "Limit reached." });
    const request = { baseUrl: `/test-${objectId()}`, userid: String(objectId()), ip: "127.0.0.1", socket: {} };
    let nextCalls = 0;
    const next = () => { nextCalls += 1; };

    const firstResponse = responseStub();
    limiter(request, firstResponse, next);
    const secondResponse = responseStub();
    limiter(request, secondResponse, next);
    const blockedResponse = responseStub();
    limiter(request, blockedResponse, next);

    assert.equal(nextCalls, 2);
    assert.equal(blockedResponse.statusCode, 429);
    assert.equal(blockedResponse.body.message, "Limit reached.");
    assert.equal(blockedResponse.headers["Retry-After"] > 0, true);
  });
});
