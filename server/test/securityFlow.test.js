import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { readFile } from "node:fs/promises";
import user from "../models/auth.js";
import LoginActivity from "../models/loginActivity.js";
import LoginChallenge from "../models/loginChallenge.js";
import Session from "../models/session.js";
import TrustedDevice from "../models/trustedDevice.js";
import { listSessions, revokeSession } from "../controller/auth.js";
import {
  createLoginChallenge,
  findTrustedDevice,
  verifyLoginChallenge,
} from "../services/loginSecurity.js";

process.env.JWT_SECRET ||= "test-secret";

const objectId = () => new mongoose.Types.ObjectId();
const originals = {
  challengeFindOne: LoginChallenge.findOne,
  challengeCreate: LoginChallenge.create,
  challengeDeleteOne: LoginChallenge.deleteOne,
  trustedFindOne: TrustedDevice.findOne,
  trustedCreate: TrustedDevice.create,
  userFindById: user.findById,
  sessionCreate: Session.create,
  sessionFind: Session.find,
  sessionFindOneAndUpdate: Session.findOneAndUpdate,
  activityCreate: LoginActivity.create,
};

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
  cookieValue: null,
  cookie(name, value) {
    this.cookieValue = { name, value };
  },
  clearCookie() {},
});

afterEach(() => {
  LoginChallenge.findOne = originals.challengeFindOne;
  LoginChallenge.create = originals.challengeCreate;
  LoginChallenge.deleteOne = originals.challengeDeleteOne;
  TrustedDevice.findOne = originals.trustedFindOne;
  TrustedDevice.create = originals.trustedCreate;
  user.findById = originals.userFindById;
  Session.create = originals.sessionCreate;
  Session.find = originals.sessionFind;
  Session.findOneAndUpdate = originals.sessionFindOneAndUpdate;
  LoginActivity.create = originals.activityCreate;
});

describe("complete security flow", () => {
  it("recognizes only an active, unexpired trusted device", async () => {
    let filter;
    const trustedDevice = { _id: objectId(), status: "active" };
    TrustedDevice.findOne = (query) => {
      filter = query;
      return { select: async () => trustedDevice };
    };

    const result = await findTrustedDevice({ userId: objectId(), token: "trusted-token" });

    assert.equal(result, trustedDevice);
    assert.equal(filter.status, "active");
    assert.ok(filter.expiresAt.$gt instanceof Date);
    assert.equal(typeof filter.tokenHash, "string");
  });

  it("removes an undeliverable login challenge without issuing a session", async () => {
    const userId = objectId();
    let created = false;
    let deleted = false;
    LoginChallenge.findOne = () => ({ sort: async () => null });
    LoginChallenge.create = async () => {
      created = true;
      return {};
    };
    LoginChallenge.deleteOne = async () => {
      deleted = true;
    };

    const result = await createLoginChallenge({
      userDocument: { _id: userId, email: "ada@example.com" },
      device: {
        browser: "Chrome",
        operatingSystem: "Windows",
        deviceType: "desktop",
      },
    });

    assert.equal(created, true);
    assert.equal(deleted, true);
    assert.equal(result.unavailable, true);
    assert.equal("token" in result, false);
  });

  it("verifies an OTP once, creates protected records, and sets a trusted cookie", async () => {
    const userId = objectId();
    const challenge = {
      userId,
      browser: "Chrome",
      operatingSystem: "Windows",
      deviceType: "desktop",
      otpHash: await bcrypt.hash("123456", 4),
      attempts: 0,
      status: "pending",
      save: async function save() {
        return this;
      },
    };
    let sessionData;
    LoginChallenge.findOne = () => ({ select: async () => challenge });
    TrustedDevice.create = async (data) => ({ _id: objectId(), ...data });
    user.findById = async () => ({
      _id: userId,
      email: "ada@example.com",
      name: "Ada",
      toObject: () => ({ _id: userId, email: "ada@example.com", name: "Ada" }),
    });
    Session.create = async (data) => {
      sessionData = data;
      return data;
    };
    LoginActivity.create = async (data) => data;
    const response = responseStub();

    const result = await verifyLoginChallenge({
      challengeToken: "challenge-token",
      otp: "123456",
      device: {
        browser: "Chrome",
        operatingSystem: "Windows",
        deviceType: "desktop",
        ipAddress: "203.0.113.10",
        userAgent: "test-agent",
      },
      res: response,
    });

    assert.equal(challenge.status, "verified");
    assert.equal(typeof result.token, "string");
    assert.equal(response.cookieValue.name, "trusted_device");
    assert.equal(typeof sessionData.tokenHash, "string");
    assert.equal("token" in sessionData, false);
  });

  it("rejects expired, invalid, exhausted, and replayed login OTPs", async () => {
    LoginChallenge.findOne = () => ({ select: async () => null });
    const expiredResult = await verifyLoginChallenge({
      challengeToken: "expired",
      otp: "123456",
      device: { browser: "Chrome", operatingSystem: "Windows", deviceType: "desktop" },
      res: responseStub(),
    });
    assert.equal(expiredResult.error, "invalid");

    const exhaustedChallenge = {
      browser: "Chrome",
      operatingSystem: "Windows",
      deviceType: "desktop",
      otpHash: await bcrypt.hash("123456", 4),
      attempts: 4,
      status: "pending",
      save: async function save() {
        return this;
      },
    };
    LoginChallenge.findOne = () => ({ select: async () => exhaustedChallenge });
    const invalidResult = await verifyLoginChallenge({
      challengeToken: "invalid",
      otp: "000000",
      device: { browser: "Chrome", operatingSystem: "Windows", deviceType: "desktop" },
      res: responseStub(),
    });
    assert.equal(invalidResult.error, "invalid");
    assert.equal(exhaustedChallenge.status, "exhausted");

    const replayChallenge = {
      userId: objectId(),
      browser: "Chrome",
      operatingSystem: "Windows",
      deviceType: "desktop",
      otpHash: await bcrypt.hash("123456", 4),
      attempts: 0,
      status: "pending",
      save: async function save() {
        return this;
      },
    };
    LoginChallenge.findOne = () => ({
      select: async () => (replayChallenge.status === "pending" ? replayChallenge : null),
    });
    TrustedDevice.create = async (data) => ({ _id: objectId(), ...data });
    user.findById = async () => ({
      _id: replayChallenge.userId,
      email: "ada@example.com",
      toObject: () => ({ _id: replayChallenge.userId, email: "ada@example.com" }),
    });
    Session.create = async (data) => data;
    LoginActivity.create = async (data) => data;
    const device = { browser: "Chrome", operatingSystem: "Windows", deviceType: "desktop", ipAddress: "203.0.113.10", userAgent: "test-agent" };
    const firstResult = await verifyLoginChallenge({ challengeToken: "replay", otp: "123456", device, res: responseStub() });
    const replayResult = await verifyLoginChallenge({ challengeToken: "replay", otp: "123456", device, res: responseStub() });
    assert.equal(typeof firstResult.token, "string");
    assert.equal(replayResult.error, "invalid");
  });

  it("limits session listing and revocation to the authenticated user", async () => {
    const userId = objectId();
    const sessionId = objectId();
    let listFilter;
    let revokeFilter;
    Session.find = (filter) => {
      listFilter = filter;
      return {
        sort() {
          return this;
        },
        lean: async () => [{
          _id: sessionId,
          browser: "Chrome",
          operatingSystem: "Windows",
          deviceType: "desktop",
          createdAt: new Date(),
          lastActivityAt: new Date(),
          expiresAt: new Date(Date.now() + 60_000),
        }],
      };
    };
    Session.findOneAndUpdate = (filter) => {
      revokeFilter = filter;
      return { _id: sessionId };
    };
    const response = responseStub();

    await listSessions({ userid: userId, sessionId }, response);
    assert.equal(listFilter.userId, userId);
    assert.equal(response.body.data[0].isCurrent, true);

    await revokeSession({ userid: userId, sessionId, params: { id: String(sessionId) } }, response);
    assert.equal(revokeFilter.userId, userId);
    assert.equal(revokeFilter.status, "active");
  });

  it("keeps the frontend verification, session, notification, and admin flows wired", async () => {
    const files = await Promise.all([
      readFile(new URL("../../stack/src/lib/AuthContext.js", import.meta.url), "utf8"),
      readFile(new URL("../../stack/src/pages/auth/index.tsx", import.meta.url), "utf8"),
      readFile(new URL("../../stack/src/pages/settings/index.tsx", import.meta.url), "utf8"),
      readFile(new URL("../../stack/src/pages/admin/login-activity.tsx", import.meta.url), "utf8"),
      readFile(new URL("../services/email.js", import.meta.url), "utf8"),
    ]);

    assert.match(files[0], /VerifyLogin/);
    assert.match(files[1], /one-time-code/);
    assert.match(files[2], /trusted-devices/);
    assert.match(files[3], /login-activity/);
    assert.match(files[4], /sendNewDeviceLoginEmail/);
  });
});
