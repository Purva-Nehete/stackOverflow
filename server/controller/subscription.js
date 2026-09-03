import crypto from "crypto";
import mongoose from "mongoose";
import Subscription from "../models/subscription.js";
import Payment from "../models/payment.js";
import User from "../models/auth.js";
import { createRazorpaySubscription } from "../services/razorpay.js";
import { getPlanList } from "../config/plans.js";

export const getSubscriptionPlans = async (req, res) => {
  try {
    return res.status(200).json({
      data: getPlanList(),
    });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.userid }).sort({
      createdAt: -1,
    });

    if (!subscription) {
      return res.status(200).json({
        data: {
          userId: req.userid,
          plan: "free",
          status: "inactive",
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        },
      });
    }

    return res.status(200).json({ data: subscription });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const createOrUpdateSubscription = async (req, res) => {
  const { plan } = req.body;

  if (!plan || !["bronze", "silver", "gold"].includes(plan)) {
    return res.status(400).json({ message: "A paid plan is required" });
  }

  try {
    const user = await User.findById(req.userid).select("name email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const checkout = await createRazorpaySubscription({
      plan,
      customerEmail: user.email,
      userId: user._id,
    });

    return res.status(200).json({ data: { checkout, plan } });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const verifySubscription = async (req, res) => {
  const { razorpay_subscription_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_subscription_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: "Payment verification data is required" });
  }

  try {
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid Razorpay signature" });
    }

    const subscription = await Subscription.findOneAndUpdate(
      { userId: req.userid },
      {
        status: "active",
        cancelAtPeriodEnd: false,
        razorpaySubscriptionId: razorpay_subscription_id,
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Subscription verified successfully",
      data: subscription,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to verify subscription" });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOneAndUpdate(
      { userId: req.userid },
      {
        status: "cancelled",
        cancelAtPeriodEnd: true,
      },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    return res.status(200).json({ data: subscription });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getSubscriptionHistory = async (req, res) => {
  try {
    const subscription = await Subscription.find({ userId: req.userid }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ data: subscription });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.userid }).sort({ createdAt: -1 });
    return res.status(200).json({ data: payments });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getSubscriptionInvoice = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid invoice id" });
  }

  try {
    const payment = await Payment.findOne({ _id: id, userId: req.userid });

    if (!payment) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    return res.status(200).json({ data: payment });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};
