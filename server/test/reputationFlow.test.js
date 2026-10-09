import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import mongoose from "mongoose";
import ReputationActivity from "../models/reputationActivity.js";
import ReputationTransfer from "../models/reputationTransfer.js";
import question from "../models/question.js";
import {
  getPrivilegeAvailability,
  reputationRules,
} from "../config/reputationRules.js";
import { validateTransferInput } from "../services/reputationLedger.js";

const readWorkspaceFile = async (relativePath) =>
  readFile(new URL(`../../${relativePath}`, import.meta.url), "utf8");

const objectId = () => new mongoose.Types.ObjectId();

describe("reputation reward and penalty contracts", () => {
  it("covers every configured reward and penalty event with a stable event type", () => {
    assert.deepEqual(Object.keys(reputationRules.rewards), [
      "answerPosted",
      "acceptedAnswer",
      "answerReachesFiveUpvotes",
      "questionReachesTenUpvotes",
      "completedProfile",
    ]);
    assert.deepEqual(Object.keys(reputationRules.penalties), [
      "receivedDownvote",
      "userDeletedAnswer",
      "administratorRemovedContent",
    ]);

    const rewardEventTypes = [
      reputationRules.eventTypes.answerPosted,
      reputationRules.eventTypes.acceptedAnswer,
      reputationRules.eventTypes.answerReachesFiveUpvotes,
      reputationRules.eventTypes.questionReachesTenUpvotes,
      reputationRules.eventTypes.completedProfile,
    ];
    const penaltyEventTypes = [
      reputationRules.eventTypes.receivedDownvote,
      reputationRules.eventTypes.userDeletedAnswer,
      reputationRules.eventTypes.administratorRemovedContent,
    ];

    assert.equal(new Set(rewardEventTypes).size, rewardEventTypes.length);
    assert.equal(new Set(penaltyEventTypes).size, penaltyEventTypes.length);
    assert.equal(
      new Set([...rewardEventTypes, ...penaltyEventTypes]).size,
      rewardEventTypes.length + penaltyEventTypes.length
    );
  });

  it("defines one-time threshold and profile policies", () => {
    assert.equal(reputationRules.policy.thresholdRewardsAreOneTime, true);
    assert.equal(reputationRules.policy.profileRewardIsOneTime, true);
    assert.equal(reputationRules.policy.downvotePenaltyIsPerDistinctVote, true);
    assert.equal(reputationRules.thresholds.answerUpvotes, 5);
    assert.equal(reputationRules.thresholds.questionUpvotes, 10);
  });

  it("never unlocks privileges below thresholds and unlocks each exact threshold", () => {
    const thresholds = Object.values(reputationRules.privileges);
    const names = Object.keys(reputationRules.privileges);

    for (let index = 0; index < thresholds.length; index += 1) {
      const below = getPrivilegeAvailability(thresholds[index] - 1);
      const at = getPrivilegeAvailability(thresholds[index]);
      assert.equal(at[names[index]], true);
      assert.equal(below[names[index]], false);
    }
  });
});

describe("reputation transfer validation contracts", () => {
  it("rejects all configured invalid transfer boundaries", () => {
    const senderId = objectId();
    const receiverId = objectId();

    for (const amount of [0, -1, 51, 100]) {
      assert.throws(
        () => validateTransferInput({ senderId, receiverId, amount, reason: "Reason" }),
        /outside the allowed range/
      );
    }
    assert.throws(
      () => validateTransferInput({ senderId, receiverId, amount: 1, reason: " ".repeat(1) }),
      /reason is required/
    );
    assert.throws(
      () =>
        validateTransferInput({
          senderId,
          receiverId,
          amount: 1,
          reason: "x".repeat(501),
        }),
      /reason is too long/
    );
    assert.throws(
      () =>
        validateTransferInput({
          senderId,
          receiverId: senderId,
          amount: 1,
          reason: "Self",
        }),
      /different users/
    );
  });

  it("keeps transfer history scoped to both sender and receiver indexes", () => {
    const indexes = ReputationTransfer.schema.indexes();
    assert.ok(indexes.some(([fields]) => fields.senderId === 1 && fields.createdAt === -1));
    assert.ok(indexes.some(([fields]) => fields.receiverId === 1 && fields.createdAt === -1));
    assert.equal(ReputationTransfer.schema.path("reason").options.maxlength, 500);
  });

  it("keeps activity history immutable and queryable by user and event", () => {
    const indexes = ReputationActivity.schema.indexes();
    assert.ok(indexes.some(([fields]) => fields.userId === 1 && fields.createdAt === -1));
    assert.ok(indexes.some(([fields]) => fields.eventType === 1 && fields.createdAt === -1));
    assert.equal(ReputationActivity.schema.path("eventKey").options.unique, true);
    assert.equal(ReputationActivity.schema.path("balanceAfter").options.min, 0);
  });
});

describe("reputation integration contracts", () => {
  it("persists answer vote and accepted-answer state in question data", async () => {
    const answer = {
      answerbody: "Answer",
      useranswered: "Ada",
      userid: String(objectId()),
      upvote: [String(objectId())],
      downvote: [],
      isAccepted: true,
    };
    const questionDocument = new question({
      questiontitle: "Question",
      questionbody: "Body",
      questiontags: ["node"],
      userid: String(objectId()),
      acceptedAnswerId: new mongoose.Types.ObjectId(),
      answer: [answer],
    });

    await assert.doesNotReject(() => questionDocument.validate());
    assert.equal(questionDocument.answer[0].isAccepted, true);
    assert.equal(questionDocument.answer[0].upvote.length, 1);
    assert.notEqual(questionDocument.acceptedAnswerId, null);
  });

  it("wires backend reputation APIs and frontend history/transfer surfaces", async () => {
    const authRoutes = await readWorkspaceFile("server/routes/auth.js");
    const reputationController = await readWorkspaceFile("server/controller/reputation.js");
    const profilePage = await readWorkspaceFile("stack/src/pages/users/[id]/index.tsx");
    const settingsPage = await readWorkspaceFile("stack/src/pages/settings/index.tsx");

    for (const route of [
      '"/reputation"',
      '"/reputation/activity"',
      '"/reputation/transfers"',
      '"/reputation/transfers/allowance"',
      '"/reputation/transfers/recipients"',
      '"/profiles/:userId/reputation"',
      '"/profiles/:userId/reputation/activity"',
    ]) {
      assert.match(authRoutes, new RegExp(`router\\.(get|post)\\(${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    }

    assert.match(reputationController, /listReputationActivity/);
    assert.match(reputationController, /listReputationTransfers/);
    assert.match(reputationController, /createReputationTransfer/);
    assert.match(profilePage, /reputation/);
    assert.match(profilePage, /reputation\/activity/);
    assert.match(settingsPage, /reputation\/transfers/);
    assert.match(settingsPage, /submitTransfer/);
    assert.match(settingsPage, /loadMoreActivity/);
    assert.match(settingsPage, /loadMoreTransfers/);
  });
});
