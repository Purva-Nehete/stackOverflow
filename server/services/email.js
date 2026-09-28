import nodemailer from "nodemailer";

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
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
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
  if (!phone) {
    return false;
  }

  console.log(
    `[SMS OTP] language=${language} to=${phone.replace(/.(?=.{4})/g, "*")} code=${otp}`
  );

  return true;
};
