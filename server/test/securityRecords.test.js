import assert from "node:assert/strict";
import { describe, it } from "node:test";
import mongoose from "mongoose";
import LoginActivity from "../models/loginActivity.js";
import Session from "../models/session.js";
import TrustedDevice from "../models/trustedDevice.js";
import { createSecurityToken, hashSecurityToken } from "../services/securityToken.js";

const objectId = () => new mongoose.Types.ObjectId();

const requiredDeviceFields = {
  userId: objectId(),
  browser: "Chrome",
  operatingSystem: "Windows",
  deviceType: "desktop",
};

describe("security records", () => {
  it("stores login activity fields and defaults unavailable location to null", async () => {
    const activity = new LoginActivity({
      ...requiredDeviceFields,
      outcome: "success",
      ipAddress: "203.0.113.10",
      userAgent: "Mozilla/5.0",
    });

    await assert.doesNotReject(() => activity.validate());
    assert.equal(activity.location, null);
    assert.equal(activity.isNewDevice, false);
    assert.ok(activity.loggedInAt instanceof Date);
  });

  it("supports session and trusted-device lifecycle fields", async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    const session = new Session({
      ...requiredDeviceFields,
      tokenHash: "session-hash",
      expiresAt,
    });
    const trustedDevice = new TrustedDevice({
      ...requiredDeviceFields,
      tokenHash: "device-hash",
      expiresAt,
    });

    await assert.doesNotReject(() => session.validate());
    await assert.doesNotReject(() => trustedDevice.validate());
    assert.equal(session.status, "active");
    assert.equal(trustedDevice.status, "active");
  });

  it("protects token hashes and defines lookup and expiry indexes", () => {
    for (const schema of [Session.schema, TrustedDevice.schema]) {
      assert.equal(schema.path("tokenHash").options.select, false);
      assert.ok(schema.indexes().some(([fields]) => fields.expiresAt === 1));
      assert.ok(schema.indexes().some(([fields]) => fields.userId === 1 && fields.status === 1));
    }

    assert.equal(LoginActivity.schema.path("ipAddress").options.select, false);
    assert.equal(LoginActivity.schema.path("userAgent").options.select, false);
    assert.ok(LoginActivity.schema.indexes().some(([fields]) => fields.userId === 1 && fields.loggedInAt === -1));
  });

  it("generates random tokens and stores only their deterministic hash", () => {
    const first = createSecurityToken();
    const second = createSecurityToken();

    assert.notEqual(first.token, second.token);
    assert.equal(first.tokenHash, hashSecurityToken(first.token));
    assert.notEqual(first.tokenHash, first.token);
  });
});
