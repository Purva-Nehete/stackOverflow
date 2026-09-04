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
  const { user } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/auth");
      return;
    }
    fetchSubscription();
    fetchPaymentHistory();
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const res = await axiosInstance.get("/subscription/me");
      setSubscription(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };

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
    if (window.confirm("Are you sure? You will retain access until the billing period ends.")) {
      try {
        await axiosInstance.patch("/subscription/cancel");
        toast.success("Subscription cancelled");
        fetchSubscription();
      } catch (error) {
        toast.error("Failed to cancel subscription");
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
      toast.error("Unable to download invoice");
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
        <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>

        {/* Current Subscription */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Current Subscription</CardTitle>
              <CardDescription>Your active plan and subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm text-gray-500">Plan</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold capitalize">{subscription?.plan}</span>
                  <Badge className="bg-blue-500 capitalize">{subscription?.plan || "free"}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p className="text-lg font-semibold capitalize mt-1">
                    {subscription?.status || "inactive"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Start Date</label>
                  <p className="text-lg font-semibold mt-1">
                    {subscription?.currentPeriodStart
                      ? new Date(subscription.currentPeriodStart).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Renewal Date</label>
                  <p className="text-lg font-semibold mt-1">
                    {subscription?.currentPeriodEnd
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              {subscription?.cancelAtPeriodEnd && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    This subscription will be cancelled at the end of the billing period.
                  </p>
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
              <CardTitle className="text-lg">Billing Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-500" />
                <div className="text-sm">
                  <p className="text-gray-500">Billing Email</p>
                  <p className="font-semibold">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <div className="text-sm">
                  <p className="text-gray-500">Member Since</p>
                  <p className="font-semibold">
                    {user?.joinDate ? new Date(user.joinDate).toLocaleDateString() : "N/A"}
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
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Your recent transactions and invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Plan</th>
                      <th className="text-left py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Invoice</th>
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
