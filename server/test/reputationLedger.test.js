import assert from "node:assert/strict";
import { describe, it } from "node:test";
import mongoose from "mongoose";
import user from "../models/auth.js";
import ReputationActivity from "../models/reputationActivity.js";
import ReputationTransfer from "../models/reputationTransfer.js";
import {
  getUtcDayRange,
  validateTransferInput,
} from "../services/reputationLedger.js";

const objectId = () => new mongoose.Types.ObjectId();

describe("reputation ledger data contracts", () => {
  it("defaults user reputation to zero and exposes the balance constraint", () => {
    const newUser = new user({
      name: "Ada",
      email: "ada@example.com",
      password: "hashed",
    });

    assert.equal(newUser.reputationBalance, 0);
    assert.equal(user.schema.path("reputationBalance").options.min, 0);
    assert.equal(user.schema.path("reputationBalance").options.index, true);
  });

  it("requires immutable activity event data and a unique event key", () => {
    const activity = new ReputationActivity({
      userId: objectId(),
      amount: 5,
      balanceAfter: 5,
      eventType: "answer_posted",
      eventKey: "answer:123:posted",
    });

    assert.equal(activity.userId != null, true);
    assert.equal(ReputationActivity.schema.path("eventKey").options.unique, true);
    assert.equal(ReputationActivity.schema.path("amount").options.immutable, true);
    assert.equal(ReputationActivity.schema.path("userId").options.immutable, true);
  });

  it("validates transfer participants, amount, and reason", async () => {
    const transfer = new ReputationTransfer({
      senderId: objectId(),
      receiverId: objectId(),
      amount: 25,
      reason: "Helpful contribution",
    });

    await assert.doesNotReject(() => transfer.validate());
    await assert.rejects(
      () =>
        new ReputationTransfer({
          senderId: transfer.senderId,
          receiverId: transfer.senderId,
          amount: 25,
          reason: "Self transfer",
        }).validate(),
      (error) => error.name === "ValidationError"
    );
  });

  it("rejects invalid transfer input before database work", () => {
    assert.throws(
      () =>
        validateTransferInput({
          senderId: objectId(),
          receiverId: objectId(),
          amount: 51,
          reason: "Too many points",
        }),
      /outside the allowed range/
    );
    assert.throws(
      () =>
        validateTransferInput({
          senderId: objectId(),
          receiverId: objectId(),
          amount: 10,
          reason: "",
        }),
      /reason is required/
    );
  });

  it("calculates daily transfer windows using UTC boundaries", () => {
    const { start, end } = getUtcDayRange(new Date("2026-10-04T20:51:00+05:30"));
    assert.equal(start.toISOString(), "2026-10-04T00:00:00.000Z");
    assert.equal(end.toISOString(), "2026-10-05T00:00:00.000Z");
  });
});
