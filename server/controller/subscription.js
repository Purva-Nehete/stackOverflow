import mongoose from "mongoose";
import Subscription from "../models/subscription.js";
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
  const { plan, status, currentPeriodEnd, razorpaySubscriptionId } = req.body;

  if (!plan) {
    return res.status(400).json({ message: "Plan is required" });
  }

  try {
    const subscription = await Subscription.findOneAndUpdate(
      { userId: req.userid },
      {
        userId: req.userid,
        plan,
        status: status || "active",
        currentPeriodEnd,
        razorpaySubscriptionId,
        nextBillingDate: currentPeriodEnd,
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({ data: subscription });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
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
