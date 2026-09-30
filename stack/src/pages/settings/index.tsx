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

type SecuritySession = {
  id: string;
  browser: string;
  operatingSystem: string;
  deviceType: string;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

type TrustedDevice = {
  id: string;
  browser: string;
  operatingSystem: string;
  deviceType: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

const SettingsPage = () => {
  const router = useRouter();
  const { user, updateUser, Logout } = useAuth();
  const { t, locale, setLocale, formatDate } = useI18n();
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
  const [sessions, setSessions] = useState<SecuritySession[]>([]);
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState("");
  const [securityActionId, setSecurityActionId] = useState<string | null>(null);

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
    if (!user) {
      return undefined;
    }

    let cancelled = false;
    const loadSecurityData = async () => {
      setSecurityLoading(true);
      setSecurityError("");
      try {
        const [sessionResponse, deviceResponse] = await Promise.all([
          axiosInstance.get("/user/sessions"),
          axiosInstance.get("/user/trusted-devices"),
        ]);
        if (!cancelled) {
          setSessions(sessionResponse.data?.data || []);
          setTrustedDevices(deviceResponse.data?.data || []);
        }
      } catch (securityRequestError: any) {
        if (!cancelled) {
          setSecurityError(securityRequestError.response?.data?.message || t("common.error"));
        }
      } finally {
        if (!cancelled) {
          setSecurityLoading(false);
        }
      }
    };

    loadSecurityData();
    return () => {
      cancelled = true;
    };
  }, [user, t]);

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

  const revokeSession = async (session: SecuritySession) => {
    if (!window.confirm(t("settings.revokeConfirm"))) {
      return;
    }

    setSecurityActionId(session.id);
    setSecurityError("");
    try {
      await axiosInstance.delete(`/user/sessions/${session.id}`);
      if (session.isCurrent) {
        await Logout();
        await router.push("/auth");
        return;
      }
      setSessions((current) => current.filter((item) => item.id !== session.id));
    } catch (revokeError: any) {
      setSecurityError(revokeError.response?.data?.message || t("common.error"));
    } finally {
      setSecurityActionId(null);
    }
  };

  const revokeTrustedDevice = async (device: TrustedDevice) => {
    if (!window.confirm(t("settings.removeDeviceConfirm"))) {
      return;
    }

    setSecurityActionId(device.id);
    setSecurityError("");
    try {
      await axiosInstance.delete(`/user/trusted-devices/${device.id}`);
      setTrustedDevices((current) => current.filter((item) => item.id !== device.id));
    } catch (revokeError: any) {
      setSecurityError(revokeError.response?.data?.message || t("common.error"));
    } finally {
      setSecurityActionId(null);
    }
  };

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

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t("settings.sessionsTitle")}</CardTitle>
            <CardDescription>{t("settings.sessionsDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {securityLoading ? <p className="text-sm text-gray-600">{t("common.loading")}</p> : null}
            {!securityLoading && sessions.length === 0 ? (
              <p className="text-sm text-gray-600">{t("settings.noSessions")}</p>
            ) : null}
            {sessions.map((session) => (
              <div key={session.id} className="flex flex-col gap-3 border-b border-gray-200 pb-4 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-gray-900">
                    {session.browser} {t("settings.on")} {session.operatingSystem}
                    {session.isCurrent ? ` (${t("settings.currentSession")})` : ""}
                  </p>
                  <p className="text-gray-600">{t("settings.deviceType")}: {session.deviceType}</p>
                  <p className="text-gray-600">{t("settings.lastActivity")}: {formatDate(session.lastActivityAt)}</p>
                  <p className="text-gray-600">{t("settings.expires")}: {formatDate(session.expiresAt)}</p>
                </div>
                <Button
                  type="button"
                  variant={session.isCurrent ? "destructive" : "outline"}
                  onClick={() => revokeSession(session)}
                  disabled={securityActionId === session.id}
                >
                  {securityActionId === session.id ? t("common.processing") : t("settings.revoke")}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t("settings.devicesTitle")}</CardTitle>
            <CardDescription>{t("settings.devicesDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!securityLoading && trustedDevices.length === 0 ? (
              <p className="text-sm text-gray-600">{t("settings.noDevices")}</p>
            ) : null}
            {trustedDevices.map((device) => (
              <div key={device.id} className="flex flex-col gap-3 border-b border-gray-200 pb-4 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-gray-900">
                    {device.browser} {t("settings.on")} {device.operatingSystem}
                    {device.isCurrent ? ` (${t("settings.currentDevice")})` : ""}
                  </p>
                  <p className="text-gray-600">{t("settings.deviceType")}: {device.deviceType}</p>
                  <p className="text-gray-600">{t("settings.lastUsed")}: {formatDate(device.lastUsedAt)}</p>
                  <p className="text-gray-600">{t("settings.expires")}: {formatDate(device.expiresAt)}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => revokeTrustedDevice(device)}
                  disabled={securityActionId === device.id}
                >
                  {securityActionId === device.id ? t("common.processing") : t("settings.removeDevice")}
                </Button>
              </div>
            ))}
            {securityError ? <p className="text-sm text-red-600">{securityError}</p> : null}
          </CardContent>
        </Card>
      </div>
    </Mainlayout>
  );
};

export default SettingsPage;
