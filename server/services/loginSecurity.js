import { randomInt } from "node:crypto";
import { UAParser } from "ua-parser-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import user from "../models/auth.js";
import LoginActivity from "../models/loginActivity.js";
import LoginChallenge from "../models/loginChallenge.js";
import Session from "../models/session.js";
import TrustedDevice from "../models/trustedDevice.js";
import { loginSecurityRules } from "../config/loginSecurity.js";
import { createSecurityToken, hashSecurityToken } from "./securityToken.js";
import { sendLoginVerificationEmail, sendNewDeviceLoginEmail } from "./email.js";

export const trustedDeviceCookieName = "trusted_device";

export const getRequestDevice = (req) => {
  const userAgent = req.headers["user-agent"] || "unknown";
  const parsed = new UAParser(userAgent).getResult();
  const deviceType = parsed.device.type;

  return {
    browser: parsed.browser.name || "Unknown browser",
    operatingSystem: parsed.os.name || "Unknown operating system",
    deviceType: ["mobile", "tablet"].includes(deviceType)
      ? deviceType
      : deviceType
        ? "unknown"
        : "desktop",
    ipAddress: req.ip || req.socket?.remoteAddress || "unknown",
    userAgent,
  };
};

export const readCookie = (req, cookieName) => {
  const cookies = req.headers.cookie?.split(";") || [];
  const cookie = cookies.find((value) => value.trim().startsWith(`${cookieName}=`));
  return cookie ? decodeURIComponent(cookie.trim().slice(cookieName.length + 1)) : null;
};

export const setTrustedDeviceCookie = (res, token) => {
  res.cookie(trustedDeviceCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: loginSecurityRules.trustedDevice.ttlDays * 24 * 60 * 60 * 1000,
    path: "/",
  });
};

export const clearTrustedDeviceCookie = (res) => {
  res.clearCookie(trustedDeviceCookieName, { httpOnly: true, sameSite: "lax", path: "/" });
};

const getSafeUser = (userDocument) => {
  const safeUser = userDocument.toObject ? userDocument.toObject() : { ...userDocument };
  delete safeUser.password;
  return safeUser;
};

export const createAuthenticatedSession = async ({ userDocument, device, trustedDeviceId = null }) => {
  const token = jwt.sign(
    { email: userDocument.email, id: userDocument._id },
    process.env.JWT_SECRET,
    { expiresIn: `${loginSecurityRules.session.ttlMinutes}m` }
  );
  const now = new Date();
  const expiresAt = new Date(now.getTime() + loginSecurityRules.session.ttlMinutes * 60 * 1000);

  await Session.create({
    userId: userDocument._id,
    tokenHash: hashSecurityToken(token),
    trustedDeviceId,
    browser: device.browser,
    operatingSystem: device.operatingSystem,
    deviceType: device.deviceType,
    lastActivityAt: now,
    expiresAt,
  });

  return { token, data: getSafeUser(userDocument) };
};

export const recordLoginActivity = async ({ userId, device, outcome, isNewDevice = false }) => {
  return LoginActivity.create({
    userId,
    outcome,
    isNewDevice,
    browser: device.browser,
    operatingSystem: device.operatingSystem,
    deviceType: device.deviceType,
    ipAddress: device.ipAddress,
    userAgent: device.userAgent,
    location: loginSecurityRules.loginActivity.unavailableLocation,
  });
};

export const findTrustedDevice = async ({ userId, token }) => {
  if (!token) {
    return null;
  }

  return TrustedDevice.findOne({
    userId,
    tokenHash: hashSecurityToken(token),
    status: "active",
    expiresAt: { $gt: new Date() },
  }).select("+tokenHash");
};

export const createLoginChallenge = async ({ userDocument, device }) => {
  const now = Date.now();
  const existingChallenge = await LoginChallenge.findOne({
    userId: userDocument._id,
    status: "pending",
  }).sort({ createdAt: -1 });

  if (existingChallenge) {
    const elapsed = now - new Date(existingChallenge.lastRequestedAt).getTime();
    const windowElapsed = now - new Date(existingChallenge.requestWindowStartedAt).getTime();
    if (elapsed < loginSecurityRules.otp.resendCooldownSeconds * 1000) {
      return { limited: true, retryAfter: Math.ceil((loginSecurityRules.otp.resendCooldownSeconds * 1000 - elapsed) / 1000) };
    }
    if (windowElapsed < 60 * 60 * 1000 && existingChallenge.requestCount >= loginSecurityRules.otp.maxRequestsPerHour) {
      return { limited: true, retryAfter: Math.ceil((60 * 60 * 1000 - windowElapsed) / 1000) };
    }
  }

  const otp = String(randomInt(0, 10 ** loginSecurityRules.otp.length)).padStart(loginSecurityRules.otp.length, "0");
  const challenge = createSecurityToken();
  const challengeExpiry = new Date(now + loginSecurityRules.otp.expiresInMinutes * 60 * 1000);
  const usesExistingWindow = existingChallenge &&
    now - new Date(existingChallenge.requestWindowStartedAt).getTime() < 60 * 60 * 1000;
  const requestWindowStartedAt = usesExistingWindow
    ? existingChallenge.requestWindowStartedAt
    : new Date(now);
  const requestCount = usesExistingWindow ? existingChallenge.requestCount + 1 : 1;

  if (existingChallenge) {
    existingChallenge.challengeHash = challenge.tokenHash;
    existingChallenge.otpHash = await bcrypt.hash(otp, 12);
    existingChallenge.browser = device.browser;
    existingChallenge.operatingSystem = device.operatingSystem;
    existingChallenge.deviceType = device.deviceType;
    existingChallenge.attempts = 0;
    existingChallenge.requestWindowStartedAt = requestWindowStartedAt;
    existingChallenge.requestCount = requestCount;
    existingChallenge.lastRequestedAt = new Date(now);
    existingChallenge.expiresAt = challengeExpiry;
    await existingChallenge.save();
  } else {
    await LoginChallenge.create({
      userId: userDocument._id,
      challengeHash: challenge.tokenHash,
      otpHash: await bcrypt.hash(otp, 12),
      browser: device.browser,
      operatingSystem: device.operatingSystem,
      deviceType: device.deviceType,
      requestWindowStartedAt: new Date(now),
      expiresAt: challengeExpiry,
    });
  }

  const emailSent = await sendLoginVerificationEmail({
    email: userDocument.email,
    otp,
    browser: device.browser,
    operatingSystem: device.operatingSystem,
  });

  if (!emailSent) {
    await LoginChallenge.deleteOne({ challengeHash: challenge.tokenHash });
    return { unavailable: true };
  }

  return {
    challengeToken: challenge.token,
    expiresInSeconds: loginSecurityRules.otp.expiresInMinutes * 60,
  };
};

export const verifyLoginChallenge = async ({ challengeToken, otp, device, res }) => {
  const challengeHash = hashSecurityToken(challengeToken || "");
  const challenge = await LoginChallenge.findOne({
    challengeHash,
    status: "pending",
    expiresAt: { $gt: new Date() },
  }).select("+challengeHash +otpHash");

  if (!challenge) {
    return { error: "invalid" };
  }

  if (challenge.attempts >= loginSecurityRules.otp.maxAttempts) {
    challenge.status = "exhausted";
    await challenge.save();
    return { error: "invalid" };
  }

  const isCorrect = await bcrypt.compare(otp || "", challenge.otpHash);
  if (!isCorrect) {
    challenge.attempts += 1;
    if (challenge.attempts >= loginSecurityRules.otp.maxAttempts) {
      challenge.status = "exhausted";
    }
    await challenge.save();
    return { error: "invalid" };
  }

  if (
    challenge.browser !== device.browser ||
    challenge.operatingSystem !== device.operatingSystem ||
    challenge.deviceType !== device.deviceType
  ) {
    return { error: "invalid" };
  }

  const trustedDeviceToken = createSecurityToken();
  const expiresAt = new Date(Date.now() + loginSecurityRules.trustedDevice.ttlDays * 24 * 60 * 60 * 1000);
  const trustedDevice = await TrustedDevice.create({
    userId: challenge.userId,
    tokenHash: trustedDeviceToken.tokenHash,
    browser: device.browser,
    operatingSystem: device.operatingSystem,
    deviceType: device.deviceType,
    expiresAt,
  });
  const userDocument = await user.findById(challenge.userId);
  if (!userDocument) {
    return { error: "invalid" };
  }

  const session = await createAuthenticatedSession({
    userDocument,
    device,
    trustedDeviceId: trustedDevice._id,
  });
  challenge.status = "verified";
  await challenge.save();
  setTrustedDeviceCookie(res, trustedDeviceToken.token);
  await recordLoginActivity({ userId: userDocument._id, device, outcome: "success", isNewDevice: true });
  await sendNewDeviceLoginEmail({
    email: userDocument.email,
    name: userDocument.name,
    browser: device.browser,
    operatingSystem: device.operatingSystem,
    deviceType: device.deviceType,
    ipAddress: device.ipAddress,
  });

  return session;
};
