import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import mongoose from "mongoose";
import user from "../models/auth.js";
import requireReputationPrivilege from "../middleware/requireReputationPrivilege.js";

const objectId = () => new mongoose.Types.ObjectId();
const originalFindById = user.findById;

afterEach(() => {
  user.findById = originalFindById;
});

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

describe("reputation privilege middleware", () => {
  it("allows a user at the exact threshold", async () => {
    user.findById = () => ({
      select: async () => ({ reputationBalance: 100 }),
    });
    const response = responseStub();
    let nextCalled = false;

    await requireReputationPrivilege("editCommunityPosts")(
      { userid: objectId() },
      response,
      () => {
        nextCalled = true;
      }
    );

    assert.equal(nextCalled, true);
    assert.equal(response.statusCode, 200);
  });

  it("rejects a user below the required threshold", async () => {
    user.findById = () => ({
      select: async () => ({ reputationBalance: 49 }),
    });
    const response = responseStub();
    let nextCalled = false;

    await requireReputationPrivilege("unrestrictedCommenting")(
      { userid: objectId() },
      response,
      () => {
        nextCalled = true;
      }
    );

    assert.equal(nextCalled, false);
    assert.equal(response.statusCode, 403);
    assert.equal(response.body.requiredReputation, 50);
  });

  it("rejects unknown privileges explicitly", async () => {
    const response = responseStub();
    await requireReputationPrivilege("unknown")({ userid: objectId() }, response, () => {});
    assert.equal(response.statusCode, 500);
  });
});
