import express from "express";
import auth from "../middleware/auth.js";
import {
  cancelSubscription,
  createOrUpdateSubscription,
  getMySubscription,
  getSubscriptionHistory,
  getSubscriptionPlans,
} from "../controller/subscription.js";

const router = express.Router();

router.get("/plans", getSubscriptionPlans);
router.get("/me", auth, getMySubscription);
router.post("/create", auth, createOrUpdateSubscription);
router.patch("/cancel", auth, cancelSubscription);
router.get("/history", auth, getSubscriptionHistory);

export default router;
