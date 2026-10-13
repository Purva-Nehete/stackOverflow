import nodemailer from "nodemailer";
import { languageRules } from "../config/languageRules.js";

const getTransporter = () => {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD } = process.env;

  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: EMAIL_USER.trim(),
      pass: EMAIL_PASSWORD.replace(/\s+/g, ""),
    },
  });
};

export const sendPaymentConfirmationEmail = async ({
  email,
  name,
  plan,
  amount,
  paidAt,
  renewalDate,
  subscriptionId,
  invoiceNumber,
  invoiceUrl,
}) => {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn("Payment email skipped: email service is not configured");
    return false;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: `Payment confirmed for your ${plan} plan`,
    text: [
      `Hi ${name || "there"},`,
      "",
      `Your payment for the ${plan} plan was successful.`,
      `Amount: ${(amount / 100).toFixed(2)} INR`,
      `Payment date: ${new Date(paidAt).toISOString()}`,
      `Renewal date: ${renewalDate ? new Date(renewalDate).toISOString() : "Not available"}`,
      `Subscription ID: ${subscriptionId || "Not available"}`,
      `Invoice number: ${invoiceNumber}`,
      `Invoice: ${invoiceUrl}`,
      "",
      "Thank you.",
    ].join("\n"),
  });

  return true;
};

export const sendLanguageVerificationEmail = async ({ email, otp, language }) => {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(`Language verification email skipped: email service is not configured for ${language}`);
    return false;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: `Your language change OTP for ${language}`,
    text: [
      "Your language change verification code is below.",
      "",
      `Code: ${otp}`,
      "",
      "This code expires in 10 minutes.",
    ].join("\n"),
  });

  return true;
};

export const sendLanguageVerificationSms = async ({ phone, otp, language }) => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;

  if (!phone || !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    if (process.env.NODE_ENV !== "production" && phone) {
      console.warn(
        `[SMS OTP development fallback] language=${language} to=${phone.replace(/.(?=.{4})/g, "*")} code=${otp}`
      );
      return true;
    }

    console.error("Language verification SMS is unavailable: configure the Twilio environment variables.");
    return false;
  }

  const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(TWILIO_ACCOUNT_SID)}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: TWILIO_FROM_NUMBER,
        To: phone,
        Body: `Your language change verification code is ${otp}. It expires in ${languageRules.otp.expiresInMinutes} minutes.`,
      }),
    }
  );

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`SMS provider rejected the request (${response.status}): ${responseText}`);
  }

  return true;
};

export const sendLoginVerificationEmail = async ({
  email,
  otp,
  browser,
  operatingSystem,
}) => {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn("Login verification email skipped: email service is not configured");
    return false;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: "Verify a new login to your account",
    text: [
      "A login was attempted from a device we do not recognize.",
      "",
      `Device: ${browser} on ${operatingSystem}`,
      `Verification code: ${otp}`,
      "",
      "This code expires in 10 minutes. If you did not try to log in, change your password immediately.",
    ].join("\n"),
  });

  return true;
};

export const sendNewDeviceLoginEmail = async ({
  email,
  name,
  browser,
  operatingSystem,
  deviceType,
  ipAddress,
}) => {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn("New-device login email skipped: email service is not configured");
    return false;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: "New device signed in to your account",
    text: [
      `Hi ${name || "there"},`,
      "",
      "A new device signed in to your account.",
      `Device: ${browser} on ${operatingSystem} (${deviceType})`,
      `IP address: ${ipAddress}`,
      `Time: ${new Date().toISOString()}`,
      "",
      "If this was not you, revoke the session and change your password.",
    ].join("\n"),
  });

  return true;
};
