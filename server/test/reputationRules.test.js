import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPrivilegeAvailability,
  getReputationRules,
  reputationRules,
} from "../config/reputationRules.js";

describe("reputation rules", () => {
  it("defines the requested rewards, penalties, thresholds, and transfer limits", () => {
    assert.deepEqual(reputationRules.rewards, {
      answerPosted: 5,
      acceptedAnswer: 10,
      answerReachesFiveUpvotes: 5,
      questionReachesTenUpvotes: 2,
      completedProfile: 10,
    });
    assert.deepEqual(reputationRules.penalties, {
      receivedDownvote: 2,
      userDeletedAnswer: 5,
      administratorRemovedContent: 10,
    });
    assert.deepEqual(reputationRules.thresholds, {
      answerUpvotes: 5,
      questionUpvotes: 10,
    });
    assert.deepEqual(reputationRules.privileges, {
      unrestrictedCommenting: 50,
      editCommunityPosts: 100,
      voteToCloseQuestions: 250,
      reportInappropriateContent: 500,
    });
    assert.deepEqual(reputationRules.transfers, {
      minimumReputationExclusive: 50,
      maximumPerTransaction: 50,
      maximumPerUtcDay: 100,
      minimumAmount: 1,
      reasonMaximumLength: 500,
    });
  });

  it("uses immutable rules and exposes the same authoritative object", () => {
    assert.equal(getReputationRules(), reputationRules);
    assert.equal(Object.isFrozen(reputationRules), true);
    assert.equal(Object.isFrozen(reputationRules.rewards), true);
    assert.equal(Object.isFrozen(reputationRules.transfers), true);
    assert.equal(reputationRules.balance.minimum, 0);
    assert.equal(reputationRules.policy.dailyTransferWindow, "UTC calendar day");
  });

  it("makes threshold privileges available only at or above each threshold", () => {
    assert.deepEqual(getPrivilegeAvailability(49), {
      unrestrictedCommenting: false,
      editCommunityPosts: false,
      voteToCloseQuestions: false,
      reportInappropriateContent: false,
    });
    assert.deepEqual(getPrivilegeAvailability(100), {
      unrestrictedCommenting: true,
      editCommunityPosts: true,
      voteToCloseQuestions: false,
      reportInappropriateContent: false,
    });
    assert.deepEqual(getPrivilegeAvailability(500), {
      unrestrictedCommenting: true,
      editCommunityPosts: true,
      voteToCloseQuestions: true,
      reportInappropriateContent: true,
    });
    assert.deepEqual(getPrivilegeAvailability(null), {
      unrestrictedCommenting: false,
      editCommunityPosts: false,
      voteToCloseQuestions: false,
      reportInappropriateContent: false,
    });
  });
});
