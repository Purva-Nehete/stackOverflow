import crypto from "crypto";
import Payment from "../models/payment.js";
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
      error: error?.message || "Unknown error",
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
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(JSON.stringify(req.body)).digest("hex");

  if (digest !== signature) {
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  const event = req.body;
  const eventId = event?.event_id || `${event?.entity?.id || "razorpay"}-${Date.now()}`;

  const alreadyProcessed = await WebhookEvent.findOne({ eventId });

  if (alreadyProcessed) {
    return res.status(200).json({ message: "Duplicate webhook ignored" });
  }

  await WebhookEvent.create({
    eventId,
    eventType: event?.event,
    processed: true,
    processedAt: new Date(),
  });

  if (event?.event === "subscription.activated") {
    const subscriptionId = event?.payload?.subscription?.entity?.id;
    const userId = event?.payload?.subscription?.entity?.notes?.userId;

    if (subscriptionId && userId) {
      await User.findByIdAndUpdate(userId, {
        subscriptionPlan: "silver",
        subscriptionStatus: "active",
        razorpaySubscriptionId: subscriptionId,
      });
    }
  }

  if (event?.event === "payment.captured") {
    const paymentId = event?.payload?.payment?.entity?.id;
    const amount = event?.payload?.payment?.entity?.amount;
    const userId = event?.payload?.payment?.entity?.notes?.userId;

    if (paymentId && userId) {
      await Payment.create({
        userId,
        paymentId,
        amount,
        status: "paid",
        paidAt: new Date(),
      });
    }
  }

  return res.status(200).json({ message: "Webhook processed" });
};
