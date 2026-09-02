import Subscription from "../models/subscription.js";
import { getPlanByKey } from "../config/plans.js";

const requireFeature = (feature) => async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      userId: req.userid,
      status: "active",
    }).sort({ createdAt: -1 });

    const subscriptionIsCurrent =
      subscription?.currentPeriodEnd && subscription.currentPeriodEnd > new Date();
    const planKey = subscriptionIsCurrent ? subscription.plan : "free";
    const plan = getPlanByKey(planKey);

    if (!plan.features[feature]) {
      return res.status(403).json({
        message: "This feature requires a premium plan",
        feature,
        plan: planKey,
      });
    }

    req.subscription = subscription;
    req.plan = plan;
    req.planKey = planKey;
    next();
  } catch (error) {
    return res.status(500).json({ message: "Unable to verify feature access" });
  }
};

export default requireFeature;
