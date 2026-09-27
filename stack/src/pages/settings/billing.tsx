import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/lib/AuthContext";
import { Calendar, CreditCard, Download } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useI18n } from "@/lib/i18n/I18nContext";

type Subscription = {
  plan: string;
  status: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  razorpaySubscriptionId?: string;
};

type Payment = {
  _id: string;
  createdAt: string;
  plan: string;
  amount?: number;
  status: string;
  invoiceNumber?: string;
};

const BillingDashboard = () => {
  const { t, formatDate } = useI18n();
  const { user, subscription, subscriptionLoading, refreshSubscription } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/auth");
      return;
    }
    fetchPaymentHistory();
  }, [user]);

  const fetchPaymentHistory = async () => {
    try {
      const res = await axiosInstance.get("/subscription/payments");
      setPayments(res.data.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (window.confirm(t("billing.cancelConfirm"))) {
      try {
        await axiosInstance.patch("/subscription/cancel");
        toast.success(t("billing.cancelled"));
        await refreshSubscription();
      } catch (error) {
        toast.error(t("billing.cancelFailed"));
      }
    }
  };

  const handleUpgrade = () => {
    router.push("/subscription");
  };

  const handleDownloadInvoice = async (payment: Payment) => {
    try {
      const response = await axiosInstance.get(`/subscription/invoices/${payment._id}`);
      const invoice = new Blob([JSON.stringify(response.data.data, null, 2)], {
        type: "application/json",
      });
      const downloadUrl = URL.createObjectURL(invoice);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${payment.invoiceNumber || `invoice-${payment._id}`}.json`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      toast.error(t("billing.invoiceFailed"));
    }
  };

  if (loading || subscriptionLoading) {
    return (
      <Mainlayout>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </Mainlayout>
    );
  }

  return (
    <Mainlayout>
      <div className="max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">{t("billing.title")}</h1>

        {/* Current Subscription */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t("billing.currentSubscription")}</CardTitle>
              <CardDescription>{t("billing.currentDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm text-gray-500">{t("subscription.plan")}</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold capitalize">{subscription?.plan}</span>
                  <Badge className="bg-blue-500 capitalize">{subscription?.plan || "free"}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">{t("billing.status")}</label>
                  <p className="text-lg font-semibold capitalize mt-1">
                    {subscription?.status || "inactive"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">{t("billing.startDate")}</label>
                  <p className="text-lg font-semibold mt-1">
                    {subscription?.currentPeriodStart
                      ? formatDate(subscription.currentPeriodStart)
                      : t("common.notAvailable")}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">{t("billing.renewalDate")}</label>
                  <p className="text-lg font-semibold mt-1">
                    {subscription?.currentPeriodEnd
                      ? formatDate(subscription.currentPeriodEnd)
                      : t("common.notAvailable")}
                  </p>
                </div>
              </div>

              {subscription?.cancelAtPeriodEnd && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">{t("billing.cancelAtPeriodEnd")}</p>
                </div>
              )}

              {subscription?.razorpaySubscriptionId && (
                <div className="text-sm text-gray-500">
                  Subscription ID: {subscription.razorpaySubscriptionId}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {subscription?.plan === "free" ? (
                  <Button onClick={handleUpgrade} className="flex-1">
                    Upgrade Plan
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleUpgrade} variant="outline" className="flex-1">
                      Change Plan
                    </Button>
                    <Button onClick={handleCancel} variant="destructive">
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
                <CardTitle className="text-lg">{t("billing.info")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-500" />
                <div className="text-sm">
                  <p className="text-gray-500">{t("billing.email")}</p>
                  <p className="font-semibold">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <div className="text-sm">
                  <p className="text-gray-500">{t("billing.memberSince")}</p>
                  <p className="font-semibold">
                    {user?.joinDate ? formatDate(user.joinDate) : t("common.notAvailable")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment History */}
        {payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("billing.paymentHistory")}</CardTitle>
              <CardDescription>{t("billing.paymentDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">{t("billing.date")}</th>
                      <th className="text-left py-3 px-4">{t("subscription.plan")}</th>
                      <th className="text-left py-3 px-4">{t("billing.amount")}</th>
                      <th className="text-left py-3 px-4">{t("billing.status")}</th>
                      <th className="text-left py-3 px-4">{t("billing.invoice")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 capitalize">{payment.plan}</td>
                        <td className="py-3 px-4">
                          ₹{payment.amount ? (payment.amount / 100).toFixed(2) : "0"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            className={
                              payment.status === "paid" ? "bg-green-500" : "bg-gray-500"
                            }
                          >
                            {payment.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleDownloadInvoice(payment)}
                            disabled={!payment.invoiceNumber}
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {payments.length === 0 && subscription?.plan !== "free" && (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No payment history available yet.
            </CardContent>
          </Card>
        )}
      </div>
    </Mainlayout>
  );
};

export default BillingDashboard;
