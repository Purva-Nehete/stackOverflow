import express from "express";
import auth from "../middleware/auth.js";
import {
  createPaymentSession,
  createSubscriptionCheckout,
  handleWebhook,
  verifyPayment,
} from "../controller/payment.js";

const router = express.Router();

router.post("/checkout", auth, createPaymentSession);
router.post("/subscription", auth, createSubscriptionCheckout);
router.post("/verify", auth, verifyPayment);
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

export default router;
