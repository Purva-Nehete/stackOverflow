import "dotenv/config";
import mongoose from "mongoose";
import user from "../models/auth.js";
import Post from "../models/post.js";

const isRollback = process.argv.includes("--rollback");
const databaseUrl = process.env.MONGODB_URL;

if (!databaseUrl) {
  throw new Error("MONGODB_URL must be set before running the community backfill.");
}

const run = async () => {
  await mongoose.connect(databaseUrl, { serverSelectionTimeoutMS: 5000 });

  if (isRollback) {
    await user.updateMany(
      {},
      {
        $unset: {
          role: "",
          suspendedUntil: "",
          suspensionReason: "",
          followersCount: "",
          followingCount: "",
        },
      }
    );
    await Post.updateMany(
      {},
      {
        $unset: {
          isRemoved: "",
          removedBy: "",
          removedReason: "",
          moderationStatus: "",
          visibility: "",
          reportCount: "",
          engagementScore: "",
        },
      }
    );
    console.log("Community defaults rollback completed.");
    return;
  }

  const userUpdates = await Promise.all([
    user.updateMany({ role: { $exists: false } }, { $set: { role: "user" } }),
    user.updateMany({ suspendedUntil: { $exists: false } }, { $set: { suspendedUntil: null } }),
    user.updateMany({ suspensionReason: { $exists: false } }, { $set: { suspensionReason: "" } }),
    user.updateMany({ followersCount: { $exists: false } }, { $set: { followersCount: 0 } }),
    user.updateMany({ followingCount: { $exists: false } }, { $set: { followingCount: 0 } }),
  ]);
  const postUpdates = await Promise.all([
    Post.updateMany({ isRemoved: { $exists: false } }, { $set: { isRemoved: false } }),
    Post.updateMany({ removedBy: { $exists: false } }, { $set: { removedBy: null } }),
    Post.updateMany({ removedReason: { $exists: false } }, { $set: { removedReason: "" } }),
    Post.updateMany({ moderationStatus: { $exists: false } }, { $set: { moderationStatus: "active" } }),
    Post.updateMany({ visibility: { $exists: false } }, { $set: { visibility: "public" } }),
    Post.updateMany({ reportCount: { $exists: false } }, { $set: { reportCount: 0 } }),
    Post.updateMany({ engagementScore: { $exists: false } }, { $set: { engagementScore: 0 } }),
  ]);

  console.log(
    `Community defaults backfilled. User fields updated: ${userUpdates.length}; post fields updated: ${postUpdates.length}.`
  );
};

run()
  .catch((error) => {
    console.error("Community backfill failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
