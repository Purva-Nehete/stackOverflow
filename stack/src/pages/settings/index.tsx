import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n/I18nContext";
import { isSupportedLocale, localeNames, supportedLocales, type Locale } from "@/lib/i18n/config";

const SettingsPage = () => {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const currentLocale = (user?.preferredLanguage as Locale | undefined) || locale;
  const [selectedLocale, setSelectedLocale] = useState<Locale>(currentLocale);
  const [otp, setOtp] = useState("");
  const [channel, setChannel] = useState<"email" | "mobile" | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!user) {
      router.push("/auth");
      return;
    }

    if (isSupportedLocale(user.preferredLanguage)) {
      setSelectedLocale(user.preferredLanguage);
    } else {
      setSelectedLocale(locale);
    }
  }, [user, locale, router]);

  useEffect(() => {
    if (countdown <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCountdown((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown]);

  const requestOtp = async () => {
    if (!isSupportedLocale(selectedLocale)) {
      return;
    }

    setIsSending(true);
    setError("");
    setSuccess("");

    try {
      const response = await axiosInstance.post("/user/language/request-otp", {
        preferredLanguage: selectedLocale,
      });

      const nextChannel =
        (response.data?.data?.channel as "email" | "mobile" | undefined) ||
        (selectedLocale === "fr" ? "email" : "mobile");

      setChannel(nextChannel);
      setVerificationSent(true);
      setOtp("");
      setCountdown(60);
      setSuccess(response.data?.message || t("settings.pendingMessage"));
    } catch (requestError: any) {
      setVerificationSent(false);
      setChannel(null);
      setError(requestError.response?.data?.message || t("common.error"));
    } finally {
      setIsSending(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      setError(t("common.error"));
      return;
    }

    setIsVerifying(true);
    setError("");
    setSuccess("");

    try {
      const response = await axiosInstance.patch("/user/language", {
        preferredLanguage: selectedLocale,
        otp: otp.trim(),
      });

      setLocale(selectedLocale);
      updateUser({ preferredLanguage: selectedLocale });
      setVerificationSent(false);
      setChannel(null);
      setOtp("");
      setSelectedLocale(selectedLocale);
      setSuccess(response.data?.message || t("settings.success"));
    } catch (verifyError: any) {
      setError(verifyError.response?.data?.message || t("common.error"));
    } finally {
      setIsVerifying(false);
    }
  };

  const languageChanged = selectedLocale !== currentLocale;
  const resolvedChannel = channel ?? (selectedLocale === "fr" ? "email" : "mobile");

  return (
    <Mainlayout>
      <div className="max-w-2xl mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.title")}</CardTitle>
            <CardDescription>{t("settings.languageDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">{t("settings.currentLanguage")}</p>
              <p className="text-lg font-semibold">{localeNames[currentLocale]}</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="language-select" className="text-sm font-medium text-gray-700">
                {t("settings.chooseLanguage")}
              </label>
              <select
                id="language-select"
                value={selectedLocale}
                onChange={(event) => {
                  const next = event.target.value as Locale;
                  setSelectedLocale(next);
                  setError("");
                  setSuccess("");
                  setVerificationSent(false);
                  setChannel(next === "fr" ? "email" : "mobile");
                  setOtp("");
                }}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:outline-none"
              >
                {supportedLocales.map((localeCode) => (
                  <option key={localeCode} value={localeCode}>
                    {localeNames[localeCode]}
                  </option>
                ))}
              </select>
            </div>

            {languageChanged && (
              <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {t("settings.channelInfo")}
                <span className="font-medium">
                  {resolvedChannel === "email"
                    ? ` ${t("settings.channelEmail")}`
                    : resolvedChannel === "mobile"
                      ? ` ${t("settings.channelMobile")}`
                      : ""}
                </span>
              </div>
            )}

            {languageChanged && !verificationSent && (
              <Button
                type="button"
                onClick={requestOtp}
                disabled={isSending}
                className="w-full"
              >
                {isSending ? t("common.processing") : t("settings.sendOtp")}
              </Button>
            )}

            {verificationSent && (
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  verifyOtp();
                }}
              >
                <div className="space-y-2">
                  <label htmlFor="otp-input" className="text-sm font-medium text-gray-700">
                    {t("settings.enterOtp")}
                  </label>
                  <Input
                    id="otp-input"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button type="submit" disabled={isVerifying || otp.length !== 6} className="flex-1">
                    {isVerifying ? t("common.processing") : t("settings.verify")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={requestOtp}
                    disabled={isSending || countdown > 0}
                    className="flex-1"
                  >
                    {countdown > 0 ? `${t("settings.resend")} (${countdown}s)` : t("settings.resend")}
                  </Button>
                </div>
              </form>
            )}

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {success ? <p className="text-sm text-green-600">{success}</p> : null}
          </CardContent>
        </Card>
      </div>
    </Mainlayout>
  );
};

export default SettingsPage;
