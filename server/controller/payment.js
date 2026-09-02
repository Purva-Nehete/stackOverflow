import crypto from "crypto";
import Payment from "../models/payment.js";
import Subscription from "../models/subscription.js";
import WebhookEvent from "../models/webhookEvent.js";
import User from "../models/auth.js";
import { createRazorpayOrder, createRazorpaySubscription } from "../services/razorpay.js";

export const createPaymentSession = async (req, res) => {
  const { plan } = req.body;

  if (!plan || !["bronze", "silver", "gold"].includes(plan)) {
    return res.status(400).json({ message: "Invalid plan selected" });
  }

  try {
    const user = await User.findById(req.userid);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const planPrices = {
      bronze: 9900,
      silver: 29900,
      gold: 99900,
    };

    const amount = planPrices[plan];

    const order = await createRazorpayOrder({
      amount,
      currency: "INR",
      receipt: `${user._id}-${Date.now()}`,
      notes: {
        userId: user._id.toString(),
        plan,
      },
    });

    return res.status(200).json({
      data: {
        order,
        plan,
        amount,
        currency: "INR",
      },
    });
  } catch (error) {
    console.error("Create payment session error:", error);
    return res.status(500).json({
      message: "Failed to create payment session",
      error:
        error?.message ||
        error?.error?.description ||
        "Razorpay order creation failed",
    });
  }
};

export const createSubscriptionCheckout = async (req, res) => {
  const { plan } = req.body;

  try {
    const user = await User.findById(req.userid);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const subscription = await createRazorpaySubscription({
      plan,
      customerEmail: user.email,
      userId: user._id,
    });

    return res.status(200).json({ data: subscription });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create subscription" });
  }
};

export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: "Invalid signature" });
  }

  return res.status(200).json({ message: "Payment verified successfully" });
};

export const handleWebhook = async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const rawBody = req.rawBody || req.body;

  if (!signature || !secret || !rawBody) {
    return res.status(400).json({ message: "Webhook signature data is missing" });
  }

  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  if (
    digest.length !== signature.length ||
    !crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
  ) {
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  let event;
  try {
    event = Buffer.isBuffer(rawBody) ? JSON.parse(rawBody.toString("utf8")) : rawBody;
  } catch (error) {
    return res.status(400).json({ message: "Invalid webhook payload" });
  }

  const eventId = event?.event_id;

  if (!eventId || !event?.event) {
    return res.status(400).json({ message: "Webhook event id and type are required" });
  }

  const alreadyProcessed = await WebhookEvent.findOne({ eventId });

  if (alreadyProcessed) {
    return res.status(200).json({ message: "Duplicate webhook ignored" });
  }

  try {
    await WebhookEvent.create({
      eventId,
      eventType: event.event,
      processed: false,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(200).json({ message: "Duplicate webhook ignored" });
    }
    throw error;
  }

  const subscriptionEntity = event?.payload?.subscription?.entity;
  const paymentEntity = event?.payload?.payment?.entity;
  const orderEntity = event?.payload?.order?.entity;
  const entity = subscriptionEntity || paymentEntity || orderEntity;
  const notes = entity?.notes || {};
  const userId = notes.userId;
  const plan = notes.plan;
  const subscriptionId = subscriptionEntity?.id || paymentEntity?.subscription_id;

  if (event.event === "subscription.activated" && subscriptionId && userId && plan) {
    await Subscription.findOneAndUpdate(
      { userId },
      {
        userId,
        plan,
        status: "active",
        razorpaySubscriptionId: subscriptionId,
        currentPeriodStart: subscriptionEntity.start_at
          ? new Date(subscriptionEntity.start_at * 1000)
          : undefined,
        currentPeriodEnd: subscriptionEntity.end_at
          ? new Date(subscriptionEntity.end_at * 1000)
          : undefined,
        cancelAtPeriodEnd: false,
      },
      { upsert: true, new: true }
    );
  }

  if (["subscription.cancelled", "subscription.expired"].includes(event.event) && subscriptionId) {
    await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId: subscriptionId },
      { status: event.event === "subscription.expired" ? "expired" : "cancelled" },
      { new: true }
    );
  }

  if (event.event === "subscription.paused" && subscriptionId) {
    await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId: subscriptionId },
      { status: "past_due" },
      { new: true }
    );
  }

  if (["payment.captured", "payment.failed"].includes(event.event) && paymentEntity?.id && userId && plan) {
    await Payment.findOneAndUpdate(
      { paymentId: paymentEntity.id },
      {
        userId,
        plan,
        paymentId: paymentEntity.id,
        orderId: paymentEntity.order_id,
        amount: paymentEntity.amount,
        currency: paymentEntity.currency || "INR",
        status: event.event === "payment.captured" ? "paid" : "failed",
        paidAt: event.event === "payment.captured" ? new Date() : undefined,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (event.event === "payment.captured" && subscriptionId) {
      await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: subscriptionId },
        { status: "active", lastPaymentId: paymentEntity.id },
        { new: true }
      );
    }
  }

  await WebhookEvent.updateOne(
    { eventId },
    { processed: true, processedAt: new Date() }
  );

  return res.status(200).json({ message: "Webhook processed" });
};
