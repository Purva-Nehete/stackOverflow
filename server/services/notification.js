import mongoose from "mongoose";
import Notification from "../models/notification.js";
import user from "../models/auth.js";

const isValidId = (value) => mongoose.Types.ObjectId.isValid(value);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createNotification = async ({
  recipientId,
  actorId,
  type,
  postId = null,
  commentId = null,
  message,
}) => {
  if (!isValidId(recipientId) || !isValidId(actorId) || String(recipientId) === String(actorId)) {
    return null;
  }

  return Notification.create({
    recipientId,
    actorId,
    type,
    postId,
    commentId,
    message,
  });
};

export const notifyMentionedUsers = async ({
  content,
  actorId,
  postId = null,
  commentId = null,
}) => {
  const mentionedNames = [
    ...new Set(
      String(content || "")
        .match(/@[a-zA-Z0-9_.-]+/g)
        ?.map((mention) => mention.slice(1).toLowerCase()) || []
    ),
  ];

  if (!mentionedNames.length) return [];

  const mentionedUsers = await user.find({
    name: {
      $in: mentionedNames.map((name) => new RegExp(`^${escapeRegExp(name)}$`, "i")),
    },
  }).select("_id name");

  return Promise.all(
    mentionedUsers.map((mentionedUser) =>
      createNotification({
        recipientId: mentionedUser._id,
        actorId,
        type: "mention",
        postId,
        commentId,
        message: "You were mentioned in a community post.",
      })
    )
  );
};
