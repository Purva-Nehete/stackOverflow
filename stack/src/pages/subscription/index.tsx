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
import { useI18n } from "@/lib/i18n/I18nContext";

type Plan = {
  key: string;
  name: string;
  price: number;
  dailyQuestionLimit: number;
  badge: string | null;
  features: Record<string, boolean>;
};

type RazorpayResponse = {
  razorpay_subscription_id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string | undefined;
  subscription_id?: string;
  order_id?: string;
  handler: (response: RazorpayResponse) => void;
  prefill: { email: string; name: string };
  theme: { color: string };
  on?: (event: string, handler: () => void) => void;
};

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on?: (event: string, handler: () => void) => void;
    };
  }
}

const Subscription = () => {
  const { t } = useI18n();
  const { user, subscription, refreshSubscription } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/auth");
      return;
    }
    fetchPlans();
  }, [user]);

  const fetchPlans = async () => {
    try {
      const res = await axiosInstance.get("/subscription/plans");
      setPlans(res.data.data);
    } catch (error) {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planKey: string) => {
    if (planKey === "free") {
      toast.info("You are already on the Free plan");
      return;
    }

    setProcessingPlan(planKey);

    try {
      const res = await axiosInstance.post("/subscription/create", { plan: planKey });
      const checkout = res.data.data.checkout;
      const checkoutId = checkout.id;

      if (checkoutId) {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          ...(checkout.mode === "order"
            ? { order_id: checkoutId }
            : { subscription_id: checkoutId }),
          handler: async (response: RazorpayResponse) => {
            try {
              if (checkout.mode === "order") {
                await axiosInstance.post("/payment/verify", {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  plan: planKey,
                });
              } else {
                await axiosInstance.post("/subscription/verify", {
                  razorpay_subscription_id: response.razorpay_subscription_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });
              }
              toast.info("Payment received. Waiting for subscription confirmation.");
              await refreshSubscription();
            } catch (error) {
              toast.error("Payment verification failed");
            }
            setProcessingPlan(null);
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
          razorpay.on?.("payment.failed", () => {
            setProcessingPlan(null);
            toast.error("Payment failed");
          });
          razorpay.open();
        } else {
          setProcessingPlan(null);
          toast.error("Razorpay is not loaded");
        }
      }
    } catch (error: any) {
      setProcessingPlan(null);
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to initiate payment"
      );
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
          <h1 className="text-3xl font-bold mb-2">{t("subscription.upgrade")}</h1>
          <p className="text-gray-600">
            {t("subscription.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.key}
              className={`flex flex-col transition-all ${
                subscription?.plan === plan.key ? "ring-2 ring-blue-500 shadow-lg" : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {subscription?.plan === plan.key && (
                    <Badge className="bg-green-500">{t("subscription.current")}</Badge>
                  )}
                </div>
                <CardDescription className="text-2xl font-bold mt-2">
                  ₹{plan.price}
                  <span className="text-sm text-gray-500">{t("subscription.month")}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-sm">
                      {!Number.isFinite(plan.dailyQuestionLimit)
                        ? t("subscription.unlimitedQuestions")
                        : `${plan.dailyQuestionLimit} ${t("subscription.questionsDay")}`}
                    </span>
                  </div>

                  {plan.features.advancedSearch && (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm">{t("subscription.advancedSearch")}</span>
                    </div>
                  )}

                  {plan.badge && (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm">{plan.badge} {t("subscription.badge")}</span>
                    </div>
                  )}

                  {plan.features.prioritySupport && (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm">{t("subscription.prioritySupport")}</span>
                    </div>
                  )}

                  {plan.features.enhancedVisibility && (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm">{t("subscription.enhancedVisibility")}</span>
                    </div>
                  )}

                  {plan.features.unlimitedBookmarks && (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm">{t("subscription.unlimitedBookmarks")}</span>
                    </div>
                  )}

                  {plan.features.exclusiveCommunity && (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm">{t("subscription.exclusiveCommunity")}</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={subscription?.plan === plan.key || processingPlan !== null}
                  className="w-full"
                  variant={subscription?.plan === plan.key ? "outline" : "default"}
                >
                  {processingPlan === plan.key ? t("subscription.openingCheckout") : subscription?.plan === plan.key ? t("subscription.currentPlan") : t("subscription.upgrade")}
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
