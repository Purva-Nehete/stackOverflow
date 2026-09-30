import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import mongoose from "mongoose";
import { readFile } from "node:fs/promises";
import TrustedDevice from "../models/trustedDevice.js";
import { listTrustedDevices, revokeTrustedDevice } from "../controller/auth.js";

const objectId = () => new mongoose.Types.ObjectId();
const originalFind = TrustedDevice.find;
const originalFindOneAndUpdate = TrustedDevice.findOneAndUpdate;

const responseStub = () => ({
  statusCode: 200,
  body: null,
  clearedCookie: false,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
  clearCookie() {
    this.clearedCookie = true;
  },
});

afterEach(() => {
  TrustedDevice.find = originalFind;
  TrustedDevice.findOneAndUpdate = originalFindOneAndUpdate;
});

describe("session and trusted-device management", () => {
  it("returns safe trusted-device metadata scoped to the authenticated user", async () => {
    const userId = objectId();
    const deviceId = objectId();
    let query;
    TrustedDevice.find = (filter) => {
      query = filter;
      return {
        select() {
          return this;
        },
        sort() {
          return this;
        },
        lean: async () => [{
          _id: deviceId,
          tokenHash: "protected-hash",
          browser: "Chrome",
          operatingSystem: "Windows",
          deviceType: "desktop",
          createdAt: new Date("2026-01-01"),
          lastUsedAt: new Date("2026-01-02"),
          expiresAt: new Date("2026-02-01"),
        }],
      };
    };
    const response = responseStub();

    await listTrustedDevices({ userid: userId, headers: {} }, response);

    assert.equal(query.userId, userId);
    assert.equal(query.status, "active");
    assert.equal(response.body.data.length, 1);
    assert.equal("tokenHash" in response.body.data[0], false);
    assert.equal(response.body.data[0].isCurrent, false);
  });

  it("revokes only a trusted device owned by the authenticated user", async () => {
    const userId = objectId();
    const deviceId = objectId();
    let query;
    TrustedDevice.findOneAndUpdate = (filter) => {
      query = filter;
      return {
        select: async () => ({ _id: deviceId, tokenHash: "protected-hash" }),
      };
    };
    const response = responseStub();

    await revokeTrustedDevice({ userid: userId, params: { id: String(deviceId) }, headers: {} }, response);

    assert.equal(query._id, String(deviceId));
    assert.equal(query.userId, userId);
    assert.equal(query.status, "active");
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.data.id, deviceId);
  });

  it("wires session and trusted-device management into settings", async () => {
    const settings = await readFile(new URL("../../stack/src/pages/settings/index.tsx", import.meta.url), "utf8");

    assert.match(settings, /\/user\/sessions/);
    assert.match(settings, /\/user\/trusted-devices/);
    assert.match(settings, /settings\.currentSession/);
    assert.match(settings, /settings\.currentDevice/);
    assert.match(settings, /revokeSession/);
    assert.match(settings, /revokeTrustedDevice/);
  });
});
