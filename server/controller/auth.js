import mongoose from "mongoose";
import { randomInt } from "node:crypto";
import user from "../models/auth.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

  if (!normalizedEmail && !normalizedPhone) {
    return res.status(400).json({
      message: "Please provide your email or phone number.",
    });
  }

  try {
    const existingUser = await user.findOne({
      $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
    });

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
