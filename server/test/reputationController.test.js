import assert from "node:assert/strict";
import { describe, it } from "node:test";
import mongoose from "mongoose";
import ReputationTransfer from "../models/reputationTransfer.js";
import ReputationActivity from "../models/reputationActivity.js";
import {
  listReputationActivity,
  listReputationTransfers,
  transferReputation,
} from "../controller/reputation.js";

const objectId = () => new mongoose.Types.ObjectId();
const responseStub = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

describe("reputation endpoints", () => {
  it("rejects invalid transfer input without database work", async () => {
    const response = responseStub();
    await transferReputation(
      {
        userid: objectId(),
        body: { receiverId: objectId(), amount: 51, reason: "Too many points" },
      },
      response
    );
    assert.equal(response.statusCode, 400);
    assert.match(response.body.message, /outside the allowed range/);
  });

  it("returns only transfers involving the authenticated user", async () => {
    const originalFind = ReputationTransfer.find;
    const currentUserId = objectId();
    const otherUserId = objectId();
    const transfer = {
      _id: objectId(),
      senderId: currentUserId,
      receiverId: otherUserId,
      amount: 10,
      reason: "Thanks",
      status: "completed",
      createdAt: new Date(),
      completedAt: new Date(),
    };
    ReputationTransfer.find = (filter) => {
      assert.equal(filter.$or.length, 2);
      return {
        sort: () => ({
          skip: () => ({
            limit: () => ({
            lean: async () => [transfer],
            }),
          }),
        }),
      };
    };

    try {
      const response = responseStub();
      await listReputationTransfers({ userid: currentUserId, query: { limit: "10" } }, response);
      assert.equal(response.statusCode, 200);
      assert.equal(response.body.data.length, 1);
      assert.equal(String(response.body.data[0].senderId), String(currentUserId));
    } finally {
      ReputationTransfer.find = originalFind;
    }
  });

  it("returns authenticated activity history with a bounded limit", async () => {
    const originalActivityFind = ReputationActivity.find;
    const currentUserId = objectId();
    ReputationActivity.find = (filter) => {
      assert.equal(String(filter.userId), String(currentUserId));
      return {
        sort: () => ({
          skip: () => ({
            limit: (limit) => {
            assert.equal(limit, 51);
            return { lean: async () => [] };
            },
          }),
        }),
      };
    };

    try {
      const response = responseStub();
      await listReputationActivity({ userid: currentUserId, query: { limit: "999" } }, response);
      assert.equal(response.statusCode, 200);
      assert.deepEqual(response.body.data, []);
    } finally {
      ReputationActivity.find = originalActivityFind;
    }
  });
});
