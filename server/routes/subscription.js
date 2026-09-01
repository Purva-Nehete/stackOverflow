import express from "express";
import auth from "../middleware/auth.js";
import { handleWebhook } from "../controller/payment.js";
import {
  cancelSubscription,
  createOrUpdateSubscription,
  getMySubscription,
  getPaymentHistory,
  getSubscriptionHistory,
  getSubscriptionInvoice,
  getSubscriptionPlans,
  verifySubscription,
} from "../controller/subscription.js";

const router = express.Router();

router.get("/plans", getSubscriptionPlans);
router.get("/me", auth, getMySubscription);
router.post("/create", auth, createOrUpdateSubscription);
router.post("/verify", auth, verifySubscription);
router.patch("/cancel", auth, cancelSubscription);
router.get("/history", auth, getSubscriptionHistory);
router.get("/payments", auth, getPaymentHistory);
router.get("/invoices/:id", auth, getSubscriptionInvoice);
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

export default router;
