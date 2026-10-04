import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import nodemailer from "nodemailer";
import {
  sendLoginVerificationEmail,
  sendNewDeviceLoginEmail,
} from "../services/email.js";

const originalEnvironment = {
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM,
};
const originalCreateTransport = nodemailer.createTransport;

afterEach(() => {
  nodemailer.createTransport = originalCreateTransport;
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("login security email notifications", () => {
  it("sends new-device notifications with safe activity context", async () => {
    let message;
    process.env.EMAIL_HOST = "smtp.test";
    process.env.EMAIL_PORT = "587";
    process.env.EMAIL_USER = "sender@example.com";
    process.env.EMAIL_PASSWORD = "test-password";
    nodemailer.createTransport = () => ({
      sendMail: async (options) => {
        message = options;
      },
    });

    const result = await sendNewDeviceLoginEmail({
      email: "ada@example.com",
      name: "Ada",
      browser: "Chrome",
      operatingSystem: "Windows",
      deviceType: "desktop",
      ipAddress: "203.0.113.10",
    });

    assert.equal(result, true);
    assert.equal(message.to, "ada@example.com");
    assert.match(message.text, /Chrome/);
    assert.match(message.text, /203\.0\.113\.10/);
    assert.doesNotMatch(message.text, /otp|token|hash/i);
  });

  it("sends the verification code only through the verification email", async () => {
    let message;
    process.env.EMAIL_HOST = "smtp.test";
    process.env.EMAIL_PORT = "587";
    process.env.EMAIL_USER = "sender@example.com";
    process.env.EMAIL_PASSWORD = "test-password";
    nodemailer.createTransport = () => ({
      sendMail: async (options) => {
        message = options;
      },
    });

    const result = await sendLoginVerificationEmail({
      email: "ada@example.com",
      otp: "123456",
      browser: "Chrome",
      operatingSystem: "Windows",
    });

    assert.equal(result, true);
    assert.equal(message.to, "ada@example.com");
    assert.match(message.text, /123456/);
    assert.match(message.text, /expires/i);
  });
});
