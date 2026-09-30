import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import mongoose from "mongoose";
import user from "../models/auth.js";
import LoginChallenge from "../models/loginChallenge.js";
import Session from "../models/session.js";
import TrustedDevice from "../models/trustedDevice.js";
import { Login } from "../controller/auth.js";
import { getRequestDevice, readCookie } from "../services/loginSecurity.js";
import { loginSecurityRules } from "../config/loginSecurity.js";

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

const originalFindOne = user.findOne;
afterEach(() => {
  user.findOne = originalFindOne;
});

describe("secure login contracts", () => {
  it("derives device metadata from the request user-agent", () => {
    const desktop = getRequestDevice({
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      },
      ip: "203.0.113.10",
      socket: {},
    });
    const mobile = getRequestDevice({
      headers: { "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148 Safari/604.1" },
      ip: "203.0.113.11",
      socket: {},
    });

    assert.equal(desktop.deviceType, "desktop");
    assert.equal(desktop.operatingSystem, "Windows");
    assert.equal(desktop.browser, "Chrome");
    assert.equal(mobile.deviceType, "mobile");
    assert.equal(mobile.operatingSystem, "iOS");
  });

  it("reads only the named trusted-device cookie", () => {
    const request = {
      headers: { cookie: "other=value; trusted_device=abc%20123; another=last" },
    };

    assert.equal(readCookie(request, "trusted_device"), "abc 123");
    assert.equal(readCookie(request, "missing"), null);
  });

  it("keeps login challenges protected and expirable", () => {
    assert.equal(LoginChallenge.schema.path("challengeHash").options.select, false);
    assert.equal(LoginChallenge.schema.path("otpHash").options.select, false);
    assert.ok(LoginChallenge.schema.indexes().some(([fields]) => fields.expiresAt === 1));
    assert.equal(loginSecurityRules.otp.maxAttempts, 5);
  });

  it("returns a generic response for unknown credentials", async () => {
    user.findOne = () => ({ select: async () => null });
    const response = responseStub();

    await Login({ body: { email: "missing@example.com", password: "wrong" } }, response);

    assert.equal(response.statusCode, 401);
    assert.equal(response.body.message, loginSecurityRules.errors.invalidCredentials);
  });

  it("does not expose protected token fields by default", () => {
    for (const schema of [LoginChallenge.schema, Session.schema, TrustedDevice.schema]) {
      assert.equal(schema.path("tokenHash")?.options.select ?? schema.path("challengeHash").options.select, false);
    }
  });
});
