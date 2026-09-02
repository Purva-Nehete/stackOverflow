import Razorpay from "razorpay";

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
    bronze: "plan_bronze",
    silver: "plan_silver",
    gold: "plan_gold",
  };

  const planId = planMap[plan];

  if (!planId) {
    throw new Error("Unsupported plan");
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
