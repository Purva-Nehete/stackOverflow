import Razorpay from "razorpay";

const razorpayMode = process.env.RAZORPAY_MODE || "test";

if (razorpayMode !== "test") {
  throw new Error("This internship build supports Razorpay Test Mode only");
}

if (!process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_")) {
  throw new Error("RAZORPAY_KEY_ID must be a Razorpay Test Mode key");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createRazorpayOrder = async ({ amount, currency = "INR", receipt, notes }) => {
  return await razorpay.orders.create({
    amount,
    currency,
    receipt,
    notes,
  });
};

export const createRazorpaySubscription = async ({
  plan,
  customerEmail,
  userId,
  totalCount = 12,
}) => {
  const planMap = {
    bronze: process.env.RAZORPAY_PLAN_BRONZE,
    silver: process.env.RAZORPAY_PLAN_SILVER,
    gold: process.env.RAZORPAY_PLAN_GOLD,
  };

  const planId = planMap[plan];

  if (!planId) {
    throw new Error(`Razorpay plan ID is not configured for ${plan}`);
  }

  if (!planId.startsWith("plan_")) {
    throw new Error(`Invalid Razorpay Test Mode plan ID for ${plan}`);
  }

  return await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: totalCount,
    customer_notify: 1,
    notes: {
      customerEmail,
      userId: userId.toString(),
      plan,
    },
  });
};

export default razorpay;
