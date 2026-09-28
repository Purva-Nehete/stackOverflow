import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";
import bcrypt from "bcryptjs";
import user from "../models/auth.js";
import {
  getVerificationChannel,
  isSupportedLanguage,
  languageRules,
} from "../config/languageRules.js";
import {
  requestLanguageChangeOtp,
  updatePreferredLanguage,
} from "../controller/auth.js";

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

const languageUser = async (overrides = {}) => ({
  email: "ada@example.com",
  phone: "+15555550123",
  preferredLanguage: "en",
  pendingLanguageChange: "fr",
  languageOtpChannel: "email",
  languageOtpRequestedAt: new Date(),
  languageOtpExpiry: new Date(Date.now() + 60_000),
  languageOtpAttempts: 0,
  languageOtpRequestWindowStartedAt: new Date(),
  languageOtpRequestCount: 0,
  languageOtpHash: await bcrypt.hash("123456", 4),
  save: async function save() {
    return this;
  },
  ...overrides,
});

const originalFindById = user.findById;
afterEach(() => {
  user.findById = originalFindById;
});

describe("language verification rules", () => {
  it("accepts exactly the six supported languages and maps channels server-side", () => {
    assert.deepEqual(Object.keys(languageRules.supportedLanguages), ["en", "es", "hi", "pt", "zh", "fr"]);
    assert.equal(languageRules.defaultLanguage, "en");
    assert.equal(getVerificationChannel("fr"), "email");

    for (const language of ["en", "es", "hi", "pt", "zh"]) {
      assert.equal(isSupportedLanguage(language), true);
      assert.equal(getVerificationChannel(language), "mobile");
    }

    assert.equal(isSupportedLanguage("de"), false);
    assert.equal(getVerificationChannel("de"), null);
  });

  it("rejects unsupported language values in the user schema", async () => {
    const invalidUser = new user({
      name: "Ada",
      email: "ada@example.com",
      password: "hashed",
      preferredLanguage: "de",
    });

    await assert.rejects(() => invalidUser.validate(), (error) => error.name === "ValidationError");
  });
});

describe("language OTP verification", () => {
  it("selects the channel from the language and ignores request contact values", async () => {
    const currentUser = await languageUser({ languageOtpRequestedAt: null });
    user.findById = async () => currentUser;
    const response = responseStub();

    await requestLanguageChangeOtp(
      {
        userid: "user-id",
        body: {
          preferredLanguage: "fr",
          email: "attacker@example.com",
          phone: "+19999999999",
        },
      },
      response
    );

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.data.channel, "email");
    assert.equal(currentUser.pendingLanguageChange, "fr");
    assert.equal(currentUser.languageOtpRequestCount, 1);
    assert.notEqual(currentUser.languageOtpHash, null);
  });

  it("enforces resend cooldown and hourly request limits", async () => {
    const currentUser = await languageUser({
      languageOtpRequestedAt: new Date(),
      languageOtpRequestCount: 1,
    });
    user.findById = async () => currentUser;
    const cooldownResponse = responseStub();

    await requestLanguageChangeOtp(
      { userid: "user-id", body: { preferredLanguage: "es" } },
      cooldownResponse
    );

    assert.equal(cooldownResponse.statusCode, 429);

    currentUser.languageOtpRequestedAt = new Date(Date.now() - 61_000);
    currentUser.languageOtpRequestCount = languageRules.otp.maxRequestsPerHour;
    const rateLimitResponse = responseStub();

    await requestLanguageChangeOtp(
      { userid: "user-id", body: { preferredLanguage: "es" } },
      rateLimitResponse
    );

    assert.equal(rateLimitResponse.statusCode, 429);
  });

  it("applies the requested language only after a correct OTP", async () => {
    const currentUser = await languageUser();
    user.findById = async () => currentUser;
    const response = responseStub();

    await updatePreferredLanguage(
      { userid: "user-id", body: { preferredLanguage: "fr", otp: "123456" } },
      response
    );

    assert.equal(response.statusCode, 200);
    assert.equal(currentUser.preferredLanguage, "fr");
    assert.equal(currentUser.pendingLanguageChange, null);
    assert.equal(currentUser.languageOtpHash, null);
    assert.equal(response.body.data.preferredLanguage, "fr");
  });

  it("leaves the current language unchanged for an invalid OTP", async () => {
    const currentUser = await languageUser();
    user.findById = async () => currentUser;
    const response = responseStub();

    await updatePreferredLanguage(
      { userid: "user-id", body: { preferredLanguage: "fr", otp: "000000" } },
      response
    );

    assert.equal(response.statusCode, 400);
    assert.equal(currentUser.preferredLanguage, "en");
    assert.equal(currentUser.languageOtpAttempts, 1);
  });

  it("rejects expired OTPs and prevents replay after successful verification", async () => {
    const expiredUser = await languageUser({ languageOtpExpiry: new Date(Date.now() - 1) });
    user.findById = async () => expiredUser;
    const expiredResponse = responseStub();

    await updatePreferredLanguage(
      { userid: "user-id", body: { preferredLanguage: "fr", otp: "123456" } },
      expiredResponse
    );

    assert.equal(expiredResponse.statusCode, 400);
    assert.equal(expiredUser.preferredLanguage, "en");
    assert.equal(expiredUser.languageOtpHash, null);

    const verifiedUser = await languageUser();
    user.findById = async () => verifiedUser;
    const firstResponse = responseStub();
    await updatePreferredLanguage(
      { userid: "user-id", body: { preferredLanguage: "fr", otp: "123456" } },
      firstResponse
    );

    const replayResponse = responseStub();
    await updatePreferredLanguage(
      { userid: "user-id", body: { preferredLanguage: "fr", otp: "123456" } },
      replayResponse
    );

    assert.equal(firstResponse.statusCode, 200);
    assert.equal(replayResponse.statusCode, 400);
  });

  it("invalidates an OTP after the maximum failed attempts", async () => {
    const currentUser = await languageUser({ languageOtpAttempts: languageRules.otp.maxAttempts });
    user.findById = async () => currentUser;
    const response = responseStub();

    await updatePreferredLanguage(
      { userid: "user-id", body: { preferredLanguage: "fr", otp: "000000" } },
      response
    );

    assert.equal(response.statusCode, 400);
    assert.equal(currentUser.preferredLanguage, "en");
    assert.equal(currentUser.languageOtpHash, null);
  });
});
