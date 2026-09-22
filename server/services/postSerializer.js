const toPlainObject = (post) =>
  typeof post?.toObject === "function" ? post.toObject() : { ...post };

export const serializePublicPost = (post) => {
  const serialized = toPlainObject(post);

  delete serialized.isRemoved;
  delete serialized.removedBy;
  delete serialized.removedReason;
  delete serialized.moderationStatus;
  delete serialized.deletedAt;
  delete serialized.reportCount;

  return serialized;
};
