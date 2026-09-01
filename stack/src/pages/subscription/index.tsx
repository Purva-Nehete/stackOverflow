import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/lib/AuthContext";
import { Check } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const Subscription = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/auth");
      return;
    }
    fetchPlans();
    fetchCurrentSubscription();
  }, [user]);

  const fetchPlans = async () => {
    try {
      const res = await axiosInstance.get("/subscription/plans");
      setPlans(res.data.data);
    } catch (error) {
      toast.error("Failed to load plans");
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const res = await axiosInstance.get("/subscription/me");
      setCurrentPlan(res.data.data.plan || "free");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planKey) => {
    if (planKey === "free") {
      toast.info("You are already on the Free plan");
      return;
    }

    try {
      const res = await axiosInstance.post("/payment/checkout", { plan: planKey });
      
      if (res.data.data.order) {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          order_id: res.data.data.order.id,
          handler: async (response) => {
            try {
              await axiosInstance.post("/payment/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              toast.success("Payment successful! Subscription activated.");
              fetchCurrentSubscription();
            } catch (error) {
              toast.error("Payment verification failed");
            }
          },
          prefill: {
            email: user.email,
            name: user.name,
          },
          theme: {
            color: "#3b82f6",
          },
        };

        if (typeof window !== "undefined" && window.Razorpay) {
          const razorpay = new window.Razorpay(options);
          razorpay.open();
        } else {
          toast.error("Razorpay is not loaded");
        }
      }
    } catch (error) {
      toast.error("Failed to initiate payment");
    }
  };

  if (loading) {
    return (
      <Mainlayout>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </Mainlayout>
    );
  }

  return (
    <Mainlayout>
      <div className="max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Upgrade Your Plan</h1>
          <p className="text-gray-600">
            Choose a plan that fits your needs and unlock premium features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.key}
              className={`flex flex-col transition-all ${
                currentPlan === plan.key ? "ring-2 ring-blue-500 shadow-lg" : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {currentPlan === plan.key && (
                    <Badge className="bg-green-500">Current</Badge>
                  )}
                </div>
                <CardDescription className="text-2xl font-bold mt-2">
                  ₹{plan.price}
                  <span className="text-sm text-gray-500">/month</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-sm">
                      {plan.dailyQuestionLimit === Infinity
                        ? "Unlimited questions"
                        : `${plan.dailyQuestionLimit} questions/day`}
                    </span>
                  </div>

                  {plan.features.advancedSearch && (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm">Advanced search</span>
                    </div>
                  )}

                  {plan.badge && (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm">{plan.badge} badge</span>
                    </div>
                  )}

                  {plan.features.prioritySupport && (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm">Priority support</span>
                    </div>
                  )}

                  {plan.features.enhancedVisibility && (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm">Enhanced visibility</span>
                    </div>
                  )}

                  {plan.features.unlimitedBookmarks && (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm">Unlimited bookmarks</span>
                    </div>
                  )}

                  {plan.features.exclusiveCommunity && (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm">Exclusive community</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={currentPlan === plan.key}
                  className="w-full"
                  variant={currentPlan === plan.key ? "outline" : "default"}
                >
                  {currentPlan === plan.key ? "Current Plan" : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Mainlayout>
  );
};

export default Subscription;
