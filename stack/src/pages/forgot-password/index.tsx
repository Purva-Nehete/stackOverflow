import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosInstance from "@/lib/axiosinstance";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { toast } from "react-toastify";

const ForgotPasswordPage = () => {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^\+?[\d\s().-]{7,20}$/;

    if (!email && !phone) {
      toast.error("Please enter your email or phone number");
      return;
    }

    if (email && !emailPattern.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (phone && !phonePattern.test(phone)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    setGeneratedPassword("");

    try {
      const res = await axiosInstance.post("/user/forgot-password", {
        email,
        phone,
      });

      if (res.data?.generatedPassword) {
        setGeneratedPassword(res.data.generatedPassword);
      }

      toast.success(res.data?.message || "Password reset link processed successfully");
    } catch (error: any) {
      const message = error.response?.data?.message || "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="flex items-center justify-center mb-4">
            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-orange-500 rounded mr-2 flex items-center justify-center">
              <div className="w-4 h-4 lg:w-6 lg:h-6 bg-white rounded-sm flex items-center justify-center">
                <div className="w-3 h-3 lg:w-4 lg:h-4 bg-orange-500 rounded-sm"></div>
              </div>
            </div>
            <span className="text-lg lg:text-xl font-bold text-gray-800">
              stack<span className="font-normal">overflow</span>
            </span>
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-xl lg:text-2xl">Forgot password</CardTitle>
              <CardDescription>
                Enter your registered email address or phone number to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  onChange={handleChange}
                  value={form.email}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm">
                  Phone number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 9876543210"
                  onChange={handleChange}
                  value={form.phone}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
                disabled={loading}
              >
                {loading ? "Processing..." : "Reset password"}
              </Button>

              {generatedPassword && (
                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  <p className="font-medium">Your new password:</p>
                  <p className="mt-1 break-all font-semibold">{generatedPassword}</p>
                </div>
              )}

              <div className="text-center text-sm">
                <button
                  type="button"
                  className="text-blue-600 hover:underline"
                  onClick={() => router.push("/auth")}
                >
                  Back to login
                </button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
