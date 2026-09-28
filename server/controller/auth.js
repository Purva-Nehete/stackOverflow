import mongoose from "mongoose";
import { randomInt } from "node:crypto";
import user from "../models/auth.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  getVerificationChannel,
  isSupportedLanguage,
  languageRules,
} from "../config/languageRules.js";
import {
  sendLanguageVerificationEmail,
  sendLanguageVerificationSms,
} from "../services/email.js";

export const generateRandomPassword = (length = 12) => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let randomPassword = "";

  for (let index = 0; index < length; index += 1) {
    randomPassword += letters[randomInt(letters.length)];
  }

  return randomPassword;
};

export const Signup = async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    const exisitinguser = await user.findOne({ email });
    if (exisitinguser) {
      return res.status(404).json({ message: "User already exist" });
    }
    const hashpassword = await bcrypt.hash(password, 12);
    const newuser = await user.create({
      name,
      email,
      phone,
      password: hashpassword,
    });
    const token = jwt.sign(
      { email: newuser.email, id: newuser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({ data: newuser, token });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};

export const Login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const exisitinguser = await user.findOne({ email });
    if (!exisitinguser) {
      return res.status(404).json({ message: "User does not exist" });
    }

    const ispasswordcrct = await bcrypt.compare(
      password,
      exisitinguser.password
    );
    if (!ispasswordcrct) {
      return res.status(400).json({ message: "Invalid password" });
    }
    const token = jwt.sign(
      { email: exisitinguser.email, id: exisitinguser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({ data: exisitinguser, token });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};

export const ForgotPassword = async (req, res) => {
  const { email, phone } = req.body || {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedPhone = typeof phone === "string" ? phone.trim() : "";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^\+?[\d\s().-]{7,20}$/;

  if (!normalizedEmail && !normalizedPhone) {
    return res.status(400).json({
      message: "Please provide your email or phone number.",
    });
  }

  if (normalizedEmail && !emailPattern.test(normalizedEmail)) {
    return res.status(400).json({ message: "Please provide a valid email address." });
  }

  if (normalizedPhone && !phonePattern.test(normalizedPhone)) {
    return res.status(400).json({ message: "Please provide a valid phone number." });
  }

  try {
    const identifiers = [];
    if (normalizedEmail) identifiers.push({ email: normalizedEmail });
    if (normalizedPhone) identifiers.push({ phone: normalizedPhone });

    const existingUser = await user.findOne({ $or: identifiers });

    if (!existingUser) {
      return res.status(404).json({
        message: "No user found with that email or phone number.",
      });
    }

    if (existingUser.forgotPasswordRequestedAt) {
      const lastRequestDate = new Date(existingUser.forgotPasswordRequestedAt);
      const now = new Date();
      const sameDay =
        lastRequestDate.getFullYear() === now.getFullYear() &&
        lastRequestDate.getMonth() === now.getMonth() &&
        lastRequestDate.getDate() === now.getDate();

      if (sameDay) {
        return res.status(403).json({
          message: "You can use this option only one time per day.",
        });
      }
    }

    const generatedPassword = generateRandomPassword(12);
    const hashpassword = await bcrypt.hash(generatedPassword, 12);

    existingUser.password = hashpassword;
    existingUser.forgotPasswordRequestedAt = new Date();
    await existingUser.save();

    return res.status(200).json({
      message: "Password reset successful.",
      generatedPassword,
      data: {
        email: existingUser.email,
        phone: existingUser.phone || null,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

export const getCurrentUserLanguage = async (req, res) => {
  try {
    const currentUser = await user.findById(req.userid).select("preferredLanguage");

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      data: {
        preferredLanguage: currentUser.preferredLanguage || "en",
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong." });
  }
};

const createLanguageOtp = () => {
  return String(randomInt(100000, 1000000)).padStart(languageRules.otp.length, "0");
};

const setUserLanguageOtp = async ({ userDoc, language, otp, channel }) => {
  const otpExpiry = new Date(Date.now() + languageRules.otp.expiresInMinutes * 60 * 1000);

  userDoc.pendingLanguageChange = language;
  userDoc.languageOtpChannel = channel;
  userDoc.languageOtpRequestedAt = new Date();
  userDoc.languageOtpExpiry = otpExpiry;
  userDoc.languageOtpAttempts = 0;
  userDoc.languageOtpHash = await bcrypt.hash(otp, 10);
  await userDoc.save();
};

const clearLanguageOtp = (userDoc) => {
  userDoc.pendingLanguageChange = null;
  userDoc.languageOtpHash = null;
  userDoc.languageOtpChannel = null;
  userDoc.languageOtpRequestedAt = null;
  userDoc.languageOtpExpiry = null;
  userDoc.languageOtpAttempts = 0;
};

export const requestLanguageChangeOtp = async (req, res) => {
  const { preferredLanguage } = req.body || {};

  if (!preferredLanguage || !isSupportedLanguage(preferredLanguage)) {
    return res.status(400).json({ message: "Unsupported language selected." });
  }

  try {
    const currentUser = await user.findById(req.userid);

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const channel = getVerificationChannel(preferredLanguage);

    if (!channel) {
      return res.status(400).json({ message: "Unsupported language selected." });
    }

    const now = Date.now();
    const requestWindowStartedAt = currentUser.languageOtpRequestWindowStartedAt
      ? new Date(currentUser.languageOtpRequestWindowStartedAt).getTime()
      : 0;
    const requestWindowExpired =
      !requestWindowStartedAt || now - requestWindowStartedAt >= 60 * 60 * 1000;

    if (requestWindowExpired) {
      currentUser.languageOtpRequestWindowStartedAt = new Date(now);
      currentUser.languageOtpRequestCount = 0;
    }

    if (
      currentUser.languageOtpRequestedAt &&
      now - new Date(currentUser.languageOtpRequestedAt).getTime() <
        languageRules.otp.resendCooldownSeconds * 1000
    ) {
      return res.status(429).json({ message: "Please wait before requesting another code." });
    }

    if (currentUser.languageOtpRequestCount >= languageRules.otp.maxRequestsPerHour) {
      return res.status(429).json({ message: "Too many verification requests. Please try again later." });
    }

    if (channel === "email" && !currentUser.email) {
      return res.status(400).json({ message: "Email verification unavailable." });
    }

    if (channel === "mobile" && !currentUser.phone) {
      return res.status(400).json({ message: "Mobile verification unavailable." });
    }

    const otp = createLanguageOtp();

    await setUserLanguageOtp({
      userDoc: currentUser,
      language: preferredLanguage,
      otp,
      channel,
    });
    currentUser.languageOtpRequestCount += 1;
    await currentUser.save();

    if (channel === "email") {
      await sendLanguageVerificationEmail({
        email: currentUser.email,
        otp,
        language: preferredLanguage,
      });
    } else {
      await sendLanguageVerificationSms({
        phone: currentUser.phone,
        otp,
        language: preferredLanguage,
      });
    }

    return res.status(200).json({
      message: "Verification code sent.",
      data: {
        channel,
        preferredLanguage,
      },
    });
  } catch (error) {
    console.error("requestLanguageChangeOtp error:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

export const updatePreferredLanguage = async (req, res) => {
  const { preferredLanguage, otp } = req.body || {};

  if (!preferredLanguage || !isSupportedLanguage(preferredLanguage)) {
    return res.status(400).json({ message: "Unsupported language selected." });
  }

  if (!otp || typeof otp !== "string") {
    return res.status(400).json({ message: "OTP is required to change language." });
  }

  try {
    const currentUser = await user.findById(req.userid);

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!currentUser.pendingLanguageChange || currentUser.pendingLanguageChange !== preferredLanguage) {
      return res.status(400).json({ message: "No pending language change found." });
    }

    if (!currentUser.languageOtpHash || !currentUser.languageOtpExpiry) {
      return res.status(400).json({ message: "Language verification expired or missing." });
    }

    if (new Date() > new Date(currentUser.languageOtpExpiry)) {
      clearLanguageOtp(currentUser);
      await currentUser.save();
      return res.status(400).json({ message: "OTP expired." });
    }

    if (currentUser.languageOtpAttempts >= languageRules.otp.maxAttempts) {
      clearLanguageOtp(currentUser);
      await currentUser.save();
      return res.status(400).json({ message: "Maximum OTP attempts exceeded." });
    }

    const isOtpCorrect = await bcrypt.compare(otp, currentUser.languageOtpHash);

    if (!isOtpCorrect) {
      currentUser.languageOtpAttempts += 1;
      await currentUser.save();
      return res.status(400).json({ message: "Invalid OTP." });
    }

    currentUser.preferredLanguage = preferredLanguage;
    currentUser.pendingLanguageChange = null;
    currentUser.languageOtpHash = null;
    currentUser.languageOtpChannel = null;
    currentUser.languageOtpRequestedAt = null;
    currentUser.languageOtpExpiry = null;
    currentUser.languageOtpAttempts = 0;
    await currentUser.save();

    return res.status(200).json({
      message: "Language preference updated.",
      data: {
        preferredLanguage: currentUser.preferredLanguage,
      },
    });
  } catch (error) {
    console.error("updatePreferredLanguage error:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

export const getallusers = async (req, res) => {
  try {
    const alluser = await user.find();
    res.status(200).json({ data: alluser });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};
export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { name, about, tags } = req.body.editForm;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "User unavailable" });
  }
  try {
    const updateprofile = await user.findByIdAndUpdate(
      _id,
      { $set: { name: name, about: about, tags: tags } },
      { new: true }
    );
    res.status(200).json({ data: updateprofile });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};
