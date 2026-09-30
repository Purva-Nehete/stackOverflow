import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import user from "../models/auth.js";
import Session from "../models/session.js";
import auth from "../middleware/auth.js";
import { authenticateSession } from "../services/loginSecurity.js";
import { hashSecurityToken } from "../services/securityToken.js";

process.env.JWT_SECRET ||= "test-secret";

const objectId = () => new mongoose.Types.ObjectId();
const originalFindById = user.findById;
const originalSessionFindOne = Session.findOne;

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
  Session.findOne = originalSessionFindOne;
});

describe("session protection", () => {
  it("refreshes activity for an active session", async () => {
    const session = {
      _id: objectId(),
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      status: "active",
      save: async function save() {
        this.saved = true;
        return this;
      },
    };
    Session.findOne = () => ({ select: async () => session });

    const result = await authenticateSession({ userId: objectId(), token: "token" });

    assert.equal(result, session);
    assert.equal(session.saved, true);
  });

  it("expires a session after the configured inactivity period", async () => {
    const session = {
      lastActivityAt: new Date(Date.now() - 31 * 60 * 1000),
      expiresAt: new Date(Date.now() + 60_000),
      status: "active",
      save: async function save() {
        this.saved = true;
        return this;
      },
    };
    Session.findOne = () => ({ select: async () => session });

    const result = await authenticateSession({ userId: objectId(), token: "token" });

    assert.equal(result, null);
    assert.equal(session.status, "expired");
    assert.equal(session.saved, true);
  });

  it("rejects revoked or missing sessions even when the JWT is valid", async () => {
    Session.findOne = () => ({ select: async () => null });
    const userId = objectId();
    const token = jwt.sign({ id: userId, email: "ada@example.com" }, process.env.JWT_SECRET);
    const request = { headers: { authorization: `Bearer ${token}` } };
    const response = responseStub();
    let nextCalled = false;
    user.findById = async () => ({ _id: userId });

    await auth(request, response, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(response.statusCode, 401);
    assert.equal(response.body.message, "Session expired or revoked");
  });

  it("passes the current session identity to protected handlers", async () => {
    const userId = objectId();
    const sessionId = objectId();
    const token = jwt.sign({ id: userId, email: "ada@example.com" }, process.env.JWT_SECRET);
    const session = {
      _id: sessionId,
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      status: "active",
      save: async function save() {
        return this;
      },
    };
    Session.findOne = ({ tokenHash }) => {
      assert.equal(tokenHash, hashSecurityToken(token));
      return { select: async () => session };
    };
    user.findById = async (id) => ({ _id: id });
    const request = { headers: { authorization: `Bearer ${token}` } };
    const response = responseStub();

    await auth(request, response, () => {
      assert.equal(String(request.userid), String(userId));
      assert.equal(String(request.sessionId), String(sessionId));
      assert.equal(request.session, session);
    });

    assert.equal(response.statusCode, 200);
  });
});
