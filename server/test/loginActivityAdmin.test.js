import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { afterEach, describe, it } from "node:test";
import mongoose from "mongoose";
import user from "../models/auth.js";
import LoginActivity from "../models/loginActivity.js";
import requireAdmin from "../middleware/requireAdmin.js";
import { listLoginActivity } from "../controller/loginActivity.js";

const objectId = () => new mongoose.Types.ObjectId();
const originalFindById = user.findById;
const originalFind = LoginActivity.find;

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

afterEach(() => {
  user.findById = originalFindById;
  LoginActivity.find = originalFind;
});

describe("administrator login activity monitoring", () => {
  it("allows administrators and rejects moderators", async () => {
    const response = responseStub();
    user.findById = () => ({ select: async () => ({ role: "moderator" }) });
    let nextCalled = false;

    await requireAdmin({ userid: objectId() }, response, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(response.statusCode, 403);

    user.findById = () => ({ select: async () => ({ role: "admin" }) });
    await requireAdmin({ userid: objectId() }, response, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
  });

  it("validates filters before querying login activity", async () => {
    const response = responseStub();

    await listLoginActivity({ query: { outcome: "not-valid" } }, response);

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.message, "Invalid login outcome.");
  });

  it("returns safe filtered activity with pagination metadata", async () => {
    const userId = objectId();
    const activityId = objectId();
    let query;
    LoginActivity.find = (filter) => {
      query = filter;
      return {
        select() {
          return this;
        },
        sort() {
          return this;
        },
        limit() {
          return this;
        },
        populate() {
          return this;
        },
        lean: async () => [{
          _id: activityId,
          userId: { _id: userId, name: "Ada", email: "ada@example.com" },
          outcome: "success",
          isNewDevice: true,
          browser: "Chrome",
          operatingSystem: "Windows",
          deviceType: "desktop",
          ipAddress: "203.0.113.10",
          userAgent: "private-agent",
          location: null,
          loggedInAt: new Date("2026-01-01"),
        }],
      };
    };
    const response = responseStub();

    await listLoginActivity({ query: { outcome: "success", deviceType: "desktop", limit: "10" } }, response);

    assert.equal(query.outcome, "success");
    assert.equal(query.deviceType, "desktop");
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.data.length, 1);
    assert.equal("userAgent" in response.body.data[0], false);
    assert.equal(response.body.hasMore, false);
    assert.equal(response.body.nextCursor, null);
  });

  it("contains the admin dashboard and monitoring filters", async () => {
    const dashboard = await readFile(new URL("../../stack/src/pages/admin/login-activity.tsx", import.meta.url), "utf8");

    assert.match(dashboard, /\/moderation\/login-activity/);
    assert.match(dashboard, /loadMore/);
    assert.match(dashboard, /userId/);
    assert.match(dashboard, /deviceType/);
    assert.match(dashboard, /ipAddress/);
  });
});
